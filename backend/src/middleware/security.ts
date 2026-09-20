import type { Request } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config';
import { badRequest } from '../utils/errors';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

export function ensureUploadDir(): void {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, config.uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME[file.mimetype] ?? 'jpg';
      const safe = crypto.randomBytes(16).toString('hex');
      cb(null, `${Date.now()}-${safe}.${ext}`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    const extOk = ALLOWED_EXT.has(path.extname(file.originalname).toLowerCase().replace('.', ''));
    const mimeOk = file.mimetype in ALLOWED_MIME;
    if (!extOk || !mimeOk) {
      cb(badRequest('Only JPG, PNG or WEBP images up to 10 MB are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function uploadMiddleware(req: Request, res: unknown, next: (err?: unknown) => void): void {
  upload.single('image')(req, res as never, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const message =
      err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is larger than 10 MB. Please upload a smaller photo.'
        : err instanceof Error
          ? err.message
          : 'Image upload failed';
    next(badRequest(message));
  });
}
