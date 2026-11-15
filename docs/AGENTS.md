# How Tiny Thali is built by agents

Small version of the "run agents like an engineering org" model: one lead, a few lanes with clear owners, an independent reviewer that decides what merges, and one human who only sees a short morning list. Flat on purpose: no middle managers, no chatter.

```
you (human, approves the MORNING-STACK)
 └─ lead ── weekly plan, reads inboxes, writes MORNING-STACK.md
     ├─ frontend   screens, styling, accessibility
     ├─ backend    Supabase, edge functions, cloud sync, anonymous dish log
     ├─ content    recipes, dishes, boosts (non-protected), dish-request triage
     ├─ ads        sponsor slots, copy rules, rate card, allergen guard
     └─ reviewer   runs the gate, merges or sends back (never writes features)
```

## Rules (each came from a mistake in the original experiment)
1. **One owner per area.** A lane edits only its own paths (see its brief). Anything else goes to `docs/agents/TO-LEAD.md` as one line.
2. **Small PRs.** One item, one branch `lane/<lane>/<yyyy-mm-dd>`, one PR, independently testable.
3. **The reviewer decides.** Only the reviewer merges. It runs `node scripts/gate.mjs`: tests must pass AND deliberately broken safety code must make them fail. A PR that touches safety without a new test is sent back.
4. **Protected paths need you.** Agents may prepare changes but never merge them: `src/lib/safety.ts`, nutrient badges and amounts in `src/data/boosts.ts` and `recipes.ts`, anything about doses/medical wording, `src/pages/Legal.tsx`, `supabase/migrations/`, edge functions, payments, secrets. These go to MORNING-STACK as one line each.
5. **No polling, no padded deadlines.** Lanes do not wait or check in on a timer. A lane runs, does its item, writes its status, and exits. If it needs an answer it asks in `TO-LEAD.md` and stops.
6. **Messages are one line.** Status lines look like `[lane -> lead] done: <item> (<commit>)` or `blocked: <what, needs whom>`.
7. **Nothing runs when there is nothing to do.** If a lane's "Next" list is empty and the lead sent it nothing, it exits with one line. This is what keeps token use low.
8. **Cheap models for cheap work.** Lead plans weekly on the strongest model. Lanes use the mid model. Mechanical edits (adding recipe rows, keywords) can use the smallest. The reviewer uses the mid model.
9. **Rules spread.** When you correct something once ("no white sauce on chole"), the lead writes it into every lane brief's "House rules" so it never needs saying again.

## Files
- `docs/agents/lanes/<lane>.md`: the brief: scope, paths, backlog "Next", house rules, log.
- `docs/agents/TO-LEAD.md`: inbox. Lanes append one line; the lead clears it.
- `docs/agents/MORNING-STACK.md`: what needs your yes, one line each, with the PR number.
- `docs/BACKLOG.md`: the old single-lane backlog; the lead splits it into the lane briefs and then retires it.

## Schedule (nothing runs until you switch it on)
| Who | When | Reads |
|---|---|---|
| lead | weekly, Sunday night | TO-LEAD, MORNING-STACK, lane logs |
| frontend, backend, content, ads | daily, staggered, only if "Next" is not empty | its own brief |
| reviewer | after lanes, daily | open PRs |

## Cost and honesty notes
- The original experiment had 67 agents and saw CI and review bills "go through the roof", and the author felt further from the work. We start with 6 and keep every lane to one small item per run.
- Agents cannot run the app here (no packages, no browser), so visual changes are only checked by reading code. Look at the app yourself weekly, and send screenshots when something feels off.
- You stay the approver for safety, medical wording, legal and money.
