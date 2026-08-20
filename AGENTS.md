# Dev notes (Base44)

- Cloudflare Pages app: React/Vite UI + Pages Functions in `functions/api/*` backed by D1 (`DB`).
- Local stack (`docker-compose.base44.yml`):
  - `api`: `wrangler pages dev dist` on 8788 — serves `/api/*` with a **local** D1 sqlite (persisted in the `wrangler_state` volume). No Cloudflare credentials needed.
  - `web`: Vite dev server on 3000; proxies `/api` to the api service via the `API_PROXY_TARGET` env var (see `vite.config.js`).
  - `install`: one-shot `npm install` into the shared `node_modules` volume (avoids both services installing concurrently).
- Tables are auto-created by the Functions code on first request; `migrations/0001_initial.sql` is only for remote D1.
- Verify: `curl localhost:3000/api/health` → `{"ok":true,...}`.
