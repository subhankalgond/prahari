import { config } from '../config';
import type { WeatherBundle } from '../types';
import type { HourlyObservation } from './forecastEngine';

export interface WeatherProvider {
  name: string;
  isDemo: boolean;
  getWeather(location: string): Promise<WeatherBundle>;
  getHourly?(location: string, hours?: number): Promise<HourlyObservation[]>;
}

// Deterministic demo provider. Values follow a fixed daily pattern so the UI
// is stable. Always flagged isDemo so the frontend can show a demo badge.

const CONDITIONS = ['Partly cloudy', 'Light rain showers', 'Mostly sunny', 'Cloudy', 'Thunderstorms in area', 'Sunny'];

export class DemoWeatherProvider implements WeatherProvider {
  name = 'demo';
  isDemo = true;

  async getHourly(location: string, hours = 72): Promise<HourlyObservation[]> {
    void location;
    const out: HourlyObservation[] = [];
    const now = new Date();
    const start = new Date(now.getTime() - 48 * 3600_000);
    for (let i = 0; i < hours; i++) {
      const t = new Date(start.getTime() + i * 3600_000);
      const hr = t.getHours();
      const wet = (t.getDate() + i) % 7 < 2 || (hr >= 2 && hr <= 7 && (t.getDate() + i) % 3 === 0);
      out.push({
        time: t.toISOString(),
        temperature: 18 + 5 * Math.sin(((hr - 6) / 24) * 2 * Math.PI),
        humidity: wet ? 93 : 65 + ((i * 7) % 20),
        precipitationMm: wet && (i % 9 === 0) ? 1.8 : 0,
      });
    }
    return out;
  }

  async getWeather(location: string): Promise<WeatherBundle> {
    const now = new Date();
    const day = Math.floor(now.getTime() / 86400_000);
    const hour = now.getHours();
    // Simple diurnal curve peaking mid-afternoon.
    const temp = 24 + 6 * Math.sin(((hour - 6) / 24) * 2 * Math.PI) + (day % 3);
    const forecast: WeatherBundle['forecast'] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now.getTime() + i * 86400_000);
      const wetDay = (day + i) % 3 === 0;
      forecast.push({
        date: d.toISOString().slice(0, 10),
        minTemp: Math.round(temp - 5 + ((day + i) % 3)),
        maxTemp: Math.round(temp + 4 - ((day + i) % 2)),
        humidity: wetDay ? 84 : 62 + ((day + i) % 4) * 4,
        rainfallMm: wetDay ? 12 + ((day + i) % 3) * 6 : 0,
        condition: CONDITIONS[(day + i) % CONDITIONS.length],
      });
    }
    const humidity = 82;
    return {
      current: {
        locationLabel: location || 'Your area',
        temperature: Math.round(temp),
        feelsLike: Math.round(temp + 1.5),
        humidity,
        rainfallMm: (day % 3 === 0 ? 18 : 0) + (hour < 12 ? 4 : 0),
        windSpeed: 8 + (day % 4) * 2,
        condition: CONDITIONS[day % CONDITIONS.length],
        isDemo: true,
      },
      forecast,
    };
  }
}

// OpenWeather provider. Activated with WEATHER_PROVIDER=openweather and a key.

interface OwCurrent {
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  rain?: { '1h'?: number };
  weather: { main: string; description: string }[];
  name: string;
}

interface OwForecast {
  list: {
    dt: number;
    main: { temp_min: number; temp_max: number; humidity: number };
    rain?: { '3h'?: number };
    weather: { main: string; description: string }[];
  }[];
}

export class OpenWeatherProvider implements WeatherProvider {
  name = 'openweather';
  isDemo = false;

