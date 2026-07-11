/* AL.AI IDE — GitHub integration (serverless, token-based).
 * The user pastes a fine-grained Personal Access Token (stored only in their
 * browser). We then use the GitHub REST API directly to list/create repos and
 * push the whole project in one commit via the Git Data API (blobs → tree →
 * commit → ref). No backend, no OAuth secret. */
(function (IDE) {
  "use strict";

  const API = "https://api.github.com";
  const gh = {
    token: IDE.store.get("ide_gh_token", ""),
    user: null,
    repo: IDE.store.get("ide_gh_repo", null), // { full_name, default_branch }
  };

  function headers() {
    return { Authorization: "Bearer " + gh.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  }
  async function api(path, opts) {
    const res = await fetch(path.startsWith("http") ? path : API + path, Object.assign({ headers: headers() }, opts || {}));
    if (!res.ok) { let msg = "GitHub " + res.status; try { const j = await res.json(); msg = j.message || msg; } catch (e) {} throw new Error(msg); }
    return res.status === 204 ? null : res.json();
  }

  gh.connected = () => !!(gh.token && gh.user);

  gh.connect = async function (token) {
    gh.token = token.trim();
    const me = await api("/user");
    gh.user = me;
    IDE.store.set("ide_gh_token", gh.token);
    return me;
  };
  gh.disconnect = function () { gh.token = ""; gh.user = null; gh.repo = null; IDE.store.del("ide_gh_token"); IDE.store.del("ide_gh_repo"); renderPanel(); };

  gh.listRepos = () => api("/user/repos?per_page=100&sort=updated&affiliation=owner");

  gh.createRepo = (name, isPrivate) => api("/user/repos", {
    method: "POST", body: JSON.stringify({ name, private: !!isPrivate, auto_init: true, description: "Created with AL.AI IDE" }),
  });

  gh.selectRepo = (repo) => { gh.repo = { full_name: repo.full_name, default_branch: repo.default_branch || "main" }; IDE.store.set("ide_gh_repo", gh.repo); renderPanel(); };

  /* ---------- push the whole VFS as one commit ---------- */
  gh.push = async function (message, log) {
    if (!gh.connected()) throw new Error("Connect GitHub first");
    if (!gh.repo) throw new Error("Pick a repository first");
    const [owner, repo] = gh.repo.full_name.split("/");
    const branch = gh.repo.default_branch || "main";
    log = log || (() => {});

    // 1. current ref (may not exist on a truly empty repo)
    let baseSha = null, baseTree = null;
    try {
      const ref = await api(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
      baseSha = ref.object.sha;
      const commit = await api(`/repos/${owner}/${repo}/git/commits/${baseSha}`);
      baseTree = commit.tree.sha;
      log("Base commit " + baseSha.slice(0, 7));
    } catch (e) { log("New / empty branch — creating initial commit"); }

    // 2. blobs for every file
    const files = Array.from(IDE.vfs.files.entries());
    log("Uploading " + files.length + " files…");
    const tree = [];
    for (const [path, content] of files) {
      const blob = await api(`/repos/${owner}/${repo}/git/blobs`, {
        method: "POST", body: JSON.stringify({ content: b64(content), encoding: "base64" }),
      });
      tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      log("  ✓ " + path, "ok");
    }

    // 3. tree
    const newTree = await api(`/repos/${owner}/${repo}/git/trees`, {
      method: "POST", body: JSON.stringify(baseTree ? { base_tree: baseTree, tree } : { tree }),
    });

    // 4. commit
    const commit = await api(`/repos/${owner}/${repo}/git/commits`, {
      method: "POST", body: JSON.stringify({ message: message || "Update from AL.AI IDE", tree: newTree.sha, parents: baseSha ? [baseSha] : [] }),
    });
    log("Commit " + commit.sha.slice(0, 7), "ok");

    // 5. move the ref (create if missing)
    try {
      await api(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
    } catch (e) {
      await api(`/repos/${owner}/${repo}/git/refs`, { method: "POST", body: JSON.stringify({ ref: "refs/heads/" + branch, sha: commit.sha }) });
    }
    const url = `https://github.com/${owner}/${repo}/tree/${branch}`;
    log("Pushed → " + url, "ok");
    return url;
  };

  // UTF-8 safe base64
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }

  /* ---------- sidebar panel UI ---------- */
  function renderPanel() {
    const host = IDE.$("#githubPanel");
    if (!host) return;
    host.innerHTML = "";

    if (!gh.connected()) {
      host.appendChild(IDE.el("div", { class: "gh-status", html:
        "Push your project straight to GitHub — no OAuth, fully in your browser." }));
      host.appendChild(IDE.el("div", { class: "step", html: "<span class='n'>1</span><span>Create a <b>fine-grained token</b> at <a href='https://github.com/settings/tokens?type=beta' target='_blank' rel='noopener' style='color:var(--accent)'>github.com/settings/tokens ↗</a> with <b>Contents: Read &amp; write</b> and <b>Administration: Read &amp; write</b> (to create repos).</span>" }));
      host.appendChild(IDE.el("div", { class: "step", html: "<span class='n'>2</span><span>Paste it below. It’s stored only in this browser.</span>" }));
      const input = IDE.el("input", { class: "inp mono", type: "password", placeholder: "github_pat_…", style: "margin:8px 0" });
      const btn = IDE.btn("Connect GitHub", "primary", async () => {
        if (!input.value.trim()) return;
        btn.disabled = true; btn.textContent = "Connecting…";
        try { const me = await gh.connect(input.value); IDE.toast("Connected as " + me.login, "ok"); renderPanel(); }
        catch (e) { IDE.toast(e.message, "err"); btn.disabled = false; btn.textContent = "Connect GitHub"; }
      });
      host.appendChild(input); host.appendChild(btn);
      return;
    }

    host.appendChild(IDE.el("div", { class: "gh-status", html:
      "Connected as <b>" + IDE.esc(gh.user.login) + "</b> " +
      (gh.repo ? "→ <b>" + IDE.esc(gh.repo.full_name) + "</b>" : "— pick a repo below") }));

    const actions = IDE.el("div", { class: "sp-block", style: "display:flex;gap:6px;flex-wrap:wrap" }, [
      IDE.btn("Push project", "primary", () => gh.openPushDialog()),
      IDE.btn("New repo", "", () => gh.openCreateDialog()),
      IDE.btn("Refresh", "", () => loadRepos()),
      IDE.btn("Sign out", "danger", () => gh.disconnect()),
    ]);
    host.appendChild(actions);

    const listWrap = IDE.el("div", { class: "sp-block" }, [IDE.el("h4", { text: "Your repositories" }), IDE.el("div", { id: "ghRepoList", class: "gh-status", text: "Loading…" })]);
    host.appendChild(listWrap);
    loadRepos();
  }

  async function loadRepos() {
    const box = IDE.$("#ghRepoList");
    if (!box) return;
    box.textContent = "Loading…";
    try {
      const repos = await gh.listRepos();
      box.innerHTML = "";
      repos.forEach((r) => {
        const item = IDE.el("div", { class: "repo-item" + (gh.repo && gh.repo.full_name === r.full_name ? " sel" : "") }, [
          IDE.el("span", { text: r.name }), IDE.el("span", { class: "r-priv", text: r.private ? "  🔒 private" : "  public" }),
        ]);
        item.addEventListener("click", () => { gh.selectRepo(r); });
        box.appendChild(item);
      });
      if (!repos.length) box.textContent = "No repositories yet — create one above.";
    } catch (e) { box.textContent = e.message; }
  }

  gh.openCreateDialog = function () {
    const name = IDE.el("input", { class: "inp", placeholder: IDE.vfs.meta.name || "my-project", value: IDE.vfs.meta.name || "" });
    const priv = IDE.el("input", { type: "checkbox", checked: "checked" });
    const body = IDE.el("div", {}, [
      IDE.el("label", { class: "field" }, [IDE.el("span", { text: "Repository name" }), name]),
      IDE.el("label", { class: "field", style: "display:flex;gap:8px;align-items:center" }, [priv, IDE.el("span", { text: "Private repository", style: "margin:0" })]),
    ]);
    const m = IDE.modal({ title: "Create GitHub repository", body, footer: [
      IDE.btn("Cancel", "", () => m.close()),
      IDE.btn("Create", "primary", async () => {
        const nm = name.value.trim(); if (!nm) return;
        try { const r = await gh.createRepo(nm, priv.checked); gh.selectRepo(r); m.close(); IDE.toast("Created " + r.full_name, "ok"); }
        catch (e) { IDE.toast(e.message, "err"); }
      }),
    ] });
  };

  gh.openPushDialog = function () {
    if (!gh.repo) { IDE.toast("Pick or create a repo first", "err"); return; }
    const msg = IDE.el("input", { class: "inp", value: "Update from AL.AI IDE" });
    const logBox = IDE.el("div", { style: "max-height:220px;overflow:auto;margin-top:10px" });
    const body = IDE.el("div", {}, [
      IDE.el("p", { class: "sub", html: "Pushing <b>" + IDE.vfs.count() + " files</b> to <b>" + IDE.esc(gh.repo.full_name) + "</b> (" + IDE.esc(gh.repo.default_branch) + ")." }),
      IDE.el("label", { class: "field" }, [IDE.el("span", { text: "Commit message" }), msg]),
      logBox,
    ]);
    const log = (line, cls) => logBox.appendChild(IDE.el("div", { class: "log-line " + (cls || ""), text: line }));
    const pushBtn = IDE.btn("Push now", "primary", async () => {
      pushBtn.disabled = true; pushBtn.textContent = "Pushing…";
      try { const url = await gh.push(msg.value, log); IDE.toast("Pushed to GitHub", "ok"); log("Done.", "ok");
        logBox.appendChild(IDE.el("a", { href: url, target: "_blank", rel: "noopener", text: "Open on GitHub ↗", style: "color:var(--accent);display:inline-block;margin-top:6px" }));
      } catch (e) { log("✗ " + e.message, "err"); IDE.toast(e.message, "err"); }
      pushBtn.disabled = false; pushBtn.textContent = "Push again";
    });
    const m = IDE.modal({ title: "⑂ Push to GitHub", wide: true, body, footer: [IDE.btn("Close", "", () => m.close()), pushBtn] });
  };

  gh.openPanel = renderPanel;
  IDE.on("app:ready", () => { renderPanel(); if (gh.token && !gh.user) gh.connect(gh.token).then(renderPanel).catch(() => {}); });

  IDE.github = gh;
})(window.IDE);
