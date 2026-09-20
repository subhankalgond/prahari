import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BellRing, ScanSearch, Sprout, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import type { AppNotification, Crop, RiskAlert, WeatherResponse } from '../types';
import { CropCard, NotificationItem, RiskCard, WeatherCard } from '../components/Cards';
import { Badge, riskTone, EmptyState, ErrorState, PageHeader, SectionTitle, SkeletonCard, Spinner } from '../components/ui';

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.greetingMorning';
  if (h < 17) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const cropsQ = useFetch<{ crops: Crop[] }>('/api/crops');
  const alertsQ = useFetch<{ alerts: RiskAlert[]; unread: number }>('/api/alerts');
  const weatherQ = useFetch<WeatherResponse>('/api/weather');
  const notifQ = useFetch<{ notifications: AppNotification[]; unread: number }>('/api/notifications');
  const notifications = (notifQ.data?.notifications ?? []).slice(0, 5);

  const crops = cropsQ.data?.crops ?? [];
  const alerts = (alertsQ.data?.alerts ?? []).filter((a) => !a.isRead);
  const highest = alerts.reduce<RiskAlert | null>((acc, a) => {
    if (!acc) return a;
    const order = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    return order[a.riskLevel] > order[acc.riskLevel] ? a : acc;
  }, null);
  const avgHealth = crops.length > 0 ? Math.round(crops.reduce((s, c) => s + c.healthScore, 0) / crops.length) : null;
  const totalArea = crops.reduce((s, c) => s + c.areaValue, 0);

  if (cropsQ.loading || alertsQ.loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={`${t(greetingKey())}, ${user?.name.split(' ')[0] ?? ''}`}
        subtitle={user ? `${user.village ? user.village + ', ' : ''}${user.district}, ${user.state}` : undefined}
      />

      {/* Primary CTA */}
      <Link
        to="/scan"
        className="card p-5 flex items-center gap-4 mb-6 border-primary-200 hover:border-primary-400 transition-colors"
      >
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-700 text-white shrink-0">
          <ScanSearch className="w-6 h-6" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink-900">{t('dashboard.scanCta')}</p>
          <p className="text-sm text-ink-600">{t('scan.subtitle')}</p>
        </div>
      </Link>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cropsQ.loading || weatherQ.loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="card p-5">
              <p className="text-sm text-ink-600">{t('dashboard.cropHealth')}</p>
              <p className="mt-1 text-3xl font-bold text-ink-900">{avgHealth ?? '-'}%</p>
              <p className="text-sm text-green-700 font-medium">{t('dashboard.healthy')}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-ink-600">{t('dashboard.diseaseRisk')}</p>
              {highest ? (
                <>
                  <p className={`mt-1 text-3xl font-bold ${highest.riskLevel === 'HIGH' ? 'text-red-700' : highest.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-green-700'}`}>
                    {t(`risk.${highest.riskLevel}`)}
                  </p>
                  <Badge tone={riskTone(highest.riskLevel)}>{t(`alerts.types.${highest.type}`)}</Badge>
                </>
              ) : (
                <p className="mt-1 text-3xl font-bold text-green-700">{t('risk.LOW')}</p>
              )}
            </div>
            <div className="card p-5">
              <p className="text-sm text-ink-600">{t('dashboard.weather')}</p>
              {weatherQ.data ? (
                <>
                  <p className="mt-1 text-3xl font-bold text-ink-900">{weatherQ.data.weather.current.temperature}&deg;C</p>
                  <p className="text-sm text-ink-600">
                    {weatherQ.data.weather.current.humidity}% {t('dashboard.humidity').toLowerCase()}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-600">{t('weather.unavailable')}</p>
              )}
            </div>
            <div className="card p-5">
              <p className="text-sm text-ink-600">{t('dashboard.activeAlerts')}</p>
              <p className={`mt-1 text-3xl font-bold ${alerts.length > 0 ? 'text-amber-600' : 'text-ink-900'}`}>{alerts.length}</p>
              <Link to="/alerts" className="text-sm font-medium text-primary-800 hover:underline inline-flex items-center gap-1">
                <BellRing className="w-3.5 h-3.5" aria-hidden />
                {t('common.viewAll')}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* My Crops */}
      <div className="mt-8">
        <SectionTitle
          action={
            <Link to="/crops/add" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 hover:underline">
              <Plus className="w-4 h-4" aria-hidden />
              {t('dashboard.addCrop')}
            </Link>
          }
        >
          {t('dashboard.myCrops')}
          {crops.length > 0 && <span className="ml-2 text-sm font-normal text-ink-600">{totalArea.toFixed(1)} {t('dashboard.ofArea')}</span>}
        </SectionTitle>

        {cropsQ.error && <ErrorState message={cropsQ.error} onRetry={cropsQ.retry} />}
        {!cropsQ.loading && crops.length === 0 && !cropsQ.error && (
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
          {crops.map((crop) => (
            <CropCard key={crop.id} crop={crop} />
          ))}
        </div>
      </div>

      {/* Latest alerts */}
      <div className="mt-8">
        <SectionTitle
          action={
            <Link to="/alerts" className="text-sm font-semibold text-primary-800 hover:underline">
              {t('common.viewAll')}
            </Link>
          }
        >
          {t('dashboard.activeAlerts')}
        </SectionTitle>
        {alerts.length === 0 ? (
          <EmptyState title={t('dashboard.alertsAllCaughtUp')} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.slice(0, 4).map((a) => (
              <RiskCard key={a.id} alert={a} />
            ))}
          </div>
        )}
      </div>

      {/* Weather teaser */}
      {weatherQ.data && (
        <div className="mt-8 max-w-sm">
          <SectionTitle
            action={
              <Link to="/weather" className="text-sm font-semibold text-primary-800 hover:underline">
                {t('dashboard.viewWeather')}
              </Link>
            }
          >
            {t('dashboard.weather')}
          </SectionTitle>
          <WeatherCard current={weatherQ.data.weather.current} />
        </div>
      )}

      {/* Notification center */}
      <div id="notifications" className="mt-8 scroll-mt-20">
        <SectionTitle
          action={
            notifQ.data && notifQ.data.unread > 0 ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.put('/api/notifications/read-all');
                    notifQ.retry();
                  } catch {
                    /* keep current list; user can retry */
                  }
                }}
                className="text-sm font-semibold text-primary-800 hover:underline"
              >
                {t('common.markAllRead')}
              </button>
            ) : undefined
          }
        >
          {t('notifications.title')}
          {notifQ.data && notifQ.data.unread > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold">
              {notifQ.data.unread}
            </span>
          )}
        </SectionTitle>
        {notifQ.error && <ErrorState message={notifQ.error} onRetry={notifQ.retry} />}
        {!notifQ.loading && notifications.length === 0 && !notifQ.error && (
          <EmptyState title={t('notifications.empty')} />
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => notifQ.retry()}>
              <NotificationItem title={n.title} body={n.body} type={n.type} isRead={n.isRead} link={n.link} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
