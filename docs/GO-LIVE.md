# Going live checklist

Items marked (you) need your accounts or decisions. I can do the rest in code.

## 1. See it running (you, once)
- Allow package installs in your network settings, then start a new chat so I can run the app and take phone-size screenshots. Or run it yourself: `npm install && npm run dev`.

## 2. Preview link for look-and-feel rounds (you)
1. Create a free Vercel (or Netlify / Cloudflare Pages) account and import the GitHub repo `Yutika-agarwal/TinyThali`.
2. Build command `npm run build`, output directory `dist`. `vercel.json` and `public/_redirects` already handle page refreshes.
3. Every push gets a preview URL. Open it on your phone and send feedback with screenshots.

Send me: 2 or 3 apps you like the look of, any logo or brand colors, and 3 words for the mood.

## 3. Accounts and community (you)
1. Create a Supabase project. Copy the Project URL and anon key into the host's environment variables as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`.
3. Authentication settings: turn on email confirmation, add the site URL and preview URLs as redirect URLs, and set up a custom sender email (SMTP) so sign-in emails don't hit spam.
4. Make yourself admin: sign up in the app, then in the SQL editor insert your user id into `user_roles` with role `admin`.
5. Test with two accounts: sign up, save a recipe, post a tip, approve it as admin, see it as the other user, delete an account.

## 4. AI recipe ideas (optional, you)
```
supabase functions deploy suggest-recipes
supabase secrets set ANTHROPIC_API_KEY=your-key
```
Never paste the key into chat or into the code.

## 5. Safety, legal, name (you, with me drafting)
- Send `docs/DIETITIAN-REVIEW.md` to a pediatric dietitian. Apply their changes in `src/data/boosts.ts` and `src/data/ingredients.ts`. Treat this as a launch gate.
- Have a lawyer review the draft Privacy, Terms and Guidelines pages in `src/pages/Legal.tsx`, and add a contact email.
- Check the "Tiny Thali" name: USPTO search or a trademark attorney, plus domain and social handles.
- Photos: use your own or properly licensed images only.

## 6. Quality pass (you)
- Cook a few recipes using `docs/TASTE-TEST.md` and send me what to fix.
- Test on a real iPhone and an Android phone, with an allergy profile set.

## 7. Pilot, then launch
- Invite about 10 parents. Ask: did you find a recipe in under a minute, did the allergen filtering feel trustworthy, what confused you.
- Fix, then launch.
