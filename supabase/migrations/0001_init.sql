-- Tiny Thali database schema for Supabase.
--
-- How to apply: Supabase dashboard -> SQL editor -> paste this file -> Run.
-- (Or `supabase db push` if you use the Supabase CLI.)
--
-- Privacy by design: kid profiles (nicknames, ages, allergies) are NOT stored here.
-- They stay on the parent's device. Only the parent's account, saved recipes, cooking
-- history and community tips are stored.
--
-- Security model: every table has row-level security (RLS). Parents can only read and
-- write their own private rows. Community tips are public only once approved.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 30),
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  primary key (user_id, role)
);

-- Internal helper. Not callable by app users (see the revoke below).
create or replace function public.has_role(_user uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user and role = _role)
$$;

revoke execute on function public.has_role(uuid, text) from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.has_role(auth.uid(), 'admin'), false)
$$;

create or replace function public.is_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce((select email_confirmed_at is not null from auth.users where id = auth.uid()), false)
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_email_confirmed() to authenticated;

-- Create a profile row for every new account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create policy profiles_read_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- user_roles has no policies on purpose: only the service role (or you, in the SQL editor) can assign roles.

-- ---------------------------------------------------------------------------
-- Community tips
-- ---------------------------------------------------------------------------

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id text not null,
  title text not null check (char_length(title) between 1 and 80),
  what_added text not null check (char_length(what_added) between 1 and 60),
  amount text not null check (char_length(amount) between 1 and 60),
  where_in_recipe text not null check (char_length(where_in_recipe) between 1 and 100),
  kid_reaction text not null check (kid_reaction in ('loved', 'ate_some', 'not_this_time')),
  age_band text not null check (age_band in ('1-3', '4-8', '9-12')),
  allergen_tags text[] not null default '{}'
    check (allergen_tags <@ array['dairy','egg','soy','sesame','peanuts','tree_nuts','gluten','fish','shellfish']),
  allergens_confirmed boolean not null default false,
  taste_note text check (taste_note is null or char_length(taste_note) <= 200),
  author_name text not null default 'A Tiny Thali parent',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now()
);

create index community_posts_status_created_idx on public.community_posts (status, created_at desc);
create index community_posts_user_idx on public.community_posts (user_id);

-- Server-side guardrails. The app checks these too, but the database is the real gate.
create or replace function public.before_post_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  poster_name text;
begin
  if not public.is_email_confirmed() then
    raise exception 'Please confirm your email before sharing a tip.';
  end if;

  if not new.allergens_confirmed then
    raise exception 'Please confirm the allergens in your boost, or choose "None of these".';
  end if;

  select count(*) into recent_count
  from public.community_posts
  where user_id = new.user_id and created_at > now() - interval '24 hours';
  if recent_count >= 5 then
    raise exception 'You can share up to 5 tips a day.';
  end if;

  if (new.title || ' ' || new.what_added || ' ' || new.where_in_recipe || ' ' || coalesce(new.taste_note, ''))
     ~* '\y(cure[sd]?|cures|treat(s|ed|ment)?|prevent(s|ed|ion)?|heal(s|ed)?|detox(es)?|reverse[sd]?)\y' then
    raise exception 'Please describe what you did and how your kid reacted, without health claims.';
  end if;

  -- The public name comes from the profile, so it cannot be spoofed by the client.
  select display_name into poster_name from public.profiles where id = new.user_id;
  new.author_name := coalesce(nullif(poster_name, ''), 'A Tiny Thali parent');
  new.status := 'pending';
  new.reject_reason := null;
  return new;
end;
$$;

create trigger community_posts_before_insert
  before insert on public.community_posts
  for each row execute function public.before_post_insert();

alter table public.community_posts enable row level security;

-- Everyone (including guests) can read approved tips. Authors see their own; admins see all.
create policy posts_read on public.community_posts
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy posts_insert on public.community_posts
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy posts_admin_update on public.community_posts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy posts_delete on public.community_posts
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Reactions ("Helpful", "Kid approved") and reports
-- ---------------------------------------------------------------------------

create table public.post_reactions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  type text not null check (type in ('helpful', 'kid_approved')),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id, type)
);

alter table public.post_reactions enable row level security;

create policy reactions_read_own on public.post_reactions
  for select to authenticated using (user_id = auth.uid());
create policy reactions_insert on public.post_reactions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'approved')
  );
create policy reactions_delete_own on public.post_reactions
  for delete to authenticated using (user_id = auth.uid());

-- Public counts only (no user ids). Views run with the owner's rights on purpose, so counts include everyone.
create view public.post_counts as
  select
    post_id,
    count(*) filter (where type = 'helpful')::int as helpful,
    count(*) filter (where type = 'kid_approved')::int as kid_approved
  from public.post_reactions
  group by post_id;

grant select on public.post_counts to anon, authenticated;

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text not null default 'other' check (reason in ('allergen', 'unsafe', 'spam', 'other')),
  note text check (note is null or char_length(note) <= 300),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.post_reports enable row level security;

create policy reports_insert on public.post_reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_read on public.post_reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_update on public.post_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private: saved recipes and cooking history
-- ---------------------------------------------------------------------------

create table public.saved_recipes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id text not null,
  boost_ids text[] not null default '{}',
  post_ids text[] not null default '{}',
  saved_at timestamptz not null default now()
);

create table public.cook_history (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id text not null,
  boost_ids text[] not null default '{}',
  post_ids text[] not null default '{}',
  reaction text not null check (reaction in ('loved', 'ate_some', 'not_this_time')),
  cooked_at timestamptz not null default now()
);

create index saved_recipes_user_idx on public.saved_recipes (user_id, saved_at desc);
create index cook_history_user_idx on public.cook_history (user_id, cooked_at desc);

alter table public.saved_recipes enable row level security;
alter table public.cook_history enable row level security;

create policy saved_owner on public.saved_recipes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy history_owner on public.cook_history
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Account deletion ("Delete my data"). Cascades remove everything the user owns.
-- ---------------------------------------------------------------------------

create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself an admin (run once, with your own account's email):
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com';
-- ---------------------------------------------------------------------------
