// Supabase Edge Function (Deno). Creates a Stripe Checkout Session for a pay-what-you-want payment.
// Deploy: supabase functions deploy create-checkout
// Secrets: supabase secrets set STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://your-site.example
//
// Card details are typed on Stripe's own page. They never touch this app or this function.
// Requires a signed-in user (JWT verification is on by default).

const MIN_CENTS = 100;
const MAX_CENTS = 50_000;

Deno.serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const userId = JSON.parse(atob(jwt.split(".")[1] ?? "") || "{}").sub as string | undefined;
    if (!userId) return new Response(JSON.stringify({ error: "sign in first" }), { status: 401, headers });

    const { amount_cents } = await req.json();
    if (!Number.isInteger(amount_cents) || amount_cents < MIN_CENTS || amount_cents > MAX_CENTS) {
      return new Response(JSON.stringify({ error: "bad amount" }), { status: 400, headers });
    }

    const site = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
    if (!site) return new Response(JSON.stringify({ error: "not configured" }), { status: 500, headers });

    const form = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(amount_cents),
      "line_items[0][price_data][product_data][name]": "Support Tiny Thali",
      client_reference_id: userId,
      success_url: `${site}/support?thanks=1`,
      cancel_url: `${site}/support`,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY") ?? ""}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const session = await res.json();
    if (!res.ok || typeof session.url !== "string") {
      return new Response(JSON.stringify({ error: "stripe error" }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ url: session.url }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "failed" }), { status: 500, headers });
  }
});
