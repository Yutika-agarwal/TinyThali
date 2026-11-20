/**
 * MVP build: only the core loop works with no backend, accounts or keys.
 *   kid profile (safety) -> ingredients (type, pick, speak) -> safe recipes -> Tiny Boosts -> cook -> loved / not this time -> save
 * Everything below is built and tested on `main`, and switched off here so the MVP stays small and testable.
 */
export const FEATURES = {
  /** Community tips, sharing, guidelines and moderation. */
  community: false,
  /** Email sign-in and cloud sync. Saved recipes stay on the device. */
  accounts: false,
  /** Pay-what-you-want support (Stripe). */
  support: false,
  /** Grocery-store sponsored lines. */
  sponsors: false,
  /** AI recipe ideas and photo scan. Both need an Anthropic key behind a Supabase function. */
  ai: false,
} as const;
