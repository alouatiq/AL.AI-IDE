# `assets/` — Frontend assets

All of the app's client code and styling.

| Path | What it holds |
|------|---------------|
| [`css/`](css/README.md) | `app.css` — every style rule (layout, themes, components). |
| [`js/`](js/README.md) | The application modules, one per concern, under a single `IDE` namespace. |

Third-party libraries (Monaco, JSZip) are **not** vendored here — they load from a CDN in
[`../index.html`](../index.html), keeping the repo dependency-free and build-free.

↑ Back to the [project root](../README.md).
