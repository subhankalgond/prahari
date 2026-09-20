// Prahari forecast engine: three validated potato/tomato late blight models
// run on hourly weather data. Deterministic, transparent, unit-testable.
//
// References (agronomic literature):
// - Hutton Criteria: two consecutive 10-day periods with min humidity >90%
//   and mean temperature within 8-21 C -> blight favorable. We use a rolling
//   variant: count of 24h blocks meeting both conditions.
// - Wallin DSV (Disease Severity Values): hourly scoring of leaf-wetness
//   duration vs mean temperature during the wet period; DSV accumulates.
// - TOMCAST: same family as Wallin, using hourly temperature + relative
//   humidity to assign Disease Severity Values on a coarser table; a spray is
//   advised when accumulated DSV crosses a threshold (15-20 typical).

export interface HourlyObservation {
  time: string; // ISO 8601
  temperature: number; // deg C
  humidity: number; // %
  precipitationMm: number; // mm in that hour
  leafWetnessHours?: number; // optional, else derived
}

export interface HuttonResult {
  accumulatedBlocks: number;
  triggered: boolean; // two consecutive 24h blocks satisfied
  lastBlockTriggeredAt: string | null;
}

export interface WallinResult {
  dsv: number;
  lastDsvHour: string | null;
}

export interface TomcastResult {
  dsv: number;
  sprayAdvised: boolean; // accumulated DSV >= 18
}

export interface SprayWindow {
  day: string; // human-readable, e.g. "Tuesday"
  dateIso: string;
  startHour: number;
  endHour: number;
  note: string;
}

export interface ForecastEngineOutput {
  hutton: HuttonResult;
  wallin: WallinResult;
  tomcast: TomcastResult;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  sprayWindows: SprayWindow[];
  modelNote: string;
}

function mean(a: number[]): number {
  if (a.length === 0) return 0;
  return a.reduce((s, x) => s + x, 0) / a.length;
}

// Leaf wetness: if the sensor value is absent, approximate from humidity and
// rain. Common practice: RH >= 90% or rain > 0 counts as wet hours.
function isWetHour(o: HourlyObservation): boolean {
  if (o.leafWetnessHours !== undefined) return o.leafWetnessHours > 0;
  return o.humidity >= 90 || o.precipitationMm > 0;
}

// --- Hutton Criteria (rolling 24h blocks) ----------------------------------

export function runHutton(hours: HourlyObservation[]): HuttonResult {
  const sorted = [...hours].sort((a, b) => a.time.localeCompare(b.time));
  const blocks: { time: string; ok: boolean }[] = [];
  for (let i = 0; i + 24 <= sorted.length; i += 24) {
    const chunk = sorted.slice(i, i + 24);
    const rhOk = mean(chunk.map((h) => (h.humidity >= 90 ? 1 : 0))) >= 0.5;
    const tempOk = mean(chunk.map((h) => h.temperature)) >= 8 && mean(chunk.map((h) => h.temperature)) <= 21;
    blocks.push({ time: chunk[chunk.length - 1].time, ok: rhOk && tempOk });
  }
  let triggered = false;
  let lastTriggered: string | null = null;
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].ok && blocks[i - 1].ok) {
      triggered = true;
      lastTriggered = blocks[i].time;
    }
  }
  return {
    accumulatedBlocks: blocks.filter((b) => b.ok).length,
    triggered,
    lastBlockTriggeredAt: lastTriggered,
  };
}

// --- Wallin DSV -------------------------------------------------------------

// Wallin table: wet period duration (h) vs mean temperature during wet period.
const WALLIN_TABLE: { minHours: number; minTemp: number; dsv: number }[] = [
  { minHours: 0, minTemp: 16, dsv: 0 },
  { minHours: 3, minTemp: 13, dsv: 1 },
  { minHours: 6, minTemp: 10, dsv: 2 },
  { minHours: 9, minTemp: 10, dsv: 3 },
  { minHours: 12, minTemp: 7, dsv: 4 },
  { minHours: 15, minTemp: 7, dsv: 5 },
  { minHours: 18, minTemp: 4, dsv: 6 },
];

