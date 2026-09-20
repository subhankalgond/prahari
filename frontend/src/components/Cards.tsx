import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Droplets, Thermometer, CloudRain, Wind, ChevronRight, Sprout, Bell } from 'lucide-react';
import type { Crop, ForecastDay, LibraryEntry, RiskAlert, WeatherNow } from '../types';
import { Badge, riskTone, severityTone } from './ui';

export function WeatherCard({ current }: { current: WeatherNow }) {
  const { t } = useTranslation();
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-600">{t('dashboard.weather')}</p>
          <p className="mt-1 text-3xl font-bold text-ink-900">{current.temperature}&deg;C</p>
          <p className="text-sm text-ink-600">{current.condition}</p>
        </div>
        {current.isDemo && <Badge tone="blue">{t('app.demoBadge')}</Badge>}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-600" aria-hidden />
          <dt className="sr-only">{t('dashboard.humidity')}</dt>
          <dd>{current.humidity}%</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CloudRain className="w-4 h-4 text-blue-600" aria-hidden />
          <dt className="sr-only">{t('dashboard.rainfall')}</dt>
          <dd>{current.rainfallMm}mm</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-blue-600" aria-hidden />
          <dt className="sr-only">{t('weather.wind')}</dt>
          <dd>{current.windSpeed}km/h</dd>
        </div>
      </dl>
    </div>
  );
}

export function CropCard({ crop }: { crop: Crop }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/crops/${crop.id}`}
      className="card p-5 flex flex-col gap-3 hover:border-primary-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-700">
            <Sprout className="w-6 h-6" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-ink-900">{crop.name}</h3>
            <p className="text-sm text-ink-600">
              {crop.areaValue} {crop.areaUnit}
              {crop.fieldName ? ` - ${crop.fieldName}` : ''}
            </p>
          </div>
        </div>
        <Badge tone={riskTone(crop.riskLevel)}>{t(`risk.${crop.riskLevel}`)}</Badge>
      </div>
      <div className="flex items-center justify-between text-sm text-ink-600">
        <span>{t('crops.stages.' + crop.growthStage)}</span>
        <span className="inline-flex items-center gap-1 font-medium text-primary-800">
          {t('common.viewDetails')}
          <ChevronRight className="w-4 h-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function RiskCard({ alert }: { alert: RiskAlert }) {
  const { t } = useTranslation();
  return (
    <Link to={`/alerts/${alert.id}`} className={`card p-5 block hover:border-primary-300 transition-colors ${!alert.isRead ? 'border-l-4 border-l-amber-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={riskTone(alert.riskLevel)}>{t(`risk.${alert.riskLevel}`)}</Badge>
            <Badge tone="gray">{t(`alerts.types.${alert.type}`)}</Badge>
            {!alert.isRead && <span className="w-2 h-2 rounded-full bg-amber-500" aria-label={t('common.unread')} />}
          </div>
          <h3 className="mt-2 font-semibold text-ink-900">{alert.title}</h3>
          <p className="mt-1 text-sm text-ink-600 line-clamp-2">{alert.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-ink-400 shrink-0 mt-1" aria-hidden />
      </div>
      {alert.cropName && (
        <p className="mt-3 text-xs text-ink-600">
          {t('alerts.affectedCrop')}: <span className="font-medium text-ink-900">{alert.cropName}</span>
        </p>
      )}
    </Link>
  );
}

export function DiseaseCard({ entry }: { entry: LibraryEntry }) {
  const { t } = useTranslation();
  return (
    <Link to={`/library/${entry.id}`} className="card p-5 flex flex-col gap-3 hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">{entry.name}</h3>
          <p className="text-sm text-ink-600">{entry.cropName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={entry.kind === 'DISEASE' ? 'red' : 'amber'}>{entry.kind === 'DISEASE' ? t('library.diseases') : t('library.pests')}</Badge>
          <Badge tone={severityTone(entry.severity)}>{t(`severity.${entry.severity}`)}</Badge>
        </div>
      </div>
      <p className="text-sm text-ink-600 line-clamp-2">{entry.description}</p>
    </Link>
  );
}

export function ForecastStrip({ forecast }: { forecast: ForecastDay[] }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
      {forecast.map((d) => (
        <div key={d.date} className="card p-3 text-center">
          <p className="text-xs font-medium text-ink-600">
            {new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
          </p>
          <p className="mt-1 text-sm font-semibold">{d.maxTemp}&deg;</p>
          <p className="text-xs text-ink-600">{d.minTemp}&deg;</p>
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-blue-700">
            <CloudRain className="w-3 h-3" aria-hidden />
            {d.rainfallMm}mm
          </p>
          <p className="text-[11px] text-ink-600" title={d.condition}>
            {d.humidity}% {t('dashboard.humidity').toLowerCase()}
          </p>
        </div>
      ))}
    </div>
  );
}

export function NotificationItem({
  title,
  body,
  type,
  isRead,
  onRead,
  link,
}: {
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  onRead?: () => void;
  link?: string | null;
}) {
  const { t } = useTranslation();
  const content = (
    <div className={`card p-4 flex gap-3 items-start ${!isRead ? 'border-l-4 border-l-primary-600' : ''}`}>
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-700 shrink-0">
        <Bell className="w-4 h-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone="gray">{t(`notifications.types.${type}`, { defaultValue: type })}</Badge>
        </div>
        <h3 className="mt-1.5 font-medium text-ink-900 text-sm">{title}</h3>
        <p className="text-sm text-ink-600">{body}</p>
      </div>
    </div>
  );
  return (
    <div
      onClick={() => {
        onRead?.();
      }}
      role={link ? 'link' : undefined}
    >
      {content}
    </div>
  );
}

export function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-600">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone ?? 'text-ink-900'}`}>{value}</p>
      {sub && <p className="text-sm text-ink-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export function ThermometerIcon() {
  return <Thermometer className="w-4 h-4" aria-hidden />;
}
