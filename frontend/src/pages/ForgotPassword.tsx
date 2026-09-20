import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui';
import { LanguageSelect } from '../components/LanguageSelect';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(t('auth.validation.identifierRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post<{ message: string; resetToken?: string; demoNotice?: string }>(
        '/api/auth/forgot-password',
        { identifier: identifier.trim() },
      );
      setToken(res.resetToken ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
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
        <div className="w-full max-w-md card p-6 md:p-8">
          <h1 className="text-2xl font-bold">{t('auth.forgotTitle')}</h1>
          <p className="mt-1 text-sm text-ink-600">{t('auth.forgotSubtitle')}</p>
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="identifier" className="field-label">
                {t('auth.identifier')}
              </label>
              <input
                id="identifier"
                className="field-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-invalid={Boolean(error)}
              />
              {error && <p className="field-error" role="alert">{error}</p>}
            </div>
            <Button type="submit" loading={submitting} className="w-full">
              {t('auth.sendReset')}
            </Button>
          </form>
          {token && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">{t('auth.resetTokenNotice')}</p>
              <p className="mt-2 font-mono break-all select-all">{token}</p>
              <Link to={`/reset-password?token=${encodeURIComponent(token)}`} className="mt-3 inline-block font-semibold underline">
                {t('auth.resetTitle')}
              </Link>
            </div>
          )}
          <p className="mt-6 text-sm text-center">
            <Link to="/login" className="font-medium text-primary-800 hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
