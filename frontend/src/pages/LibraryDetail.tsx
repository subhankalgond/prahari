import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ListChecks, ShieldAlert, Sprout } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import type { LibraryEntry } from '../types';
import { Badge, ErrorState, severityTone, Spinner } from '../components/ui';
import { LanguageSelect } from '../components/LanguageSelect';
import { useAuth } from '../contexts/AuthContext';

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-ink-600">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" aria-hidden />
          {s}
        </li>
      ))}
    </ul>
  );
}

export default function LibraryDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, loading, error, retry } = useFetch<{ entry: LibraryEntry }>(`/api/diseases/${id}`, [id]);

  return (
    <div className="min-h-screen bg-canvas">
      {!user && (
        <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
          <div className="max-w-content mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/library" className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900">
              <ArrowLeft className="w-4 h-4" aria-hidden />
              {t('library.title')}
            </Link>
            <LanguageSelect />
          </div>
        </header>
      )}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {data?.entry && (
          <article>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{data.entry.name}</h1>
                <p className="mt-1 text-sm text-ink-600">
                  {data.entry.cropName} - {data.entry.kind === 'DISEASE' ? t('library.diseases') : t('library.pests')}
                </p>
              </div>
              <Badge tone={severityTone(data.entry.severity)}>{t(`severity.${data.entry.severity}`)}</Badge>
            </div>

            <section className="card p-5 mt-6">
              <h2 className="font-semibold">{t('library.overview')}</h2>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{data.entry.description}</p>
            </section>

            <section className="card p-5 mt-4">
              <h2 className="font-semibold">{t('library.symptoms')}</h2>
              <div className="mt-3">
                <List items={data.entry.symptoms} />
              </div>
            </section>

            <section className="card p-5 mt-4">
              <h2 className="font-semibold">{t('library.causes')}</h2>
              <div className="mt-3">
                <List items={data.entry.causes} />
              </div>
            </section>

            {data.entry.favorable && data.entry.favorable.length > 0 && (
              <section className="card p-5 mt-4">
                <h2 className="font-semibold">{t('library.favorable')}</h2>
                <div className="mt-3">
                  <List items={data.entry.favorable} />
                </div>
              </section>
            )}

            <section className="card p-5 mt-4">
              <h2 className="font-semibold">{t('library.prevention')}</h2>
              <div className="mt-3">
                <List items={data.entry.prevention} />
              </div>
            </section>

            <section className="card p-5 mt-4">
              <h2 className="font-semibold flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary-700" aria-hidden />
                {t('library.management')}
              </h2>
              <div className="mt-3">
                <List items={data.entry.management} />
              </div>
            </section>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-amber-900">{t('library.safety')}</p>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
              >
                <Sprout className="w-4 h-4" aria-hidden />
                {t('landing.scanCrop')}
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
