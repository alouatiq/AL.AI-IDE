# `assets/css/` — Styles

`app.css` contains **all** styling for the IDE — there is no CSS build step or preprocessor.

- **Theming** is driven by CSS custom properties on `:root`, overridden by `html[data-theme="light"]`.
  The theme toggle just flips that attribute (and re-themes Monaco).
- Organised top-to-bottom by region: top bar → workbench → activity bar → side panel → editor/tabs →
  preview → chat → modals.
- Layout uses flexbox; the side panel and chat column are resizable via the `.splitter` handles.

To restyle, edit the variables at the top first — most colors cascade from there.

↑ Back to [`assets/`](../README.md) · [project root](../../README.md).
