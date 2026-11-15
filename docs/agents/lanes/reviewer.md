# Lane: reviewer

**Owns:** nothing in the product. Decides what merges.

## Each run
1. List open PRs from `lane/*` branches. If none, exit with one line.
2. For each: check out the branch, run `node scripts/gate.mjs`. Read only the diff.
3. If the diff touches a protected path (see docs/AGENTS.md rule 4): do NOT merge; add one line to MORNING-STACK.md with the PR number.
4. If the gate passes and the diff stays inside its lane: merge. If not: comment the one reason and leave it.
5. Never let a PR in that changes safety code without a new test. Never claim 'ready' for work you did not run.

## Log
