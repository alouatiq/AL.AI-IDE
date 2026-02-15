// Vercel Edge Function — proxies chat completions to the selected provider using
// that provider's server-side secret key, so keys never reach the browser.
// Body: { provider, model, messages, stream, ... }. All providers here are
// OpenAI-compatible (Google via its /openai/ compatibility endpoint).
export const config = { runtime: "edge" };

// provider id -> upstream URL + the env var(s) that hold its key (first one set wins)
const MAP = {
  openrouter: { url: "https://openrouter.ai/api/v1/chat/completions", env: ["OPENROUTER_API_KEY"] },
  groq:       { url: "https://api.groq.com/openai/v1/chat/completions", env: ["GROQ_API_KEY"] },
  google:     { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", env: ["GEMINI_API_KEY", "GOOGLE_API_KEY"] },
  cerebras:   { url: "https://api.cerebras.ai/v1/chat/completions", env: ["CEREBRAS_API_KEY"] },
};

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: { message: "Method not allowed" } }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: { message: "Invalid JSON body" } }, 400); }

  const providerId = (body.provider || "openrouter").toLowerCase();
  const p = MAP[providerId];
  if (!p) return json({ error: { message: "Unknown provider: " + providerId } }, 400);

  const key = p.env.map((e) => process.env[e]).find(Boolean);
  if (!key) {
    return json({ error: { message: `No server key for ${providerId}. Set ${p.env.join(" or ")} in the environment, or add your own key in Settings.` } }, 400);
  }

  // Forward everything except our routing field.
  const { provider, ...payload } = body;

  let upstream;
  try {
    upstream = await fetch(p.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
        "HTTP-Referer": req.headers.get("origin") || "https://al-ai-ide.vercel.app",
        "X-Title": "AL.AI-IDE",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json({ error: { message: "Upstream fetch failed: " + e.message } }, 502);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
