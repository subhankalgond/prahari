import type { Request, Response } from 'express';
import type { DataStore } from '../repositories/DataStore';
import { notFound, forbidden } from '../utils/errors';
import type { CropInput } from '../types';

function parseMaybeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

export function makeCropController(store: DataStore) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const crops = await store.listCrops(req.user!.id);
      res.json({ crops });
    },

    async create(req: Request, res: Response): Promise<void> {
      const input = req.body as CropInput;
      const crop = await store.createCrop(req.user!.id, input);
      res.status(201).json({ crop });
    },

    async get(req: Request, res: Response): Promise<void> {
      const crop = await store.findCrop(req.params.id);
      if (!crop || !crop.userId) {
        throw notFound('Crop not found');
      }
      if (crop.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw forbidden();
      }
      const [history, scans, alerts] = await Promise.all([
        store.listHealthHistory(crop.id),
        store.listScansByUser(req.user!.id),
        store.listAlerts(req.user!.id),
      ]);
      res.json({
        crop,
        healthHistory: history,
        recentScans: scans.filter((s) => s.cropId === crop.id).slice(0, 5),
        recentAlerts: alerts.filter((a) => a.cropId === crop.id || a.cropName === crop.name).slice(0, 5),
      });
    },

    async update(req: Request, res: Response): Promise<void> {
      const crop = await store.findCrop(req.params.id);
      if (!crop) throw notFound('Crop not found');
      if (crop.userId !== req.user!.id) throw forbidden();
      const input = req.body as Partial<CropInput>;
      const updated = await store.updateCrop(crop.id, input);
      res.json({ crop: updated });
    },

    async remove(req: Request, res: Response): Promise<void> {
      const crop = await store.findCrop(req.params.id);
      if (!crop) throw notFound('Crop not found');
      if (crop.userId !== req.user!.id) throw forbidden();
      await store.deleteCrop(crop.id);
      res.json({ message: 'Crop deleted' });
    },

    async healthHistory(req: Request, res: Response): Promise<void> {
      const crop = await store.findCrop(req.params.id);
      if (!crop) throw notFound('Crop not found');
      if (crop.userId !== req.user!.id && req.user!.role !== 'ADMIN') throw forbidden();
      const history = await store.listHealthHistory(crop.id);
      res.json({ history });
    },
  };
}

export function makeProfileController(store: DataStore) {
  return {
    async get(req: Request, res: Response): Promise<void> {
      const user = await store.findUserById(req.user!.id);
      if (!user) throw notFound('User not found');
      res.json({ user: { ...user, passwordHash: undefined } });
    },

    async update(req: Request, res: Response): Promise<void> {
      const { name, email, state, district, taluk, village, language } = req.body as Record<string, string>;
      const user = await store.updateProfile(req.user!.id, {
        name,
        email: email || null,
        state,
        district,
        taluk: taluk || null,
        village: village || null,
        language,
      });
      res.json({ user: { ...user, passwordHash: undefined } });
    },

    async crops(req: Request, res: Response): Promise<void> {
      const crops = await store.listCrops(req.user!.id);
      res.json({ crops: parseMaybeArray(crops) });
    },
  };
}

export function makeNotificationController(store: DataStore) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const notifications = await store.listNotifications(req.user!.id);
      const unread = notifications.filter((n) => !n.isRead).length;
      res.json({ notifications, unread });
    },

    async markRead(req: Request, res: Response): Promise<void> {
      const n = await store.markNotificationRead(req.params.id, req.user!.id);
      res.json({ notification: n });
    },

    async markAllRead(req: Request, res: Response): Promise<void> {
      await store.markAllNotificationsRead(req.user!.id);
      res.json({ message: 'All notifications marked as read' });
    },
  };
}
