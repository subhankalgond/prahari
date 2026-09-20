import bcrypt from 'bcryptjs';
import { config } from '../config';
import { DEMO_LIBRARY } from '../demo/demoData';
import type { LibraryEntry } from '../types';

// Seeds the production PostgreSQL database with:
// - the crop disease and pest knowledge base entries
// - one admin account (credentials from ADMIN_EMAIL / ADMIN_PASSWORD env vars)
// Run with: npm run seed

async function main(): Promise<void> {
  if (config.demoMode) {
    console.log('[prahari] DEMO_MODE=true: the app already loads built-in demo data.');
    console.log('Set DEMO_MODE=false and configure DATABASE_URL to seed a real database.');
    return;
  }

  const { PrismaStore } = await import('../repositories/prismaStore');
  const store = new PrismaStore();

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
    console.log('[prahari] Admin account already exists.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[prahari] seed failed:', err);
    process.exit(1);
  });
