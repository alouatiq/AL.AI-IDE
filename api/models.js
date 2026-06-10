// Vercel Edge Function — returns:
//   models:    the live list of free OpenRouter model IDs, with coding-capable
//              models ranked first (self-healing so model names never go stale)
//   providers: which providers have a server-side key configured (booleans only,
//              never the keys themselves) so the frontend knows what it can use.
export const config = { runtime: "edge" };

// Substrings that mark a model as strong at code. Order = rough preference.
const CODING_HINTS = ["coder", "code", "deepseek", "qwen", "devstral", "codestral", "starcoder"];

function codingRank(id) {
  const s = id.toLowerCase();
  const i = CODING_HINTS.findIndex((h) => s.includes(h));
  return i === -1 ? CODING_HINTS.length : i;
}

export default async function handler() {
  const providers = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    agentrouter: !!process.env.AGENTROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    google: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    cerebras: !!process.env.CEREBRAS_API_KEY,
  };

  let models = [];
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models");
    const j = await r.json();
    models = (j.data || [])
      .filter((m) => typeof m.id === "string" && m.id.endsWith(":free"))
      .map((m) => m.id)
      .sort((a, b) => codingRank(a) - codingRank(b) || a.localeCompare(b));
  } catch (e) { /* leave models empty; frontend has static fallbacks */ }

  return new Response(JSON.stringify({ models, providers }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
