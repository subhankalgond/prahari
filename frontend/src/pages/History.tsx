import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import type { ScanWithResult } from '../types';
import { Badge, severityTone, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

export default function History() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<{ scans: ScanWithResult[] }>('/api/scans');
  const [crop, setCrop] = useState('');
  const [result, setResult] = useState('');
  const [date, setDate] = useState('');

  const scans = data?.scans ?? [];
  const cropNames = useMemo(() => [...new Set(scans.map((s) => s.cropName))].sort(), [scans]);

  const filtered = useMemo(
    () =>
      scans
        .filter((s) => (crop ? s.cropName === crop : true))
        .filter((s) =>
          result === 'healthy'
            ? s.result?.isHealthy
            : result === 'disease'
              ? s.result && !s.result.isHealthy && s.result.status !== 'LOW_CONFIDENCE'
              : result === 'low'
                ? s.result?.status === 'LOW_CONFIDENCE'
                : true,
        )
        .filter((s) => (date ? s.createdAt.slice(0, 10) === date : true)),
    [scans, crop, result, date],
  );

  return (
    <div>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />

      <div className="card p-4 mb-6 grid gap-3 sm:grid-cols-3">
        <select className="field-input" value={crop} onChange={(e) => setCrop(e.target.value)} aria-label={t('history.filterCrop')}>
          <option value="">{t('history.filterCrop')}</option>
          {cropNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="field-input" value={result} onChange={(e) => setResult(e.target.value)} aria-label={t('history.filterResult')}>
          <option value="">{t('history.filterResult')}</option>
          <option value="healthy">{t('history.resultHealthy')}</option>
          <option value="disease">{t('history.resultDisease')}</option>
          <option value="low">{t('history.resultLow')}</option>
        </select>
        <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t('common.date')} />
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && scans.length === 0 && (
        <EmptyState
          icon={<Camera className="w-10 h-10" aria-hidden />}
          title={t('history.empty')}
          action={
            <Link to="/scan" className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">
              {t('history.emptyCta')}
            </Link>
          }
        />
      )}
      {!loading && !error && scans.length > 0 && filtered.length === 0 && <EmptyState title={t('library.empty')} />}

      <ul className="space-y-3">
        {filtered.map((s) => (
          <li key={s.id}>
            <Link to={`/scan/result/${s.id}`} className="card p-4 flex items-center gap-4 hover:border-primary-300">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-stone-200" />
              ) : (
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-stone-100 text-stone-400">
                  <Camera className="w-6 h-6" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{s.cropName}</span>
                  {s.result && (
                    <Badge tone={s.result.isHealthy ? 'green' : s.result.status === 'LOW_CONFIDENCE' ? 'amber' : 'red'}>
                      {s.result.condition}
                    </Badge>
                  )}
                  {s.result?.severity && !s.result.isHealthy && (
                    <Badge tone={severityTone(s.result.severity)}>{t(`severity.${s.result.severity}`)}</Badge>
                  )}
                </div>
                <p className="text-xs text-ink-600 mt-0.5">{new Date(s.createdAt).toLocaleString()}</p>
              </div>
              {s.result && <span className="text-sm font-semibold shrink-0">{s.result.confidence}%</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
