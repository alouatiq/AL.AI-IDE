# `assets/js/` — Application modules

Plain classic scripts (no bundler), loaded in order from [`../../index.html`](../../index.html). Each attaches
to one global `IDE` namespace, so load order matters (later modules use earlier ones).

| # | File | Responsibility | Public surface |
|---|------|----------------|----------------|
| 1 | `util.js` | Namespace, `localStorage` wrapper, event bus, DOM helpers, toast/modal/prompt, safe markdown renderer. | `IDE.store`, `IDE.on/emit`, `IDE.$`, `IDE.el`, `IDE.modal`, `IDE.ask`, `IDE.renderMarkdown` |
| 2 | `vfs.js` | Virtual file system: in-memory tree, IndexedDB persistence, File System Access API, ZIP export. | `IDE.vfs` |
| 3 | `skills.js` | Project **templates** and installable **skills** (config/tooling add-ons). | `IDE.skills` |
| 4 | `editor.js` | Monaco setup, tab management, model sync, apply/insert helpers. | `IDE.editor` |
| 5 | `explorer.js` | File-tree UI: render, create/rename/delete, drag-drop import. | `IDE.explorer` |
| 6 | `preview.js` | Live preview: builds a sandboxed iframe from the VFS with asset rewriting. | `IDE.preview` |
| 7 | `ai.js` | AI chat zone: providers, coding-model list + fallback, streaming, context, code actions, settings. | `IDE.ai` |
| 8 | `github.js` | GitHub token connect, repo list/create/select, one-commit push via the Git Data API. | `IDE.github` |
| 9 | `app.js` | Boot & wiring only: theme, activity bar, splitters, skills panel, startup wizard. | — |

## Conventions

- **Events** decouple modules — e.g. `vfs.js` emits `fs:change`, the explorer re-renders. Key events:
  `app:ready`, `fs:change`, `fs:reload`, `editor:open`, `editor:change`, `project:name`.
- **State** lives in its module; small settings persist via `IDE.store` (`localStorage`), the project via
  IndexedDB (in `vfs.js`).
- Add a **feature** to the matching module; keep `app.js` for wiring.

↑ Back to [`assets/`](../README.md) · [project root](../../README.md).
