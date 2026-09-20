import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import { api } from '../../lib/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../contexts/ToastContext';
import type { RiskAlert } from '../../types';
import { Badge, Button, riskTone, ErrorState, PageHeader, Spinner } from '../../components/ui';

export default function AdminAlerts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, loading, error, retry } = useFetch<{ alerts: RiskAlert[] }>('/api/admin/alerts');
  const [form, setForm] = useState({
    title: '',
    description: '',
    cropName: '',
    type: 'GENERAL',
    riskLevel: 'MEDIUM',
    action: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/admin/alerts', {
        title: form.title.trim(),
        description: form.description.trim(),
        cropName: form.cropName.trim() || null,
        type: form.type,
        riskLevel: form.riskLevel,
        action: form.action.trim() || null,
      });
      toast('success', t('admin.alertForm.created'));
      setForm({ title: '', description: '', cropName: '', type: 'GENERAL', riskLevel: 'MEDIUM', action: '' });
      retry();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('admin.alerts')} />

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary-700" aria-hidden />
          {t('admin.alertForm.title')}
        </h2>
        <p className="text-sm text-ink-600">{t('admin.alertForm.subtitle')}</p>
        <div>
          <label htmlFor="al-title" className="field-label">
            {t('admin.alertForm.alertTitle')}
          </label>
          <input id="al-title" className="field-input" required minLength={4} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label htmlFor="al-desc" className="field-label">
            {t('admin.alertForm.description')}
          </label>
          <textarea id="al-desc" rows={2} required minLength={4} className="field-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="al-crop" className="field-label">
              {t('admin.alertForm.cropName')}
            </label>
            <input id="al-crop" className="field-input" value={form.cropName} onChange={(e) => setForm({ ...form, cropName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="al-type" className="field-label">
              {t('admin.alertForm.type')}
            </label>
            <select id="al-type" className="field-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="DISEASE_RISK">{t('alerts.types.DISEASE_RISK')}</option>
              <option value="PEST_RISK">{t('alerts.types.PEST_RISK')}</option>
              <option value="WEATHER">{t('alerts.types.WEATHER')}</option>
              <option value="GENERAL">{t('alerts.types.GENERAL')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="al-risk" className="field-label">
              {t('admin.alertForm.riskLevel')}
            </label>
            <select id="al-risk" className="field-input" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
              <option value="LOW">{t('risk.LOW')}</option>
              <option value="MEDIUM">{t('risk.MEDIUM')}</option>
              <option value="HIGH">{t('risk.HIGH')}</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="al-action" className="field-label">
            {t('admin.alertForm.action')}
          </label>
          <input id="al-action" className="field-input" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
        </div>
        <Button type="submit" loading={submitting}>
          {t('admin.alertForm.title')}
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="font-semibold mb-3">{t('admin.alerts')}</h2>
        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={retry} />}
        <ul className="space-y-3">
          {(data?.alerts ?? []).slice(0, 20).map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={riskTone(a.riskLevel)}>{t(`risk.${a.riskLevel}`)}</Badge>
                <Badge tone="gray">{t(`alerts.types.${a.type}`)}</Badge>
                {a.cropName && <Badge tone="blue">{a.cropName}</Badge>}
              </div>
              <p className="mt-2 font-medium text-sm">{a.title}</p>
              <p className="text-sm text-ink-600">{a.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
