<h1 align="center">AL.AI IDE</h1>

<p align="center">
  A browser-based, serverless AI web IDE. Build a project locally, edit it in a real
  <b>Monaco</b> editor, pair with an AI assistant that reads and writes your files,
  preview it live, and export it as a ZIP or push it straight to <b>GitHub</b>.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green"></a>
  <img alt="No backend" src="https://img.shields.io/badge/backend-none-8b5cf6">
  <img alt="Runs in the browser" src="https://img.shields.io/badge/runs-in%20your%20browser-3b82f6">
  <img alt="No build step" src="https://img.shields.io/badge/build-none-64748b">
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#what-you-can-build">What you can build</a> ·
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

**AL.AI IDE** is a single-page web IDE that runs entirely in the browser. You build a
project locally in a real file tree (persisted in IndexedDB), edit it with the VS Code
editor engine (Monaco), and work alongside an AI coding assistant that reads your open
file and project context and returns code you can apply in one click.

Nothing is uploaded until you choose to push to GitHub. Your project lives in your
browser and survives reloads. You can run the app as a plain static site, or deploy your
own instance on Vercel in minutes.

![AL.AI IDE](docs/screenshots/ide.png)

---

## What you can build

The **IDE application itself is frontend-only** — there is no backend of ours. The
optional `api/*` Edge functions exist solely to keep a shared AI provider key secret;
every feature also works with a bring-your-own-key setup and no server at all.

As a **project scaffolder**, however, it generates both **frontend and backend**
starters:

| Template | Stack | Runs in Live Preview? |
|----------|-------|-----------------------|
| Static Website | HTML + CSS + JS | Yes — instantly |
| React + Vite | React SPA | No — `npm install && npm run dev` locally |
| Node + Express API | Express REST API | No — runs locally |
| Python CLI | Python + argparse | No — runs locally |
| **FastAPI + React** | FastAPI backend + React/Vite frontend | No — run each locally |
| **Django + React** | Django backend + React/Vite frontend | No — run each locally |
| Blank | Empty starter | — |

> **Note:** the in-browser Live Preview runs **frontend/static** projects in a sandboxed
> iframe. Backend and full-stack templates are meant to be exported (ZIP or GitHub) and
> run locally — each includes a README with the exact commands.

The two full-stack templates ship a **React (Vite) frontend** wired to a backend on
`:8000` through a dev proxy, so the two halves run same-origin during development with no
CORS configuration.

---

## Features

**Editor**
- Monaco editor (the engine behind VS Code) — syntax highlighting for 25+ languages, minimap, multi-tab editing.
- Local file system: create, rename, delete files and folders; drag-and-drop from your OS.
- Autosave to the browser (IndexedDB) — reopen the tab and your project is intact.
- Open a real folder from disk (File System Access API) and save changes back to it.
- Export the whole project as a `.zip` at any time.

**AI coding assistant**
- Curated free coding models ranked first — Qwen 2.5 Coder, DeepSeek V3/R1, Llama 3.3 70B, Gemini Flash — across OpenRouter, Groq, Google and Cerebras, plus OpenRouter's live free-model list.
- Two-level automatic fallback: if a model is rate-limited or fails, it walks to the next provider/model.
- Context-aware: the assistant receives your open file and project file list (toggle off any time).
- One-click apply: every returned code block has New file / Insert / Copy actions; a named target path writes straight to that file.
- Bring-your-own-key for any provider (stored only in your browser), or rely on the deployment's shared server key.

**Skills & templates**
- Start-up wizard: pick a template and toggle pre-installed skills (README, `.gitignore`, `.editorconfig`, Prettier, ESLint, MIT license, GitHub Actions, plus Contributing, Code of Conduct and Security policy generators).
- Add skills to an existing project later from the Skills panel.

**Live preview**
- Renders your project in a sandboxed iframe, rewriting relative asset links to blob URLs so multi-file HTML/CSS/JS sites work with no build and no server. Auto-refreshes as you type.

**GitHub integration**
- Connect with a fine-grained token (stored only in your browser — fully serverless, no OAuth secret).
- List, create and select a repository, then push the whole project in one commit via the Git Data API, with a live per-file log.

