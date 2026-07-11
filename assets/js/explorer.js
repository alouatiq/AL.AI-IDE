/* AL.AI IDE — File explorer tree.
 * Renders the VFS as a collapsible tree with create / rename / delete actions
 * and drag-drop import of files from the OS. */
(function (IDE) {
  "use strict";

  const ICONS = {
    js: "🟨", jsx: "⚛️", ts: "🔷", tsx: "⚛️", json: "🔧", html: "🌐", htm: "🌐",
    css: "🎨", scss: "🎨", md: "📝", py: "🐍", rb: "💎", go: "🐹", rs: "🦀",
    java: "☕", php: "🐘", sh: "💻", yml: "⚙️", yaml: "⚙️", txt: "📃", svg: "🖼️",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", lock: "🔒",
  };
  const iconFor = (name) => {
    if (name === ".gitignore" || name === ".env" || name === ".editorconfig") return "⚙️";
    if (name === "LICENSE") return "📜";
    return ICONS[(name.split(".").pop() || "").toLowerCase()] || "📄";
  };

  const collapsed = new Set(IDE.store.get("ide_collapsed", []));
  const saveCollapsed = () => IDE.store.set("ide_collapsed", Array.from(collapsed));

  const exp = { iconFor };

  function nodeRow(node, depth) {
    const pad = 6 + depth * 12;
    if (node.dir) {
      const isOpen = !collapsed.has(node.path);
      const row = IDE.el("div", { class: "node", style: "padding-left:" + pad + "px", title: node.path }, [
        IDE.el("span", { class: "twist", text: isOpen ? "▾" : "▸" }),
        IDE.el("span", { class: "nicon", text: isOpen ? "📂" : "📁" }),
        IDE.el("span", { class: "nname", text: node.name }),
        IDE.el("button", { class: "nact", title: "New file", text: "＋", onclick: (e) => { e.stopPropagation(); newFileIn(node.path); } }),
        IDE.el("button", { class: "nact", title: "Delete", text: "🗑", onclick: (e) => { e.stopPropagation(); del(node.path); } }),
      ]);
      row.addEventListener("click", () => { if (isOpen) collapsed.add(node.path); else collapsed.delete(node.path); saveCollapsed(); render(); });
      // drop target
      row.addEventListener("dragover", (e) => { e.preventDefault(); row.classList.add("dragover"); });
      row.addEventListener("dragleave", () => row.classList.remove("dragover"));
      row.addEventListener("drop", (e) => onDrop(e, node.path));
      const wrap = IDE.el("div");
      wrap.appendChild(row);
      if (isOpen && node.children) node.children.forEach((c) => wrap.appendChild(nodeRow(c, depth + 1)));
      return wrap;
    }
    const active = IDE.editor && IDE.editor.getActivePath() === node.path;
    const row = IDE.el("div", { class: "node" + (active ? " active" : ""), style: "padding-left:" + (pad + 12) + "px", title: node.path }, [
      IDE.el("span", { class: "nicon", text: iconFor(node.name) }),
      IDE.el("span", { class: "nname", text: node.name }),
      IDE.el("button", { class: "nact", title: "Rename", text: "✎", onclick: (e) => { e.stopPropagation(); rename(node.path); } }),
      IDE.el("button", { class: "nact", title: "Delete", text: "🗑", onclick: (e) => { e.stopPropagation(); del(node.path); } }),
    ]);
    row.addEventListener("click", () => IDE.editor.openFile(node.path));
    return row;
  }

  function render() {
    const host = IDE.$("#tree");
    if (!host) return;
    host.innerHTML = "";
    const tree = IDE.vfs.tree();
    if (!tree.length) {
      host.appendChild(IDE.el("div", { class: "tree-empty", html:
        "No files yet.<br><br>Start from a template in <b>🧩 Skills</b>, click <b>🗎</b> to add a file, or <b>drag files</b> here." }));
      return;
    }
    tree.forEach((n) => host.appendChild(nodeRow(n, 0)));
  }

  async function newFileIn(dir) {
    const name = await IDE.ask("New file", dir ? "Path inside " + dir : "File name (can include folders, e.g. src/app.js)", "");
    if (!name) return;
    const path = IDE.vfs.norm((dir ? dir + "/" : "") + name);
    if (IDE.vfs.exists(path)) { IDE.toast("Already exists", "err"); return; }
    IDE.vfs.write(path, "");
    IDE.editor.openFile(path);
  }

  async function newFolderIn(dir) {
    const name = await IDE.ask("New folder", "Folder name", "");
    if (!name) return;
    IDE.vfs.mkdir(IDE.vfs.norm((dir ? dir + "/" : "") + name));
  }

  async function rename(path) {
    const cur = IDE.vfs.basename(path);
    const name = await IDE.ask("Rename", "New name (or path)", cur);
    if (!name || name === cur) return;
    const parent = IDE.vfs.dirname(path);
    const to = IDE.vfs.norm(name.includes("/") ? name : (parent ? parent + "/" : "") + name);
    if (IDE.vfs.exists(to)) { IDE.toast("Target exists", "err"); return; }
    IDE.vfs.rename(path, to);
    IDE.editor.rename(path, to);
  }

  async function del(path) {
    const ok = await IDE.confirm("Delete", "Delete “" + path + "”" + (IDE.vfs.isDir(path) ? " and everything inside it" : "") + "? This can't be undone.");
    if (!ok) return;
    IDE.vfs.remove(path);
    IDE.editor.refresh(path);
  }

  /* ---------- drag-drop import ---------- */
  async function onDrop(e, targetDir) {
    e.preventDefault(); e.stopPropagation();
    const dz = e.currentTarget; if (dz && dz.classList) dz.classList.remove("dragover");
    const items = e.dataTransfer && e.dataTransfer.items;
    const base = targetDir ? targetDir + "/" : "";
    if (items && items.length && items[0].webkitGetAsEntry) {
      for (const it of items) { const entry = it.webkitGetAsEntry && it.webkitGetAsEntry(); if (entry) await walkEntry(entry, base); }
    } else if (e.dataTransfer && e.dataTransfer.files) {
      for (const f of e.dataTransfer.files) await importFile(f, base + f.name);
    }
    render();
  }
  function walkEntry(entry, base) {
    return new Promise((resolve) => {
      if (entry.isFile) entry.file((f) => importFile(f, base + entry.name).then(resolve));
      else if (entry.isDirectory) {
        const reader = entry.createReader();
        reader.readEntries(async (entries) => { for (const en of entries) await walkEntry(en, base + entry.name + "/"); resolve(); });
      } else resolve();
    });
  }
  function importFile(file, path) {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => { IDE.vfs.write(IDE.vfs.norm(path), r.result); resolve(); };
      r.onerror = resolve;
      r.readAsText(file);
    });
  }

  exp.newFile = () => newFileIn("");
  exp.newFolder = () => newFolderIn("");
  exp.render = render;

  IDE.on("fs:change", render);
  IDE.on("fs:reload", render);
  IDE.on("editor:open", render);

  // whole-tree is also a drop zone
  IDE.on("app:ready", () => {
    const host = IDE.$("#tree");
    host.addEventListener("dragover", (e) => { e.preventDefault(); });
    host.addEventListener("drop", (e) => onDrop(e, ""));
    render();
  });

  IDE.explorer = exp;
})(window.IDE);
