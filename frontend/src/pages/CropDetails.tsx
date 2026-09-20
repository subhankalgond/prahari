import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, ScanSearch, Trash2, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import type { Crop, HealthPoint, RiskAlert, ScanWithResult } from '../types';
import { Badge, ConfirmDialog, riskTone, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { useState } from 'react';
import FieldMap from '../components/FieldMap';

interface CropResponse {
  crop: Crop;
  healthHistory: HealthPoint[];
  recentScans: ScanWithResult[];
  recentAlerts: RiskAlert[];
}

export default function CropDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, loading, error, retry } = useFetch<CropResponse>(`/api/crops/${id}`, [id]);

  async function removeCrop() {
    try {
      await api.del(`/api/crops/${id}`);
      toast('success', t('toasts.cropDeleted'));
      navigate('/crops');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;
  const { crop, healthHistory, recentScans, recentAlerts } = data;

  const chartData = healthHistory.map((h) => ({
    date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: h.score,
  }));

  return (
    <div>
      <Link to="/crops" className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {t('crops.title')}
      </Link>
      <PageHeader title={crop.name} subtitle={`${crop.areaValue} ${crop.areaUnit}${crop.fieldName ? ` - ${crop.fieldName}` : ''}`} />

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge tone={riskTone(crop.riskLevel)}>{t('crops.risk')}: {t(`risk.${crop.riskLevel}`)}</Badge>
        <Badge tone="gray">{t('crops.stages.' + crop.growthStage)}</Badge>
        {crop.soilType && <Badge tone="gray">{t('crops.soils.' + crop.soilType)}</Badge>}
        {crop.irrigationType && <Badge tone="gray">{t('crops.irrigation.' + crop.irrigationType)}</Badge>}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold">{t('crops.healthHistory')}</h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink-900">{crop.healthScore}</span>
            <span className="text-ink-600">/ 100</span>
          </div>
          <div className="h-48 mt-4" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#047857" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">{t('crops.detailsTitle')}</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">{t('crops.fieldName')}</dt>
              <dd className="font-medium text-right">{crop.fieldName ?? '-'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">{t('crops.sownOn')}</dt>
              <dd className="font-medium">{new Date(crop.sowingDate).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">{t('crops.stage')}</dt>
              <dd className="font-medium">{t('crops.stages.' + crop.growthStage)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">{t('crops.soilType')}</dt>
              <dd className="font-medium">{crop.soilType ? t('crops.soils.' + crop.soilType) : '-'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">{t('crops.irrigationType')}</dt>
              <dd className="font-medium">{crop.irrigationType ? t('crops.irrigation.' + crop.irrigationType) : '-'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {(crop as { fieldBoundary?: { lat: number; lng: number }[] | null }).fieldBoundary && (
        <div className="card p-6 mt-6">
          <h2 className="font-semibold text-ink-900 mb-4">{t('fieldMap.title')}</h2>
          <FieldMap
            value={(crop as { fieldBoundary?: { lat: number; lng: number }[] | null }).fieldBoundary ?? null}
            onChange={() => {
              /* read-only on details page */
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/scan?crop=${crop.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
        >
          <ScanSearch className="w-4 h-4" aria-hidden />
          {t('crops.scanCrop')}
        </Link>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
        >
          <History className="w-4 h-4" aria-hidden />
          {t('crops.viewHistory')}
        </Link>
        <Link
          to={`/crops/${crop.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
        >
          <Pencil className="w-4 h-4" aria-hidden />
          {t('crops.editCrop')}
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" aria-hidden />
          {t('crops.deleteCrop')}
        </button>
      </div>

      {/* Recent scans */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">{t('crops.recentScans')}</h2>
        {recentScans.length === 0 ? (
          <EmptyState title={t('crops.noScansYet')} />
        ) : (
          <ul className="space-y-3">
            {recentScans.map((s) => (
              <li key={s.id}>
                <Link to={`/scan/result/${s.id}`} className="card p-4 flex items-center justify-between gap-3 hover:border-primary-300">
                  <div>
                    <p className="font-medium text-sm">{s.result?.condition ?? s.status}</p>
                    <p className="text-xs text-ink-600">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  {s.result && (
                    <span className="text-sm font-semibold">{s.result.confidence}%</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent alerts */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">{t('crops.recentAlerts')}</h2>
        {recentAlerts.length === 0 ? (
          <EmptyState title={t('dashboard.alertsAllCaughtUp')} />
        ) : (
          <ul className="space-y-3">
            {recentAlerts.map((a) => (
              <li key={a.id}>
                <Link to={`/alerts/${a.id}`} className="card p-4 flex items-center justify-between gap-3 hover:border-primary-300">
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-ink-600">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={riskTone(a.riskLevel)}>{t(`risk.${a.riskLevel}`)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('crops.deleteConfirmTitle')}
        body={t('crops.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={removeCrop}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
