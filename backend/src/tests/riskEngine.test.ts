import { describe, it, expect } from 'vitest';
import { assessRisk } from '../services/riskEngine';
import type { WeatherBundle } from '../types';

function weather(overrides: Partial<WeatherBundle['current']> = {}, rain3 = 0): WeatherBundle {
  return {
    current: {
      locationLabel: 'Test',
      temperature: 27,
      feelsLike: 29,
      humidity: 60,
      rainfallMm: 0,
      windSpeed: 8,
      condition: 'Sunny',
      isDemo: true,
      ...overrides,
    },
    forecast: Array.from({ length: 7 }, () => ({
      date: '2026-09-20',
      minTemp: 22,
      maxTemp: 31,
      humidity: 60,
      rainfallMm: rain3 / 3,
      condition: 'Sunny',
    })),
  };
}

describe('risk engine', () => {
  it('returns LOW for cool dry conditions on a young crop', () => {
    const r = assessRisk({ cropName: 'Wheat', growthStage: 'SEEDLING', weather: weather({ humidity: 40, temperature: 18 }) });
    expect(r.level).toBe('LOW');
    expect(r.score).toBeLessThan(35);
  });

  it('returns HIGH with reasons for humid rainy weather on fruiting tomato', () => {
    const r = assessRisk({ cropName: 'Tomato', growthStage: 'FRUITING', weather: weather({ humidity: 85, temperature: 27 }, 24) });
    expect(r.level).toBe('HIGH');
    expect(r.reasons.length).toBeGreaterThanOrEqual(3);
    expect(r.factors.some((f) => f.factor === 'humidity')).toBe(true);
    expect(r.factors.some((f) => f.factor === 'rain')).toBe(true);
  });

  it('counts recent disease history as a factor', () => {
    const r = assessRisk({
      cropName: 'Rice',
      growthStage: 'FLOWERING',
      weather: weather({ humidity: 75 }, 10),
      recentDiseaseNames: ['Blast'],
    });
    expect(r.factors.some((f) => f.factor === 'history')).toBe(true);
  });

  it('never returns a score above 95 and always includes the caveat note', () => {
    const r = assessRisk({
      cropName: 'Tomato',
      growthStage: 'FRUITING',
      weather: weather({ humidity: 95, temperature: 25 }, 60),
      recentDiseaseNames: ['Early Blight', 'Late Blight'],
    });
    expect(r.score).toBeLessThanOrEqual(95);
    expect(r.note).toMatch(/not a guaranteed prediction/i);
  });
});
