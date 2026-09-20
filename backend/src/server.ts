import { createApp } from './app';
import { config } from './config';
import { MemoryStore } from './repositories/memoryStore';
import { startKeepAlive } from './utils/keepAlive';

async function main(): Promise<void> {
  let store;
  if (config.demoMode) {
    console.log('[prahari] DEMO MODE: using in-memory demo data. No database required.');
    store = new MemoryStore(true);
  } else {
    const { PrismaStore } = await import('./repositories/prismaStore');
    store = new PrismaStore();
    console.log('[prahari] Production mode: using PostgreSQL via Prisma.');
  }

  const app = createApp(store);
  app.listen(config.port, () => {
    console.log(`[prahari] API listening on http://localhost:${config.port}`);
    startKeepAlive();
  });
}

main().catch((err) => {
  console.error('[prahari] failed to start:', err);
  process.exit(1);
});
