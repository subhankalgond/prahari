import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Sprout, ScanSearch, Bug, Leaf, BellRing, Settings as SettingsIcon, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelect } from '../components/LanguageSelect';
import { OfflineBanner } from '../components/OfflineBanner';

const NAV = [
  { to: '/admin', key: 'admin.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/farmers', key: 'admin.farmers', icon: Sprout },
  { to: '/admin/crops', key: 'admin.crops', icon: Sprout },
  { to: '/admin/scans', key: 'admin.scans', icon: ScanSearch },
  { to: '/admin/diseases', key: 'admin.diseases', icon: Leaf },
  { to: '/admin/pests', key: 'admin.pests', icon: Bug },
  { to: '/admin/alerts', key: 'admin.alerts', icon: BellRing },
  { to: '/admin/settings', key: 'admin.settingsNav', icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen md:flex bg-canvas">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-stone-200 bg-white sticky top-0 h-screen">
        <Link to="/admin" className="flex items-center gap-2.5 px-5 h-16 border-b border-stone-100">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-900">
            <ShieldCheck className="w-5 h-5 text-white" aria-hidden />
          </span>
          <div>
            <p className="font-bold text-primary-900 leading-tight">Prahari</p>
            <p className="text-xs text-ink-600">{t('admin.title')}</p>
          </div>
        </Link>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
        <div className="border-t border-stone-100 p-4 space-y-2">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-stone-50 hover:text-ink-900 w-full"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <OfflineBanner />
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200">
          <div className="flex items-center justify-between px-4 h-14">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-900">
                <ShieldCheck className="w-4 h-4 text-white" aria-hidden />
              </span>
              <span className="font-bold text-primary-900">{t('admin.title')}</span>
            </Link>
            <LanguageSelect />
          </div>
          <nav aria-label="Admin mobile" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isActive ? 'bg-primary-700 text-white' : 'bg-stone-100 text-ink-600'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="max-w-content mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
