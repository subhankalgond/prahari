import type { Request, Response } from 'express';
import type { DataStore } from '../repositories/DataStore';
import { notFound } from '../utils/errors';
import { getDashboardStats, getRecentActivity } from '../services/adminService';

export function makeAdminController(store: DataStore) {
  return {
    async dashboard(_req: Request, res: Response): Promise<void> {
      const [stats, activity] = await Promise.all([getDashboardStats(store), getRecentActivity(store)]);
      const crops = await store.listAllCrops();
      const scans = await store.listAllScans();

      const conditionCounts = new Map<string, number>();
      for (const s of scans) {
        if (s.result) {
          const key = s.result.condition;
          conditionCounts.set(key, (conditionCounts.get(key) ?? 0) + 1);
        }
      }
      const cropCounts = new Map<string, number>();
      for (const c of crops) {
        cropCounts.set(c.name, (cropCounts.get(c.name) ?? 0) + 1);
      }
      const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 } as Record<string, number>;
      for (const c of crops) riskCounts[c.riskLevel] = (riskCounts[c.riskLevel] ?? 0) + 1;

      // Scans per day over the last 14 days.
      const days: { date: string; scans: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        days.push({ date: d.toISOString().slice(0, 10), scans: 0 });
      }
      for (const s of scans) {
        const day = new Date(s.createdAt).toISOString().slice(0, 10);
        const bucket = days.find((x) => x.date === day);
        if (bucket) bucket.scans += 1;
      }

      res.json({
        stats,
        activity,
        charts: {
          scansOverTime: days,
          diseaseDistribution: [...conditionCounts.entries()].map(([name, count]) => ({ name, count })),
          cropDistribution: [...cropCounts.entries()].map(([name, count]) => ({ name, count })),
          riskDistribution: Object.entries(riskCounts).map(([name, count]) => ({ name, count })),
        },
      });
    },

    async farmers(req: Request, res: Response): Promise<void> {
      const search = ((req.query.search as string) ?? '').toLowerCase();
      const farmers = await store.listFarmers();
      const crops = await store.listAllCrops();
      const rows = farmers
        .filter((f) =>
          search
            ? f.name.toLowerCase().includes(search) ||
              f.mobile.includes(search) ||
              f.district.toLowerCase().includes(search)
            : true,
        )
        .map((f) => ({
          id: f.id,
          name: f.name,
          mobile: f.mobile,
          email: f.email,
          state: f.state,
          district: f.district,
          village: f.village,
          cropCount: crops.filter((c) => c.userId === f.id).length,
          lastActiveAt: f.lastActiveAt,
          isActive: f.isActive,
          createdAt: f.createdAt,
        }));
      res.json({ farmers: rows });
    },

    async setFarmerActive(req: Request, res: Response): Promise<void> {
      const { isActive } = req.body as { isActive: boolean };
      const farmer = await store.setFarmerActive(req.params.id, Boolean(isActive));
      res.json({ farmer: { ...farmer, passwordHash: undefined } });
    },

    async crops(_req: Request, res: Response): Promise<void> {
      const crops = await store.listAllCrops();
      const farmers = await store.listFarmers();
      res.json({
        crops: crops.map((c) => ({
          ...c,
          farmerName: farmers.find((f) => f.id === c.userId)?.name ?? 'Unknown',
        })),
      });
    },

    async scans(_req: Request, res: Response): Promise<void> {
      const scans = await store.listAllScans();
      res.json({ scans });
    },

    async farmer(req: Request, res: Response): Promise<void> {
      const farmer = await store.findUserById(req.params.id);
      if (!farmer || farmer.role !== 'FARMER') throw notFound('Farmer not found');
      const crops = await store.listCrops(farmer.id);
      const scans = await store.listScansByUser(farmer.id);
      res.json({
        farmer: { ...farmer, passwordHash: undefined },
        crops,
        scans: scans.slice(0, 20),
      });
    },
  };
}
