const FRACTIONS: [number, string][] = [
  [0.25, "1/4"],
  [1 / 3, "1/3"],
  [0.5, "1/2"],
  [2 / 3, "2/3"],
  [0.75, "3/4"],
];

const NUM = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)`;
const LEADING = new RegExp(String.raw`^${NUM}(?:\s*(?:to|-)\s*${NUM})?`);

function parse(n: string): number {
  const mixed = n.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = n.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(n);
}

/** Kitchen-friendly number: whole numbers, then quarters/thirds, rounded to nearest 1/4 above 1. */
export function formatAmount(x: number): string {
  if (x >= 10) return String(Math.round(x));
  const whole = Math.floor(x + 1e-9);
  const rest = x - whole;
  if (rest < 0.125) return String(whole || 1);
  if (rest > 0.875) return String(whole + 1);
  const [, text] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - rest) < Math.abs(best[0] - rest) ? f : best));
  return whole > 0 ? `${whole} ${text}` : text;
}

const UNIT = /^(\s*(?:small |large |medium )?)(cup|bunch|clove|can|slice|handful|sprig|piece|stick)(?![a-z])/;
const PLURAL: Record<string, string> = { bunch: "bunches" };

function scaleHead(text: string, factor: number): string {
  const m = text.match(LEADING);
  if (!m) return text;
  const value = parse(m[1]) * factor;
  const a = formatAmount(value);
  const b = m[2] ? formatAmount(parse(m[2]) * factor) : null;
  let rest = text.slice(m[0].length);
  if (value > 1.05) rest = rest.replace(UNIT, (_, pre: string, unit: string) => pre + (PLURAL[unit] ?? unit + "s"));
  return (b ? `${a} to ${b}` : a) + rest;
}

/**
 * Multiplies the amount at the start of a quantity ("1 cup", "1/2, grated", "2 to 3 cups"), the
 * amounts after "or" / "(or" / "made into" / "(about", and fixes plurals. Times like "soaked 6 to 8
 * hours" and phrases like "to taste" are left alone.
 */
export function scaleQty(qty: string, factor: number): string {
  if (factor === 1) return qty;
  const parts = qty.split(/(\(or |\bor |made into |\(about )/);
  return parts.map((p, i) => (i === 0 || i % 2 === 0 ? scaleHead(p, factor) : p)).join("");
}
