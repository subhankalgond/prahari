import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Phone } from 'lucide-react';
import { PageHeader } from '../components/ui';

const FAQ_KEYS = ['howScan', 'howAdd', 'howAlerts', 'aiLimits'] as const;

export default function Help() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>('howScan');

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('help.title')} subtitle={t('help.subtitle')} />

      <section>
        <h2 className="font-semibold mb-3">{t('help.faqTitle')}</h2>
        <div className="space-y-3">
          {FAQ_KEYS.map((key) => (
            <div key={key} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === key ? null : key)}
                aria-expanded={open === key}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-medium"
              >
                {t(`help.${key}Title`)}
                <ChevronDown className={`w-5 h-5 shrink-0 text-ink-600 transition-transform ${open === key ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {open === key && <p className="px-5 pb-5 text-sm text-ink-600 leading-relaxed">{t(`help.${key}Body`)}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 mt-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary-700" aria-hidden />
          {t('help.contactTitle')}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{t('help.contactBody')}</p>
        <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-ink-600">
          {t('help.contactPlaceholder')}
        </div>
      </section>

      <div className="mt-8">
        <Link to="/library" className="text-sm font-semibold text-primary-800 hover:underline">
          {t('library.title')}
        </Link>
      </div>
    </div>
  );
}
