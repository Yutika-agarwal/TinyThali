import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase client, or null when the keys are not configured. When null the app runs
 * in local-only mode (everything stays on the device), exactly like the first prototype.
 */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

export const cloudEnabled = supabase !== null;
