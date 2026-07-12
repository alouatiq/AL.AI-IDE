/* AL.AI IDE — Skills & Templates.
 * TEMPLATES scaffold a starter project. SKILLS are optional capability add-ons
 * (config files, tooling) the user can toggle before creating the project.
 * Everything is generated locally into the VFS — no downloads, no network. */
(function (IDE) {
  "use strict";

  const gitignoreNode = "node_modules\ndist\n.env\n.env.local\n.DS_Store\n";
  const gitignoreFullstack =
    "# Node / frontend\nnode_modules\ndist\n\n# Python / backend\n__pycache__/\n*.pyc\n.venv/\nvenv/\ndb.sqlite3\n\n# Env & OS\n.env\n.env.local\n.DS_Store\n";
  const readme = (name, body) => `# ${name}\n\n${body}\n\n---\n_Built with **AL.AI IDE** — a serverless AI web IDE._\n`;

  /* A shared React + Vite frontend that talks to a backend on :8000 through a
   * dev proxy, so the frontend and backend run same-origin with no CORS setup. */
  const reactFrontend = (heading) => ({
    "frontend/package.json": JSON.stringify({
      name: "frontend", private: true, version: "0.0.0", type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
      devDependencies: { "@vitejs/plugin-react": "^4.3.1", vite: "^5.4.0" },
    }, null, 2),
    "frontend/index.html": `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${heading}</title></head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
    "frontend/vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api calls to the backend so the browser stays same-origin (no CORS).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000" } },
});
`,
    "frontend/src/main.jsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
`,
    "frontend/src/App.jsx": `import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Loading…");

  useEffect(() => {
    fetch("/api/hello")
      .then((r) => r.json())
      .then((d) => setMessage(d.message))
      .catch(() => setMessage("Backend not reachable — is it running on :8000?"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", marginTop: "4rem" }}>
      <h1>${heading}</h1>
      <p>Backend says: <strong>{message}</strong></p>
    </main>
  );
}
`,
    "frontend/README.md": readme("Frontend (React + Vite)", "```bash\nnpm install\nnpm run dev\n```\n\nOpens on <http://localhost:5173>. `/api/*` requests are proxied to the backend on `:8000`."),
  });

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

    fastapi: {
      icon: "⚡", name: "FastAPI + React", desc: "Full-stack: a FastAPI backend and a React (Vite) frontend. Run each locally.",
      entry: "README.md",
      files: () => ({
        ...reactFrontend("FastAPI + React ⚡"),
        "backend/main.py": `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AL.AI IDE — FastAPI backend")

# Allow the Vite dev server during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI 🚀"}
`,
        "backend/requirements.txt": "fastapi>=0.110\nuvicorn[standard]>=0.29\n",
        "backend/README.md": readme("Backend (FastAPI)", "```bash\npython -m venv .venv\nsource .venv/bin/activate   # Windows: .venv\\\\Scripts\\\\activate\npip install -r requirements.txt\nuvicorn main:app --reload --port 8000\n```\n\nAPI runs on <http://localhost:8000> — try <http://localhost:8000/api/hello>."),
        ".gitignore": gitignoreFullstack,
        "README.md": readme("FastAPI + React", "A full-stack starter.\n\n- **`backend/`** — FastAPI (Python), serves `/api/*` on `:8000`.\n- **`frontend/`** — React + Vite, dev server on `:5173`, proxies `/api` to the backend.\n\n## Run it\n\nTwo terminals:\n\n```bash\n# 1) backend\ncd backend && python -m venv .venv && source .venv/bin/activate\npip install -r requirements.txt && uvicorn main:app --reload --port 8000\n\n# 2) frontend\ncd frontend && npm install && npm run dev\n```\n\nOpen <http://localhost:5173>."),
      }),
    },

    django: {
      icon: "🎸", name: "Django + React", desc: "Full-stack: a Django backend and a React (Vite) frontend. Run each locally.",
      entry: "README.md",
      files: () => ({
        ...reactFrontend("Django + React 🎸"),
        "backend/manage.py": `#!/usr/bin/env python
import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
`,
        "backend/config/__init__.py": "",
        "backend/config/settings.py": `from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Dev-only key — replace with an environment variable in production.
SECRET_KEY = "dev-only-change-me"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "api",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
`,
        "backend/config/urls.py": `from django.urls import include, path

urlpatterns = [
    path("api/", include("api.urls")),
]
`,
        "backend/config/wsgi.py": `import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()
`,
        "backend/api/__init__.py": "",
        "backend/api/apps.py": `from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
`,
        "backend/api/views.py": `from django.http import JsonResponse


def hello(request):
    return JsonResponse({"message": "Hello from Django 🎸"})
`,
        "backend/api/urls.py": `from django.urls import path

from . import views

urlpatterns = [
    path("hello", views.hello),
]
`,
        "backend/requirements.txt": "Django>=5.0\n",
        "backend/README.md": readme("Backend (Django)", "```bash\npython -m venv .venv\nsource .venv/bin/activate   # Windows: .venv\\\\Scripts\\\\activate\npip install -r requirements.txt\npython manage.py runserver 8000\n```\n\nAPI runs on <http://localhost:8000> — try <http://localhost:8000/api/hello>."),
        ".gitignore": gitignoreFullstack,
        "README.md": readme("Django + React", "A full-stack starter.\n\n- **`backend/`** — Django (Python), serves `/api/*` on `:8000`.\n- **`frontend/`** — React + Vite, dev server on `:5173`, proxies `/api` to the backend.\n\n## Run it\n\nTwo terminals:\n\n```bash\n# 1) backend\ncd backend && python -m venv .venv && source .venv/bin/activate\npip install -r requirements.txt && python manage.py runserver 8000\n\n# 2) frontend\ncd frontend && npm install && npm run dev\n```\n\nOpen <http://localhost:5173>."),
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
    contributing: {
      name: "CONTRIBUTING guide", desc: "A CONTRIBUTING.md explaining setup, branching and commit style.", preselect: false,
      apply: (files, ctx) => {
        const name = (ctx && ctx.name) || "this project";
        files["CONTRIBUTING.md"] = `# Contributing to ${name}

Thanks for your interest in contributing! This guide covers how to get set up and
the conventions we follow.

## Getting started

1. Fork the repository and clone your fork.
2. Create a branch off \`main\`: \`git switch -c feat/short-description\`.
3. Make your change, keeping commits small and focused.

## Branch & commit conventions

- Branch prefixes: \`feat/\`, \`fix/\`, \`docs/\`, \`chore/\`, \`refactor/\`, \`test/\`.
- Use [Conventional Commits](https://www.conventionalcommits.org/), e.g.
  \`feat(api): add pagination to the users endpoint\`.
- Each commit should leave the project in a working state.

## Pull requests

- Describe **what** changed and **why**.
- Make sure the build and tests pass.
- Link any related issues.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
`;
      },
    },
    codeofconduct: {
      name: "Code of Conduct", desc: "A Contributor Covenant CODE_OF_CONDUCT.md.", preselect: false,
      apply: (files, ctx) => {
        const email = (ctx && ctx.contactEmail) || "the maintainers";
        files["CODE_OF_CONDUCT.md"] = `# Code of Conduct

## Our pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

## Our standards

Examples of behavior that contributes to a positive environment:

- Showing empathy and kindness toward other people.
- Being respectful of differing opinions, viewpoints, and experiences.
- Giving and gracefully accepting constructive feedback.

Examples of unacceptable behavior:

- Harassment, insulting or derogatory comments, and personal or political attacks.
- Publishing others' private information without explicit permission.
- Other conduct which could reasonably be considered inappropriate.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to ${email}. All complaints will be reviewed and investigated promptly
and fairly.

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org),
version 2.1.
`;
      },
    },
    security: {
      name: "Security Policy", desc: "A SECURITY.md describing how to report vulnerabilities.", preselect: false,
      apply: (files, ctx) => {
        const email = (ctx && ctx.contactEmail) || "the maintainers (add a contact address here)";
        files["SECURITY.md"] = `# Security Policy

## Reporting a vulnerability

If you discover a security issue, please report it **privately** so it can be
fixed before public disclosure.

- **Contact:** ${email}
- Please include a description, steps to reproduce, the affected version/commit,
  and any proof-of-concept.
- You will receive an acknowledgement as soon as possible, with updates as the
  issue is triaged and resolved.

Please **do not** open a public issue for security vulnerabilities.

## Supported versions

The latest release on \`main\` is supported. Older releases receive fixes on a
best-effort basis.
`;
      },
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
