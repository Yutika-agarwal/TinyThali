// Supabase Edge Function (Deno). Deploy: supabase functions deploy identify-ingredients
// Secret: supabase secrets set ANTHROPIC_API_KEY=...
// Requires a signed-in user (JWT verification is on by default).
//
// Privacy: receives one downscaled photo and a list of ingredient ids. The photo is sent to
// the model and is not stored.

const ID = /^[a-z_]{2,30}$/;
const MAX_IMAGE_CHARS = 2_000_000; // about 1.5 MB of JPEG

Deno.serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const { image, candidates } = await req.json();
    const okList = Array.isArray(candidates) && candidates.length <= 100 && candidates.every((x) => typeof x === "string" && ID.test(x));
    if (typeof image !== "string" || image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image) || !okList) {
      return new Response(JSON.stringify({ error: "bad input" }), { status: 400, headers });
    }

    const prompt = `Look at this photo of food ingredients (a fridge, pantry shelf or counter).
List which of these ingredient ids you can clearly see: ${candidates.join(", ")}
Only include items you are confident about. Do not guess. Do not include ids that are not in the list.
Respond with ONLY a JSON array of ids, for example ["potato","spinach"]. If you see none, respond with [].`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return new Response(JSON.stringify({ error: "model error" }), { status: 502, headers });

    const body = await res.json();
    const text: string = body?.content?.[0]?.text ?? "[]";
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const parsed = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === "string" && candidates.includes(x)) : [];
    return new Response(JSON.stringify({ ids }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "failed" }), { status: 500, headers });
  }
});