**Privacy**
- Project files, chat history and settings stay in your browser.
- The only outbound calls are to the AI provider you pick and, when you push, to `api.github.com`.

---

## Quick start

```bash
git clone https://github.com/alouatiq/AL.AI-IDE.git
cd AL.AI-IDE

# Run as a static site (bring your own key in Settings):
npx serve .
# open the printed http://localhost:xxxx
```

> Open the app through a local server (`npx serve .`), not the `file://` path — Monaco
> needs an `http(s)` origin.

Then add your own free key (e.g. [openrouter.ai/keys](https://openrouter.ai/keys)) in
**Settings**, or deploy with a server key so visitors need no key of their own (below).

---

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falouatiq%2FAL.AI-IDE)

1. Click the button (or run `vercel`).
2. *(Optional)* add any of these environment variables so visitors need no key of their own:

   | Variable | Provider | Get a free key |
   |----------|----------|----------------|
   | `OPENROUTER_API_KEY` | OpenRouter (best free coding models) | <https://openrouter.ai/keys> |
   | `GROQ_API_KEY` | Groq (very fast) | <https://console.groq.com/keys> |
   | `GEMINI_API_KEY` | Google Gemini | <https://aistudio.google.com/app/apikey> |
   | `CEREBRAS_API_KEY` | Cerebras (very fast) | <https://cloud.cerebras.ai/> |

3. Redeploy. Vercel serves `index.html` statically and runs `api/*` as Edge functions.

**Local development with the Edge functions:**

```bash
cp .env.example .env.local   # add at least OPENROUTER_API_KEY
npx vercel dev
```

The app also works with **zero** server keys — it simply prompts each visitor to add
their own in Settings.

---

## Architecture

```
Browser (index.html + assets/js/*)
   ├─ Left   · file tree ........ VFS in IndexedDB (+ File System Access API, ZIP export)
   ├─ Middle · code editor ...... Monaco (from CDN)
   ├─ Right  · AI assistant ..... your key → provider directly
   │                              server key → /api/chat (Edge fn adds the secret)
   └─ GitHub · push ............. api.github.com with your browser-only token
```

| Provider key priority | `your own key (overrides) → shared server key → skip` |
|---|---|

The four Edge functions are optional — they exist only to keep a shared server key
secret. Without them, every feature still works with bring-your-own-key.

**Tech stack**

- Vanilla JavaScript (no framework, no build step), organised into small classic-script modules under one `IDE` namespace.
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) (CDN) — the VS Code editing engine.
- [JSZip](https://stuk.github.io/jszip/) (CDN) — project export.
- IndexedDB + File System Access API — local persistence and real-folder access.
- Vercel Edge Functions — optional serverless key proxy.
- GitHub REST / Git Data API — browser-side push.

---

## Project structure

```
AL.AI-IDE/
├── index.html            # app shell (loads Monaco + all modules)
├── assets/
│   ├── css/app.css       # all styling
│   └── js/               # one module per concern (util, vfs, editor, explorer,
│                         #   preview, skills, ai, github, app) — see assets/js/README.md
├── api/                  # optional Vercel Edge functions (chat proxy, model list)
├── docs/                 # screenshots & design notes
└── .github/              # CI/CD, Dependabot, issue/PR templates
```

Every directory has its own `README.md` explaining what lives there.

---

## Contributing

Contributions are welcome. This is a dependency-free, no-build app, which makes it easy
to hack on. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup and conventions, and the
**[Code of Conduct](CODE_OF_CONDUCT.md)**. Good first areas: new templates and skills,
additional languages, UI polish, and documentation.

## Security

See **[SECURITY.md](SECURITY.md)** to report a vulnerability. Keys and tokens live only
in your browser; the deployment's server keys stay in Vercel environment variables behind
the Edge proxy.

## License

Released under the **[MIT License](LICENSE)** © 2026 AL OUATIQ.

## Contact

| | |
|---|---|
| **Author** | AL OUATIQ |
| **Website** | <https://alouatiq.com> |
| **Email** | contact@alouatiq.com |
| **GitHub** | [@alouatiq](https://github.com/alouatiq) |
