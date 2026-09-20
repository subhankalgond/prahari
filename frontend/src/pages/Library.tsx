import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Sprout } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { DiseaseCard } from '../components/Cards';
import { LanguageSelect } from '../components/LanguageSelect';
import { useAuth } from '../contexts/AuthContext';

export default function Library() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, loading, error, retry } = useFetch<{ entries: import('../types').LibraryEntry[] }>(
    '/api/diseases',
    [],
  );
  const [query, setQuery] = useState('');
  const [crop, setCrop] = useState('');
  const [kind, setKind] = useState('');
  const [severity, setSeverity] = useState('');

  const crops = useMemo(() => [...new Set((data?.entries ?? []).map((e) => e.cropName))].sort(), [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.entries ?? [])
      .filter((e) => (crop ? e.cropName === crop : true))
      .filter((e) => (kind ? e.kind === kind : true))
      .filter((e) => (severity ? e.severity === severity : true))
      .filter((e) =>
        q
          ? e.name.toLowerCase().includes(q) ||
            e.cropName.toLowerCase().includes(q) ||
            e.symptoms.some((s) => s.toLowerCase().includes(q))
          : true,
      );
  }, [data, query, crop, kind, severity]);

  return (
    <div className="min-h-screen bg-canvas">
      {!user && (
        <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
          <div className="max-w-content mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
                <Sprout className="w-5 h-5 text-white" aria-hidden />
              </span>
              <span className="font-bold text-lg text-primary-900">Prahari</span>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSelect className="hidden sm:inline-flex" />
              <Link to="/login" className="rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]">
                {t('landing.startMonitoring')}
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-content mx-auto px-4 py-8">
        <PageHeader title={t('library.title')} subtitle={t('library.subtitle')} />

        <div className="card p-4 mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              type="search"
              className="field-input pl-10"
              placeholder={t('library.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('library.searchPlaceholder')}
            />
          </div>
          <select className="field-input md:w-44" value={crop} onChange={(e) => setCrop(e.target.value)} aria-label={t('library.allCrops')}>
            <option value="">{t('library.allCrops')}</option>
            {crops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="field-input md:w-44" value={kind} onChange={(e) => setKind(e.target.value)} aria-label={t('library.allTypes')}>
            <option value="">{t('library.allTypes')}</option>
            <option value="DISEASE">{t('library.diseases')}</option>
            <option value="PEST">{t('library.pests')}</option>
          </select>
          <select className="field-input md:w-44" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label={t('library.severity')}>
            <option value="">{t('library.allSeverities')}</option>
            <option value="LOW">{t('severity.LOW')}</option>
            <option value="MODERATE">{t('severity.MODERATE')}</option>
            <option value="HIGH">{t('severity.HIGH')}</option>
          </select>
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && filtered.length === 0 && <EmptyState title={t('library.empty')} />}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <DiseaseCard key={entry.id} entry={entry} />
          ))}
        </div>
        <p className="mt-6 text-xs text-ink-600">{t('library.safety')}</p>
      </main>
    </div>
  );
}