  async getWeather(location: string): Promise<WeatherBundle> {
    const base = 'https://api.openweathermap.org/data/2.5';
    const qs = `appid=${encodeURIComponent(config.weatherApiKey)}&units=metric&q=${encodeURIComponent(location || 'Bengaluru,IN')}`;
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${base}/weather?${qs}`, { signal: AbortSignal.timeout(10_000) }),
      fetch(`${base}/forecast?${qs}`, { signal: AbortSignal.timeout(10_000) }),
    ]);
    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error('Weather provider request failed');
    }
    const current = (await currentRes.json()) as OwCurrent;
    const forecastRaw = (await forecastRes.json()) as OwForecast;

    // Collapse 3-hourly rows into daily entries.
    const byDay = new Map<string, { min: number; max: number; humidity: number; rain: number; condition: string }>();
    for (const row of forecastRaw.list) {
      const date = new Date(row.dt * 1000).toISOString().slice(0, 10);
      const agg = byDay.get(date) ?? {
        min: Infinity,
        max: -Infinity,
        humidity: row.main.humidity,
        rain: 0,
        condition: row.weather[0]?.main ?? 'Clear',
      };
      agg.min = Math.min(agg.min, row.main.temp_min);
      agg.max = Math.max(agg.max, row.main.temp_max);
      agg.humidity = Math.max(agg.humidity, row.main.humidity);
      agg.rain += row.rain?.['3h'] ?? 0;
      byDay.set(date, agg);
    }
    const forecast = [...byDay.entries()].slice(0, 7).map(([date, agg]) => ({
      date,
      minTemp: Math.round(agg.min),
      maxTemp: Math.round(agg.max),
      humidity: Math.round(agg.humidity),
      rainfallMm: Math.round(agg.rain * 10) / 10,
      condition: agg.condition,
    }));

    return {
      current: {
        locationLabel: current.name || location || 'Your area',
        temperature: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        rainfallMm: current.rain?.['1h'] ?? 0,
        windSpeed: Math.round(current.wind.speed * 3.6),
        condition: current.weather[0]?.main ?? 'Clear',
        isDemo: false,
      },
      forecast,
    };
  }
}

export function getWeatherProvider(): WeatherProvider {
  if (config.weatherProvider === 'openweather' && config.weatherApiKey) {
    return new OpenWeatherProvider();
  }
  if (config.weatherProvider === 'openmeteo') {
    return new OpenMeteoProvider();
  }
  return new DemoWeatherProvider();
}

// --- Open-Meteo (keyless hourly data for the forecast engine) ---------------

interface OmResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
  };
}

// Coordinates for a few states; a real deployment would geocode the village.
const LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
  karnataka: { lat: 12.97, lon: 77.59 },
  maharashtra: { lat: 18.52, lon: 73.86 },
  'himachal pradesh': { lat: 31.1, lon: 77.17 },
  'uttarakhand': { lat: 30.07, lon: 78.26 },
  'west bengal': { lat: 22.57, lon: 88.36 },
};

export class OpenMeteoProvider implements WeatherProvider {
  name = 'openmeteo';
  isDemo = false;

  private coordsFor(location: string): { lat: number; lon: number } {
    const key = (location || '').toLowerCase();
    for (const [name, c] of Object.entries(LOCATION_COORDS)) {
      if (key.includes(name)) return c;
    }
    return { lat: 12.97, lon: 77.59 }; // default: Bengaluru plateau
  }

  async getHourly(location: string, hours = 72): Promise<HourlyObservation[]> {
    const { lat, lon } = this.coordsFor(location);
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation&past_hours=48&forecast_hours=${hours - 48}` +
      `&timeformat=iso8601&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const data = (await res.json()) as OmResponse;
    const h = data.hourly;
    return h.time.map((time, i) => ({
      time,
      temperature: h.temperature_2m[i],
      humidity: h.relative_humidity_2m[i],
      precipitationMm: h.precipitation[i] ?? 0,
    }));
  }

  // Open-Meteo also serves daily aggregates; reuse them for the weather page.
  async getWeather(location: string): Promise<WeatherBundle> {
    const { lat, lon } = this.coordsFor(location);
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,precipitation_sum,weather_code` +
      `&forecast_days=7&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const data = (await res.json()) as {
      current: { temperature_2m: number; relative_humidity_2m: number; precipitation: number; weather_code: number; wind_speed_10m: number };
      daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; relative_humidity_2m_max: number[]; precipitation_sum: number[]; weather_code: number[] };
    };
    const code = data.current.weather_code;
    const forecast = data.daily.time.map((date, i) => ({
      date,
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      humidity: Math.round(data.daily.relative_humidity_2m_max[i]),
      rainfallMm: data.daily.precipitation_sum[i] ?? 0,
      condition: describeWmoCode(data.daily.weather_code[i]),
    }));
    return {
      current: {
        locationLabel: location || 'Your area',
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.temperature_2m),
        humidity: Math.round(data.current.relative_humidity_2m),
        rainfallMm: data.current.precipitation ?? 0,
        windSpeed: Math.round(data.current.wind_speed_10m * 3.6),
        condition: describeWmoCode(code),
        isDemo: false,
      },
      forecast,
    };
  }
}

function describeWmoCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 67) return 'Drizzle';
  if (code >= 71 && code <= 86) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Rain';
}
