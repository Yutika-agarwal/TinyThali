# Lane: backend

**Owns:** `src/lib/cloud.ts`, `src/lib/supabase.ts`, `supabase/functions/*`, `src/lib/aiIdeas.ts`, `src/lib/photo.ts`.
**Needs the human:** `supabase/migrations/*` and anything with keys (prepare the SQL, list it in MORNING-STACK, never apply).

## House rules
- Anything the AI returns is re-checked on the device against allergies before it is shown.
- Never send kid details or allergy info to a model. Ingredient names only.
- No secrets in code or chat; secrets are set by the human in Supabase.

## Next
1. Draft a weekly SQL view that counts `dish_requests` not yet matched, for the content lane (migration goes to MORNING-STACK).
2. Add input length and rate limits to each edge function; add tests for the pure helpers.

## Log
