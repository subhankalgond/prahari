# Prahari

**Detect Early. Protect Crops. Grow Better.**

AI-assisted crop health monitoring for farmers. Built for Smart India Hackathon
problem statement **SIH26131**: Early detection and management of crop diseases
and pest infestations (Agriculture, FoodTech & Rural Development, Software).

The core idea is not just an image classifier: crop photo + weather + growth
stage + location feed a transparent risk engine that produces early warnings
with the reasons shown.

---

## What it does

For farmers:

- Register crops with area, stage, soil and irrigation details
- Scan a crop photo and receive a structured AI-assisted assessment
  (possible condition, confidence, severity, symptoms, what to do now,
  prevention, when to seek expert help)
- See weather and a 7-day forecast with explained crop risk factors
- Receive risk alerts whose reasons are listed, not hidden
- Track crop health scores over time and review full scan history
- Use the whole app in English, Hindi, Kannada or Marathi

For administrators:

- Dashboard with KPIs and charts (scans over time, condition/crop/risk distributions)
- Farmer management (search, suspend, reactivate)
- Full CRUD over the disease and pest knowledge library
- Broadcast alerts to all active farmers
- View all scan records with farmer and crop attribution

Every AI result is labelled **AI-assisted** and carries a disclaimer. Low
confidence results say so plainly and recommend consulting an expert. The risk
engine lists its factors and states that it is not a guaranteed prediction.

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, lucide-react, react-i18next, PWA (vite-plugin-pwa) |
| Backend   | Node.js, Express, TypeScript, zod, helmet, CORS allowlist, rate limiting, multer upload validation |
| Database  | PostgreSQL via Prisma (demo mode uses an in-memory store, no DB needed) |
| Auth      | JWT (bcrypt password hashing), role-based access (FARMER / ADMIN) |
| AI        | Pluggable provider: built-in demo provider or FastAPI model service |
| Weather   | Pluggable provider: OpenWeather (with API key) or labelled demo provider |

## Project structure

```
/               npm workspaces: frontend + backend
/frontend       React app (pages, layouts, components, i18n, contexts, hooks)
/backend        Express API (controllers, routes, services, middleware, repositories)
  /prisma       PostgreSQL schema
  /src/tests    Vitest + Supertest suite (42 tests)
/ai-service     Optional FastAPI service wrapping a real model
```

## Quick start (demo mode, zero setup)

Requires Node 18+.

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (the Vite dev server proxies /api and /uploads)

Demo mode (`DEMO_MODE=true`, the default) uses an in-memory store pre-seeded
with demo farmers, crops, scans, alerts, notifications and a 10-entry disease
and pest library. The UI shows a visible **Demo data** badge wherever demo
content appears, and the login screen lists the demo accounts:

| Role   | Credentials                              |
| ------ | ---------------------------------------- |
| Farmer | `9876543210` / `Demo@12345`              |
| Admin  | `admin@prahari.in` / `Admin@12345`  |

## Production mode (PostgreSQL)

1. Create a PostgreSQL database and set `DATABASE_URL`.
2. Copy `.env.example` to `.env` and fill in values. Generate secrets with
   `openssl rand -hex 32`. Never commit real secrets.
3. Install the Prisma tooling locally and push the schema:

   ```bash
   npm install -D prisma            # from the backend workspace
   npx prisma generate              # in backend/
   npx prisma db push               # creates the tables
   ```

4. Seed the knowledge base and create an admin:

   ```bash
   ADMIN_EMAIL=admin@yourdomain.in ADMIN_PASSWORD=<strong password> npm run seed
   ```

5. Set `DEMO_MODE=false` and restart.

Registration always creates FARMER accounts; admins exist only via the seed.

## Connecting a real AI model

The backend ships with a demo AI provider (`AI_PROVIDER=demo`). To connect a
real classifier:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

Then set `AI_PROVIDER=model` and `AI_SERVICE_URL=http://localhost:8000` in the
root `.env`. Replace the placeholder in
`ai-service/app/services/classifier.py` with your trained model. The JSON
contract is documented in `ai-service/README.md`. Confidence is normalized,
clamped below 100 percent, and results are always labelled AI-assisted.

## Connecting live weather

Set `WEATHER_PROVIDER=openweather` and `WEATHER_API_KEY=...` (OpenWeather).
Without a key the app uses a clearly-labelled demo provider. Keys live only on
the backend; the frontend never sees them.

## Environment variables

See `.env.example` at the repository root. Highlights:

```
DEMO_MODE=true            # in-memory demo store (no database required)
DATABASE_URL=             # PostgreSQL connection string (production)
JWT_SECRET=               # openssl rand -hex 32
WEATHER_PROVIDER=demo     # openweather | demo
WEATHER_API_KEY=
AI_PROVIDER=demo          # model | demo
AI_SERVICE_URL=
CORS_ORIGIN=http://localhost:5173
PUBLIC_SITE_URL=https://prahari.in
SUPABASE_URL=             # optional managed Postgres/auth/storage
STORAGE_BUCKET=crop-images
```

## Scripts

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Run API + web app together               |
| `npm run build`      | Typecheck and build backend + frontend   |
| `npm test`           | Backend test suite (Vitest + Supertest)  |
| `npm run typecheck`  | TypeScript checks in both workspaces     |
| `npm run seed`       | Seed library + admin into production DB  |

## Deployment

**Frontend (Vercel):** import the repo, set the root directory to `frontend`,
framework preset Vite. Set `VITE_API_URL` to your API URL. SPA rewrites are
configured in `frontend/vercel.json`.

**Backend (Render/Railway):** root directory `backend`, build
`npm ci && npm run build`, start `npm start`, health check `/api/health`.
See `backend/render.yaml` for a ready template and the full environment
variable list.

**AI service:** deploy `ai-service/` (Dockerfile included) and point
`AI_SERVICE_URL` at it.

## Security notes

- bcrypt password hashing; JWT bearer tokens
- Role-based access control; farmers can only touch their own crops, scans,
  alerts and notifications; admin routes are guarded
- zod validation on all mutating endpoints
- Uploads restricted to JPG/PNG/WEBP, 10 MB, MIME + extension checked,
  random server-generated filenames
- helmet security headers, CORS allowlist, rate limiting on auth and scans
- Parameterized queries via Prisma / typed data access (no string-built SQL)

## Accessibility and design

- Mobile-first: bottom navigation with a prominent Scan action on phones,
  sidebar on desktop
- 44px minimum touch targets, visible focus rings, ARIA labels on icon-only
  controls, keyboard-dismissible dialogs, `prefers-reduced-motion` support
- Emerald-on-warm-off-white palette, WCAG AA contrast, no decorative noise

## Honesty rules baked into the product

- "Possible condition", "AI-assisted assessment", "needs attention" language
  throughout; no guaranteed diagnoses
- Risk alerts show their factor list and a not-a-guarantee note
- Demo data, demo weather and demo analysis are all visibly labelled
- Library chemical guidance always defers to the product label and local
  agricultural officers

## License

MIT. Built for the Smart India Hackathon 2026.
