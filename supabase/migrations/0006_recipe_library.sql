-- Recipe library: dishes parents ask for become recipes only after a person approves them.
create table if not exists public.library_recipes (
  id text primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  name text not null check (char_length(name) between 2 and 80),
  requested_dish text,
  data jsonb not null,
  source text not null default 'ai_draft' check (source in ('ai_draft', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists library_recipes_status_idx on public.library_recipes (status, created_at);

alter table public.library_recipes enable row level security;

-- Parents (and anonymous visitors) only ever see approved recipes.
create policy library_read on public.library_recipes
  for select using (status = 'approved' or public.is_admin());
create policy library_admin_write on public.library_recipes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admins can see what parents ask for. Everyone else can still only add a name.
create policy dish_requests_admin_read on public.dish_requests
  for select to authenticated using (public.is_admin());

create or replace view public.dish_request_counts with (security_invoker = true) as
  select lower(trim(dish)) as dish, count(*)::int as asked, count(*) filter (where matched)::int as matched_count, max(created_at) as last_asked
  from public.dish_requests
  group by 1;

grant select on public.dish_request_counts to authenticated;
