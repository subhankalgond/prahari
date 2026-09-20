import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui';
import { useToast } from '../contexts/ToastContext';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t('auth.validation.passwordShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.validation.passwordsMismatch'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/auth/reset-password', { token: token.trim(), password });
      toast('success', t('auth.resetSuccess'));
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
            <Sprout className="w-5 h-5 text-white" aria-hidden />
          </span>
          <span className="font-bold text-primary-900">Prahari</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md card p-6 md:p-8">
          <h1 className="text-2xl font-bold">{t('auth.resetTitle')}</h1>
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="token" className="field-label">
                Reset token
              </label>
              <input id="token" className="field-input font-mono" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div>
              <label htmlFor="new-password" className="field-label">
                {t('auth.newPassword')}
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="field-label">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="field-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={submitting} className="w-full">
              {t('auth.resetSubmit')}
            </Button>
          </form>
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
