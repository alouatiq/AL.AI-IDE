# Security Policy

## Reporting a vulnerability

If you discover a security issue in AL.AI IDE, please report it **privately** so it can be fixed
before public disclosure.

- **Email:** contact@alouatiq.com
- Please include: a description, steps to reproduce, affected version/commit, and any proof-of-concept.
- You'll get an acknowledgement as soon as possible, and updates as the issue is triaged and fixed.

Please **do not** open a public GitHub issue for security vulnerabilities.

## Supported versions

The latest release on `main` is supported. Pre-1.0 releases receive fixes on a best-effort basis.

## Design notes relevant to security

AL.AI IDE is a **serverless, browser-first** app. The security model is:

- **Secrets stay client-side.** Provider API keys and your GitHub token are stored **only in your
  browser** (`localStorage`). They are never sent to any server we control.
- **Optional Edge proxy.** When deployed on Vercel with provider env vars set, the `api/*` Edge
  functions add the shared server key server-side so it never reaches the browser. They forward only
  to the fixed set of provider endpoints.
- **GitHub push** uses the GitHub REST/Git Data API directly from the browser with the user's own
  fine-grained token — recommend scoping it to the target repositories and the minimum permissions
  (Contents: read & write; Administration: read & write only if creating repos).
- **Live preview** runs project code inside a **sandboxed iframe** built from in-memory blob URLs.
  Only preview a project you trust; treat it like running untrusted code locally.
- **Content-Security-Policy** and hardening headers are set in `vercel.json` and restrict script,
  connect, frame and style sources to what the app actually needs.

## Scope

In scope: the app code in this repository (`index.html`, `assets/`, `api/`). Out of scope:
vulnerabilities in third-party providers (OpenRouter, Groq, Google, Cerebras, GitHub) or in the CDN
libraries (Monaco, JSZip) themselves — report those upstream.
