/**
 * keepAlive.ts
 *
 * Starts a cron job that pings GET /api/health on this backend every 10 minutes.
 * Purpose: prevent the Render free-tier container from going to sleep due to inactivity.
 *
 * Safety guarantees:
 *  - Only one cron job is ever registered (guards against double-start on restart).
 *  - Overlapping requests are skipped if the previous one hasn't finished.
 *  - All errors are caught; this cron can never crash the backend.
 *  - Skipped silently when BACKEND_URL is not configured (e.g. local development).
 */

import cron from 'node-cron';
import { config } from '../config';

// Prevents double-registration if this module is somehow imported twice.
let started = false;

// Prevents overlapping concurrent health pings.
let isRunning = false;

async function pingHealth(): Promise<void> {
  if (isRunning) {
    console.log('[keepAlive] Skipping — previous health check still in progress.');
    return;
  }

  isRunning = true;
  try {
    const url = `${config.backendUrl}/api/health`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10-second timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      console.log('[keepAlive] ✅ It worked — backend is alive.');
    } else {
      console.warn(`[keepAlive] ❌ It did not work — HTTP ${res.status}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[keepAlive] ❌ It did not work — ${message}`);
  } finally {
    isRunning = false;
  }
}

/**
 * Call once after the HTTP server starts.
 * Registers a cron that pings /api/health every 10 minutes.
 */
export function startKeepAlive(): void {
  if (started) {
    console.log('[keepAlive] Already started — skipping duplicate registration.');
    return;
  }

  if (!config.backendUrl) {
    console.log(
      '[keepAlive] BACKEND_URL is not set — keep-alive cron is disabled (OK for local development).',
    );
    return;
  }

  // Run every 10 minutes.
  cron.schedule('*/10 * * * *', () => {
    pingHealth().catch((err: unknown) => {
      // Belt-and-suspenders: pingHealth already catches all errors internally.
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[keepAlive] Unexpected error: ${message}`);
    });
  });

  started = true;
  console.log(
    `[keepAlive] Keep-alive cron started. Pinging ${config.backendUrl}/api/health every 10 minutes.`,
  );
}
