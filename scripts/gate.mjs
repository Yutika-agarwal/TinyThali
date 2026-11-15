// The reviewer's gate: tests must pass, and deliberately broken safety code must make them fail.
// Usage: node scripts/gate.mjs        (exit 0 = ready, exit 1 = not ready)
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const FILE = "src/lib/safety.ts";
const MUTANTS = [
  ["recipe allergen conflicts ignored", ".filter((a) => allergies.includes(a));", ".filter(() => false);", 1],
  ["boost allergen overlap ignored", ".filter((a) => combinedAllergies(kids).includes(a));", ".filter(() => false);", 1],
  ["boost age limit ignored", "BAND_MIN_AGE[band] < boost.minAge", "false", 1],
  ["community tip allergens ignored", "post.allergenTags.filter((a) => allergies.includes(a));", "post.allergenTags.filter(() => false);", 1],
  ["parent's own allergy words ignored", "combinedOtherAllergies(kids).find((w) => mentionsAllergy(text, w)) ?? null", "null", 1],
];

const run = () => spawnSync("node", ["--test", "src/lib/*.test.ts"], { shell: true, encoding: "utf8" }).status === 0;
const original = readFileSync(FILE, "utf8");
let bad = 0;

if (!run()) {
  console.log("FAIL: tests do not pass");
  process.exit(1);
}
console.log("ok: tests pass");

try {
  for (const [name, from, to] of MUTANTS) {
    if (!original.includes(from)) {
      console.log(`FAIL: mutant "${name}" no longer matches ${FILE}; update scripts/gate.mjs`);
      bad++;
      continue;
    }
    writeFileSync(FILE, original.replace(from, to));
    const survived = run();
    console.log(survived ? `FAIL: tests did not notice "${name}"` : `ok: tests caught "${name}"`);
    if (survived) bad++;
  }
} finally {
  writeFileSync(FILE, original);
}
console.log(bad ? `NOT READY (${bad} problem${bad > 1 ? "s" : ""})` : "READY");
process.exit(bad ? 1 : 0);
