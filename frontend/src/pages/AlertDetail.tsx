import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCheck, CloudSun, ScanSearch, Sprout } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { RiskAlert } from '../types';
import { Badge, riskTone, ErrorState, PageHeader, Spinner } from '../components/ui';

export default function AlertDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, loading, error, retry } = useFetch<{ alert: RiskAlert }>(`/api/alerts/${id}`, [id]);

  async function markRead() {
    try {
      await api.put(`/api/alerts/${id}/read`);
      toast('success', t('alerts.markedRead'));
      retry();
    } catch {
      toast('error', t('common.error'));
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;
  const alert = data.alert;

  return (
    <div className="max-w-2xl">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {t('common.back')}
      </button>
      <PageHeader title={alert.title} subtitle={new Date(alert.createdAt).toLocaleString()} />

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge tone={riskTone(alert.riskLevel)}>{t(`risk.${alert.riskLevel}`)}</Badge>
        <Badge tone="gray">{t(`alerts.types.${alert.type}`)}</Badge>
        {alert.cropName && <Badge tone="blue">{alert.cropName}</Badge>}
        {alert.score !== null && <Badge tone="gray">{t('alerts.score')}: {alert.score}</Badge>}
      </div>

      <section className="card p-5">
        <p className="text-sm text-ink-600 leading-relaxed">{alert.description}</p>
      </section>

      {alert.reasons.length > 0 && (
        <section className="card p-5 mt-4">
          <h2 className="font-semibold">{t('alerts.reason')}</h2>
          <ul className="mt-3 space-y-2">
            {alert.reasons.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink-600">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      {alert.weatherNote && (
        <section className="card p-5 mt-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-blue-700" aria-hidden />
            {t('alerts.weatherFactors')}
          </h2>
          <p className="mt-2 text-sm text-ink-600">{alert.weatherNote}</p>
        </section>
      )}

      {alert.action && (
        <section className="card p-5 mt-4 border-l-4 border-l-primary-600">
          <h2 className="font-semibold">{t('alerts.recommendedSteps')}</h2>
          <p className="mt-2 text-sm text-ink-600">{alert.action}</p>
        </section>
      )}

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4" role="note">
        <p className="text-sm text-amber-900">{t('alerts.disclaimer')}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!alert.isRead && (
          <button
            type="button"
            onClick={markRead}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
          >
            <CheckCheck className="w-4 h-4" aria-hidden />
            {t('common.markRead')}
          </button>
        )}
        {alert.cropId && (
          <Link
            to={`/crops/${alert.cropId}`}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
          >
            <Sprout className="w-4 h-4" aria-hidden />
            {t('alerts.viewCrop')}
          </Link>
        )}
        <Link
          to="/scan"
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
        >
          <ScanSearch className="w-4 h-4" aria-hidden />
          {t('alerts.scanCrop')}
        </Link>
      </div>
    </div>
  );
}
