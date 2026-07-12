# `.github/workflows/`

GitHub Actions pipelines. Actions are pinned to major versions; jobs run least-privilege.

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | push to `main`, all PRs | Sequential pipeline: **lint-frontend** (JS syntax + JSON validity) → **test-quality** (README-in-every-dir, core files present) → **security-scan** (gitleaks). Each stage gates the next via `needs:`. |
| `cd.yml` | push to `main` | Deploy gate — Vercel auto-deploys the static app + `api/` Edge functions on merge; hook for manual `vercel deploy`. |
| `release.yml` | tag `v*` | Publishes a GitHub Release with auto-generated notes. |

Make the CI jobs **required status checks** in repo Settings so PRs can't merge red.

↑ Back to [`.github/`](../README.md) · [project root](../../README.md).
