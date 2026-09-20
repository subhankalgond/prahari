import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui';
import { LanguageSelect } from '../components/LanguageSelect';
import { LANGUAGES, setLanguage } from '../i18n';

const STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterData>({
    name: '',
    mobile: '',
    email: '',
    password: '',
    state: '',
    district: '',
    taluk: '',
    village: '',
    language: i18n.language.slice(0, 2),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof RegisterData>(key: K, value: RegisterData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = t('auth.validation.nameRequired');
    if (!/^\+?[0-9]{10,14}$/.test(form.mobile.trim())) next.mobile = t('auth.validation.mobileInvalid');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = t('auth.validation.emailInvalid');
    if (form.password.length < 8) next.password = t('auth.validation.passwordShort');
    if (!form.state) next.state = t('auth.validation.stateRequired');
    if (form.district.trim().length < 2) next.district = t('auth.validation.districtRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ ...form, language: form.language || 'en' });
      toast('success', t('toasts.registered'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('common.error') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
            <Sprout className="w-5 h-5 text-white" aria-hidden />
          </span>
          <span className="font-bold text-primary-900">Prahari</span>
        </Link>
        <LanguageSelect />
      </div>
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="card p-6 md:p-8">
            <h1 className="text-2xl font-bold">{t('auth.registerTitle')}</h1>
            <p className="mt-1 text-sm text-ink-600">{t('auth.registerSubtitle')}</p>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="field-label">
                  {t('auth.fullName')}
                </label>
                <input
                  id="name"
                  className="field-input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mobile" className="field-label">
                    {t('auth.mobile')}
                  </label>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="tel"
                    className="field-input"
                    placeholder="9876543210"
                    value={form.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                    aria-invalid={Boolean(errors.mobile)}
                  />
                  {errors.mobile && <p className="field-error" role="alert">{errors.mobile}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="field-label">
                    {t('auth.emailOptional')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="password" className="field-label">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="field-input"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="field-label">
                    {t('auth.state')}
                  </label>
                  <select
                    id="state"
                    className="field-input"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    aria-invalid={Boolean(errors.state)}
                  >
                    <option value="">--</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="field-error" role="alert">{errors.state}</p>}
                </div>
                <div>
                  <label htmlFor="district" className="field-label">
                    {t('auth.district')}
                  </label>
                  <input
                    id="district"
                    className="field-input"
                    value={form.district}
                    onChange={(e) => set('district', e.target.value)}
                    aria-invalid={Boolean(errors.district)}
                  />
                  {errors.district && <p className="field-error" role="alert">{errors.district}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taluk" className="field-label">
                    {t('auth.taluk')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
                  </label>
                  <input id="taluk" className="field-input" value={form.taluk} onChange={(e) => set('taluk', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="village" className="field-label">
                    {t('auth.village')} <span className="text-ink-400 font-normal">({t('common.optional')})</span>
                  </label>
                  <input id="village" className="field-input" value={form.village} onChange={(e) => set('village', e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="language" className="field-label">
                  {t('auth.language')}
                </label>
                <select
                  id="language"
                  className="field-input"
                  value={form.language}
                  onChange={(e) => {
                    set('language', e.target.value);
                    setLanguage(e.target.value);
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.form && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {errors.form}
                </div>
              )}
              <Button type="submit" loading={submitting} className="w-full">
                {t('auth.signUp')}
              </Button>
            </form>
            <p className="mt-6 text-sm text-center text-ink-600">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="font-semibold text-primary-800 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
