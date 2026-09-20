import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Sprout,
  ScanSearch,
  BellRing,
  CloudSun,
  CloudRain,
  BookOpen,
  History,
  UserRound,
  CircleHelp,
  Bell,
  LogOut,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelect } from '../components/LanguageSelect';
import { OfflineBanner } from '../components/OfflineBanner';
import VoiceAssistant from '../components/VoiceAssistant';

const NAV = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/crops', key: 'nav.crops', icon: Sprout },
  { to: '/scan', key: 'nav.scan', icon: ScanSearch },
  { to: '/alerts', key: 'nav.alerts', icon: BellRing },
  { to: '/weather', key: 'nav.weather', icon: CloudSun },
  { to: '/spray', key: 'nav.spray', icon: CloudRain },
  { to: '/library', key: 'nav.library', icon: BookOpen },
  { to: '/history', key: 'nav.history', icon: History },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
  { to: '/help', key: 'nav.help', icon: CircleHelp },
];

const MOBILE_NAV = [
  { to: '/dashboard', key: 'nav.home', icon: LayoutDashboard },
  { to: '/crops', key: 'nav.crops', icon: Sprout },
  { to: '/scan', key: 'nav.scan', icon: ScanSearch, prominent: true },
  { to: '/alerts', key: 'nav.alerts', icon: BellRing },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
];

export default function FarmerLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get<{ unread: number }>('/api/notifications')
      .then((res) => {
        if (active) setUnread(res.unread);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-stone-200 bg-white sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-stone-100">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
            <Sprout className="w-5 h-5 text-white" aria-hidden />
          </span>
          <span className="font-bold text-lg tracking-tight text-primary-900">Prahari</span>
        </Link>
        <nav aria-label="Main" className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-900' : 'text-ink-600 hover:bg-stone-50 hover:text-ink-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden />
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-100 p-4 space-y-3">
          <LanguageSelect className="w-full" />
          <SignOutButton />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop offline banner */}
        <div className="hidden md:block">
          <OfflineBanner />
        </div>
        {/* Mobile top bar */}
        <OfflineBanner />
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200">
          <div className="flex items-center justify-between px-4 h-14">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-700">
                <Sprout className="w-4.5 h-4.5 text-white w-5 h-5" aria-hidden />
              </span>
              <span className="font-bold text-primary-900">Prahari</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSelect />
              <Link to="/dashboard#notifications" aria-label={t('notifications.title')} className="relative p-2 -m-1">
                <Bell className="w-5 h-5 text-ink-600" aria-hidden />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-content mx-auto px-4 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <VoiceAssistant />

      {/* Bottom navigation (mobile) */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-primary-800' : 'text-ink-600'
                }`
              }
            >
              {item.prominent ? (
                <span className="inline-flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-primary-700 text-white shadow-card">
                  <item.icon className="w-6 h-6" aria-hidden />
                </span>
              ) : (
                <item.icon className="w-5 h-5" aria-hidden />
              )}
              {t(item.key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function SignOutButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <button
      type="button"
      onClick={() => {
        logout();
        navigate('/login');
      }}
      className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-stone-50 hover:text-ink-900"
    >
      <LogOut className="w-5 h-5" aria-hidden />
      {t('nav.logout')}
    </button>
  );
}
