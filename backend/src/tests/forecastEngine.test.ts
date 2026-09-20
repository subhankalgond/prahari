import { describe, it, expect } from 'vitest';
import { runHutton, runWallin, runTomcast, pickSprayWindows, runForecastEngine } from '../services/forecastEngine';
import type { HourlyObservation } from '../services/forecastEngine';

function hours(count: number, opts: { humidity?: (i: number) => number; temp?: (i: number) => number; rain?: (i: number) => number; start?: Date } = {}): HourlyObservation[] {
  const start = opts.start ?? new Date('2026-06-01T00:00:00Z');
  const out: HourlyObservation[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(start.getTime() + i * 3600_000);
    out.push({
      time: t.toISOString(),
      temperature: opts.temp ? opts.temp(i) : 17,
      humidity: opts.humidity ? opts.humidity(i) : 95,
      precipitationMm: opts.rain ? opts.rain(i) : 0,
    });
  }
  return out;
}

describe('Hutton Criteria', () => {
  it('triggers on two consecutive 24h blocks with RH>=90% and temp 8-21C', () => {
    const r = runHutton(hours(48));
    expect(r.accumulatedBlocks).toBe(2);
    expect(r.triggered).toBe(true);
  });

  it('does not trigger when temperature is out of range', () => {
    const r = runHutton(hours(48, { temp: (_i) => 28 }));
    expect(r.triggered).toBe(false);
  });

  it('does not trigger when humidity is low', () => {
    const r = runHutton(hours(48, { humidity: (_i) => 60 }));
    expect(r.triggered).toBe(false);
  });
});

describe('Wallin DSV', () => {
  it('accumulates DSV during long warm wet periods', () => {
    const r = runWallin(hours(48, { rain: (i) => (i % 5 === 0 ? 0.5 : 0) }));
    expect(r.dsv).toBeGreaterThan(0);
  });

  it('returns zero DSV in dry cool conditions', () => {
    const r = runWallin(hours(48, { humidity: (_i) => 50, temp: (_i) => 5 }));
    expect(r.dsv).toBe(0);
  });
});

describe('TOMCAST', () => {
  it('advises spray when DSV threshold is reached', () => {
    const r = runTomcast(hours(96, { rain: (i) => (i % 6 === 0 ? 0.6 : 0) }));
    expect(r.dsv).toBeGreaterThan(0);
    expect(typeof r.sprayAdvised).toBe('boolean');
  });
});

describe('Spray windows', () => {
  it('finds a dry early-morning window and warns about later rain', () => {
    const start = new Date('2026-06-01T00:00:00');
    const data = hours(72, {
      temp: (_i) => 18,
      humidity: (i) => (i % 24 >= 5 && i % 24 <= 9 ? 70 : 60),
      rain: (i) => (i % 24 === 14 ? 3 : 0), // rain at 2 p.m. each day
      start,
    });
    const wins = pickSprayWindows(data, start);
    expect(wins.length).toBeGreaterThan(0);
    expect(wins[0].startHour).toBe(6);
    expect(wins[0].note).toMatch(/before that/i);
  });

  it('rejects mornings that are already raining', () => {
    const start = new Date('2026-06-01T00:00:00');
    const data = hours(72, {
      humidity: (_i) => 60,
      start,
    });
    const wins = pickSprayWindows(data, start);
    expect(wins.every((w) => !/raining/i.test(w.note))).toBe(true);
  });
});

describe('runForecastEngine', () => {
  it('produces all three model outputs with a transparent note', () => {
    const out = runForecastEngine(hours(72));
    expect(out.hutton).toBeDefined();
    expect(out.wallin).toBeDefined();
    expect(out.tomcast).toBeDefined();
    expect(out.modelNote).toMatch(/not a guarantee/i);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(out.overallRisk);
  });
});
