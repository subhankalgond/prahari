import type { Request, Response } from 'express';
import type { DataStore } from '../repositories/DataStore';
import { badRequest, forbidden, notFound } from '../utils/errors';
import { getAiProvider } from '../services/aiProvider';
import type { AiPrediction } from '../services/aiProvider';
import { generateAlertsForUser } from '../services/alertService';
import { getWeatherProvider } from '../services/weatherService';

function fileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export function makeScanController(store: DataStore) {
  return {
    async create(req: Request, res: Response): Promise<void> {
      const { cropId } = req.body as { cropId: string };
      const growthStage = (req.body.growthStage as string | undefined) ?? null;
      const symptoms = (req.body.symptoms as string | undefined) ?? null;
      const file = req.file;

      const crop = await store.findCrop(cropId);
      if (!crop) throw notFound('Crop not found');
      if (crop.userId !== req.user!.id) throw forbidden();

      const scan = await store.createScan(req.user!.id, cropId, file ? fileUrl(file.filename) : null);

      let prediction: AiPrediction;
      try {
        const provider = getAiProvider();
        prediction = await provider.analyze({ cropName: crop.name, growthStage: growthStage ?? crop.growthStage, symptoms, imageUrl: scan.imageUrl });
      } catch (err) {
        await store.attachScanFailure(scan.id);
        throw badRequest('AI analysis is currently unavailable. Please try again later.');
      }

      const result = await store.attachScanResult(scan.id, {
        crop: crop.name,
        condition: prediction.condition,
        isHealthy: prediction.isHealthy,
        confidence: prediction.confidence,
        severity: prediction.severity,
        status: prediction.isHealthy ? 'HEALTHY' : prediction.confidence < 60 ? 'LOW_CONFIDENCE' : 'NEEDS_ATTENTION',
        symptoms: prediction.symptoms,
        causes: prediction.causes,
        actions: prediction.actions,
        prevention: prediction.prevention,
        expertHelp: 'If symptoms continue or the result is uncertain, consult a qualified agricultural expert or your local Krishi Vigyan Kendra.',
        provider: prediction.provider,
        isDemo: prediction.isDemo,
      });

      await store.addHealthPoint(crop.id, prediction.isHealthy ? Math.min(96, crop.healthScore + 3) : Math.max(30, crop.healthScore - 12), prediction.isHealthy ? 'LOW' : prediction.severity === 'HIGH' ? 'HIGH' : 'MEDIUM');

      // Regenerate weather-driven alerts for this farmer and crop.
      try {
        const weather = await getWeatherProvider().getWeather(crop.location ?? '');
        const pastDiseases = (await store.listScansByUser(req.user!.id))
          .map((s) => (s.result && !s.result.isHealthy ? s.result.condition : null))
          .filter((c): c is string => Boolean(c))
          .slice(0, 5);
        await generateAlertsForUser(
          store,
          req.user!.id,
          { cropName: crop.name, growthStage: growthStage ?? crop.growthStage, weather, location: crop.location, recentDiseaseNames: pastDiseases, cropId: crop.id },
          weather,
        );
      } catch {
        // Alert generation must never fail the scan response.
      }

      res.status(201).json({ scanId: scan.id, result });
    },

    async list(req: Request, res: Response): Promise<void> {
      const scans = await store.listScansByUser(req.user!.id);
      res.json({ scans });
    },

    async get(req: Request, res: Response): Promise<void> {
      const scan = await store.findScan(req.params.id);
      if (!scan) throw notFound('Scan not found');
      if (scan.userId !== req.user!.id && req.user!.role !== 'ADMIN') throw forbidden();
      res.json({ scan });
    },

    async report(req: Request, res: Response): Promise<void> {
      const scan = await store.findScan(req.params.id);
      if (!scan) throw notFound('Scan not found');
      if (scan.userId !== req.user!.id) throw forbidden();
      const { reason } = req.body as { reason: string };
      await store.createNotification(
        req.user!.id,
        'SYSTEM',
        'Report received',
        'Thank you. Your report will be reviewed by the team. For urgent advice contact your local agriculture officer.',
        '/history',
      );
      void reason;
      res.json({ message: 'Report submitted. Thank you for helping improve accuracy.' });
    },
  };
}
