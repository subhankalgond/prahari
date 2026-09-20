# Prahari - run doc

Full-stack app: React (Vite) frontend on 5173 + Express API on 4000.
Demo mode (in-memory data) needs no database; weather/forecast use live
Open-Meteo (no key required).

## Reproduce artifacts

1. Copy `.env` from the main checkout to this worktree root (never commit it).
2. Install deps once:
   - `npm install` (workspace root: installs backend + frontend + concurrently)
   - `npm install react-leaflet@4 leaflet@1.9 @types/leaflet --workspace frontend --legacy-peer-deps`
3. No build needed for dev mode.

## Run the server

- One command (both servers): `npm run dev` from the repo root.
  - API listens on http://localhost:4000 (tsx watch)
  - Web listens on http://localhost:5173 (Vite, proxies /api and /uploads to 4000)
- Detached (PowerShell):
  `powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory 'C:\Users\subha\OneDrive\Desktop\kisaan' -RedirectStandardOutput '<log>.out' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"`
  (stdout and stderr must go to different files.)

## Verify

- `npm run test -w backend` (51 tests)
- `npm run typecheck`
- Health: `curl http://localhost:4000/api/health`
- Forecast: `curl "http://localhost:4000/api/forecast?location=Karnataka"`
- Demo logins: farmer `9876543210 / Demo@12345`, admin `admin@prahari.in / Admin@12345`
