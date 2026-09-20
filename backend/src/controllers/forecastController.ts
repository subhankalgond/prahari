import type { Request, Response } from 'express';
import { getWeatherProvider, DemoWeatherProvider } from '../services/weatherService';
import { runForecastEngine } from '../services/forecastEngine';

// GET /api/forecast?location=Bengaluru,IN
// Runs the three validated models on hourly weather and returns spray windows.
export function makeForecastController() {
  return {
    async get(req: Request, res: Response): Promise<void> {
      const location = (req.query.location as string) ?? '';
      try {
        const provider = getWeatherProvider();
        const getHourly = provider.getHourly?.bind(provider);
        if (!getHourly) throw new Error('Provider has no hourly data');
        const hours = await getHourly(location, 120);
        const engine = runForecastEngine(hours);
        res.json({ location, provider: provider.name, isDemo: provider.isDemo, ...engine });
      } catch (liveError) {
        try {
          const demo = new DemoWeatherProvider();
          const hours = await demo.getHourly(location, 120);
          const engine = runForecastEngine(hours);
          res.json({
            location,
            provider: demo.name,
            isDemo: true,
            fallbackReason: 'Live weather unavailable; computed on labelled demo data.',
            ...engine,
          });
        } catch {
          res.status(503).json({ message: 'Forecast service is temporarily unavailable.' });
        }
      }
    },
  };
}
