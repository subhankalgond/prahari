import { useTranslation } from 'react-i18next';
import { CloudRain, CloudSun, Droplets, Thermometer, Wind, RefreshCw } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import type { WeatherResponse } from '../types';
import { Badge, riskTone, ErrorState, PageHeader, Spinner } from '../components/ui';
import { ForecastStrip, WeatherCard } from '../components/Cards';

export default function WeatherPage() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<WeatherResponse>('/api/weather');

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? t('weather.unavailable')} onRetry={retry} />;

  const { weather, risk } = data;

  return (
    <div>
      <PageHeader title={t('weather.title')} subtitle={t('weather.subtitle')} />

      <div className="grid md:grid-cols-2 gap-4">
        <WeatherCard current={weather.current} />

        {/* Crop risk factors */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('weather.riskFactors')}</h2>
            <Badge tone={riskTone(risk.level)}>{t(`risk.${risk.level}`)}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {t('weather.riskSummary')}: {risk.summary}
          </p>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-ink-600">
                <Thermometer className="w-4 h-4" aria-hidden />
                {t('weather.temperature')}
              </dt>
              <dd className="font-medium">{weather.current.temperature}&deg;C</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-ink-600">
                <Droplets className="w-4 h-4" aria-hidden />
                {t('weather.humidity')}
              </dt>
              <dd className={`font-medium ${weather.current.humidity >= 80 ? 'text-amber-700' : ''}`}>{weather.current.humidity}%</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-ink-600">
                <CloudRain className="w-4 h-4" aria-hidden />
                {t('weather.rainfall')}
              </dt>
              <dd className={`font-medium ${weather.current.rainfallMm > 0 ? 'text-amber-700' : ''}`}>
                {weather.current.rainfallMm} {t('weather.mm')}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-ink-600">
                <Wind className="w-4 h-4" aria-hidden />
                {t('weather.wind')}
              </dt>
              <dd className="font-medium">
                {weather.current.windSpeed} {t('weather.kmh')}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
            <h3 className="text-sm font-semibold text-blue-900">{t('weather.riskExplanation')}</h3>
            <ul className="mt-2 space-y-1.5">
              {risk.factors.map((f, i) => (
                <li key={i} className="text-xs text-blue-900">
                  <span className="font-semibold">{f.value}</span> (+{f.points}): {f.detail}
                </li>
              ))}
              {risk.factors.length === 0 && <li className="text-xs text-blue-900">--</li>}
            </ul>
            <p className="mt-2 text-[11px] text-blue-800">{risk.note}</p>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">{t('weather.forecast')}</h2>
        <ForecastStrip forecast={weather.forecast} />
      </section>

      {data.isDemo && (
        <p className="mt-6 flex items-center gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 w-fit">
          <CloudSun className="w-4 h-4" aria-hidden />
          {t('weather.demoMode')}
        </p>
      )}

      <button
        type="button"
        onClick={retry}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
      >
        <RefreshCw className="w-4 h-4" aria-hidden />
        {t('common.retry')}
      </button>
    </div>
  );
}
