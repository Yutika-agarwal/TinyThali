# Lane: frontend

**Owns:** `src/pages/*` (except Legal), `src/components/*`, `src/index.css`.
**Never touches:** safety.ts, data files, supabase/.

## House rules
- Less is more: for every button ask if it is needed. One accent colour (green). Light type.
- Every icon-only button has an aria-label; every input has a label.
- A parent with limited time: fewest taps, nothing static that does not help, no repeated headings.
- Boosts stay almost invisible to the kid and always fit the dish typed.

## Next
1. Aria-label and label audit across components (report any it cannot fix in TO-LEAD).
2. Saved tab: show date cooked and last reaction on each saved recipe.
3. Save a typed dish with its boosts from the Boost tab (heart next to the field).
4. Lunchbox / tiffin chip on Results once content adds meal tags.

## Log
