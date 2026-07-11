/* AL.AI IDE — AI chat zone.
 * Talks directly (or via the Vercel Edge proxy) to free, OpenAI-compatible
 * providers, with two-level fallback across a coding-focused model chain. Streams
 * responses, injects project/file context, and offers apply-to-editor on code. */
(function (IDE) {
  "use strict";

  const PROVIDERS = {
    agentrouter: { label: "AgentRouter", baseUrl: "https://agentrouter.org/v1", keyUrl: "https://agentrouter.org/console/token", hint: "sk-…", corsDirect: false },
    openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", keyUrl: "https://openrouter.ai/keys", hint: "sk-or-v1-…", corsDirect: true },
    groq:       { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", keyUrl: "https://console.groq.com/keys", hint: "gsk_…", corsDirect: true },
    google:     { label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", keyUrl: "https://aistudio.google.com/app/apikey", hint: "AIza…", corsDirect: true },
    cerebras:   { label: "Cerebras", baseUrl: "https://api.cerebras.ai/v1", keyUrl: "https://cloud.cerebras.ai/", hint: "csk-…", corsDirect: false },
  };

  // Curated best free CODING models (recommended first). OpenRouter's live free
  // list is merged in on top of these and self-heals if names go stale.
  const CODING_MODELS = [
    { provider: "agentrouter", model: "claude-sonnet-4-5-20250929", label: "★ Claude Sonnet 4.5 · AgentRouter" },
    { provider: "agentrouter", model: "qwen3-coder-480b", label: "★ Qwen3 Coder 480B · AgentRouter" },
    { provider: "agentrouter", model: "deepseek-r1", label: "DeepSeek R1 · AgentRouter" },
    { provider: "agentrouter", model: "gpt-4o", label: "GPT-4o · AgentRouter" },
    { provider: "openrouter", model: "qwen/qwen-2.5-coder-32b-instruct:free", label: "★ Qwen2.5 Coder 32B · OpenRouter" },
    { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", label: "★ DeepSeek V3 · OpenRouter" },
    { provider: "openrouter", model: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (reasoning) · OpenRouter" },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B · OpenRouter" },
    { provider: "groq", model: "llama-3.3-70b-versatile", label: "Llama 3.3 70B · Groq (fast)" },
    { provider: "groq", model: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill · Groq (fast)" },
    { provider: "google", model: "gemini-2.5-flash", label: "Gemini 2.5 Flash · Google" },
    { provider: "google", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash · Google" },
    { provider: "cerebras", model: "llama-3.3-70b", label: "Llama 3.3 70B · Cerebras (fast)" },
  ];

  // On-device models — run FULLY in the browser via WebGPU (WebLLM). No key, no
  // network at inference time. Each downloads once (cached in the browser) then
  // reruns offline. q4f32 variants work on GPUs that lack the shader-f16 feature.
  const ON_DEVICE = [
    { model: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5 Coder 1.5B", size: "~1.2 GB", note: "coding · fast" },
    { model: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", size: "~0.9 GB", note: "tiny · phone-OK" },
    { model: "Llama-3.2-1B-Instruct-q4f32_1-MLC", label: "Llama 3.2 1B (f32-safe)", size: "~1.2 GB", note: "works on more GPUs" },
    { model: "Qwen2.5-3B-Instruct-q4f16_1-MLC", label: "Qwen2.5 3B", size: "~2.0 GB", note: "balanced" },
    { model: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B", size: "~2.2 GB", note: "balanced" },
    { model: "gemma-2-2b-it-q4f16_1-MLC", label: "Gemma 2 2B", size: "~1.6 GB", note: "fast" },
    { model: "Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi-3.5 mini", size: "~2.2 GB", note: "reasoning" },
    { model: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC", label: "Qwen2.5 Coder 7B", size: "~4.7 GB", note: "coding · strong" },
  ];
  const ON_DEVICE_LABEL = {};
  ON_DEVICE.forEach((m) => { ON_DEVICE_LABEL[m.model] = m.label; });

  const SYSTEM_PROMPT =
    "You are a senior pair-programming assistant embedded in AL.AI IDE, a browser-based code editor. " +
    "Be concise and practical. When you provide code that belongs in a file, put it in a fenced code block and " +
    "start the fence info with the language then the target path, e.g. ```js src/app.js — this lets the user apply it with one click. " +
    "When editing an existing file, return the full updated file unless the user asks for a snippet. Prefer modern, idiomatic code.";

  const ai = {
    cfg: {
      keys: IDE.store.get("ide_ai_keys", {}),
      selected: IDE.store.get("ide_ai_model", "openrouter::" + CODING_MODELS[0].model),
    },
    serverKeys: {}, useProxy: false, live: [],
    messages: IDE.store.get("ide_chat", []),
    busy: false, abort: null,
  };

  const msgsEl = () => IDE.$("#chatMessages");
  const persist = () => IDE.store.set("ide_chat", ai.messages.slice(-40));

  /* ---------- provider capability detection ---------- */
  ai.detect = async function () {
    try {
      const r = await fetch("api/models", { cache: "no-store" });
      if (r.ok) { const j = await r.json(); ai.useProxy = true; ai.serverKeys = j.providers || {}; ai.live = j.models || []; }
    } catch (e) { ai.useProxy = false; }
    if (!ai.live.length) {
      try { const r = await fetch("https://openrouter.ai/api/v1/models"); const j = await r.json();
        ai.live = (j.data || []).filter((m) => typeof m.id === "string" && m.id.endsWith(":free")).map((m) => m.id); } catch (e) {}
    }
    ai.buildModelList();
  };

  const providerUsable = (pid) => pid === "ondevice"
    ? webgpuOK()
    : !!(ai.cfg.keys[pid] || (ai.useProxy && ai.serverKeys[pid]));

  /* ---------- on-device engine (WebLLM / WebGPU) ---------- */
  const od = { webllm: null, engine: null, model: null, installed: new Set(IDE.store.get("ide_od_installed", [])) };
  function webgpuOK() { return typeof navigator !== "undefined" && !!navigator.gpu; }
  // Import straight from jsDelivr (already trusted by our CSP for Monaco) rather
  // than esm.run, whose 302 redirect trips the Content-Security-Policy.
  async function loadWebLLM() { if (!od.webllm) od.webllm = await import("https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm"); return od.webllm; }
  ai.odIsInstalled = (model) => od.installed.has(model);
  ai.odWebgpuOK = webgpuOK;
  ai.ON_DEVICE = ON_DEVICE;

  async function ensureOnDevice(model, onStatus) {
    if (!webgpuOK()) throw new Error("This browser has no WebGPU — on-device models need a Chromium browser (Chrome/Edge) with hardware acceleration on.");
    const w = await loadWebLLM();
    if (!od.engine || od.model !== model) {
      onStatus("⬇ Loading “" + (ON_DEVICE_LABEL[model] || model) + "” — first run downloads it once, then it's cached…");
      od.engine = await w.CreateMLCEngine(model, { initProgressCallback: (p) => onStatus("⬇ " + (p.text || "loading…")) });
      od.model = model;
      od.installed.add(model); IDE.store.set("ide_od_installed", Array.from(od.installed));
    }
    return od.engine;
  }

  async function runOnDevice(model, messages, onChunk, signal, onStatus) {
    const engine = await ensureOnDevice(model, onStatus);
    onStatus("🖥 Generating on your device…");
    const stream = await engine.chat.completions.create({ messages, stream: true, temperature: 0.7 });
    let got = false;
    for await (const chunk of stream) {
      if (signal.aborted) { try { await engine.interruptGenerate(); } catch (e) {} break; }
      const delta = chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content;
      if (delta) { got = true; onChunk(delta); }
    }
    if (!got && !signal.aborted) throw new Error("on-device model returned nothing");
    onStatus("");
  }

  ai.odRemove = async function (model) {
    try { const w = await loadWebLLM(); if (od.model === model) { od.engine = null; od.model = null; } await w.deleteModelInCache(model); } catch (e) {}
    od.installed.delete(model); IDE.store.set("ide_od_installed", Array.from(od.installed));
  };

  ai.buildModelList = function () {
    const sel = IDE.$("#modelSelect");
    if (!sel) return;
    const seen = new Set();
    const opts = [];
    const add = (provider, model, label) => {
      const val = provider + "::" + model;
      if (seen.has(val)) return; seen.add(val);
      opts.push({ val, label: label || (model + " · " + PROVIDERS[provider].label), usable: providerUsable(provider) });
    };
    CODING_MODELS.forEach((m) => add(m.provider, m.model, m.label));
    // merge live OpenRouter free coding models
    const rank = (id) => ["coder", "code", "deepseek", "qwen", "devstral", "codestral"].findIndex((h) => id.toLowerCase().includes(h));
    ai.live.slice().sort((a, b) => { const ra = rank(a), rb = rank(b); return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb); })
      .slice(0, 40).forEach((id) => add("openrouter", id));

    sel.innerHTML = "";
    // On-device group first — no key needed (only shown where WebGPU exists)
    if (webgpuOK()) {
      const g = IDE.el("optgroup", { label: "🖥 On-device · local, no key" });
      ON_DEVICE.forEach((m) => {
        const tag = od.installed.has(m.model) ? "✓ " : "⬇ ";
        g.appendChild(IDE.el("option", { value: "ondevice::" + m.model, text: tag + m.label + " (" + m.size + ")" }));
      });
      sel.appendChild(g);
    }
    // Cloud group
    const gc = IDE.el("optgroup", { label: "☁ Cloud · needs a key" });
    opts.forEach((o) => { gc.appendChild(IDE.el("option", { value: o.val, text: (o.usable ? "" : "🔒 ") + o.label })); });
    sel.appendChild(gc);

    const all = (webgpuOK() ? ON_DEVICE.map((m) => "ondevice::" + m.model) : []).concat(opts.map((o) => o.val));
    if (all.includes(ai.cfg.selected)) sel.value = ai.cfg.selected;
    else if (all.length) { ai.cfg.selected = all[0]; sel.value = all[0]; }
  };

  ai.hasAnyEngine = () => (webgpuOK() ? true : false) || Object.keys(PROVIDERS).some(providerUsable);

  /* ---------- build the fallback chain ---------- */
  function selectedPair() {
    const [provider, ...rest] = ai.cfg.selected.split("::");
    return { provider, model: rest.join("::") };
  }
  function chain() {
    const list = [];
    const push = (provider, model) => { if (providerUsable(provider)) list.push({ provider, model }); };
    const sel = selectedPair(); push(sel.provider, sel.model);
    // then the first usable recommended model of every other provider
    CODING_MODELS.forEach((m) => { if (!list.some((x) => x.provider === m.provider)) push(m.provider, m.model); });
    return list;
  }

  /* ---------- context ---------- */
  function contextMessage() {
    if (!IDE.$("#ctxInclude").checked) return null;
    const active = IDE.editor.getActivePath();
    const files = IDE.vfs.list();
    let ctx = "PROJECT CONTEXT (read-only, for your reference):\n";
    ctx += "Files: " + (files.length ? files.join(", ") : "(none yet)") + "\n";
    if (active) {
      let content = IDE.vfs.read(active) || "";
      if (content.length > 12000) content = content.slice(0, 12000) + "\n… (truncated)";
      ctx += "\nCurrently open file — " + active + ":\n```\n" + content + "\n```";
    }
    return { role: "system", content: ctx };
  }

  /* ---------- streaming (adapted from AL.AI chat) ---------- */
  async function streamProvider(pid, model, messages, onChunk, signal) {
    const prov = PROVIDERS[pid];
    const browserKey = ai.cfg.keys[pid];
    const serverAvail = ai.useProxy && ai.serverKeys[pid];
    const useBrowser = browserKey && (prov.corsDirect || !serverAvail);
    let endpoint, headers = { "Content-Type": "application/json" }, body = { model, messages, stream: true };
    if (useBrowser) {
      endpoint = prov.baseUrl.replace(/\/+$/, "") + "/chat/completions";
      headers["Authorization"] = "Bearer " + browserKey;
      if (pid === "openrouter") { headers["HTTP-Referer"] = location.origin; headers["X-Title"] = "AL.AI-IDE"; }
    } else if (serverAvail) { endpoint = "api/chat"; body.provider = pid; }
    else if (browserKey) {
      endpoint = prov.baseUrl.replace(/\/+$/, "") + "/chat/completions";
      headers["Authorization"] = "Bearer " + browserKey;
      if (pid === "openrouter") { headers["HTTP-Referer"] = location.origin; headers["X-Title"] = "AL.AI-IDE"; }
    } else throw new Error("no key configured for " + pid);

    const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), signal });
    if (!res.ok) { let msg = "HTTP " + res.status; try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch (e) {} const err = new Error(msg); err.status = res.status; throw err; }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        const l = line.trim(); if (!l.startsWith("data:")) continue;
        const data = l.slice(5).trim(); if (data === "[DONE]") return;
        try { const j = JSON.parse(data);
          if (j.error) { const e = new Error(j.error.message || "stream error"); throw e; }
          const delta = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
          if (delta) onChunk(delta);
        } catch (e) { if (e.message && e.message !== "Unexpected end of JSON input") { /* ignore partial */ } }
      }
    }
  }

  /* ---------- send ---------- */
  ai.send = async function (text) {
    text = (text || "").trim();
    if (!text || ai.busy) return;
    const selPre = selectedPair();
    if (selPre.provider === "ondevice") { if (!webgpuOK()) { openNoEngine(true); return; } }
    else if (!chain().length) { openNoEngine(); return; }

    ai.messages.push({ role: "user", content: text });
    render(); persist();
    IDE.$("#chatInput").value = ""; autosize();

    ai.busy = true; IDE.$("#chatSend").disabled = true;
    ai.abort = new AbortController();
    const aiMsg = { role: "assistant", content: "", model: "" };
    ai.messages.push(aiMsg);
    render();
    const setStatus = (s) => { IDE.$("#chatStatus").textContent = s || ""; };

    let sys = SYSTEM_PROMPT;
    const ctx = contextMessage(); if (ctx) sys += "\n\n" + ctx.content;
    const apiMsgs = [{ role: "system", content: sys }];
    ai.messages.slice(0, -1).forEach((m) => apiMsgs.push({ role: m.role, content: m.content }));

    const sel = selectedPair();
    let ok = false, lastErr = null;

    if (sel.provider === "ondevice") {
      // Local model — no cloud fallback; keep the user on their chosen engine.
      aiMsg.model = (ON_DEVICE_LABEL[sel.model] || sel.model) + " · On-device";
      try {
        aiMsg.content = "";
        await runOnDevice(sel.model, apiMsgs, (d) => { aiMsg.content += d; renderStreaming(aiMsg); }, ai.abort.signal, setStatus);
        ok = true; ai.buildModelList();
      } catch (e) { lastErr = e; if (e.name === "AbortError") { setStatus("Stopped."); ok = true; } }
      if (!ok) { aiMsg.content = "⚠️ **On-device model failed.** " + (lastErr ? "`" + IDE.esc(lastErr.message) + "`" : "") + "\n\n" + odHelp(lastErr); setStatus(""); }
    } else {
      const links = chain();
      for (let i = 0; i < links.length; i++) {
        const { provider, model } = links[i];
        aiMsg.model = model + " · " + PROVIDERS[provider].label;
        if (i > 0) setStatus("↻ falling back to " + aiMsg.model + " …");
        try {
          aiMsg.content = "";
          await streamProvider(provider, model, apiMsgs, (d) => { aiMsg.content += d; renderStreaming(aiMsg); }, ai.abort.signal);
          ok = true; setStatus(""); break;
        } catch (e) {
          lastErr = e;
          if (e.name === "AbortError") { setStatus("Stopped."); ok = true; break; }
        }
      }
      if (!ok) {
        aiMsg.content = "⚠️ **All providers failed.** " + (lastErr ? "`" + IDE.esc(lastErr.message) + "`" : "") +
          "\n\nTry another model, add your own free key in **⚙ Settings**, or check your connection.";
        setStatus("");
      }
    }
    ai.busy = false; IDE.$("#chatSend").disabled = false; ai.abort = null;
    render(); persist();
  };

  ai.stop = () => { if (ai.abort) ai.abort.abort(); };
  ai.clear = () => { ai.messages = []; persist(); render(); };

  /* ---------- rendering ---------- */
  function welcome() {
    return '<div class="chat-welcome">👋 I\'m your <b>coding assistant</b>.<br><br>' +
      'Ask me to build a feature, fix a bug, or explain code. I can see your open file &amp; project (toggle <b>context</b> below).<br><br>' +
      'When I write a file, click <b>New file</b> or <b>Insert</b> to apply it.</div>';
  }
  function bubbleHTML(m) {
    if (m.role === "user") return IDE.esc(m.content).replace(/\n/g, "<br>");
    return IDE.renderMarkdown(m.content || "", { codeActions: true }) + (m._streaming ? '<span class="cursor"></span>' : "");
  }
  function msgEl(m) {
    const el = IDE.el("div", { class: "cmsg " + m.role });
    const who = IDE.el("div", { class: "who" }, [
      IDE.el("span", { text: m.role === "user" ? "You" : "AI" }),
      m.model ? IDE.el("span", { class: "model", text: m.model }) : null,
    ]);
    const bubble = IDE.el("div", { class: "bubble", html: bubbleHTML(m) });
    el.appendChild(who); el.appendChild(bubble);
    wireCodeActions(bubble);
    return el;
  }
  function render() {
    const host = msgsEl();
    if (!ai.messages.length) { host.innerHTML = welcome(); return; }
    host.innerHTML = "";
    ai.messages.forEach((m) => host.appendChild(msgEl(m)));
    host.scrollTop = host.scrollHeight;
  }
  function renderStreaming(m) {
    m._streaming = true;
    const host = msgsEl();
    let last = host.lastElementChild;
    const bubble = last && last.querySelector(".bubble");
    if (bubble) { bubble.innerHTML = bubbleHTML(m); wireCodeActions(bubble); host.scrollTop = host.scrollHeight; }
    m._streaming = false;
  }

  function wireCodeActions(bubble) {
    IDE.$$(".codeblock", bubble).forEach((cb) => {
      const code = cb.getAttribute("data-code");
      const file = cb.getAttribute("data-file");
      IDE.$$(".cb-act", cb).forEach((btn) => {
        btn.addEventListener("click", async () => {
          const act = btn.getAttribute("data-cb");
          if (act === "copy") { try { await navigator.clipboard.writeText(code); IDE.toast("Copied", "ok"); } catch (e) {} }
          else if (act === "insert") { if (IDE.editor.insertAtCursor(code)) IDE.toast("Inserted at cursor", "ok"); else IDE.toast("Open a file first", "err"); }
          else if (act === "new") {
            let path = file;
            if (!path) path = await IDE.ask("New file from code", "File path", IDE.editor.getActivePath() || "");
            if (!path) return;
            path = IDE.vfs.norm(path);
            const exists = IDE.vfs.files.has(path);
            if (exists) { const ok = await IDE.confirm("Overwrite?", "“" + path + "” exists. Replace its contents?"); if (!ok) return; }
            IDE.vfs.write(path, code);
            IDE.editor.refresh(path);
            IDE.editor.openFile(path);
            IDE.toast((exists ? "Updated " : "Created ") + path, "ok");
          }
        });
      });
    });
  }

  /* ---------- settings modal (keys + provider status) ---------- */
  ai.openSettings = function () {
    const body = IDE.el("div");
    body.appendChild(IDE.el("p", { class: "sub", html:
      "Add your own <b>free</b> API key for any provider (stored only in your browser). " +
      "Your key overrides any shared server key. No key? OpenRouter, Groq, Google &amp; Cerebras all have free tiers." }));
    Object.keys(PROVIDERS).forEach((pid) => {
      const p = PROVIDERS[pid];
      const server = ai.useProxy && ai.serverKeys[pid];
      const input = IDE.el("input", { class: "inp mono k", type: "password", placeholder: p.hint, value: ai.cfg.keys[pid] || "" });
      input.addEventListener("change", () => { ai.cfg.keys[pid] = input.value.trim(); IDE.store.set("ide_ai_keys", ai.cfg.keys); ai.buildModelList(); });
      const row = IDE.el("div", { class: "prov-row" }, [
        IDE.el("span", { class: "p-name", text: p.label }),
        IDE.el("span", { class: "p-badge" + (server ? " on" : ""), text: server ? "server key ✓" : "no server key" }),
        input,
        IDE.el("a", { href: p.keyUrl, target: "_blank", rel: "noopener", text: "get key ↗", style: "font-size:11px;color:var(--accent)" }),
      ]);
      body.appendChild(row);
    });

    // On-device (local) models section
    body.appendChild(IDE.el("div", { class: "section-title", text: "🖥 On-device models (local, no key)", style: "margin-top:18px" }));
    if (!webgpuOK()) {
      body.appendChild(IDE.el("p", { class: "sub", html:
        "This browser has <b>no WebGPU</b>, so local models can't run here. Use <b>Chrome</b> or <b>Edge</b> (desktop) with hardware acceleration enabled, then reopen this." }));
    } else {
      body.appendChild(IDE.el("p", { class: "sub", html:
        "Download a model to run it <b>fully in your browser</b> — no key, no data leaves your device, works offline. Each downloads once (multiple GB) and is cached. Pick it from the model dropdown afterwards." }));
      ON_DEVICE.forEach((m) => body.appendChild(odRow(m)));
    }

    IDE.modal({ title: "⚙ AI Settings", wide: true, body, footer: [IDE.btn("Done", "primary", () => IDE.$(".overlay:last-child .x").click())] });
  };

  function odRow(m) {
    const installed = od.installed.has(m.model);
    const status = IDE.el("span", { class: "log-line", style: "flex:1", text: installed ? "✓ installed" : m.note });
    const btn = IDE.btn(installed ? "Use" : "Install", installed ? "" : "primary");
    const rm = IDE.el("button", { class: "btn danger", text: "🗑", title: "Remove download", style: installed ? "" : "display:none" });
    btn.addEventListener("click", async () => {
      if (od.installed.has(m.model)) { ai.cfg.selected = "ondevice::" + m.model; IDE.store.set("ide_ai_model", ai.cfg.selected); ai.buildModelList(); IDE.$("#modelSelect").value = ai.cfg.selected; IDE.toast("Selected " + m.label + " — send a message to use it", "ok"); return; }
      btn.disabled = true;
      try {
        await ensureOnDevice(m.model, (s) => { status.textContent = s; });
        status.textContent = "✓ installed"; btn.textContent = "Use"; btn.classList.remove("primary"); rm.style.display = ""; btn.disabled = false;
        ai.buildModelList(); IDE.toast(m.label + " ready", "ok");
      } catch (e) { status.textContent = "✗ " + e.message; btn.disabled = false; IDE.toast(e.message, "err"); }
    });
    rm.addEventListener("click", async () => { await ai.odRemove(m.model); status.textContent = m.note; btn.textContent = "Install"; btn.classList.add("primary"); rm.style.display = "none"; ai.buildModelList(); IDE.toast("Removed " + m.label, "ok"); });
    return IDE.el("div", { class: "prov-row" }, [
      IDE.el("span", { class: "p-name", text: m.label }),
      IDE.el("span", { class: "p-badge", text: m.size }),
      status, btn, rm,
    ]);
  }

  function odHelp(err) {
    const msg = String((err && err.message) || "");
    if (/shader-f16|f16|createComputePipeline|compute stage/i.test(msg)) {
      return "Your GPU likely lacks the **shader-f16** feature. In **⚙ Settings → On-device**, install a **q4f32** model (e.g. *Llama 3.2 1B (f32-safe)*) — f32 runs on far more GPUs.";
    }
    return "Make sure you're on **Chrome/Edge desktop** with hardware acceleration on, or switch to a **cloud** model (add a key in ⚙ Settings).";
  }

  function openNoEngine(needWebgpu) {
    const gpu = webgpuOK();
    const body = IDE.el("div", { html:
      "<p class='sub'>" + (needWebgpu
        ? "That's a <b>local</b> model, but this browser has <b>no WebGPU</b>. Use Chrome/Edge desktop, or pick a cloud model below."
        : "No AI engine is set up for this model yet. Pick any of these:") + "</p>" +
      (gpu ? "<div class='step'><span class='n'>🖥</span><span><b>Run it locally, free</b> — in <b>⚙ Settings → On-device</b>, install a model (e.g. <i>Qwen2.5 Coder 1.5B</i>). No key, works offline.</span></div>" : "") +
      "<div class='step'><span class='n'>🔑</span><span><b>Use a cloud model</b> — add your own free key in <b>⚙ Settings</b> (AgentRouter or OpenRouter).</span></div>" +
      "<div class='step'><span class='n'>☁</span><span>Or deploy on Vercel with a provider key (e.g. <code>OPENROUTER_API_KEY</code>) so everyone can chat with no setup.</span></div>" });
    IDE.modal({ title: "🤖 Set up the AI", body, footer: [IDE.btn("Open Settings", "primary", () => { IDE.$(".overlay:last-child .x").click(); ai.openSettings(); })] });
  }
  ai.openNoEngine = openNoEngine;

  /* ---------- composer wiring ---------- */
  function autosize() { const t = IDE.$("#chatInput"); t.style.height = "auto"; t.style.height = Math.min(160, t.scrollHeight) + "px"; }

  IDE.on("app:ready", () => {
    render();
    const input = IDE.$("#chatInput");
    input.addEventListener("input", autosize);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ai.busy ? null : ai.send(input.value); } });
    IDE.$("#chatSend").addEventListener("click", () => { if (ai.busy) ai.stop(); else ai.send(input.value); });
    IDE.$("#chatClear").addEventListener("click", async () => { if (await IDE.confirm("Clear chat", "Delete this conversation?")) ai.clear(); });
    IDE.$("#modelSelect").addEventListener("change", (e) => { ai.cfg.selected = e.target.value; IDE.store.set("ide_ai_model", ai.cfg.selected); });
    IDE.$("#chatContextBtn").addEventListener("click", () => {
      const active = IDE.editor.getActivePath();
      IDE.toast(active ? "AI can see: " + active + " + file list" : "AI can see your file list (open a file to share it)", "ok");
    });
  });

  IDE.ai = ai;
})(window.IDE);
