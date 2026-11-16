-- Anonymous daily counts of a few app events. No user id, no device id, no text, no kid data.
create table if not exists public.usage_counts (
  day date not null default current_date,
  event text not null,
  n integer not null default 0,
  primary key (day, event)
);

alter table public.usage_counts enable row level security;
-- No policies: nobody can read or write the table directly. The app can only call bump_usage().

create or replace function public.bump_usage(p_event text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.usage_counts (day, event, n)
  select current_date, p_event, 1
  where p_event in ('recipe_cooked','boost_applied','recipe_saved','voice_used','photo_used','sponsor_tapped')
  on conflict (day, event) do update set n = public.usage_counts.n + 1;
$$;

revoke all on function public.bump_usage(text) from public;
grant execute on function public.bump_usage(text) to anon, authenticated;

-- Read it from the Supabase dashboard:
-- select day, event, n from usage_counts order by day desc, n desc;
