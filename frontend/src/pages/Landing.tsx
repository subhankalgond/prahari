import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  ScanSearch,
  BellRing,
  CloudSun,
  HeartPulse,
  Languages,
  BookOpen,
  Check,
  ArrowRight,
  MapPin,
  CloudRain,
  Clock,
  Volume2,
} from 'lucide-react';
import { LanguageSelect } from '../components/LanguageSelect';

export default function Landing() {
  const { t } = useTranslation();

  const features = [
    { icon: ScanSearch, title: t('landing.scanTitle'), body: t('landing.scanBody') },
    { icon: BellRing, title: t('landing.alertTitle'), body: t('landing.alertBody') },
    { icon: CloudSun, title: t('landing.weatherTitle'), body: t('landing.weatherBody') },
    { icon: HeartPulse, title: t('landing.healthTitle'), body: t('landing.healthBody') },
    { icon: Languages, title: t('landing.langTitle'), body: t('landing.langBody') },
    { icon: BookOpen, title: t('landing.libraryTitle'), body: t('landing.libraryBody') },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-stone-200">
        <div className="max-w-content mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
              <Sprout className="w-5 h-5 text-white" aria-hidden />
            </span>
            <span className="font-bold text-lg tracking-tight text-primary-900">Prahari</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelect className="hidden sm:inline-flex" />
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-50 min-h-[44px]"
            >
              {t('auth.signIn')}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
            >
              {t('landing.startMonitoring')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-content mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-5 text-lg text-ink-600 max-w-xl">{t('landing.heroSubtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-6 py-3 text-base font-semibold text-white hover:bg-primary-800 min-h-[48px]"
              >
                {t('landing.startMonitoring')}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-800 border border-stone-300 hover:bg-stone-50 min-h-[48px]"
              >
                {t('landing.scanCrop')}
              </Link>
            </div>
          </div>
          {/* Hero visual: an inline SVG field illustration, no stock AI imagery */}
          <div className="hidden md:block" aria-hidden>
            <svg viewBox="0 0 520 380" className="w-full h-auto" role="img" aria-label="">
              <rect x="0" y="250" width="520" height="130" rx="12" fill="#D1FAE5" />
              <rect x="0" y="300" width="520" height="80" rx="12" fill="#A7F3D0" />
              <path d="M60 300 C60 220 90 200 120 190 C110 250 100 280 60 300 Z" fill="#047857" />
              <path d="M120 300 C120 210 150 190 180 175 C170 240 160 275 120 300 Z" fill="#059669" />
              <path d="M180 300 C180 225 205 205 235 195 C225 255 215 280 180 300 Z" fill="#047857" />
              <path d="M240 300 C240 205 270 185 300 170 C290 235 280 272 240 300 Z" fill="#065F46" />
              <circle cx="420" cy="90" r="44" fill="#FCD34D" />
              <path d="M20 250 Q260 210 500 250" stroke="#10B981" strokeWidth="3" fill="none" strokeDasharray="1 10" strokeLinecap="round" />
              <g transform="translate(330,120)">
                <rect x="0" y="0" width="150" height="96" rx="14" fill="#ffffff" stroke="#A8A29E" />
                <rect x="12" y="14" width="52" height="52" rx="8" fill="#ECFDF5" stroke="#10B981" />
                <path d="M38 52 C38 34 48 30 58 26 C52 42 46 48 38 52 Z" fill="#047857" />
                <rect x="76" y="20" width="60" height="8" rx="4" fill="#D6D3D1" />
                <rect x="76" y="38" width="44" height="8" rx="4" fill="#E7E5E4" />
                <rect x="76" y="56" width="52" height="8" rx="4" fill="#E7E5E4" />
                <rect x="12" y="76" width="124" height="8" rx="4" fill="#FDE68A" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="max-w-content mx-auto px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('landing.pillarsTitle')}</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {[
            { icon: MapPin, title: t('landing.pillarMapTitle'), body: t('landing.pillarMapBody') },
            { icon: CloudRain, title: t('landing.pillarForecastTitle'), body: t('landing.pillarForecastBody') },
            { icon: Clock, title: t('landing.pillarWindowTitle'), body: t('landing.pillarWindowBody') },
            { icon: Volume2, title: t('landing.pillarVoiceTitle'), body: t('landing.pillarVoiceBody') },
          ].map((p) => (
            <div key={p.title} className="card p-6 flex gap-4">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-primary-50 text-primary-800 shrink-0">
                <p.icon className="w-5 h-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-content mx-auto px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('landing.howItWorks')}</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-700 text-white font-bold">
                {n}
              </span>
              <h3 className="mt-4 font-semibold text-lg">{t(`landing.how${n}Title`)}</h3>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{t(`landing.how${n}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature sections */}
      <section className="max-w-content mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-primary-50 text-primary-700">
                <f.icon className="w-6 h-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Prahari */}
      <section className="bg-primary-900 text-white">
        <div className="max-w-content mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('landing.whyTitle')}</h2>
              <p className="mt-4 text-primary-100">{t('landing.heroSubtitle')}</p>
            </div>
            <ul className="space-y-4">
              {['why1', 'why2', 'why3', 'why4'].map((k) => (
                <li key={k} className="flex gap-3">
                  <Check className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" aria-hidden />
                  <span className="text-primary-50">{t(`landing.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-content mx-auto px-4 py-16">
        <div className="card p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('landing.ctaTitle')}</h2>
          <p className="mt-3 text-ink-600 max-w-xl mx-auto">{t('landing.ctaBody')}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center rounded-lg bg-primary-700 px-6 py-3 text-base font-semibold text-white hover:bg-primary-800 min-h-[48px]"
            >
              {t('landing.startMonitoring')}
            </Link>
            <Link
              to="/library"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-800 border border-stone-300 hover:bg-stone-50 min-h-[48px]"
            >
              {t('library.title')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-content mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
                <Sprout className="w-5 h-5 text-white" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-primary-900">Prahari</p>
                <p className="text-xs text-ink-600">{t('app.tagline')}</p>
              </div>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/library" className="text-ink-600 hover:text-ink-900">
                {t('library.title')}
              </Link>
              <Link to="/help" className="text-ink-600 hover:text-ink-900">
                {t('nav.help')}
              </Link>
              <Link to="/terms" className="text-ink-600 hover:text-ink-900">
                Terms &amp; Conditions
              </Link>
              <Link to="/privacy" className="text-ink-600 hover:text-ink-900">
                Privacy Policy
              </Link>
            </nav>
          </div>
          <p className="mt-8 text-xs text-ink-600 max-w-3xl">{t('landing.footerNote')}</p>
          <p className="mt-2 text-xs text-ink-400">© 2026 Prahari. prahari.in</p>
        </div>
      </footer>
    </div>
  );
}
