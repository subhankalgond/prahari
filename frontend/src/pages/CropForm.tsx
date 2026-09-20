import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import FieldMap from '../components/FieldMap';
import { Button, ErrorState, PageHeader, Spinner } from '../components/ui';

interface FormState {
  name: string;
  variety: string;
  fieldName: string;
  areaValue: string;
  areaUnit: string;
  sowingDate: string;
  harvestDate: string;
  growthStage: string;
  soilType: string;
  irrigationType: string;
  location: string;
  boundary: { lat: number; lng: number }[] | null;
}

const EMPTY: FormState = {
  name: '',
  variety: '',
  fieldName: '',
  areaValue: '',
  areaUnit: 'acre',
  sowingDate: '',
  harvestDate: '',
  growthStage: 'VEGETATIVE',
  soilType: '',
  irrigationType: '',
  location: '',
  boundary: null,
};

export default function CropForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editing = Boolean(id);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ crop: { name: string; variety: string | null; fieldName: string | null; areaValue: number; areaUnit: string; sowingDate: string; harvestDate: string | null; growthStage: string; soilType: string | null; irrigationType: string | null; location: string | null } }>(`/api/crops/${id}`)
      .then((res) => {
        const c = res.crop;
        setForm({
          name: c.name,
          variety: c.variety ?? '',
          fieldName: c.fieldName ?? '',
          areaValue: String(c.areaValue),
          areaUnit: c.areaUnit,
          sowingDate: c.sowingDate.slice(0, 10),
          harvestDate: c.harvestDate ? c.harvestDate.slice(0, 10) : '',
          growthStage: c.growthStage,
          soilType: c.soilType ?? '',
          irrigationType: c.irrigationType ?? '',
          location: c.location ?? '',
          boundary: (c as { fieldBoundary?: { lat: number; lng: number }[] | null }).fieldBoundary ?? null,
        });
        setLoading(false);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : t('common.error'));
        setLoading(false);
      });
  }, [id, t]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = t('crops.cropNamePlaceholder');
    const area = Number(form.areaValue);
    if (!form.areaValue || Number.isNaN(area) || area <= 0) next.areaValue = '> 0';
    if (!form.sowingDate) next.sowingDate = t('crops.sowingDate');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        variety: form.variety || null,
        fieldName: form.fieldName || null,
        areaValue: Number(form.areaValue),
        areaUnit: form.areaUnit,
        sowingDate: form.sowingDate,
        harvestDate: form.harvestDate || null,
        growthStage: form.growthStage,
        soilType: form.soilType || null,
        irrigationType: form.irrigationType || null,
        location: form.location || null,
        fieldBoundary: form.boundary && form.boundary.length >= 3 ? form.boundary : null,
      };
      if (editing) {
        await api.put(`/api/crops/${id}`, payload);
        toast('success', t('toasts.cropUpdated'));
        navigate(`/crops/${id}`);
      } else {
        const res = await api.post<{ crop: { id: string } }>('/api/crops', payload);
        toast('success', t('toasts.cropAdded'));
        navigate(`/crops/${res.crop.id}`);
      }
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('common.error') });
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div className="max-w-2xl">
      <Link to={editing ? `/crops/${id}` : '/crops'} className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {t('common.back')}
      </Link>
      <PageHeader title={editing ? t('crops.editTitle') : t('crops.addTitle')} subtitle={t('crops.addSubtitle')} />

      <form onSubmit={onSubmit} noValidate className="card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="crop-name" className="field-label">
              {t('crops.cropName')}
            </label>
            <input id="crop-name" className="field-input" placeholder={t('crops.cropNamePlaceholder')} value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
            {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="crop-variety" className="field-label">
              {t('crops.variety')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
            </label>
            <input id="crop-variety" className="field-input" placeholder={t('crops.varietyPlaceholder')} value={form.variety} onChange={(e) => set('variety', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label htmlFor="crop-field" className="field-label">
              {t('crops.fieldName')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
            </label>
            <input id="crop-field" className="field-input" placeholder={t('crops.fieldNamePlaceholder')} value={form.fieldName} onChange={(e) => set('fieldName', e.target.value)} />
          </div>
          <div>
            <label htmlFor="crop-area" className="field-label">
              {t('crops.area')}
            </label>
            <input
              id="crop-area"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              className="field-input"
              value={form.areaValue}
              onChange={(e) => set('areaValue', e.target.value)}
              aria-invalid={Boolean(errors.areaValue)}
            />
            {errors.areaValue && <p className="field-error" role="alert">{errors.areaValue}</p>}
          </div>
          <div>
            <label htmlFor="crop-unit" className="field-label">
              {t('crops.unit')}
            </label>
            <select id="crop-unit" className="field-input" value={form.areaUnit} onChange={(e) => set('areaUnit', e.target.value)}>
              <option value="acre">acre</option>
              <option value="hectare">hectare</option>
              <option value="gunta">gunta</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="crop-sowing" className="field-label">
              {t('crops.sowingDate')}
            </label>
            <input id="crop-sowing" type="date" className="field-input" value={form.sowingDate} onChange={(e) => set('sowingDate', e.target.value)} aria-invalid={Boolean(errors.sowingDate)} />
            {errors.sowingDate && <p className="field-error" role="alert">{errors.sowingDate}</p>}
          </div>
          <div>
            <label htmlFor="crop-harvest" className="field-label">
              {t('crops.harvestDate')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
            </label>
            <input id="crop-harvest" type="date" className="field-input" value={form.harvestDate} onChange={(e) => set('harvestDate', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="crop-stage" className="field-label">
              {t('crops.growthStage')}
            </label>
            <select id="crop-stage" className="field-input" value={form.growthStage} onChange={(e) => set('growthStage', e.target.value)}>
              {(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY'] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`crops.stages.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="crop-soil" className="field-label">
              {t('crops.soilType')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
            </label>
            <select id="crop-soil" className="field-input" value={form.soilType} onChange={(e) => set('soilType', e.target.value)}>
              <option value="">--</option>
              {(['BLACK', 'ALLUVIAL', 'RED', 'LATERITE', 'SANDY', 'LOAMY'] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`crops.soils.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="crop-irrigation" className="field-label">
              {t('crops.irrigationType')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
            </label>
            <select id="crop-irrigation" className="field-input" value={form.irrigationType} onChange={(e) => set('irrigationType', e.target.value)}>
              <option value="">--</option>
              {(['RAINFED', 'CANAL', 'WELL', 'BOREWELL', 'DRIP', 'SPRINKLER'] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`crops.irrigation.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="crop-location" className="field-label">
              {t('crops.location')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
            </label>
            <input id="crop-location" className="field-input" placeholder={t('crops.locationPlaceholder')} value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>

        <div>
          <span className="field-label">
            {t('fieldMap.title')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
          </span>
          <FieldMap value={form.boundary} onChange={(b) => set('boundary', b)} />
        </div>

        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errors.form}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={submitting}>
            {editing ? t('common.saveChanges') : t('common.save')}
          </Button>
          <Link to={editing ? `/crops/${id}` : '/crops'} className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-stone-50 min-h-[44px]">
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}
