# `api/` — Vercel Edge Functions

Optional serverless functions. They exist only to keep a **shared provider key** secret when the app
is deployed. Without them the app still works fully with **bring-your-own-key**.

| File | Role |
|------|------|
| `chat.js` | Proxies chat completions to the selected provider (OpenAI-compatible), adding the server-side key. Streams the response straight back. |
| `models.js` | Returns the live OpenRouter free-model list (coding models ranked first) and which providers have a server key configured (booleans only — never the keys). |

Each function runs on the **Edge runtime** (`export const config = { runtime: "edge" }`). Keys come from
environment variables — see [`../.env.example`](../.env.example). No key is ever sent to the browser.

Add a new provider by extending the `MAP` in `chat.js` (id → upstream URL + env var names).

↑ Back to the [project root](../README.md).
