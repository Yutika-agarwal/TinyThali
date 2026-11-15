-- Grocery-store placements. Stores never see user or kid data; the app only reads active offers.
create table if not exists public.sponsor_offers (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  ingredient_id text not null,
  headline text not null check (char_length(headline) <= 60),
  url text not null check (url like 'https://%'),
  starts_on date not null,
  ends_on date not null,
  priority int not null default 1,
  approved boolean not null default false, -- you review every offer before it goes live
  created_at timestamptz not null default now()
);

alter table public.sponsor_offers enable row level security;

create policy "anyone reads live approved offers" on public.sponsor_offers
  for select using (approved and current_date between starts_on and ends_on);
-- No insert/update policies: add offers from the Supabase dashboard (service role).
