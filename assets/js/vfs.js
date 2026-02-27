/* AL.AI IDE — Virtual File System.
 * Files live in memory (a path->content map) and persist to IndexedDB so a project
 * survives reloads. Optionally binds to a real local folder via the File System
 * Access API (Chromium), and can export the whole project as a .zip (JSZip). */
(function (IDE) {
  "use strict";

  const DB_NAME = "alai-ide";
  const STORE = "project";
  const KEY = "current";

  const vfs = {
    files: new Map(),   // path -> string content
    dirs: new Set(),    // explicit directory paths (keeps empty folders)
    meta: { name: "untitled-project" },
    dirHandle: null,    // FileSystemDirectoryHandle when a local folder is bound
  };

  /* ---------- IndexedDB ---------- */
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSave(snapshot) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(snapshot, KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  async function idbLoad() {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(KEY);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  }

  const persist = IDE.debounce(async () => {
    try {
      await idbSave({
        files: Object.fromEntries(vfs.files),
        dirs: Array.from(vfs.dirs),
        meta: vfs.meta,
      });
    } catch (e) { console.warn("persist failed", e); }
  }, 400);

  /* ---------- path helpers ---------- */
  function norm(p) { return String(p || "").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/"); }
  function dirname(p) { p = norm(p); const i = p.lastIndexOf("/"); return i === -1 ? "" : p.slice(0, i); }
  function basename(p) { p = norm(p); const i = p.lastIndexOf("/"); return i === -1 ? p : p.slice(i + 1); }
  function ensureParents(p) { let d = dirname(p); while (d) { vfs.dirs.add(d); d = dirname(d); } }

  /* ---------- public API ---------- */
  vfs.norm = norm; vfs.dirname = dirname; vfs.basename = basename;

  vfs.exists = (p) => { p = norm(p); return vfs.files.has(p) || vfs.dirs.has(p); };
  vfs.isDir = (p) => vfs.dirs.has(norm(p));
  vfs.read = (p) => vfs.files.get(norm(p));

  vfs.write = (p, content, opts) => {
    p = norm(p); if (!p) return;
    vfs.files.set(p, content == null ? "" : String(content));
    ensureParents(p);
    persist();
    if (!(opts && opts.silent)) IDE.emit("fs:change", { path: p, kind: "write" });
  };

  vfs.mkdir = (p) => {
    p = norm(p); if (!p) return;
    vfs.dirs.add(p); ensureParents(p);
    persist(); IDE.emit("fs:change", { path: p, kind: "mkdir" });
  };

  vfs.remove = (p) => {
    p = norm(p);
    let removed = false;
    if (vfs.files.delete(p)) removed = true;
    if (vfs.dirs.delete(p)) removed = true;
    // remove descendants
    const prefix = p + "/";
    for (const f of Array.from(vfs.files.keys())) if (f.startsWith(prefix)) { vfs.files.delete(f); removed = true; }
    for (const d of Array.from(vfs.dirs)) if (d.startsWith(prefix)) { vfs.dirs.delete(d); removed = true; }
    if (removed) { persist(); IDE.emit("fs:change", { path: p, kind: "remove" }); }
    return removed;
  };

  vfs.rename = (from, to) => {
    from = norm(from); to = norm(to);
    if (!from || !to || from === to) return false;
    const moved = [];
    if (vfs.files.has(from)) { vfs.files.set(to, vfs.files.get(from)); vfs.files.delete(from); moved.push([from, to]); }
    if (vfs.dirs.has(from)) { vfs.dirs.delete(from); vfs.dirs.add(to); }
    const prefix = from + "/";
    for (const f of Array.from(vfs.files.keys())) if (f.startsWith(prefix)) { const nt = to + f.slice(from.length); vfs.files.set(nt, vfs.files.get(f)); vfs.files.delete(f); moved.push([f, nt]); }
    for (const d of Array.from(vfs.dirs)) if (d.startsWith(prefix)) { vfs.dirs.delete(d); vfs.dirs.add(to + d.slice(from.length)); }
    ensureParents(to);
    persist(); IDE.emit("fs:change", { path: to, kind: "rename", moved });
    return true;
  };

  /** Return a sorted tree structure: { name, path, dir, children? }. */
  vfs.tree = () => {
    const root = { name: "", path: "", dir: true, children: new Map() };
    const ensure = (parts) => {
      let node = root, acc = "";
      for (const part of parts) {
        acc = acc ? acc + "/" + part : part;
        if (!node.children.has(part)) node.children.set(part, { name: part, path: acc, dir: true, children: new Map() });
        node = node.children.get(part);
      }
      return node;
    };
    for (const d of vfs.dirs) ensure(d.split("/"));
    for (const f of vfs.files.keys()) {
      const parts = f.split("/");
      const name = parts.pop();
      const parent = ensure(parts);
      parent.children.set(name, { name, path: f, dir: false });
    }
    const toArr = (node) => {
      if (!node.children) return node;
      const kids = Array.from(node.children.values()).map(toArr)
        .sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
      return { name: node.name, path: node.path, dir: true, children: kids };
    };
    return toArr(root).children;
  };

  vfs.list = () => Array.from(vfs.files.keys()).sort();
  vfs.count = () => vfs.files.size;

  vfs.setName = (name) => { vfs.meta.name = name || "untitled-project"; persist(); IDE.emit("project:name", vfs.meta.name); };

  /** Replace the whole project (used by templates / opening folders). */
  vfs.load = (files, dirs, meta) => {
    vfs.files = new Map(Object.entries(files || {}));
    vfs.dirs = new Set(dirs || []);
    for (const f of vfs.files.keys()) ensureParents(f);
    if (meta) vfs.meta = meta;
    persist();
    IDE.emit("fs:reload", {});
  };

  vfs.restore = async () => {
    try {
      const snap = await idbLoad();
      if (snap && snap.files) {
        vfs.files = new Map(Object.entries(snap.files));
        vfs.dirs = new Set(snap.dirs || []);
        vfs.meta = snap.meta || vfs.meta;
        for (const f of vfs.files.keys()) ensureParents(f);
        return true;
      }
    } catch (e) { console.warn("restore failed", e); }
    return false;
  };

  /* ---------- ZIP export (JSZip) ---------- */
  vfs.downloadZip = async () => {
    if (typeof JSZip === "undefined") { IDE.toast("ZIP library not loaded", "err"); return; }
    const zip = new JSZip();
    for (const [p, content] of vfs.files) zip.file(p, content);
    for (const d of vfs.dirs) zip.folder(d);
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (vfs.meta.name || "project") + ".zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    IDE.toast("Downloaded " + a.download, "ok");
  };

  /* ---------- File System Access API (open / save real folder) ---------- */
  vfs.canUseFolder = () => typeof window.showDirectoryPicker === "function";

  const IGNORE = new Set(["node_modules", ".git", ".vercel", "dist", "build", ".next", ".cache"]);
  const isText = (name) => !/\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|woff2?|ttf|eot|mp[34]|mov|wasm|exe|dll|bin)$/i.test(name);

  async function readDir(handle, base, files) {
    for await (const [name, h] of handle.entries()) {
      if (IGNORE.has(name)) continue;
      const p = base ? base + "/" + name : name;
      if (h.kind === "directory") { await readDir(h, p, files); }
      else if (isText(name)) {
        try { const file = await h.getFile(); files[p] = await file.text(); } catch (e) {}
      }
    }
  }

  vfs.openFolder = async () => {
    if (!vfs.canUseFolder()) { IDE.toast("Your browser can't open folders — use ⬇ ZIP / drag-drop instead", "err"); return false; }
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    const files = {};
    await readDir(handle, "", files);
    vfs.dirHandle = handle;
    vfs.load(files, [], { name: handle.name || "project" });
    IDE.toast("Opened folder: " + handle.name, "ok");
    return true;
  };

  vfs.saveFolder = async () => {
    if (!vfs.dirHandle) {
      if (!vfs.canUseFolder()) { IDE.toast("Folder save unsupported — use ⬇ ZIP", "err"); return; }
      vfs.dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    }
    let n = 0;
    for (const [p, content] of vfs.files) {
      const parts = p.split("/"); const name = parts.pop();
      let dir = vfs.dirHandle;
      for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
      const fh = await dir.getFileHandle(name, { create: true });
      const w = await fh.createWritable(); await w.write(content); await w.close(); n++;
    }
    IDE.toast("Saved " + n + " files to " + (vfs.dirHandle.name || "folder"), "ok");
  };

  IDE.vfs = vfs;
})(window.IDE);
