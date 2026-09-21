import express, { type Express } from 'express';
import { config } from './config';
import { registerRoutes } from './routes';
import { corsMiddleware, securityHeaders, errorHandler, notFoundHandler } from './middleware/common';
import { ensureUploadDir } from './middleware/security';
import type { DataStore } from './repositories/DataStore';

export function createApp(store: DataStore): Express {
  const app = express();
  ensureUploadDir();

  app.set('trust proxy', 1);
  app.use(securityHeaders());
  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'prahari-api',
      demoMode: config.demoMode,
      showDemoHint: config.showDemoHint,
      time: new Date().toISOString(),
    });
  });

  // Uploaded crop images. Filenames are random hex generated server-side.
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '7d', immutable: true }));

  registerRoutes(app, store);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
