import { supabase } from "./supabase.ts";

/** The only events we count. The database function rejects anything else. */
export const USAGE_EVENTS = [
  "recipe_cooked",
  "boost_applied",
  "recipe_saved",
  "voice_used",
  "photo_used",
  "sponsor_tapped",
] as const;
export type UsageEvent = (typeof USAGE_EVENTS)[number];

/**
 * Adds one to today's anonymous count for an event. Nothing else is sent: no id, no text, no kid data.
 * Silent if Supabase is not set up or the network fails. Never blocks the screen.
 */
export function track(event: UsageEvent): void {
  if (!supabase) return;
  void Promise.resolve(supabase.rpc("bump_usage", { p_event: event })).catch(() => {});
}
