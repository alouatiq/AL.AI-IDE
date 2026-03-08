/* AL.AI IDE — Monaco editor + tab management.
 * Loads Monaco from CDN (AMD), keeps one model per open file, and mirrors every
 * edit back into the VFS (autosave) so the preview and AI always see fresh code. */
(function (IDE) {
  "use strict";

  const LANG = {
    js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
    ts: "typescript", tsx: "typescript", json: "json", html: "html", htm: "html",
    css: "css", scss: "scss", less: "less", md: "markdown", markdown: "markdown",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java", c: "c", h: "c",
    cpp: "cpp", cs: "csharp", php: "php", sh: "shell", bash: "shell", yml: "yaml",
    yaml: "yaml", xml: "xml", sql: "sql", vue: "html", svg: "xml", txt: "plaintext",
  };
  const langOf = (path) => LANG[(path.split(".").pop() || "").toLowerCase()] || "plaintext";

  const ed = {
    monaco: null, editor: null, ready: false,
    models: new Map(),   // path -> monaco model
    tabs: [],            // open paths in order
    active: null,
    _readyCbs: [],
  };

  const tabbar = () => IDE.$("#tabbar");
  const emptyEl = () => IDE.$("#editorEmpty");

  const writeBack = IDE.debounce((path, value) => {
    IDE.vfs.write(path, value, { silent: true });
    IDE.emit("editor:change", { path, value });
  }, 250);

  ed.init = function () {
    return new Promise((resolve) => {
      require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });
      require(["vs/editor/editor.main"], (monaco) => {
        ed.monaco = monaco;
        const dark = document.documentElement.getAttribute("data-theme") !== "light";
        ed.editor = monaco.editor.create(IDE.$("#editor"), {
          value: "", language: "plaintext",
          theme: dark ? "vs-dark" : "vs",
          automaticLayout: true, fontSize: 13, minimap: { enabled: true },
          scrollBeyondLastLine: false, tabSize: 2, renderWhitespace: "selection",
          fontFamily: "var(--mono)", padding: { top: 8 },
        });
        ed.editor.onDidChangeModelContent(() => {
          if (!ed.active) return;
          writeBack(ed.active, ed.editor.getValue());
        });
        // Ctrl/Cmd+S -> save to local folder (if bound) else toast
        ed.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          if (IDE.vfs.dirHandle) IDE.vfs.saveFolder(); else IDE.toast("Autosaved in browser · ⬇ ZIP or 💾 Open a folder to save to disk", "ok");
        });
        ed.ready = true;
        ed._readyCbs.forEach((cb) => cb()); ed._readyCbs = [];
        resolve();
      });
    });
  };

  ed.onReady = (cb) => { if (ed.ready) cb(); else ed._readyCbs.push(cb); };

  ed.setTheme = (dark) => { if (ed.monaco) ed.monaco.editor.setTheme(dark ? "vs-dark" : "vs"); };

  function modelFor(path) {
    if (ed.models.has(path)) return ed.models.get(path);
    const uri = ed.monaco.Uri.parse("inmemory://model/" + encodeURI(path));
    let m = ed.monaco.editor.getModel(uri);
    if (!m) m = ed.monaco.editor.createModel(IDE.vfs.read(path) || "", langOf(path), uri);
    ed.models.set(path, m);
    return m;
  }

  ed.openFile = function (path) {
    path = IDE.vfs.norm(path);
    if (IDE.vfs.isDir(path) || !IDE.vfs.files.has(path)) return;
    ed.onReady(() => {
      const m = modelFor(path);
      // keep model in sync if VFS changed underneath (e.g. AI wrote it)
      if (m.getValue() !== IDE.vfs.read(path) && path !== ed.active) m.setValue(IDE.vfs.read(path) || "");
      ed.editor.setModel(m);
      ed.active = path;
      if (!ed.tabs.includes(path)) ed.tabs.push(path);
      emptyEl().classList.add("hidden");
      renderTabs();
      ed.editor.focus();
      IDE.emit("editor:open", { path });
    });
  };

  ed.closeTab = function (path) {
    const i = ed.tabs.indexOf(path);
    if (i === -1) return;
    ed.tabs.splice(i, 1);
    const m = ed.models.get(path);
    if (m) { m.dispose(); ed.models.delete(path); }
    if (ed.active === path) {
      const next = ed.tabs[i] || ed.tabs[i - 1] || null;
      if (next) ed.openFile(next);
      else { ed.active = null; ed.editor.setModel(null); emptyEl().classList.remove("hidden"); }
    }
    renderTabs();
  };

  /** External update to a file's content (AI apply, rename). Refresh model + tab. */
  ed.refresh = function (path) {
    const m = ed.models.get(path);
    if (m && m.getValue() !== (IDE.vfs.read(path) || "")) {
      const pos = ed.active === path ? ed.editor.getPosition() : null;
      m.setValue(IDE.vfs.read(path) || "");
      if (pos) try { ed.editor.setPosition(pos); } catch (e) {}
    }
    if (!IDE.vfs.files.has(path)) ed.closeTab(path);
  };

  ed.rename = function (from, to) {
    const i = ed.tabs.indexOf(from);
    if (i !== -1) {
      const wasActive = ed.active === from;
      const m = ed.models.get(from);
      if (m) { m.dispose(); ed.models.delete(from); }
      ed.tabs.splice(i, 1);
      if (IDE.vfs.files.has(to)) { if (!ed.tabs.includes(to)) ed.tabs.splice(i, 0, to); if (wasActive) ed.openFile(to); }
      renderTabs();
    }
  };

  ed.getActivePath = () => ed.active;
  ed.getValue = () => (ed.editor ? ed.editor.getValue() : "");

  ed.insertAtCursor = function (text) {
    if (!ed.editor || !ed.active) return false;
    const sel = ed.editor.getSelection();
    ed.editor.executeEdits("ai-insert", [{ range: sel, text, forceMoveMarkers: true }]);
    ed.editor.focus();
    return true;
  };

  function renderTabs() {
    const bar = tabbar();
    bar.innerHTML = "";
    ed.tabs.forEach((p) => {
      const name = IDE.vfs.basename(p);
      const tab = IDE.el("div", { class: "tab" + (p === ed.active ? " active" : ""), title: p }, [
        IDE.el("span", { class: "nicon", text: IDE.explorer ? IDE.explorer.iconFor(name) : "📄" }),
        IDE.el("span", { class: "tname", text: name }),
        IDE.el("button", { class: "tclose", text: "✕", onclick: (e) => { e.stopPropagation(); ed.closeTab(p); } }),
      ]);
      tab.addEventListener("click", () => ed.openFile(p));
      bar.appendChild(tab);
    });
  }

  IDE.editor = ed;
})(window.IDE);
