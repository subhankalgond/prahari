import type { Request, Response } from 'express';
import type { DataStore } from '../repositories/DataStore';
import { notFound } from '../utils/errors';
import type { LibraryEntry } from '../types';

export function makeLibraryController(store: DataStore) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { crop, kind } = req.query as { crop?: string; kind?: string };
      const entries = await store.listLibrary({
        cropName: crop || undefined,
        kind: kind === 'DISEASE' || kind === 'PEST' ? kind : undefined,
      });
      res.json({ entries });
    },

    async get(req: Request, res: Response): Promise<void> {
      const entry = await store.findLibraryEntry(req.params.id);
      if (!entry) throw notFound('Library entry not found');
      res.json({ entry });
    },
  };
}

export function makeAdminLibraryController(store: DataStore) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { crop, kind } = req.query as { crop?: string; kind?: string };
      const entries = await store.listLibrary({
        cropName: crop || undefined,
        kind: kind === 'DISEASE' || kind === 'PEST' ? kind : undefined,
        includeInactive: true,
      });
      res.json({ entries });
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>;
      const entry = await store.createLibraryEntry({
        name: body.name,
        cropName: body.cropName,
        kind: body.kind,
        description: body.description,
        symptoms: body.symptoms,
        causes: body.causes,
        favorable: body.favorable ?? [],
        prevention: body.prevention,
        management: body.management,
        severity: body.severity,
        isActive: body.isActive ?? true,
      });
      res.status(201).json({ entry });
    },

    async update(req: Request, res: Response): Promise<void> {
      const body = req.body as Partial<Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>>;
      const existing = await store.findLibraryEntry(req.params.id);
      if (!existing) throw notFound('Library entry not found');
      const entry = await store.updateLibraryEntry(req.params.id, body);
      res.json({ entry });
    },

    async remove(req: Request, res: Response): Promise<void> {
      const existing = await store.findLibraryEntry(req.params.id);
      if (!existing) throw notFound('Library entry not found');
      await store.deleteLibraryEntry(req.params.id);
      res.json({ message: 'Entry deleted' });
    },
  };
}
