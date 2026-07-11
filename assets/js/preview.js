/* AL.AI IDE — Live preview.
 * Assembles the project into a sandboxed iframe. For static sites it rewrites
 * relative href/src references (and CSS url(...)) to blob URLs built from the VFS,
 * so multi-file HTML/CSS/JS projects render without any build or server. */
(function (IDE) {
  "use strict";

  const MIME = {
    html: "text/html", htm: "text/html", css: "text/css", js: "text/javascript",
    mjs: "text/javascript", json: "application/json", svg: "image/svg+xml",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
    webp: "image/webp", ico: "image/x-icon",
  };
  const mimeOf = (p) => MIME[(p.split(".").pop() || "").toLowerCase()] || "text/plain";

  const pv = { open: false, _urls: [] };

  const pane = () => IDE.$("#previewPane");
  const frame = () => IDE.$("#previewFrame");

  function revoke() { pv._urls.forEach((u) => URL.revokeObjectURL(u)); pv._urls = []; }

  function blobFor(content, mime) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    pv._urls.push(url);
    return url;
  }

  function resolvePath(base, ref) {
    // resolve a relative reference against the entry file's directory
    ref = ref.replace(/^\.\//, "");
    if (ref.startsWith("/")) return IDE.vfs.norm(ref);
    const parts = (base ? base.split("/") : []);
    for (const seg of ref.split("/")) {
      if (seg === "..") parts.pop();
      else if (seg !== ".") parts.push(seg);
    }
    return IDE.vfs.norm(parts.join("/"));
  }

  function build(entry) {
    revoke();
    if (!IDE.vfs.files.has(entry)) {
      // maybe a lone HTML file exists — pick first .html
      const html = IDE.vfs.list().find((p) => /\.html?$/.test(p));
      if (html) entry = html; else return "<html><body style='font-family:sans-serif;padding:2rem;color:#888'>No <b>" + IDE.esc(entry) + "</b> to preview. Set an entry file above, or create an index.html.</body></html>";
    }
    const baseDir = IDE.vfs.dirname(entry);
    let html = IDE.vfs.read(entry) || "";

    // pre-build blob URLs for every file, keyed by path
    const urlByPath = {};
    const urlFor = (path) => {
      if (!IDE.vfs.files.has(path)) return null;
      if (!urlByPath[path]) {
        let content = IDE.vfs.read(path);
        if (/\.css$/i.test(path)) content = rewriteCss(content, IDE.vfs.dirname(path));
        urlByPath[path] = blobFor(content, mimeOf(path));
      }
      return urlByPath[path];
    };

    function rewriteCss(css, cssDir) {
      return css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, ref) => {
        if (/^(https?:|data:|#)/.test(ref)) return m;
        const p = resolvePath(cssDir, ref);
        const u = urlFor(p);
        return u ? "url(" + q + u + q + ")" : m;
      });
    }

    // rewrite src / href attributes pointing at local files
    html = html.replace(/\b(src|href)=(["'])([^"']+)\2/gi, (m, attr, q, ref) => {
      if (/^(https?:|data:|mailto:|#|\/\/)/.test(ref)) return m;
      const p = resolvePath(baseDir, ref);
      const u = urlFor(p);
      return u ? attr + "=" + q + u + q : m;
    });

    return html;
  }

  pv.reload = function () {
    const entry = IDE.vfs.norm(IDE.$("#previewEntry").value || "index.html");
    const doc = build(entry);
    frame().src = blobFor(doc, "text/html");
  };

  pv.show = function () {
    pane().classList.remove("hidden");
    pv.open = true;
    pv.reload();
  };
  pv.hide = function () { pane().classList.add("hidden"); pv.open = false; revoke(); };
  pv.toggle = function () { pv.open ? pv.hide() : pv.show(); };

  // auto-refresh on edits when preview is open (debounced)
  const auto = IDE.debounce(() => { if (pv.open) pv.reload(); }, 500);
  IDE.on("editor:change", auto);
  IDE.on("fs:change", auto);

  IDE.on("app:ready", () => {
    IDE.$("#previewReload").addEventListener("click", () => pv.reload());
    IDE.$("#previewClose").addEventListener("click", () => pv.hide());
    IDE.$("#previewEntry").addEventListener("keydown", (e) => { if (e.key === "Enter") pv.reload(); });
  });

  IDE.preview = pv;
})(window.IDE);
