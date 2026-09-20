import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch';
import { Badge, ErrorState, PageHeader, Spinner } from '../../components/ui';

interface HealthResponse {
  status: string;
  service: string;
  demoMode: boolean;
  time: string;
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<HealthResponse>('/api/health');

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('admin.settings.title')} />
      <div className="card p-6 space-y-5">
        <div>
          <p className="text-sm font-medium">{t('admin.settings.demoMode')}</p>
          {data?.demoMode ? (
            <>
              <Badge tone="blue">{t('app.demoBadge')}</Badge>
              <p className="mt-2 text-sm text-ink-600">{t('admin.settings.demoModeOn')}</p>
            </>
          ) : (
            <Badge tone="green">PostgreSQL</Badge>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{t('admin.settings.aiProvider')}</p>
          <p className="text-sm text-ink-600">AI_PROVIDER=demo (set AI_PROVIDER=model with AI_SERVICE_URL to use the FastAPI service)</p>
        </div>
        <div>
          <p className="text-sm font-medium">{t('admin.settings.siteUrl')}</p>
          <p className="text-sm text-ink-600">{import.meta.env.VITE_SITE_URL ?? 'https://prahari.in'}</p>
        </div>
      </div>
    </div>
  );
}
