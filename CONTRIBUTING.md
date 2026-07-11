# Contributing to AL.AI IDE

Thanks for your interest! This is a **dependency-free, no-build** app — one HTML file, one CSS file, and a
handful of small classic-script JS modules under a single `IDE` namespace. That makes it easy to hack on.

## Setup

```bash
git clone https://github.com/alouatiq/AL.AI-IDE.git
cd AL.AI-IDE
npx serve .          # static — bring your own key in ⚙ Settings
# or, to run the Edge functions too:
cp .env.example .env.local   # add OPENROUTER_API_KEY
npx vercel dev
```

Open the printed `http://localhost:…` (not the `file://` path — Monaco needs an http origin).

## Project layout

See [`assets/js/README.md`](assets/js/README.md) — every concern (VFS, editor, explorer, preview, AI, GitHub)
is its own module. Add features to the matching module; keep `app.js` for wiring only.

## Branching & commits

We follow **GitHub Flow** with short-lived branches off `main`:

```bash
git switch main && git pull
git switch -c feat/my-thing
```

- Branch names: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`, `security/…`.
- Use **[Conventional Commits](https://www.conventionalcommits.org/)**:

  ```
  feat(preview): auto-refresh on file rename

  Short body explaining what & why.

  Standards: digital-solutions
  ```

- Keep commits small and each one leaving the app working.
- Open a PR; make sure CI is green; PRs are squash-merged into `main`.

## Style

- Match the surrounding code (2-space indent, `.editorconfig` enforced).
- No frameworks, no build step, no new runtime dependencies without discussion.
- Prefer small, focused functions and clear names over cleverness.

## Good first issues

- New project **templates** or **skills** (`assets/js/skills.js`).
- More editor languages / file-type icons.
- UI/UX polish, accessibility, keyboard shortcuts.
- Docs and screenshots.

By contributing you agree your work is licensed under the project's [MIT License](LICENSE).
