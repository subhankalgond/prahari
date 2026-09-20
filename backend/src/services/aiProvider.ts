import { config } from '../config';

// AI service abstraction. The API layer only ever talks to this interface.

export interface AiInput {
  cropName: string;
  growthStage?: string | null;
  symptoms?: string | null;
  imageUrl?: string | null;
}

export interface AiPrediction {
  crop: string;
  condition: string;
  isHealthy: boolean;
  confidence: number; // 0-100, never 100
  severity: 'LOW' | 'MODERATE' | 'HIGH' | null;
  symptoms: string[];
  causes: string[];
  actions: string[];
  prevention: string[];
  provider: string;
  isDemo: boolean;
}

export interface AiProvider {
  name: string;
  isDemo: boolean;
  analyze(input: AiInput): Promise<AiPrediction>;
}

// ---------------------------------------------------------------------------
// Demo provider: deterministic heuristic mapping, clearly labelled demo.
// ---------------------------------------------------------------------------

interface ConditionProfile {
  condition: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  confidence: number;
  symptoms: string[];
  causes: string[];
  actions: string[];
  prevention: string[];
}

const PROFILES: Record<string, ConditionProfile> = {
  tomato: {
    condition: 'Early Blight',
    severity: 'MODERATE',
    confidence: 84,
    symptoms: [
      'Brown spots with concentric rings, usually on older leaves first',
      'Yellowing around spots; leaves may dry and drop',
      'Dark sunken patches on stems near the soil line',
    ],
    causes: ['Fungus Alternaria solani', 'Warm temperatures between 20 and 30 C', 'Wet leaves from dew, rain or overhead irrigation'],
    actions: [
      'Remove and destroy affected leaves; do not compost them',
      'Improve airflow by pruning dense growth',
      'Water at the base in the morning, not on leaves',
      'Monitor the crop every 3 to 4 days for new spots',
    ],
    prevention: [
      'Use certified disease-free seed',
      'Rotate with non-solanaceous crops for 2 to 3 seasons',
      'Keep proper plant spacing for airflow',
      'Mulch to reduce soil splash onto leaves',
    ],
  },
  rice: {
    condition: 'Blast',
    severity: 'HIGH',
    confidence: 81,
    symptoms: [
      'Diamond-shaped spots with grey centres and brown margins on leaves',
      'Infected nodes turn blackish and may break',
      'Panicle neck turns brown and grains remain chaffy',
    ],
    causes: ['Fungus Magnaporthe oryzae', 'Extended leaf wetness and cloudy weather', 'Excess nitrogen fertilisation'],
    actions: [
      'Monitor the crop closely; the panicle stage is most vulnerable',
      'Drain excess standing water where practical',
      'Avoid extra nitrogen until the crop recovers',
      'Mark affected patches and track their spread daily',
    ],
    prevention: [
      'Use regionally recommended blast-tolerant varieties',
      'Treat seed before sowing where advised locally',
      'Split nitrogen applications instead of one heavy dose',
      'Keep proper spacing to reduce humidity inside the canopy',
    ],
  },
  chilli: {
    condition: 'Thrips damage',
    severity: 'MODERATE',
    confidence: 79,
    symptoms: [
      'Curled, crinkled leaves with silvery streaks',
      'Flower drop and poor fruit set',
      'Distorted growth at plant tops',
    ],
    causes: ['Thrips feeding on leaves and flowers', 'Hot dry weather favouring buildup', 'Weedy flowering hosts near the field'],
    actions: [
      'Install blue sticky traps to monitor and reduce adults',
      'Remove heavily infested shoots and destroy them',
      'Check plant tops and flowers weekly',
      'Conserve predatory mites and bugs by avoiding unnecessary sprays',
    ],
    prevention: [
      'Cover nurseries with fine insect-proof net',
      'Keep field borders free of weeds',
      'Irrigate regularly to reduce plant stress',
      'Rotate crops to break pest cycles',
    ],
  },
  cotton: {
    condition: 'Alternaria Leaf Spot',
    severity: 'MODERATE',
    confidence: 80,
    symptoms: [
      'Small dark brown spots with yellow halos',
      'Spots merging and causing early leaf drop',
      'Lesions on bracts near bolls in wet weather',
    ],
    causes: ['Fungus Alternaria macrospora', 'Humid wet weather', 'Nutrient stress, especially low potassium'],
    actions: [
      'Collect and destroy fallen infected leaves',
      'Ensure balanced nutrition, especially potassium',
      'Improve airflow by managing dense canopy',
      'Monitor spread after each rain spell',
    ],
    prevention: [
      'Maintain balanced fertilisation',
      'Avoid overhead irrigation',
      'Remove and compost crop debris after harvest',
      'Choose well-drained fields',
    ],
  },
};

