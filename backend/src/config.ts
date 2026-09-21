import dotenv from 'dotenv';
import path from 'path';

// backend/src -> backend -> project root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
dotenv.config(); // also load .env from the current working directory, if any

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 4000),
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? 'https://prahari.in',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  demoMode: bool(process.env.DEMO_MODE, true),
  // Show the demo credentials box on the login page even in production mode
  // (after the demo accounts have been seeded into the real database).
  showDemoHint: bool(process.env.SHOW_DEMO_HINT, false),
  databaseUrl: process.env.DATABASE_URL ?? '',
  weatherProvider: (process.env.WEATHER_PROVIDER ?? 'demo').toLowerCase(),
  weatherApiKey: process.env.WEATHER_API_KEY ?? '',
  aiProvider: (process.env.AI_PROVIDER ?? 'demo').toLowerCase(),
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  uploadDir: process.env.UPLOAD_DIR ?? path.resolve(__dirname, '../../uploads'),
  maxUploadBytes: num(process.env.MAX_UPLOAD_MB, 10) * 1024 * 1024,
  // Keep-alive: deployed backend URL used by the self-ping cron job.
  // Example: https://your-backend-domain.onrender.com
  backendUrl: process.env.BACKEND_URL ?? '',
};

export type AppConfig = typeof config;
