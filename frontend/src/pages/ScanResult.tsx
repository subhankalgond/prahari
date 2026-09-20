import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, Flag, ListChecks, MessageSquareWarning, RefreshCw, ShieldAlert, Sprout } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import type { ScanWithResult } from '../types';
import { Badge, Button, ErrorState, severityTone, Spinner } from '../components/ui';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

export default function ScanResult() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, loading, error, retry } = useFetch<{ scan: ScanWithResult }>(`/api/scans/${id}`, [id]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reporting, setReporting] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  const scan = data?.scan;
  if (!scan) return null;
  const result = scan.result;

  async function submitReport() {
    if (!id) return;
    setReporting(true);
    try {
      await api.post(`/api/scans/${id}/report`, { reason: reason.trim() });
      toast('success', t('scan.reportSubmitted'));
      setReportOpen(false);
      setReason('');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {t('scan.resultTitle')}
      </Link>

      {!result && (
        <div className="card p-6 text-center">
          <p className="text-ink-600">{t('scan.analyzing')}...</p>
        </div>
      )}

      {scan.status === 'FAILED' && (
        <div className="card p-6 text-center" role="alert">
          <ShieldAlert className="mx-auto w-10 h-10 text-amber-600" aria-hidden />
          <p className="mt-3 font-semibold">{t('weather.unavailable')}</p>
          <Link to="/scan" className="mt-4 inline-block rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">
            {t('scan.retake')}
          </Link>
        </div>
      )}

      {result && (
        <>
          {/* Status header */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-ink-600">{t('scan.possibleCondition')}</p>
                <h1 className="mt-1 text-2xl font-bold text-ink-900">{result.condition}</h1>
                <p className="mt-1 text-sm text-ink-600">
                  {t('history.columns.crop')}: <span className="font-medium text-ink-900">{result.crop}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone={result.status === 'HEALTHY' ? 'green' : result.status === 'LOW_CONFIDENCE' ? 'amber' : 'red'}>
                  {t(`scan.status.${result.status}`)}
                </Badge>
                {result.severity && <Badge tone={severityTone(result.severity)}>{t('scan.severity')}: {t(`severity.${result.severity}`)}</Badge>}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-stone-50 border border-stone-200 py-3">
                <p className="text-2xl font-bold text-ink-900">{result.confidence}%</p>
                <p className="text-xs text-ink-600">{t('scan.aiConfidence')}</p>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-200 py-3">
                <p className="text-2xl font-bold text-ink-900">{new Date(result.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-ink-600">{t('common.date')}</p>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-200 py-3">
                <p className="text-sm font-bold text-ink-900 pt-1.5">{result.isDemo ? t('app.demoBadge') : 'AI model'}</p>
                <p className="text-xs text-ink-600">{result.provider}</p>
              </div>
            </div>
            {result.isDemo && (
              <p className="mt-3 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                {t('scan.demoResult')}
              </p>
            )}
          </div>

          {/* Low confidence path */}
          {result.status === 'LOW_CONFIDENCE' && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5" role="alert">
              <h2 className="font-semibold text-amber-900">{t('scan.lowConfidenceTitle')}</h2>
              <p className="mt-1.5 text-sm text-amber-900">{t('scan.lowConfidenceAdvice')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/scan" className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 min-h-[44px] inline-flex items-center">
                  <Camera className="w-4 h-4 mr-2" aria-hidden />
                  {t('scan.retake')}
                </Link>
                <Link to="/help" className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 min-h-[44px] inline-flex items-center">
                  {t('nav.help')}
                </Link>
              </div>
            </div>
          )}

          {/* Symptom / cause sections */}
          {result.symptoms.length > 0 && (
            <section className="card p-5 mt-4">
              <h2 className="font-semibold">{t('scan.symptomsTitle')}</h2>
              <ul className="mt-3 space-y-2">
                {result.symptoms.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.causes.length > 0 && (
            <section className="card p-5 mt-4">
              <h2 className="font-semibold">{t('scan.causesTitle')}</h2>
              <ul className="mt-3 space-y-2">
                {result.causes.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.actions.length > 0 && (
            <section className="card p-5 mt-4 border-l-4 border-l-primary-600">
              <h2 className="font-semibold flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary-700" aria-hidden />
                {t('scan.actionsTitle')}
              </h2>
              <ol className="mt-3 space-y-2.5">
                {result.actions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink-600">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-800 text-[11px] font-bold shrink-0 mt-0.5" aria-hidden>
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {result.prevention.length > 0 && (
            <section className="card p-5 mt-4">
              <h2 className="font-semibold">{t('scan.preventionTitle')}</h2>
              <ul className="mt-3 space-y-2">
                {result.prevention.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-600 shrink-0" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5 mt-4">
            <h2 className="font-semibold">{t('scan.expertTitle')}</h2>
            <p className="mt-2 text-sm text-ink-600">{result.expertHelp}</p>
          </section>

          {/* Disclaimer */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3" role="note">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-amber-900">{t('scan.disclaimer')}</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/history"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
            >
              <Sprout className="w-4 h-4" aria-hidden />
              {t('scan.saveResult')}
            </Link>
            <Link
              to="/weather"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
            >
              <ListChecks className="w-4 h-4" aria-hidden />
              {t('scan.viewRecommendations')}
            </Link>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              {t('scan.scanAnother')}
            </Link>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 min-h-[44px]"
            >
              <Flag className="w-4 h-4" aria-hidden />
              {t('scan.reportIncorrect')}
            </button>
          </div>
        </>
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('scan.reportTitle')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitReport();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="report-reason" className="field-label">
              {t('scan.reportPlaceholder')}
            </label>
            <textarea
              id="report-reason"
              rows={3}
              required
              minLength={5}
              className="field-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={reporting}>
              <MessageSquareWarning className="w-4 h-4" aria-hidden />
              {t('scan.reportSubmit')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
