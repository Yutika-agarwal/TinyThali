// Supabase Edge Function (Deno). Deploy: supabase functions deploy suggest-recipes
// Secret: supabase secrets set ANTHROPIC_API_KEY=...
// Requires a signed-in user (JWT verification is on by default).
//
// Privacy: receives only ingredient ids. No kid profile, name, age or allergy data.

const ID = /^[a-z_]{2,30}$/;

Deno.serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const { fridge, pantry } = await req.json();
    const ok = (a: unknown) => Array.isArray(a) && a.length <= 40 && a.every((x) => typeof x === "string" && ID.test(x));
    if (!ok(fridge) || !ok(pantry) || fridge.length === 0) {
      return new Response(JSON.stringify({ error: "bad input" }), { status: 400, headers });
    }

    const prompt = `You write simple Indian home-style, vegetarian recipe ideas for kids.
Use ONLY these ingredient ids (the parent has them): ${fridge.join(", ")}
Pantry staples also allowed: ${pantry.join(", ")}
Do not use any other ingredient. Suggest up to 3 different, realistic recipes.
Respond with ONLY a JSON array, no prose, like:
[{"name":"","blurb":"one short sentence","minutes":20,"ingredients":[{"id":"ingredient_id","qty":"1 cup"}],"steps":["..."]}]
Rules: every ingredient "id" must be from the lists above. Steps are short and clear. No health or medical claims. Soft textures, and nothing whole that is a choking hazard.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return new Response(JSON.stringify({ error: "model error" }), { status: 502, headers });

    const body = await res.json();
    const text: string = body?.content?.[0]?.text ?? "[]";
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const ideas = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : [];
    return new Response(JSON.stringify({ ideas }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "failed" }), { status: 500, headers });
  }
});
