# Login and pay-what-you-want setup, step by step

Goal: people sign in with email, and can chip in any amount, including nothing. Everything works the same either way.

## How the pieces fit
```
Phone app  --(1 tap "Continue with $5")-->  Supabase function create-checkout
           <--(Stripe's secure page URL)--
Phone app  --(redirect)-->  Stripe Checkout (card typed here, never in our app)
Stripe     --(payment completed event, signed)-->  Supabase function stripe-webhook
stripe-webhook --(verifies signature)--> writes a row in `donations`
App Profile/Support page --(reads own rows)--> "Thank you"
```
Why a webhook: the browser can be closed or tampered with, so only Stripe's signed message is trusted as proof of payment.

## Part 1: Login (Supabase Auth)
1. Create a Supabase project. Settings, API: copy the Project URL and the anon key.
2. SQL editor: run `supabase/migrations/0001_init.sql`, then `0002_donations.sql`.
3. Authentication, Providers: keep Email on. Turn on "Confirm email".
4. Authentication, URL configuration: set Site URL to your live site and add your preview URLs as redirect URLs.
5. Authentication, SMTP: add a custom sender so sign-in emails don't land in spam (Resend, Postmark and SendGrid all work).
6. On your host (Vercel etc.) set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.
7. Try it: sign up, confirm the email, sign out, sign in with a magic link.

## Part 2: Payments (Stripe, test mode first)
1. Create a Stripe account. Stay in **Test mode** (toggle in the dashboard) until Part 4.
2. Developers, API keys: copy the **Secret key** (`sk_test_...`). Keep it out of chat, code and git.
3. Install the Supabase CLI and log in: `supabase login`, then `supabase link --project-ref YOUR_REF`.
4. Set secrets and deploy the checkout function:
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx SITE_URL=https://your-site.example
   supabase functions deploy create-checkout
   ```
5. Deploy the webhook function. It must skip the login check, because Stripe calls it:
   ```
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
6. In Stripe, Developers, Webhooks, Add endpoint:
   - URL: `https://YOUR_REF.supabase.co/functions/v1/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`), then:
   ```
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
7. Test: open `/support`, pick $5, sign in, pay with the test card `4242 4242 4242 4242`, any future date, any CVC. You should land on "Thank you", and a row should appear in the `donations` table.
8. Also test: the "Not now" option works without signing in, a declined test card (`4000 0000 0000 0002`) shows no row, and a replayed webhook doesn't create a second row.

## Part 3: What to check
- The webhook rejects requests without a valid Stripe signature (try `curl -X POST` on it: expect "bad request").
- Clients can read only their own donation rows (RLS) and cannot insert any.
- The Support page says it is not a tax-deductible donation. That is correct unless you operate as a registered nonprofit.

## Part 4: Going live
1. Finish Stripe account activation (business details, bank account for payouts). This is done by you inside Stripe.
2. Switch the dashboard to Live mode and create the live API key and a live webhook endpoint (new `whsec_`).
3. Update the secrets with the live values (`supabase secrets set ...`) and redeploy the functions.
4. Make one real $1 payment yourself and confirm the row and the payout.
5. Check with an accountant or lawyer on: sales tax or VAT on voluntary payments in your state or country, how to report the income, your refund policy (add a contact email on the Terms page), and whether "support" wording is right for your business structure.

## Simplest alternative (no code)
Stripe Payment Links can offer "customers choose what to pay". Create one in the dashboard and link to it from the Support page. You lose the per-user "Thank you" record, but there is nothing to deploy.
