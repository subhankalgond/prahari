import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-canvas grid place-items-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary-700">404</p>
        <h1 className="mt-4 text-xl font-semibold">{t('common.notFoundTitle')}</h1>
        <p className="mt-2 text-sm text-ink-600">{t('common.notFoundBody')}</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
        >
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  );
}
