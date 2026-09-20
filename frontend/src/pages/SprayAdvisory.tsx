import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudRain, Volume2, Square, MapPin, Info } from 'lucide-react';
import { Button } from '../components/ui';
import { api } from '../lib/api';

export interface SprayWindow {
  day: string;
  dateIso: string;
  startHour: number;
  endHour: number;
  note: string;
}

export interface ForecastResponse {
  location: string;
  provider: string;
  isDemo: boolean;
  fallbackReason?: string;
  hutton: { accumulatedBlocks: number; triggered: boolean };
  wallin: { dsv: number };
  tomcast: { dsv: number; sprayAdvised: boolean };
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  sprayWindows: SprayWindow[];
  modelNote: string;
}

const RISK_STYLES: Record<string, string> = {
  LOW: 'bg-green-50 text-green-800 border-green-200',
  MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
  HIGH: 'bg-red-50 text-red-800 border-red-200',
};

function hourRange(start: number, end: number, lang: string): string {
  const fmt = (h: number) => {
    const suffix = lang === 'en' ? (h < 12 ? 'a.m.' : 'p.m.') : h < 12 ? 'AM' : 'PM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${suffix}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

export default function SprayAdvisory() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [location, setLocation] = useState('Karnataka');

  const load = (loc: string) => {
    setLoading(true);
    setError(false);
    api
      .get(`/api/forecast?location=${encodeURIComponent(loc)}`)
      .then((d) => setData(d as ForecastResponse))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = () => {
    if (!data || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const win = data.sprayWindows[0];
    const riskWord =
      data.overallRisk === 'HIGH'
        ? t('spray.riskHigh')
        : data.overallRisk === 'MEDIUM'
          ? t('spray.riskMedium')
          : t('spray.riskLow');
    const windowText = win
      ? t('spray.spokenWindow', {
          day: t(`days.${win.day}`, win.day),
          time: hourRange(win.startHour, win.endHour, i18n.language),
        })
      : t('spray.noWindowSpoken');
    const text = t('spray.spokenAdvisory', { risk: riskWord, window: windowText });
    const utter = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', mr: 'mr-IN' };
    utter.lang = langMap[i18n.language] ?? 'en-IN';
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4" aria-busy>
        <div className="h-8 w-56 bg-stone-200 rounded animate-pulse" />
        <div className="h-40 bg-stone-200 rounded-2xl animate-pulse" />
        <div className="h-24 bg-stone-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const win = data?.sprayWindows?.[0] ?? null;

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <CloudRain className="w-10 h-10 mx-auto text-stone-400" aria-hidden />
        <p className="mt-4 text-ink-700">{t('spray.unavailable')}</p>
        <Button className="mt-4" onClick={() => load(location)}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t('spray.title')}</h1>
        <label className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-ink-500" aria-hidden />
          <span className="sr-only">{t('spray.location')}</span>
          <select
            className="field-input py-2"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              load(e.target.value);
            }}
          >
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
          </select>
        </label>
      </div>

      {data.isDemo && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
          {data.fallbackReason ?? t('common.demoData')}
        </p>
      )}

      {/* Single spray window output */}
      <div className="card p-6">
        <p className="text-sm font-medium text-ink-600">{t('spray.nextWindow')}</p>
        {win ? (
          <>
            <p className="mt-2 text-3xl font-bold text-primary-900 tracking-tight">
              {t(`days.${win.day}`, win.day)} {hourRange(win.startHour, win.endHour, i18n.language)}
            </p>
            <p className="mt-2 flex items-start gap-2 text-ink-700">
              <CloudRain className="w-4 h-4 mt-1 shrink-0 text-sky-700" aria-hidden />
              {win.note}
            </p>
          </>
        ) : (
          <p className="mt-2 text-lg text-ink-700">{t('spray.noWindow')}</p>
        )}
        <div className="mt-4 flex gap-3">
          {!speaking ? (
            <Button onClick={speak} disabled={!('speechSynthesis' in window)} className="inline-flex items-center gap-2">
              <Volume2 className="w-4 h-4" aria-hidden />
              {t('spray.listen')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={stopSpeaking} className="inline-flex items-center gap-2">
              <Square className="w-4 h-4" aria-hidden />
              {t('spray.stop')}
            </Button>
          )}
        </div>
        {!('speechSynthesis' in window) && (
          <p className="mt-2 text-xs text-ink-500">{t('spray.voiceUnsupported')}</p>
        )}
      </div>

      {/* Three model results, transparent */}
      <div className="card p-6">
        <h2 className="font-semibold text-ink-900">{t('spray.modelsTitle')}</h2>
        <dl className="mt-4 grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-stone-200 p-4">
            <dt className="text-sm font-medium text-ink-600">Hutton Criteria</dt>
            <dd className="mt-1 text-lg font-bold">{data.hutton.triggered ? t('spray.triggered') : t('spray.notTriggered')}</dd>
            <dd className="text-xs text-ink-500 mt-1">{t('spray.huttonBlocks', { count: data.hutton.accumulatedBlocks })}</dd>
          </div>
          <div className="rounded-xl border border-stone-200 p-4">
            <dt className="text-sm font-medium text-ink-600">Wallin DSV</dt>
            <dd className="mt-1 text-lg font-bold">{data.wallin.dsv}</dd>
            <dd className="text-xs text-ink-500 mt-1">{t('spray.wallinNote')}</dd>
          </div>
          <div className="rounded-xl border border-stone-200 p-4">
            <dt className="text-sm font-medium text-ink-600">TOMCAST</dt>
            <dd className="mt-1 text-lg font-bold">{data.tomcast.dsv}</dd>
            <dd className="text-xs text-ink-500 mt-1">{data.tomcast.sprayAdvised ? t('spray.tomcastAdvised') : t('spray.tomcastWait')}</dd>
          </div>
        </dl>
        <p className="mt-4">
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm font-semibold ${RISK_STYLES[data.overallRisk]}`}>
            {t('spray.overallRisk')}: {t(`spray.risk_${data.overallRisk}`)}
          </span>
        </p>
      </div>

      <p className="flex items-start gap-2 text-xs text-ink-500">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
        {data.modelNote}
      </p>
    </div>
  );
}
