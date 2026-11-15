-- What parents say they are cooking. Dish text only: no user id, no kid data. Used to grow the menu.
create table if not exists public.dish_requests (
  id uuid primary key default gen_random_uuid(),
  dish text not null check (char_length(dish) between 2 and 60),
  matched boolean not null default false, -- true when we already had boosts for it
  created_at timestamptz not null default now()
);

alter table public.dish_requests enable row level security;

create policy "anyone can add a dish name" on public.dish_requests
  for insert with check (char_length(dish) between 2 and 60);
-- No select policy: read it from the Supabase dashboard (service role).

-- Most-requested dishes we do not cover yet:
-- select lower(dish) d, count(*) from dish_requests where not matched group by 1 order by 2 desc;
