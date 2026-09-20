import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, LogOut, Save } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, PageHeader, SectionTitle } from '../components/ui';
import { LANGUAGES, setLanguage } from '../i18n';
import type { User } from '../types';

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    state: '',
    district: '',
    taluk: '',
    village: '',
    language: 'en',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      email: user.email ?? '',
      state: user.state,
      district: user.district,
      taluk: user.taluk ?? '',
      village: user.village ?? '',
      language: user.language,
    });
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put<{ user: User }>('/api/profile', form);
      setUser(res.user);
      setLanguage(form.language);
      toast('success', t('toasts.profileUpdated'));
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.put('/api/profile/password', { currentPassword: passwords.current, newPassword: passwords.next });
      toast('success', t('toasts.passwordChanged'));
      setPasswords({ current: '', next: '' });
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSavingPassword(false);
    }
  }

  function onLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('profile.title')} subtitle={`${t('profile.memberSince')} ${new Date(user.createdAt).toLocaleDateString()}`} />

      <form onSubmit={saveProfile} className="card p-6 space-y-5">
        <h2 className="font-semibold">{t('profile.personalInfo')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-name" className="field-label">
              {t('profile.name')}
            </label>
            <input id="p-name" className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="p-mobile" className="field-label">
              {t('profile.mobile')}
            </label>
            <input id="p-mobile" className="field-input" value={user.mobile} disabled />
          </div>
          <div>
            <label htmlFor="p-email" className="field-label">
              {t('profile.email')}
            </label>
            <input id="p-email" type="email" className="field-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="p-language" className="field-label">
              {t('profile.language')}
            </label>
            <select
              id="p-language"
              className="field-input"
              value={form.language}
              onChange={(e) => {
                setForm({ ...form, language: e.target.value });
                setLanguage(e.target.value);
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-600">{t('profile.languageNote')}</p>
          </div>
        </div>

        <h2 className="font-semibold pt-2">{t('profile.location')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-state" className="field-label">
              {t('profile.state')}
            </label>
            <input id="p-state" className="field-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="p-district" className="field-label">
              {t('profile.district')}
            </label>
            <input id="p-district" className="field-input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="p-taluk" className="field-label">
              {t('profile.taluk')}
            </label>
            <input id="p-taluk" className="field-input" value={form.taluk} onChange={(e) => setForm({ ...form, taluk: e.target.value })} />
          </div>
          <div>
            <label htmlFor="p-village" className="field-label">
              {t('profile.village')}
            </label>
            <input id="p-village" className="field-input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
          </div>
        </div>

        <Button type="submit" loading={savingProfile}>
          <Save className="w-4 h-4" aria-hidden />
          {t('profile.saveProfile')}
        </Button>
      </form>

      <div className="mt-8">
        <SectionTitle>{t('profile.security')}</SectionTitle>
        <form onSubmit={changePassword} className="card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-current" className="field-label">
                {t('profile.currentPassword')}
              </label>
              <input
                id="p-current"
                type="password"
                autoComplete="current-password"
                className="field-input"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="p-next" className="field-label">
                {t('profile.newPassword')}
              </label>
              <input
                id="p-next"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="field-input"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                required
              />
            </div>
          </div>
          <Button type="submit" variant="secondary" loading={savingPassword}>
            <KeyRound className="w-4 h-4" aria-hidden />
            {t('profile.updatePassword')}
          </Button>
        </form>
      </div>

      <div className="mt-8">
        <SectionTitle>{t('nav.help')}</SectionTitle>
        <div className="card p-6">
          <Link to="/help" className="text-sm font-semibold text-primary-800 hover:underline">
            {t('help.title')}
          </Link>
        </div>
      </div>

      <div className="mt-8 mb-4">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 min-h-[44px]"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}
