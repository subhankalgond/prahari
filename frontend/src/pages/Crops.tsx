import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Sprout } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import type { Crop } from '../types';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { CropCard } from '../components/Cards';

export default function Crops() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<{ crops: Crop[] }>('/api/crops');

  return (
    <div>
      <PageHeader title={t('crops.title')} subtitle={t('crops.subtitle')} />
      <div className="mb-6">
        <Link
          to="/crops/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 min-h-[44px]"
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t('dashboard.addCrop')}
        </Link>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && (data?.crops ?? []).length === 0 && (
        <EmptyState
          icon={<Sprout className="w-10 h-10" aria-hidden />}
          title={t('dashboard.noCrops')}
          action={
            <Link
              to="/crops/add"
              className="inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
            >
              {t('dashboard.noCropsCta')}
            </Link>
          }
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.crops ?? []).map((crop) => (
          <CropCard key={crop.id} crop={crop} />
        ))}
      </div>
    </div>
  );
}
