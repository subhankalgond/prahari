# Prahari - real data storage with Supabase

The app already has a complete Prisma/PostgreSQL data layer. Switching from
demo mode to real, persisted data needs only credentials in `.env` plus three
commands. This guide is everything else, pre-done.

## What is already in place

- `backend/prisma/schema.prisma` - all tables (users, crops, scans, results,
  library, alerts, notifications, health history, field boundaries)
- `backend/src/repositories/prismaStore.ts` - production DataStore
- `backend/src/seed/seedCli.ts` - seeds library entries + admin account
- Prisma 5.22 installed and the client generated
- Server auto-selects Postgres when `DEMO_MODE=false`

## Step 1. Create the Supabase project

1. https://supabase.com -> New project
2. Region: Mumbai (ap-south-1) is closest for Indian farmers
3. Set a strong database password (you will need it for the connection string)

## Step 2. Copy these values into `.env` at the repo root

From Supabase -> Project Settings -> Database -> Connection string (URI),
use the **Connection pooler** (port 6543) for serverless-friendly access:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key from Settings -> API>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from Settings -> API>
STORAGE_BUCKET=crop-images
DEMO_MODE=false
ADMIN_EMAIL=admin@prahari.in
ADMIN_PASSWORD=<choose a strong password>
ADMIN_MOBILE=+919999000001
JWT_SECRET=<openssl rand -hex 32>
WEATHER_PROVIDER=openmeteo
AI_PROVIDER=demo
```

When you paste the URL/key here in chat, I will fill these in and run the
remaining steps automatically.

## Step 3. Commands I will run (already scripted, just needs the URL)

```bash
cd backend
npx prisma migrate deploy          # create all tables in Supabase
npx prisma db push                 # sync any schema drift (safe, additive)
npm run seed                       # 10 library entries + admin account
```

Then restart the API. `/api/health` will report `"demoMode": false`, and every
registration, crop, scan and alert is now persisted in Supabase.

## Step 4 (optional). Crop image storage in Supabase Storage

Local `uploads/` works fine for dev and demos. For production uploads:

1. Supabase dashboard -> Storage -> New bucket -> name `crop-images`, private
2. In `.env`: `STORAGE_BUCKET=crop-images`
3. Tell me and I will add the Supabase Storage upload path to the scan
   service (the abstraction point is already in `config.storageBucket`).

## Verification checklist after switch

- [ ] `/api/health` shows `demoMode: false`
- [ ] Register a new farmer -> row appears in Supabase `users` table
- [ ] Add a crop -> visible in `crops` table, survives a server restart
- [ ] Scan a crop -> row in `crop_scans` + `scan_results`
- [ ] Library shows the 10 seeded entries from the database
- [ ] Admin login works with the ADMIN_EMAIL / ADMIN_PASSWORD you set

## Rollback to demo mode

Set `DEMO_MODE=true` in `.env` and restart. The app returns to the in-memory
store with built-in demo data - useful if Supabase is ever unreachable.
