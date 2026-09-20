import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Camera, ImagePlus, Leaf, ScanSearch, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { Crop } from '../types';
import { Button, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

export default function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const cropsQ = useRef<{ crops: Crop[] } | null>(null);
  const [crops, setCrops] = useState<Crop[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [cropId, setCropId] = useState(params.get('crop') ?? '');
  const [stage, setStage] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [offline, setOffline] = useState(!navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ crops: Crop[] }>('/api/crops')
      .then((res) => setCrops(res.crops))
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : t('common.error')));
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [t]);

  useEffect(() => {
    if (!submitting) return;
    const timer = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, 3));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [submitting]);

  const cropsReady = useMemo(() => crops !== null, [crops]);
  void cropsQ;

  function pickImage(e: ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    setFileError('');
    if (!chosen) return;
    if (!ACCEPTED.includes(chosen.type)) {
      setFileError('Only JPG, PNG or WEBP images are supported.');
      return;
    }
    if (chosen.size > MAX_BYTES) {
      setFileError('Image is larger than 10 MB. Choose a smaller photo.');
      return;
    }
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cropId) {
      toast('error', t('scan.needImage'));
      return;
    }
    if (!file) {
      setFileError(t('scan.needImage'));
      return;
    }
    if (offline) {
      toast('error', t('scan.needInternet'));
      return;
    }
    setSubmitting(true);
    setStep(0);
    try {
      const fd = new FormData();
      fd.append('cropId', cropId);
      if (stage) fd.append('growthStage', stage);
      if (symptoms.trim()) fd.append('symptoms', symptoms.trim());
      fd.append('image', file);
      const res = await api.post<{ scanId: string }>('/api/scans', fd);
      toast('success', t('scan.completed'));
      navigate(`/scan/result/${res.scanId}`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
      setSubmitting(false);
    }
  }

  if (!cropsReady && !loadError) return <Spinner />;
  if (loadError) return <ErrorState message={loadError} />;

  if (crops && crops.length === 0) {
    return (
      <EmptyState
        icon={<Leaf className="w-10 h-10" aria-hidden />}
        title={t('scan.needCrop')}
        action={
          <Link to="/crops/add" className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">
            {t('scan.addCropFirst')}
          </Link>
        }
      />
    );
  }

  return (
    <div className="max-w-xl">
      <PageHeader title={t('scan.title')} subtitle={t('scan.subtitle')} />

      {offline && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3" role="alert">
          <WifiOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-amber-900">{t('scan.needInternet')}</p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="card p-5">
          <label htmlFor="scan-crop" className="field-label">
            {t('scan.selectCrop')}
          </label>
          <select id="scan-crop" className="field-input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            <option value="">--</option>
            {(crops ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {t('crops.stages.' + c.growthStage)}
              </option>
            ))}
          </select>

          <label htmlFor="scan-stage" className="field-label mt-4">
            {t('scan.selectStage')} <span className="text-ink-400 font-normal">({t('scan.optional')})</span>
          </label>
          <select id="scan-stage" className="field-input" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">--</option>
            {(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`crops.stages.${s}`)}
              </option>
            ))}
          </select>

          <label htmlFor="scan-symptoms" className="field-label mt-4">
            {t('scan.symptoms')} <span className="text-ink-400 font-normal">({t('scan.optional')})</span>
          </label>
          <textarea
            id="scan-symptoms"
            rows={2}
            className="field-input"
            placeholder={t('scan.symptomsPlaceholder')}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>

        <div className="card p-5">
          <p className="field-label">{t('scan.upload')}</p>
          {preview ? (
            <div>
              <img src={preview} alt="Crop preview" className="w-full max-h-80 object-contain rounded-xl border border-stone-200 bg-stone-50" />
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="w-4 h-4" aria-hidden />
                  {t('scan.changeImage')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-sm font-medium text-ink-600 hover:border-primary-400 hover:text-primary-800 min-h-[120px]"
              >
                <ImagePlus className="w-6 h-6" aria-hidden />
                {t('scan.upload')}
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-sm font-medium text-ink-600 hover:border-primary-400 hover:text-primary-800 min-h-[120px]"
              >
                <Camera className="w-6 h-6" aria-hidden />
                {t('scan.takePhoto')}
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickImage} />
          <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={pickImage} />
          <p className="mt-3 text-xs text-ink-600">{t('scan.formats')}</p>
          {fileError && (
            <p className="field-error" role="alert">
              {fileError}
            </p>
          )}
        </div>

        {submitting ? (
          <div className="card p-6" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-700">
                <ScanSearch className="w-5 h-5 animate-pulse" aria-hidden />
              </span>
              <p className="font-semibold">{t('scan.analyzing')}</p>
            </div>
            <ol className="mt-4 space-y-2.5 text-sm">
              {[t('scan.step1'), t('scan.step2'), t('scan.step3')].map((label, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      step > i ? 'bg-green-600 text-white' : step === i ? 'bg-primary-700 text-white' : 'bg-stone-200 text-stone-500'
                    }`}
                    aria-hidden
                  >
                    {step > i ? '✓' : i + 1}
                  </span>
                  <span className={step >= i ? 'text-ink-900 font-medium' : 'text-ink-400'}>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <Button type="submit" className="w-full min-h-[48px] text-base" disabled={!cropId || !file}>
            <ScanSearch className="w-5 h-5" aria-hidden />
            {t('scan.analyze')}
          </Button>
        )}

        {offline && (
          <p className="flex items-center gap-2 text-sm text-ink-600">
            <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden />
            {t('common.offline')}
          </p>
        )}
      </form>
    </div>
  );
}
