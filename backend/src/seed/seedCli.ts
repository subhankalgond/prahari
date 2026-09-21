import bcrypt from 'bcryptjs';
import { config } from '../config';
import { DEMO_ALERTS, DEMO_CROPS, DEMO_LIBRARY, DEMO_NOTIFICATIONS, DEMO_USER_ID } from '../demo/demoData';
import type { LibraryEntry } from '../types';

// Seeds the production PostgreSQL database with:
// - the crop disease and pest knowledge base entries (real library)
// - one admin account (credentials from ADMIN_EMAIL / ADMIN_PASSWORD env vars)
// - presentation demo account: farmer + demo crops + alerts + notifications so
//   the demo credentials work on the real database. Idempotent: re-running
//   never duplicates. The real admin account is left untouched.
// Run with: npm run seed

async function main(): Promise<void> {
  if (config.demoMode) {
    console.log('[prahari] DEMO_MODE=true: the app already loads built-in demo data.');
    console.log('Set DEMO_MODE=false and configure DATABASE_URL to seed a real database.');
    return;
  }

  const { PrismaStore } = await import('../repositories/prismaStore');
  const store = new PrismaStore();

  // ---- Knowledge base library ----
  const existing = await store.listLibrary({ includeInactive: true });
  if (existing.length === 0) {
    for (const entry of DEMO_LIBRARY) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...data } = entry as LibraryEntry;
      void _id;
      void _c;
      void _u;
      await store.createLibraryEntry(data);
    }
    console.log(`[prahari] Seeded ${DEMO_LIBRARY.length} library entries.`);
  } else {
    console.log(`[prahari] Library already has ${existing.length} entries; skipping.`);
  }

  // ---- Admin account (real, never overwritten) ----
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@prahari.in';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const existingAdmin = await store.findUserByEmail(adminEmail);
  if (!existingAdmin) {
    if (!adminPassword || adminPassword.length < 8) {
      console.log('[prahari] Skipped admin creation: set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars).');
    } else {
      await store.createUser({
        name: 'Prahari Admin',
        mobile: process.env.ADMIN_MOBILE ?? '+919999000001',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        state: 'Karnataka',
        district: 'Bengaluru',
        taluk: null,
        village: null,
        language: 'en',
        role: 'ADMIN',
      });
      console.log(`[prahari] Created admin account: ${adminEmail}`);
    }
  } else {
    console.log('[prahari] Admin account already exists; left untouched.');
  }

  // ---- Presentation demo account ----
  // A FARMER account with the known demo credentials so the login-page hint
  // works against the real database during presentations. Data is re-seeded
  // if missing; the demo farmer's password is reset on every run so the
  // documented credentials always work.
  const demoEmail = 'ravi.demo@prahari.in';
  const demoMobile = '+919876543210';
  const demoPassword = 'Demo@12345';
  const demoName = 'Ravi Kumar';

  let demoUser = await store.findUserByEmail(demoEmail);
  if (!demoUser) {
    demoUser = await store.findUserByMobile(demoMobile);
  }
  if (demoUser) {
    // Reset the password so the documented demo credentials always work.
    await store.updatePassword(demoUser.id, await bcrypt.hash(demoPassword, 10));
    console.log('[prahari] Demo farmer account exists; password reset to the documented demo credentials.');
  } else {
    demoUser = await store.createUser({
      name: demoName,
      mobile: demoMobile,
      email: demoEmail,
      passwordHash: await bcrypt.hash(demoPassword, 10),
      role: 'FARMER',
      language: 'en',
      state: 'Karnataka',
      district: 'Bengaluru Rural',
      taluk: 'Doddaballapur',
      village: 'Madhure',
    });
    console.log('[prahari] Created demo farmer account: 9876543210 / Demo@12345');
  }
  const demoUserId = demoUser.id;

  // ---- Demo crops (one per crop type in the library) ----
  const existingCrops = await store.listCrops(demoUserId);
  const existingNames = new Set(existingCrops.map((c) => c.name));
  let added = 0;
  for (const crop of DEMO_CROPS) {
    if (existingNames.has(crop.name)) continue;
    const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, healthScore: _h, riskLevel: _r, ...data } = crop;
    void _id; void _u; void _c; void _up; void _h; void _r;
    const created = await store.createCrop(demoUserId, {
      ...data,
      sowingDate: crop.sowingDate,
      harvestDate: crop.harvestDate,
    });
    // Reflect the demo health score/risk in the crop and its history.
    await store.updateCropHealth(created.id, crop.healthScore, crop.riskLevel);
    added += 1;
  }
  console.log(`[prahari] Demo crops: ${added > 0 ? `added ${added}` : 'all present'} (${DEMO_CROPS.length} total).`);

  // ---- Demo alerts + notifications (skip ones the user has already seen) ----
  const existingAlerts = await store.listAlerts(demoUserId);
  const alertTitles = new Set(existingAlerts.map((a) => a.title));
  let alertsAdded = 0;
  for (const alert of DEMO_ALERTS) {
    if (alertTitles.has(alert.title)) continue;
    const { id: _id, userId: _u, isRead: _r, createdAt: _c, updatedAt: _up, ...data } = alert;
    void _id; void _u; void _r; void _c; void _up;
    await store.createAlert({ ...data, userId: demoUserId, cropId: null });
    alertsAdded += 1;
  }
  if (alertsAdded > 0) console.log(`[prahari] Added ${alertsAdded} demo alerts.`);

  const existingNotifications = await store.listNotifications(demoUserId);
  const notificationTitles = new Set(existingNotifications.map((n) => n.title));
  let notificationsAdded = 0;
  for (const n of DEMO_NOTIFICATIONS) {
    if (notificationTitles.has(n.title)) continue;
    await store.createNotification(demoUserId, n.type, n.title, n.body, n.link ?? undefined);
    notificationsAdded += 1;
  }
  if (notificationsAdded > 0) console.log(`[prahari] Added ${notificationsAdded} demo notifications.`);

  // Reminder for the login-page hint.
  if (!config.showDemoHint) {
    console.log('[prahari] Tip: set SHOW_DEMO_HINT=true to show the demo credentials on the login page.');
  }

  void DEMO_USER_ID; // demo dataset ids differ from real DB ids by design
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[prahari] seed failed:', err);
    process.exit(1);
  });
