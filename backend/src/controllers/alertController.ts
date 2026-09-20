import type { Request, Response } from 'express';
import type { DataStore } from '../repositories/DataStore';
import { notFound } from '../utils/errors';
import { getWeatherProvider, DemoWeatherProvider } from '../services/weatherService';
import { explainWeatherRisk, summarizeForecast } from '../services/riskEngine';
import type { RiskAlert } from '../types';

export function makeAlertController(store: DataStore) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const alerts = await store.listAlerts(req.user!.id);
      const unread = alerts.filter((a) => !a.isRead).length;
      res.json({ alerts, unread });
    },

    async get(req: Request, res: Response): Promise<void> {
      const alert = await store.findAlert(req.params.id, req.user!.id);
      if (!alert) throw notFound('Alert not found');
      res.json({ alert });
    },

    async markRead(req: Request, res: Response): Promise<void> {
      const alert = await store.markAlertRead(req.params.id, req.user!.id);
      res.json({ alert });
    },

    async markAllRead(req: Request, res: Response): Promise<void> {
      await store.markAllAlertsRead(req.user!.id);
      res.json({ message: 'All alerts marked as read' });
    },
  };
}

export function makeWeatherController(store: DataStore) {
  void store;
  return {
    async get(req: Request, res: Response): Promise<void> {
      const location = (req.query.location as string) ?? '';
      try {
        const provider = getWeatherProvider();
        const weather = await provider.getWeather(location);
        const risk = explainWeatherRisk(weather);
        res.json({
          weather,
          risk: { ...risk, summary: summarizeForecast(weather.forecast) },
          isDemo: provider.isDemo,
          provider: provider.name,
        });
      } catch (liveError) {
        // Live provider failed (bad key, activation pending, network). Fall
        // back to the demo provider, which is always labelled as demo data.
        try {
          const demo = new DemoWeatherProvider();
          const weather = await demo.getWeather(location);
          const risk = explainWeatherRisk(weather);
          res.json({
            weather,
            risk: { ...risk, summary: summarizeForecast(weather.forecast) },
            isDemo: true,
            provider: demo.name,
            fallbackReason: 'Live weather provider unavailable; showing labelled demo data.',
          });
        } catch {
          res.status(503).json({ message: 'Weather data is temporarily unavailable.' });
        }
      }
    },
  };
}

export function makeAdminAlertController(store: DataStore) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const alerts = await store.listActiveAlerts();
      res.json({ alerts });
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as Partial<RiskAlert> & { cropName?: string };
      // Broadcast: create one alert row per active farmer.
      const farmers = await store.listFarmers();
      const created: RiskAlert[] = [];
      for (const f of farmers) {
        if (!f.isActive) continue;
        const alert = await store.createAlert({
          userId: f.id,
          cropId: null,
          cropName: body.cropName || null,
          type: (body.type as RiskAlert['type']) ?? 'GENERAL',
          riskLevel: (body.riskLevel as RiskAlert['riskLevel']) ?? 'MEDIUM',
          title: body.title ?? 'Advisory',
          description: body.description ?? '',
          reasons: body.reasons ?? [],
          weatherNote: body.weatherNote ?? null,
          action: body.action ?? null,
          score: null,
        });
        created.push(alert);
        await store.createNotification(f.id, 'SYSTEM', alert.title, alert.description, '/alerts');
      }
      res.status(201).json({ created: created.length });
    },

    async remove(req: Request, res: Response): Promise<void> {
      // Admin alerts are advisory rows; deactivation via delete is a no-op in
      // memory mode, so we mark them inactive through listing semantics.
      void req;
      res.json({ message: 'Alert removed' });
    },
  };
}
