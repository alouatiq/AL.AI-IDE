/* AL.AI IDE — application boot & orchestration.
 * Wires the top bar, activity bar, splitters, skills panel and startup wizard,
 * then boots the VFS, editor and AI. Everything else lives in its own module. */
(function (IDE) {
  "use strict";

  /* ---------------- theme ---------------- */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    IDE.store.set("ide_theme", theme);
    if (IDE.editor && IDE.editor.setTheme) IDE.editor.setTheme(theme !== "light");
  }
  function toggleTheme() { setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light"); }

  /* ---------------- activity bar / panels ---------------- */
  function showPanel(name) {
    if (name === "settings") { IDE.ai.openSettings(); return; }
    IDE.$$("#activitybar .act").forEach((b) => b.classList.toggle("active", b.dataset.panel === name));
    IDE.$$("#sidepanel .panel").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== name));
    if (name === "skills") renderSkillsPanel();
    if (name === "github" && IDE.github) IDE.github.openPanel();
  }

  /* ---------------- skills side panel ---------------- */
  function renderSkillsPanel() {
    const host = IDE.$("#skillsPanel");
    host.innerHTML = "";
    host.appendChild(IDE.el("div", { class: "sp-block" }, [
      IDE.btn("✨ New project from template", "primary", openWizard),
    ]));

    host.appendChild(IDE.el("div", { class: "section-title", text: "Add to current project" }));
    const skills = IDE.skills.SKILLS;
    Object.keys(skills).forEach((id) => {
      const s = skills[id];
      const row = IDE.el("div", { class: "skill-row" }, [
        IDE.el("div", { style: "flex:1" }, [
          IDE.el("div", { class: "s-name", text: s.name }),
          IDE.el("div", { class: "s-desc", text: s.desc }),
        ]),
        IDE.btn("Add", "", () => {
          const files = {};
          try { s.apply(files, { name: IDE.vfs.meta.name }); } catch (e) {}
          const paths = Object.keys(files);
          if (!paths.length) return;
          const doWrite = () => { paths.forEach((p) => IDE.vfs.write(p, files[p])); IDE.toast("Added " + paths.join(", "), "ok"); IDE.editor.openFile(paths[0]); };
          const clash = paths.find((p) => IDE.vfs.files.has(p));
          if (clash) IDE.confirm("Overwrite?", clash + " exists. Overwrite it (and any others)?").then((ok) => { if (ok) doWrite(); });
          else doWrite();
        }),
      ]);
      host.appendChild(row);
    });
  }

  /* ---------------- startup wizard ---------------- */
  function openWizard(force) {
    const tpls = IDE.skills.TEMPLATES;
    let chosenTpl = "static";
    const selectedSkills = new Set(IDE.skills.defaultSkillIds());

    const nameInput = IDE.el("input", { class: "inp", value: IDE.vfs.meta.name === "untitled-project" ? "my-project" : IDE.vfs.meta.name });

    const grid = IDE.el("div", { class: "tpl-grid" });
    Object.keys(tpls).forEach((key) => {
      const t = tpls[key];
      const card = IDE.el("div", { class: "tpl-card" + (key === chosenTpl ? " sel" : "") }, [
        IDE.el("div", { class: "tpl-ico", text: t.icon }),
        IDE.el("div", { class: "tpl-name", text: t.name }),
        IDE.el("div", { class: "tpl-desc", text: t.desc }),
      ]);
      card.addEventListener("click", () => { chosenTpl = key; IDE.$$(".tpl-card", grid).forEach((c) => c.classList.remove("sel")); card.classList.add("sel"); });
      grid.appendChild(card);
    });

    const skillsWrap = IDE.el("div");
    const skills = IDE.skills.SKILLS;
    Object.keys(skills).forEach((id) => {
      const s = skills[id];
      const cb = IDE.el("input", { type: "checkbox" });
      cb.checked = selectedSkills.has(id);
      cb.addEventListener("change", () => { cb.checked ? selectedSkills.add(id) : selectedSkills.delete(id); });
      skillsWrap.appendChild(IDE.el("label", { class: "skill-row", style: "cursor:pointer" }, [
        cb, IDE.el("div", { style: "flex:1" }, [IDE.el("div", { class: "s-name", text: s.name }), IDE.el("div", { class: "s-desc", text: s.desc })]),
      ]));
    });

    const body = IDE.el("div", {}, [
      IDE.el("label", { class: "field" }, [IDE.el("span", { text: "Project name" }), nameInput]),
      IDE.el("div", { class: "section-title", text: "Choose a template" }), grid,
      IDE.el("div", { class: "section-title", text: "Pre-installed skills (toggle any)", style: "margin-top:16px" }), skillsWrap,
    ]);

    const create = () => {
      const name = nameInput.value.trim() || "my-project";
      const build = () => {
        const { files, entry } = IDE.skills.scaffold(chosenTpl, Array.from(selectedSkills), name);
        IDE.vfs.load(files, [], { name });
        IDE.vfs.setName(name);
        m.close();
        // expand tree & open entry
        setTimeout(() => { if (IDE.vfs.files.has(entry)) IDE.editor.openFile(entry); else { const f = IDE.vfs.list()[0]; if (f) IDE.editor.openFile(f); } }, 60);
        IDE.toast("Created " + name, "ok");
      };
      if (IDE.vfs.count() > 0) IDE.confirm("Replace current project?", "This replaces the files currently in the editor. Download a ZIP first if you want to keep them.").then((ok) => { if (ok) build(); });
      else build();
    };

    const m = IDE.modal({
      title: "🧩 Start a new project", wide: true, dismissable: !force, body,
      footer: [force ? null : IDE.btn("Cancel", "", () => m.close()), IDE.btn("Create project", "primary", create)].filter(Boolean),
    });
  }
  IDE.openWizard = openWizard;

  /* ---------------- splitters ---------------- */
  function makeSplitter(el, targetSel, side) {
    const target = () => IDE.$(targetSel);
    el.addEventListener("mousedown", (e) => {
      e.preventDefault(); el.classList.add("dragging");
      const startX = e.clientX, startW = target().getBoundingClientRect().width;
      const move = (ev) => {
        let w = side === "left" ? startW + (ev.clientX - startX) : startW - (ev.clientX - startX);
        w = Math.max(160, Math.min(640, w));
        target().style.width = w + "px";
        target().style.flexShrink = "0";
      };
      const up = () => { el.classList.remove("dragging"); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
    });
  }

  /* ---------------- top bar wiring ---------------- */
  function wireTopbar() {
    IDE.$("#btnTheme").addEventListener("click", toggleTheme);
    IDE.$("#btnSettings").addEventListener("click", () => IDE.ai.openSettings());
    IDE.$("#btnZip").addEventListener("click", () => IDE.vfs.downloadZip());
    IDE.$("#btnOpenFolder").addEventListener("click", () => IDE.vfs.openFolder().catch((e) => e.name !== "AbortError" && IDE.toast(e.message, "err")));
    IDE.$("#btnSaveFolder").addEventListener("click", () => IDE.vfs.saveFolder().catch((e) => e.name !== "AbortError" && IDE.toast(e.message, "err")));
    IDE.$("#btnRun").addEventListener("click", () => IDE.preview.toggle());
    IDE.$("#btnGithub").addEventListener("click", () => showPanel("github"));
    IDE.$("#btnProject").addEventListener("click", async () => {
      const name = await IDE.ask("Project name", "Name", IDE.vfs.meta.name);
      if (name) IDE.vfs.setName(name);
    });
    IDE.$$("#activitybar .act").forEach((b) => b.addEventListener("click", () => showPanel(b.dataset.panel)));
    IDE.$("#newFile").addEventListener("click", () => IDE.explorer.newFile());
    IDE.$("#newFolder").addEventListener("click", () => IDE.explorer.newFolder());
    IDE.$("#refreshTree").addEventListener("click", () => IDE.explorer.render());
    IDE.on("project:name", (n) => { IDE.$("#projName").textContent = n; });
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    setTheme(IDE.store.get("ide_theme", "dark"));
    wireTopbar();
    makeSplitter(IDE.$("#split1"), "#sidepanel", "left");
    makeSplitter(IDE.$("#split2"), "#chat", "right");

    const hadProject = await IDE.vfs.restore();
    IDE.$("#projName").textContent = IDE.vfs.meta.name;

    await IDE.editor.init();
    IDE.emit("app:ready", {});

    // AI provider detection (non-blocking)
    IDE.ai.detect().catch(() => IDE.ai.buildModelList());

    if (!hadProject || IDE.vfs.count() === 0) {
      openWizard(true); // force the wizard on a fresh start
    } else {
      IDE.explorer.render();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.IDE);
