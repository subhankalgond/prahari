import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch';
import type { AdminScanRow } from '../../types';
import { Badge, ErrorState, PageHeader, Spinner } from '../../components/ui';

export default function AdminScans() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<{ scans: AdminScanRow[] }>('/api/admin/scans');

  return (
    <div>
      <PageHeader title={t('admin.scans')} />
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-ink-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">{t('admin.scanRecords.farmer')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.scanRecords.crop')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.scanRecords.condition')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.scanRecords.confidence')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.scanRecords.date')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.scans ?? []).map((s) => (
                <tr key={s.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{s.farmerName}</td>
                  <td className="px-4 py-3">{s.cropName}</td>
                  <td className="px-4 py-3">
                    {s.result ? (
                      <span className="flex items-center gap-2">
                        <Badge tone={s.result.isHealthy ? 'green' : s.result.status === 'LOW_CONFIDENCE' ? 'amber' : 'red'}>
                          {s.result.condition}
                        </Badge>
                        {s.result.isDemo && <Badge tone="blue">{t('app.demoBadge')}</Badge>}
                      </span>
                    ) : (
                      <span className="text-ink-600">{s.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{s.result ? `${s.result.confidence}%` : '-'}</td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {(data?.scans ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-600">
                    {t('admin.scanRecords.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
