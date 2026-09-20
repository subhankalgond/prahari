import type { DataStore } from '../repositories/DataStore';
import { assessRisk } from './riskEngine';
import type { RiskEngineInput } from './riskEngine';
import type { RiskAlert, WeatherBundle } from '../types';

// Turns risk engine output into farmer-visible alerts and notifications.
// Deduplicates: one alert per crop+type within 24 hours.

export async function generateAlertsForUser(
  store: DataStore,
  userId: string,
  input: RiskEngineInput & { cropId?: string | null },
  weather: WeatherBundle,
): Promise<RiskAlert[]> {
  const assessment = assessRisk(input);
  if (assessment.level === 'LOW' && assessment.score < 20) {
    return [];
  }

  const existing = await store.listAlerts(userId);
  const dayAgo = Date.now() - 86400_000;
  const duplicate = existing.find(
    (a) =>
      a.cropName === input.cropName &&
      a.type === (assessment.level === 'HIGH' ? 'DISEASE_RISK' : 'PEST_RISK') &&
      new Date(a.createdAt).getTime() > dayAgo,
  );
  if (duplicate) {
    return [duplicate];
  }

  const isDisease = assessment.level === 'HIGH';
  const alert = await store.createAlert({
    userId,
    cropId: input.cropId ?? null,
    cropName: input.cropName,
    type: isDisease ? 'DISEASE_RISK' : 'PEST_RISK',
    riskLevel: assessment.level,
    title: isDisease
      ? `Fungal disease conditions detected for ${input.cropName}`
      : `Pest pressure rising for ${input.cropName}`,
    description: isDisease
      ? 'Weather and crop stage favour disease spread in your area. Inspect plants for early symptoms.'
      : 'Warm dry conditions favour sap-sucking pests. Check shoots and leaf undersides.',
    reasons: assessment.reasons.map((r) => r.replace(/^\+ /, '')),
    weatherNote: `Humidity ${weather.current.humidity}%, temperature ${weather.current.temperature} C, ${weather.current.condition.toLowerCase()}`,
    action: isDisease
      ? 'Inspect lower leaves and dense canopy areas; monitor the crop every 3 days.'
      : 'Check leaf undersides and shoots; use sticky traps to monitor populations.',
    score: assessment.score,
  });

  await store.createNotification(
    userId,
    isDisease ? 'DISEASE_RISK' : 'PEST_RISK',
    alert.title,
    alert.description,
    '/alerts',
  );

  return [alert];
}
