/* AL.AI IDE — Skills & Templates.
 * TEMPLATES scaffold a starter project. SKILLS are optional capability add-ons
 * (config files, tooling) the user can toggle before creating the project.
 * Everything is generated locally into the VFS — no downloads, no network. */
(function (IDE) {
  "use strict";

  const gitignoreNode = "node_modules\ndist\n.env\n.env.local\n.DS_Store\n";
  const readme = (name, body) => `# ${name}\n\n${body}\n\n---\n_Built with **AL.AI IDE** — a serverless AI web IDE._\n`;

  /* ---------------- Templates ---------------- */
  const TEMPLATES = {
    static: {
      icon: "🌐", name: "Static Website", desc: "Plain HTML + CSS + JS. Zero build, runs in Live Preview instantly.",
      entry: "index.html",
      files: () => ({
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Site</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <h1>Hello from AL.AI IDE 👋</h1>
    <p>Edit <code>index.html</code> and hit <b>▶ Run</b> to see changes.</p>
    <button id="btn">Click me</button>
  </main>
  <script src="app.js"></script>
</body>
</html>
`,
        "styles.css": `:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; display: grid; place-items: center; min-height: 100vh; }
main { text-align: center; padding: 2rem; }
button { padding: .6rem 1.2rem; border: none; border-radius: 8px; background: #3b82f6; color: #fff; cursor: pointer; }
`,
        "app.js": `document.getElementById("btn").addEventListener("click", () => {
  alert("It works! 🎉");
});
`,
        "README.md": readme("My Site", "A simple static website."),
      }),
    },

    react: {
      icon: "⚛️", name: "React + Vite", desc: "Modern React SPA with Vite. Preview needs `npm install && npm run dev` locally.",
      entry: "index.html",
      files: () => ({
        "package.json": JSON.stringify({
          name: "react-app", private: true, version: "0.0.0", type: "module",
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
          dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
          devDependencies: { "@vitejs/plugin-react": "^4.3.1", vite: "^5.4.0" },
        }, null, 2),
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>React App</title></head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
        "vite.config.js": `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n`,
        "src/main.jsx": `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\ncreateRoot(document.getElementById("root")).render(<App />);\n`,
        "src/App.jsx": `import { useState } from "react";\nexport default function App() {\n  const [n, setN] = useState(0);\n  return (\n    <main style={{ fontFamily: "system-ui", textAlign: "center", marginTop: "4rem" }}>\n      <h1>React + Vite ⚛️</h1>\n      <button onClick={() => setN(n + 1)}>Count: {n}</button>\n    </main>\n  );\n}\n`,
        ".gitignore": gitignoreNode,
        "README.md": readme("React App", "React + Vite starter.\n\n```bash\nnpm install\nnpm run dev\n```"),
      }),
    },

    node: {
      icon: "🟢", name: "Node + Express API", desc: "A minimal Express REST API. Run with `npm install && npm start`.",
      entry: "server.js",
      files: () => ({
        "package.json": JSON.stringify({
          name: "express-api", version: "1.0.0", type: "module",
          scripts: { start: "node server.js" }, dependencies: { express: "^4.19.2" },
        }, null, 2),
        "server.js": `import express from "express";\nconst app = express();\napp.use(express.json());\n\napp.get("/", (req, res) => res.json({ ok: true, msg: "Hello from AL.AI IDE" }));\napp.get("/api/health", (req, res) => res.json({ status: "up" }));\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log("Listening on :" + PORT));\n`,
        ".gitignore": gitignoreNode,
        "README.md": readme("Express API", "Minimal Express server.\n\n```bash\nnpm install\nnpm start\n```"),
      }),
    },

    python: {
      icon: "🐍", name: "Python CLI", desc: "A tidy Python starter with argparse. Run with `python main.py`.",
      entry: "main.py",
      files: () => ({
        "main.py": `import argparse\n\n\ndef main() -> None:\n    parser = argparse.ArgumentParser(description="A tiny Python app from AL.AI IDE")\n    parser.add_argument("name", nargs="?", default="world")\n    args = parser.parse_args()\n    print(f"Hello, {args.name}!")\n\n\nif __name__ == "__main__":\n    main()\n`,
        "requirements.txt": "# add your dependencies here\n",
        ".gitignore": "__pycache__/\n*.pyc\n.venv/\n.env\n",
        "README.md": readme("Python CLI", "```bash\npython main.py YourName\n```"),
      }),
    },

    blank: {
      icon: "📄", name: "Blank Project", desc: "Start empty. Just a README — build it up however you like.",
      entry: "index.html",
      files: () => ({ "README.md": readme("New Project", "Start building!") }),
    },
  };

  /* ---------------- Skills (optional add-ons) ---------------- */
  const SKILLS = {
    readme: {
      name: "Rich README", desc: "A structured README with sections & badges.", preselect: true,
      apply: (files, ctx) => { files["README.md"] = `# ${ctx.name}\n\n> Built with AL.AI IDE.\n\n## Features\n\n- ✨ TODO\n\n## Getting started\n\nTODO\n\n## License\n\nMIT\n`; },
    },
    gitignore: {
      name: ".gitignore", desc: "Sensible ignores so junk never gets committed.", preselect: true,
      apply: (files) => { if (!files[".gitignore"]) files[".gitignore"] = gitignoreNode; },
    },
    editorconfig: {
      name: ".editorconfig", desc: "Consistent indentation across editors.", preselect: true,
      apply: (files) => { files[".editorconfig"] = "root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true\n"; },
    },
    prettier: {
      name: "Prettier config", desc: "Opinionated code formatting rules.", preselect: false,
      apply: (files) => { files[".prettierrc"] = JSON.stringify({ semi: true, singleQuote: false, printWidth: 100, tabWidth: 2 }, null, 2); },
    },
    eslint: {
      name: "ESLint config", desc: "Basic linting for JavaScript projects.", preselect: false,
      apply: (files) => { files["eslint.config.js"] = 'export default [\n  { rules: { "no-unused-vars": "warn", "no-undef": "error" } },\n];\n'; },
    },
    license: {
      name: "MIT License", desc: "Add an open-source MIT LICENSE file.", preselect: false,
      apply: (files) => { const y = new Date().getFullYear(); files["LICENSE"] = `MIT License\n\nCopyright (c) ${y}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy...\n`; },
    },
    github: {
      name: "GitHub Actions CI", desc: "A ready-to-run CI workflow stub.", preselect: false,
      apply: (files) => { files[".github/workflows/ci.yml"] = "name: CI\non: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo \"add your build & test steps\"\n"; },
    },
  };

  IDE.skills = {
    TEMPLATES, SKILLS,
    templateKeys: () => Object.keys(TEMPLATES),
    /** Build the file map for a chosen template + selected skill ids. */
    scaffold(templateKey, skillIds, projectName) {
      const tpl = TEMPLATES[templateKey] || TEMPLATES.blank;
      const files = { ...tpl.files() };
      const ctx = { name: projectName || "my-project", template: templateKey };
      (skillIds || []).forEach((id) => { if (SKILLS[id]) try { SKILLS[id].apply(files, ctx); } catch (e) {} });
      return { files, entry: tpl.entry };
    },
    defaultSkillIds() { return Object.keys(SKILLS).filter((k) => SKILLS[k].preselect); },
  };
})(window.IDE);
