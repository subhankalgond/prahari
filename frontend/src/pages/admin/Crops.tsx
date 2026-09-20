import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch';
import type { Crop } from '../../types';
import { Badge, riskTone, ErrorState, PageHeader, Spinner } from '../../components/ui';

interface AdminCropRow extends Crop {
  farmerName: string;
}

export default function AdminCrops() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<{ crops: AdminCropRow[] }>('/api/admin/crops');

  return (
    <div>
      <PageHeader title={t('admin.crops')} />
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-ink-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">{t('crops.cropName')}</th>
                <th className="px-4 py-3 font-semibold">Farmer</th>
                <th className="px-4 py-3 font-semibold">{t('crops.area')}</th>
                <th className="px-4 py-3 font-semibold">{t('crops.stage')}</th>
                <th className="px-4 py-3 font-semibold">{t('crops.healthScore')}</th>
                <th className="px-4 py-3 font-semibold">{t('crops.risk')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.crops ?? []).map((c) => (
                <tr key={c.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-ink-600">{c.farmerName}</td>
                  <td className="px-4 py-3">
                    {c.areaValue} {c.areaUnit}
                  </td>
                  <td className="px-4 py-3">{t(`crops.stages.${c.growthStage}`)}</td>
                  <td className="px-4 py-3">{c.healthScore}/100</td>
                  <td className="px-4 py-3">
                    <Badge tone={riskTone(c.riskLevel)}>{t(`risk.${c.riskLevel}`)}</Badge>
                  </td>
                </tr>
              ))}
              {(data?.crops ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-600">
                    {t('library.empty')}
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
