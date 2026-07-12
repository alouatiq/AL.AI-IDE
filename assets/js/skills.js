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

  /* Brand logos (Simple Icons, CC0) inlined so the app stays no-build & offline.
   * Each is a single-path SVG tinted with its official brand colour. */
  const svg = (color, path) =>
    `<svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${path}"/></svg>`;
  const LOGOS = {
    html5: svg("#E34F26", "M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"),
    react: svg("#61DAFB", "M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"),
    node: svg("#5FA04E", "M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"),
    python: svg("#3776AB", "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"),
    fastapi: svg("#009688", "M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896"),
    django: svg("#44B78B", "M11.146 0h3.924v18.166c-2.013.382-3.491.535-5.096.535-4.791 0-7.288-2.166-7.288-6.32 0-4.002 2.65-6.6 6.753-6.6.637 0 1.121.05 1.707.203zm0 9.143a3.894 3.894 0 00-1.325-.204c-1.988 0-3.134 1.223-3.134 3.365 0 2.09 1.096 3.236 3.109 3.236.433 0 .79-.025 1.35-.102V9.142zM21.314 6.06v9.098c0 3.134-.229 4.638-.917 5.937-.637 1.249-1.478 2.039-3.211 2.905l-3.644-1.733c1.733-.815 2.574-1.53 3.109-2.625.561-1.121.739-2.421.739-5.835V6.059h3.924zM17.39.021h3.924v4.026H17.39z"),
    // Generic "blank document" mark for the empty starter (not a brand).
    blank: `<svg viewBox="0 0 24 24" fill="#94a3b8" fill-rule="evenodd" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V7a1 1 0 0 0 1 1h3.5L13 3.5z"/></svg>`,
  };

  /* ---------------- Templates ---------------- */
  const TEMPLATES = {
    static: {
      icon: "🌐", logos: [LOGOS.html5], side: "frontend", name: "Static Website", desc: "Plain HTML + CSS + JS. Zero build, runs in Live Preview instantly.",
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
      icon: "⚛️", logos: [LOGOS.react], side: "frontend", name: "React + Vite", desc: "Modern React SPA with Vite. Preview needs `npm install && npm run dev` locally.",
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
      icon: "🟢", logos: [LOGOS.node], side: "backend", name: "Node + Express API", desc: "A minimal Express REST API. Run with `npm install && npm start`.",
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
      icon: "🐍", logos: [LOGOS.python], side: "backend", name: "Python CLI", desc: "A tidy Python starter with argparse. Run with `python main.py`.",
      entry: "main.py",
      files: () => ({
        "main.py": `import argparse\n\n\ndef main() -> None:\n    parser = argparse.ArgumentParser(description="A tiny Python app from AL.AI IDE")\n    parser.add_argument("name", nargs="?", default="world")\n    args = parser.parse_args()\n    print(f"Hello, {args.name}!")\n\n\nif __name__ == "__main__":\n    main()\n`,
        "requirements.txt": "# add your dependencies here\n",
        ".gitignore": "__pycache__/\n*.pyc\n.venv/\n.env\n",
        "README.md": readme("Python CLI", "```bash\npython main.py YourName\n```"),
      }),
    },

    fastapi: {
      icon: "⚡", logos: [LOGOS.fastapi, LOGOS.react], side: "fullstack", name: "FastAPI + React", desc: "Full-stack: a FastAPI backend and a React (Vite) frontend. Run each locally.",
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
      icon: "🎸", logos: [LOGOS.django, LOGOS.react], side: "fullstack", name: "Django + React", desc: "Full-stack: a Django backend and a React (Vite) frontend. Run each locally.",
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
      icon: "📄", logos: [LOGOS.blank], side: "starter", name: "Blank Project", desc: "Start empty. Just a README — build it up however you like.",
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