const HEALTHY_PROFILE: ConditionProfile = {
  condition: 'Healthy',
  severity: 'LOW',
  confidence: 88,
  symptoms: ['No disease symptoms visible on the submitted photo'],
  causes: [],
  actions: [
    'Continue current field practices',
    'Scout the crop weekly for early changes',
    'Keep monitoring weather-based risk alerts',
  ],
  prevention: [
    'Maintain balanced nutrition and irrigation',
    'Remove weeds that host pests and diseases',
    'Keep records of any disease seen this season',
  ],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export class DemoAiProvider implements AiProvider {
  name = 'demo';
  isDemo = true;

  async analyze(input: AiInput): Promise<AiPrediction> {
    const cropKey = input.cropName.toLowerCase();
    const seed = hashString(`${cropKey}:${input.symptoms ?? ''}:${input.growthStage ?? ''}`);
    // A stable but varied picture: most scans look healthy, some show disease.
    const healthyDraw = seed % 10 < 4;

    const profile = healthyDraw ? HEALTHY_PROFILE : PROFILES[cropKey] ?? PROFILES.tomato;
    const jitter = (seed % 9) - 4; // -4..+4
    const confidence = Math.max(55, Math.min(96, profile.confidence + jitter));

    return {
      crop: input.cropName,
      condition: profile.condition,
      isHealthy: healthyDraw,
      confidence,
      severity: healthyDraw ? null : profile.severity,
      symptoms: profile.symptoms,
      causes: profile.causes,
      actions: profile.actions,
      prevention: profile.prevention,
      provider: this.name,
      isDemo: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Model provider: calls the FastAPI ai-service. Enabled with AI_PROVIDER=model.
// ---------------------------------------------------------------------------

interface ModelResponse {
  crop: string;
  condition: string;
  confidence: number; // 0-1 or 0-100
  severity?: string;
  is_healthy?: boolean;
  symptoms?: string[];
  causes?: string[];
  recommendations?: string[];
  prevention?: string[];
}

export class ModelAiProvider implements AiProvider {
  name = 'model';
  isDemo = false;

  async analyze(input: AiInput): Promise<AiPrediction> {
    const response = await fetch(`${config.aiServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop: input.cropName,
        growth_stage: input.growthStage ?? null,
        symptoms: input.symptoms ?? null,
        image_url: input.imageUrl ?? null,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }
    const data = (await response.json()) as ModelResponse;
    const confidenceRaw = typeof data.confidence === 'number' ? data.confidence : 0.5;
    const confidence = Math.round(confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw);
    const isHealthy = data.is_healthy ?? /healthy|normal/i.test(data.condition);
    return {
      crop: data.crop ?? input.cropName,
      condition: data.condition,
      isHealthy,
      confidence: Math.max(1, Math.min(99, confidence)),
      severity: isHealthy ? null : this.mapSeverity(data.severity),
      symptoms: data.symptoms ?? [],
      causes: data.causes ?? [],
      actions: data.recommendations ?? [],
      prevention: data.prevention ?? [],
      provider: this.name,
      isDemo: false,
    };
  }

  private mapSeverity(value: string | undefined): 'LOW' | 'MODERATE' | 'HIGH' {
    const v = (value ?? '').toLowerCase();
    if (v.includes('high') || v.includes('severe')) return 'HIGH';
    if (v.includes('low') || v.includes('mild')) return 'LOW';
    return 'MODERATE';
  }
}

export function getAiProvider(): AiProvider {
  if (config.aiProvider === 'model') {
    return new ModelAiProvider();
  }
  return new DemoAiProvider();
}