export function runWallin(hours: HourlyObservation[]): WallinResult {
  const sorted = [...hours].sort((a, b) => a.time.localeCompare(b.time));
  let dsv = 0;
  let lastDsvHour: string | null = null;
  let wetRun: HourlyObservation[] = [];
  const flush = () => {
    if (wetRun.length === 0) return;
    const hrs = wetRun.length;
    const t = mean(wetRun.map((h) => h.temperature));
    // Highest DSV row whose thresholds are met.
    let rowDsv = 0;
    for (const row of WALLIN_TABLE) {
      if (hrs >= row.minHours && t >= row.minTemp) rowDsv = row.dsv;
    }
    if (rowDsv > 0) {
      dsv += rowDsv;
      lastDsvHour = wetRun[wetRun.length - 1].time;
    }
    wetRun = [];
  };
  for (const h of sorted) {
    if (isWetHour(h)) wetRun.push(h);
    else flush();
  }
  flush();
  return { dsv, lastDsvHour };
}

// --- TOMCAST ----------------------------------------------------------------

// TOMCAST assigns DSV per wet period from a coarser table; spray advised at
// cumulative 18 (common threshold for tomatoes).
const TOMCAST_TABLE: { minHours: number; minTemp: number; dsv: number }[] = [
  { minHours: 0, minTemp: 13, dsv: 0 },
  { minHours: 4, minTemp: 13, dsv: 2 },
  { minHours: 8, minTemp: 11, dsv: 3 },
  { minHours: 12, minTemp: 10, dsv: 4 },
  { minHours: 16, minTemp: 8, dsv: 5 },
];

export function runTomcast(hours: HourlyObservation[]): TomcastResult {
  const sorted = [...hours].sort((a, b) => a.time.localeCompare(b.time));
  let dsv = 0;
  let wetRun: HourlyObservation[] = [];
  const flush = () => {
    if (wetRun.length === 0) return;
    const hrs = wetRun.length;
    const t = mean(wetRun.map((h) => h.temperature));
    let rowDsv = 0;
    for (const row of TOMCAST_TABLE) {
      if (hrs >= row.minHours && t >= row.minTemp) rowDsv = row.dsv;
    }
    dsv += rowDsv;
    wetRun = [];
  };
  for (const h of sorted) {
    if (isWetHour(h)) wetRun.push(h);
    else flush();
  }
  flush();
  return { dsv, sprayAdvised: dsv >= 18 };
}

// --- Spray window selection -------------------------------------------------
// Pick up to two viable spray windows in the next 3 days: early-morning hours
// (5-9 local) where no rain is expected in the following 4 hours; if rain IS
// expected later that day, note "spray before that".

export function pickSprayWindows(hours: HourlyObservation[], now = new Date()): SprayWindow[] {
  const sorted = [...hours].sort((a, b) => a.time.localeCompare(b.time));
  const windows: SprayWindow[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const nowMs = now.getTime();
  const byLocalDay = new Map<string, HourlyObservation[]>();
  for (const h of sorted) {
    const d = new Date(h.time);
    if (d.getTime() < nowMs) continue;
    const key = h.time.slice(0, 10);
    byLocalDay.set(key, [...(byLocalDay.get(key) ?? []), h]);
  }
  for (const [dateIso, dayHours] of byLocalDay) {
    if (windows.length >= 2) break;
    const morning = dayHours.filter((h) => {
      const hr = new Date(h.time).getHours();
      return hr >= 5 && hr <= 9;
    });
    if (morning.length < 2) continue;
    const wetMorning = morning.some((h) => isWetHour(h) && h.precipitationMm > 0.2);
    if (wetMorning) continue;
    const laterRain = dayHours.find((h) => {
      const hr = new Date(h.time).getHours();
      return hr > 9 && h.precipitationMm > 0.5;
    });
    const d = new Date(dateIso + 'T00:00:00');
    const note = laterRain
      ? `Rain expected around ${new Date(laterRain.time).getHours()}:00. Spray before that.`
      : 'No rain expected later this day. Spray in the morning window.';
    windows.push({
      day: dayNames[d.getDay()],
      dateIso,
      startHour: 6,
      endHour: 9,
      note,
    });
  }
  return windows;
}

export function runForecastEngine(hours: HourlyObservation[]): ForecastEngineOutput {
  const hutton = runHutton(hours);
  const wallin = runWallin(hours);
  const tomcast = runTomcast(hours);
  const triggers = [hutton.triggered, wallin.dsv >= 12, tomcast.sprayAdvised].filter(Boolean).length;
  const overallRisk = triggers >= 2 ? 'HIGH' : triggers === 1 ? 'MEDIUM' : 'LOW';
  return {
    hutton,
    wallin,
    tomcast,
    overallRisk,
    sprayWindows: pickSprayWindows(hours),
    modelNote:
      'Rule-based disease-forecast models run on hourly weather data. They indicate favourable conditions for late blight-type diseases; they are not a guarantee of infection. Always confirm with field scouting.',
  };
}
