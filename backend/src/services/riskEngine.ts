import type { ForecastDay, RiskAssessment, RiskFactor, RiskLevel, WeatherBundle } from '../types';

// Rule-based risk engine. Transparent and modular: every contributing factor
// is reported with its points so the UI can explain WHY a risk level was
// produced. This is a heuristic screening aid, not a validated scientific
// model; a calibrated agronomic model can replace this module later.

export interface RiskEngineInput {
  cropName: string;
  growthStage: string;
  weather: WeatherBundle;
  location?: string | null;
  recentDiseaseNames?: string[];
}

interface StageProfile {
  humidityWeight: number;
  rainWeight: number;
  tempWeight: number;
  stageWeight: number;
}

const STAGE_PROFILES: Record<string, StageProfile> = {
  SEEDLING: { humidityWeight: 10, rainWeight: 9, tempWeight: 5, stageWeight: 3 },
  VEGETATIVE: { humidityWeight: 12, rainWeight: 11, tempWeight: 6, stageWeight: 4 },
  FLOWERING: { humidityWeight: 15, rainWeight: 13, tempWeight: 6, stageWeight: 6 },
  FRUITING: { humidityWeight: 15, rainWeight: 13, tempWeight: 6, stageWeight: 6 },
  MATURITY: { humidityWeight: 10, rainWeight: 9, tempWeight: 5, stageWeight: 3 },
};

const FUNGAL_CROPS = new Set(['tomato', 'rice', 'paddy', 'cotton', 'potato', 'chilli']);
const SAP_PEST_CROPS = new Set(['tomato', 'chilli', 'cotton', 'okra', 'brinjal']);

function levelFor(score: number): RiskLevel {
  if (score >= 45) return 'HIGH';
  if (score >= 22) return 'MEDIUM';
  return 'LOW';
}

export function assessRisk(input: RiskEngineInput): RiskAssessment {
  const factors: RiskFactor[] = [];
  const { current, forecast } = input.weather;
  const stage = input.growthStage.toUpperCase();
  const profile = STAGE_PROFILES[stage] ?? STAGE_PROFILES.VEGETATIVE;

  // Humidity: the single strongest fungal disease driver.
  if (current.humidity >= 80) {
    factors.push({
      factor: 'humidity',
      value: `${current.humidity}% humidity`,
      points: profile.humidityWeight,
      detail: 'High humidity favours fungal growth on leaves',
    });
  } else if (current.humidity >= 65) {
    factors.push({
      factor: 'humidity',
      value: `${current.humidity}% humidity`,
      points: Math.round(profile.humidityWeight * 0.55),
      detail: 'Moderately humid conditions',
    });
  }

  // Recent + forecast rainfall.
  const rain3day = forecast.slice(0, 3).reduce((sum, d) => sum + d.rainfallMm, 0);
  const rainTotal = current.rainfallMm + rain3day;
  if (rainTotal >= 15) {
    factors.push({
      factor: 'rain',
      value: `${Math.round(rainTotal)} mm rain expected in 3 days`,
      points: profile.rainWeight,
      detail: 'Rain wets leaves and helps spores spread',
    });
  } else if (rainTotal >= 5) {
    factors.push({
      factor: 'rain',
      value: `${Math.round(rainTotal)} mm rain expected in 3 days`,
      points: Math.round(profile.rainWeight * 0.55),
      detail: 'Some rainfall expected',
    });
  }

  // Temperature band for fungal activity.
  const t = current.temperature;
  if (t >= 20 && t <= 30) {
    factors.push({
      factor: 'temperature',
      value: `${t} C`,
      points: profile.tempWeight,
      detail: 'Temperature in the range where many fungal diseases are active',
    });
  } else if (t > 34) {
    factors.push({
      factor: 'temperature',
      value: `${t} C`,
      points: 3,
      detail: 'Heat stress can weaken crops and attract sap-sucking pests',
    });
  }

  // Growth stage vulnerability.
  if (stage === 'FLOWERING' || stage === 'FRUITING') {
    factors.push({
      factor: 'stage',
      value: `${stage.charAt(0)}${stage.slice(1).toLowerCase()} stage`,
      points: profile.stageWeight,
      detail: 'Reproductive stages are more vulnerable to infection and yield loss',
    });
  }

  // Crop-specific static susceptibility.
  const cropKey = input.cropName.toLowerCase();
  if (FUNGAL_CROPS.has(cropKey)) {
    factors.push({
      factor: 'crop',
      value: input.cropName,
      points: 5,
      detail: 'This crop is generally susceptible to fungal diseases in humid weather',
    });
  }
  if (SAP_PEST_CROPS.has(cropKey) && current.humidity < 60 && t >= 28) {
    factors.push({
      factor: 'pest',
      value: input.cropName,
      points: 5,
      detail: 'Warm dry weather favours thrips, whitefly and aphid buildup',
    });
  }

  // Forecast humidity spike.
  const humidDays = forecast.filter((d) => d.humidity >= 85).length;
  if (humidDays >= 3) {
    factors.push({
      factor: 'forecast',
      value: `${humidDays} very humid days ahead`,
      points: 5,
      detail: 'Sustained humidity keeps leaves wet for long periods',
    });
  }

  // Known disease history from previous scans.
  if (input.recentDiseaseNames && input.recentDiseaseNames.length > 0) {
    const unique = [...new Set(input.recentDiseaseNames)].slice(0, 2).join(', ');
    factors.push({
      factor: 'history',
      value: `Past scans found ${unique}`,
      points: 6,
      detail: 'Disease seen recently on this farm can recur under similar weather',
    });
  }

  const score = Math.min(95, factors.reduce((sum, f) => sum + f.points, 0));
  const level = levelFor(score);
  const reasons = factors
    .slice()
    .sort((a, b) => b.points - a.points)
    .map((f) => `+ ${f.value} (${f.points} pts): ${f.detail}`);

  const note =
    'This is a screening signal based on simple weather and crop rules. It is not a guaranteed prediction. Verify conditions in your field and consult a local agricultural expert before treatment decisions.';

  return { score, level, reasons, factors, note };
}

export function explainWeatherRisk(weather: WeatherBundle): RiskAssessment {
  return assessRisk({
    cropName: 'general',
    growthStage: 'VEGETATIVE',
    weather,
  });
}

export function summarizeForecast(forecast: ForecastDay[]): string {
  const rainDays = forecast.filter((d) => d.rainfallMm >= 5).length;
  if (rainDays >= 3) return 'Wet week: fungal disease pressure is likely to rise.';
  if (rainDays >= 1) return 'Some rain this week: keep an eye on leaf wetness.';
  return 'Mostly dry week: watch for heat and sap-sucking pests.';
}
