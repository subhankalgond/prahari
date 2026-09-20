import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../contexts/ToastContext';
import type { LibraryEntry } from '../../types';
import { Badge, Button, ConfirmDialog, ErrorState, PageHeader, severityTone, Spinner } from '../../components/ui';
import { Modal } from '../../components/Modal';

interface FormState {
  name: string;
  cropName: string;
  kind: 'DISEASE' | 'PEST';
  description: string;
  symptoms: string;
  causes: string;
  favorable: string;
  prevention: string;
  management: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
}

const EMPTY: FormState = {
  name: '',
  cropName: '',
  kind: 'DISEASE',
  description: '',
  symptoms: '',
  causes: '',
  favorable: '',
  prevention: '',
  management: '',
  severity: 'MODERATE',
};

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function LibraryAdmin({ kind }: { kind: 'DISEASE' | 'PEST' }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, loading, error, retry } = useFetch<{ entries: LibraryEntry[] }>(
    `/api/admin/${kind === 'DISEASE' ? 'diseases' : 'pests'}`,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryEntry | null>(null);
  const [deleting, setDeleting] = useState<LibraryEntry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const entries = (data?.entries ?? []).filter((e) => e.kind === kind);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, kind });
    setModalOpen(true);
  }

  function openEdit(entry: LibraryEntry) {
    setEditing(entry);
    setForm({
      name: entry.name,
      cropName: entry.cropName,
      kind: entry.kind,
      description: entry.description,
      symptoms: entry.symptoms.join('\n'),
      causes: entry.causes.join('\n'),
      favorable: (entry.favorable ?? []).join('\n'),
      prevention: entry.prevention.join('\n'),
      management: entry.management.join('\n'),
      severity: entry.severity,
    });
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      cropName: form.cropName.trim(),
      kind: form.kind,
      description: form.description.trim(),
      symptoms: toLines(form.symptoms),
      causes: toLines(form.causes),
      favorable: toLines(form.favorable),
      prevention: toLines(form.prevention),
      management: toLines(form.management),
      severity: form.severity,
      isActive: true,
    };
    try {
      if (editing) {
        await api.put(`/api/admin/${kind === 'DISEASE' ? 'diseases' : 'pests'}/${editing.id}`, payload);
      } else {
        await api.post(`/api/admin/${kind === 'DISEASE' ? 'diseases' : 'pests'}`, payload);
      }
      toast('success', t('common.save'));
      setModalOpen(false);
      retry();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    try {
      await api.del(`/api/admin/${kind === 'DISEASE' ? 'diseases' : 'pests'}/${deleting.id}`);
      toast('success', t('common.delete'));
      setDeleting(null);
      retry();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    }
  }

  return (
    <div>
      <PageHeader title={kind === 'DISEASE' ? t('admin.diseases') : t('admin.pests')} />
      <div className="mb-4">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" aria-hidden />
          {t('admin.diseaseTable.add')}
        </Button>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-ink-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">{t('admin.diseaseTable.name')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.diseaseTable.crop')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.diseaseTable.severity')}</th>
                <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{entry.name}</td>
                  <td className="px-4 py-3 text-ink-600">{entry.cropName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={severityTone(entry.severity)}>{t(`severity.${entry.severity}`)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(entry)} className="!min-h-[36px] !px-3 !py-1.5 text-xs">
                        <Pencil className="w-3.5 h-3.5" aria-hidden />
                        {t('common.edit')}
                      </Button>
                      <Button variant="danger" onClick={() => setDeleting(entry)} className="!min-h-[36px] !px-3 !py-1.5 text-xs">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-600">
                    {t('admin.diseaseTable.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.diseaseTable.edit') : t('admin.diseaseTable.add')} wide>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="le-name" className="field-label">
                {t('admin.diseaseTable.name')}
              </label>
              <input id="le-name" className="field-input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="le-crop" className="field-label">
                {t('admin.diseaseTable.crop')}
              </label>
              <input id="le-crop" className="field-input" required minLength={2} value={form.cropName} onChange={(e) => setForm({ ...form, cropName: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="le-desc" className="field-label">
              {t('admin.diseaseTable.description')}
            </label>
            <textarea id="le-desc" rows={3} required minLength={10} className="field-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label htmlFor="le-symptoms" className="field-label">
              {t('admin.diseaseTable.symptomsOnePerLine')}
            </label>
            <textarea id="le-symptoms" rows={3} required className="field-input" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
          </div>
          <div>
            <label htmlFor="le-causes" className="field-label">
              {t('admin.diseaseTable.causesOnePerLine')}
            </label>
            <textarea id="le-causes" rows={2} required className="field-input" value={form.causes} onChange={(e) => setForm({ ...form, causes: e.target.value })} />
          </div>
          <div>
            <label htmlFor="le-fav" className="field-label">
              {t('admin.diseaseTable.favourableOptional')}
            </label>
            <textarea id="le-fav" rows={2} className="field-input" value={form.favorable} onChange={(e) => setForm({ ...form, favorable: e.target.value })} />
          </div>
          <div>
            <label htmlFor="le-prev" className="field-label">
              {t('admin.diseaseTable.preventionOnePerLine')}
            </label>
            <textarea id="le-prev" rows={2} required className="field-input" value={form.prevention} onChange={(e) => setForm({ ...form, prevention: e.target.value })} />
          </div>
          <div>
            <label htmlFor="le-mgmt" className="field-label">
              {t('admin.diseaseTable.managementOnePerLine')}
            </label>
            <textarea id="le-mgmt" rows={2} required className="field-input" value={form.management} onChange={(e) => setForm({ ...form, management: e.target.value })} />
          </div>
          <div>
            <label htmlFor="le-sev" className="field-label">
              {t('admin.diseaseTable.severity')}
            </label>
            <select id="le-sev" className="field-input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as FormState['severity'] })}>
              <option value="LOW">{t('severity.LOW')}</option>
              <option value="MODERATE">{t('severity.MODERATE')}</option>
              <option value="HIGH">{t('severity.HIGH')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t('admin.diseaseTable.deleteConfirm')}
        body={deleting?.name ?? ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={onDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
