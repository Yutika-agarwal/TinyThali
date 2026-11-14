import { INGREDIENT_BY_ID } from "../data/ingredients.ts";

/**
 * Photo scan: the AI only suggests ingredient ids from our own table. We never trust it
 * for anything else, and the parent confirms every suggestion before it reaches the fridge.
 */

/** Ids the model may choose from (everything except always-assumed pantry staples). */
export function scanCandidateIds(): string[] {
  return Object.values(INGREDIENT_BY_ID)
    .filter((i) => i.category !== "pantry")
    .map((i) => i.id);
}

/** Keeps only known, non-pantry ids, without duplicates. Pure, so it is unit-tested. */
export function validateDetected(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ok = new Set(scanCandidateIds());
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id === "string" && ok.has(id) && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 30);
}

/** Downscales a photo so it uploads quickly on mobile data. Returns a base64 JPEG (no prefix). */
export async function resizeToJpegBase64(file: File, maxSide = 1024, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
