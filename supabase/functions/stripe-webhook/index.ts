// Supabase Edge Function (Deno). Receives Stripe's "payment completed" event and records the donation.
// Deploy WITHOUT JWT checks, because Stripe calls it, not a signed-in user:
//   supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to functions automatically.)
//
// Safety: the request is trusted only if Stripe's signature verifies. Never skip that check.

const TOLERANCE_SECONDS = 300;

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const body = await req.text();
  const header = req.headers.get("stripe-signature") ?? "";
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  if (!parts.t || !parts.v1 || !secret) return new Response("bad request", { status: 400 });

  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  const expected = await hmacHex(secret, `${parts.t}.${body}`);
  if (age > TOLERANCE_SECONDS || !safeEqual(expected, parts.v1)) return new Response("bad signature", { status: 400 });

  const event = JSON.parse(body);
  if (event.type === "checkout.session.completed" && event.data?.object?.payment_status === "paid") {
    const s = event.data.object;
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/donations`, {
      method: "POST",
      headers: {
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify({
        user_id: s.client_reference_id ?? null,
        amount_cents: s.amount_total,
        currency: s.currency ?? "usd",
        stripe_session_id: s.id,
      }),
    });
    if (!res.ok) return new Response("db error", { status: 500 }); // Stripe will retry
  }
  return new Response("ok");
});
