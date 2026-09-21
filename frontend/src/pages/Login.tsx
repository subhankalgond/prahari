import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui';
import { LanguageSelect } from '../components/LanguageSelect';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Show the demo credentials hint only when the backend runs in demo mode.
  useEffect(() => {
    let active = true;
    api
      .get<{ demoMode?: boolean }>('/api/health')
      .then((h) => {
        if (active) setIsDemoMode(Boolean(h.demoMode));
      })
      .catch(() => {
        /* backend unreachable: hide the hint */
      });
    return () => {
      active = false;
    };
  }, []);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  function validate(): boolean {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = t('auth.validation.identifierRequired');
    if (!password) next.password = t('auth.validation.passwordRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      toast('success', t('toasts.signedIn'));
      navigate(user.role === 'ADMIN' ? '/admin' : from, { replace: true });
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
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="card p-6 md:p-8">
            <h1 className="text-2xl font-bold">{t('auth.loginTitle')}</h1>
            <p className="mt-1 text-sm text-ink-600">{t('auth.loginSubtitle')}</p>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="identifier" className="field-label">
                  {t('auth.identifier')}
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  className="field-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                />
                {errors.identifier && (
                  <p id="identifier-error" className="field-error" role="alert">
                    {errors.identifier}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="field-label">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="field-input pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden /> : <Eye className="w-5 h-5" aria-hidden />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="field-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-primary-700 focus:ring-primary-600"
                  />
                  {t('auth.rememberMe')}
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary-800 hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              {errors.form && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {errors.form}
                </div>
              )}
              <Button type="submit" loading={submitting} className="w-full">
                {t('auth.signIn')}
              </Button>
            </form>
            <p className="mt-6 text-sm text-center text-ink-600">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-semibold text-primary-800 hover:underline">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
          {isDemoMode && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">{t('auth.demoHint')}</p>
              <p className="mt-1">{t('auth.demoFarmer')}</p>
              <p>{t('auth.demoAdmin')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
