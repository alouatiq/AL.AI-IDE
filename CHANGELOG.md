# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-11

### Added
- **Initial release — a serverless AI web IDE.**
- VS Code–style three-pane workbench: activity bar, file explorer, tabbed **Monaco** editor, and AI chat.
- **Virtual file system** persisted in IndexedDB; create/rename/delete files & folders; drag-and-drop import.
- **Open a local folder** and **save back to disk** via the File System Access API; **download project as ZIP**.
- **AI coding assistant** over free providers (OpenRouter, Groq, Google, Cerebras) with a curated coding-model
  list, OpenRouter live free-model merge, streaming, two-level fallback, and project/file context injection.
- **Apply-to-editor**: New file / Insert / Copy buttons on every AI code block; target-path aware.
- **Skills & templates**: start-up wizard (Static, React+Vite, Node+Express, Python, Blank) with pre-selected
  skill add-ons (README, .gitignore, .editorconfig, Prettier, ESLint, MIT, GitHub Actions).
- **Live preview** in a sandboxed iframe with relative-asset rewriting and auto-refresh.
- **GitHub integration**: connect with a fine-grained token, list/create/select repos, and push the whole
  project in one commit via the Git Data API.
- Optional Vercel **Edge functions** (`api/chat`, `api/models`) to proxy a shared server key.
- Security headers + Content-Security-Policy in `vercel.json`.
- Full governance docs, per-directory READMEs, and CI/CD scaffolding.

[Unreleased]: https://github.com/alouatiq/AL.AI-IDE/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/alouatiq/AL.AI-IDE/releases/tag/v0.1.0
