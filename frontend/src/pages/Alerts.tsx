import { useTranslation } from 'react-i18next';
import { BellOff } from 'lucide-react';
import { api } from '../lib/api';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../contexts/ToastContext';
import type { RiskAlert } from '../types';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { RiskCard } from '../components/Cards';

export default function Alerts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, loading, error, retry } = useFetch<{ alerts: RiskAlert[]; unread: number }>('/api/alerts');

  async function markAll() {
    try {
      await api.put('/api/alerts/read-all');
      toast('success', t('toasts.allRead'));
      retry();
    } catch {
      toast('error', t('common.error'));
    }
  }

  return (
    <div>
      <PageHeader title={t('alerts.title')} subtitle={t('alerts.subtitle')} />
      {(data?.alerts ?? []).some((a) => !a.isRead) && (
        <div className="mb-4">
          <button type="button" onClick={markAll} className="text-sm font-semibold text-primary-800 hover:underline min-h-[44px]">
            {t('common.markAllRead')}
          </button>
        </div>
      )}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && (data?.alerts ?? []).length === 0 && (
        <EmptyState icon={<BellOff className="w-10 h-10" aria-hidden />} title={t('alerts.empty')} />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {(data?.alerts ?? []).map((a) => (
          <RiskCard key={a.id} alert={a} />
        ))}
      </div>
      <p className="mt-6 text-xs text-ink-600">{t('alerts.disclaimer')}</p>
    </div>
  );
}
