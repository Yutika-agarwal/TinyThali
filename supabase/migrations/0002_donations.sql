-- Pay-what-you-want support payments. Rows are written ONLY by the stripe-webhook function
-- (service role) after Stripe confirms a payment. Clients can read their own rows and nothing else.

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  amount_cents integer not null check (amount_cents >= 50),
  currency text not null default 'usd',
  stripe_session_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.donations enable row level security;

create policy "donations: read own"
  on public.donations for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies on purpose: only the service role (webhook) writes.
