import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useFetch } from '../../hooks/useFetch';
import type { AdminDashboardResponse } from '../../types';
import { ErrorState, PageHeader, SkeletonCard, Spinner } from '../../components/ui';

const COLORS = ['#047857', '#059669', '#10B981', '#F59E0B', '#DC2626', '#2563EB', '#6B7280'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useFetch<AdminDashboardResponse>('/api/admin/dashboard');

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;

  const kpis = [
    { label: t('admin.kpi.totalFarmers'), value: data.stats.totalFarmers },
    { label: t('admin.kpi.activeCrops'), value: data.stats.activeCrops },
    { label: t('admin.kpi.scansToday'), value: data.stats.scansToday },
    { label: t('admin.kpi.totalScans'), value: data.stats.totalScans },
    { label: t('admin.kpi.highRisk'), value: data.stats.highRiskCrops, tone: 'text-red-700' },
    { label: t('admin.kpi.activeAlerts'), value: data.stats.activeAlerts, tone: 'text-amber-600' },
  ];

  return (
    <div>
      <PageHeader title={t('admin.title')} subtitle={t('admin.dashboard')} />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-ink-600">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.tone ?? 'text-ink-900'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold">{t('admin.charts.scansOverTime')}</h2>
          <div className="h-64 mt-4" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.scansOverTime} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="scans" stroke="#047857" fill="#D1FAE5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold">{t('admin.charts.diseaseDistribution')}</h2>
          <div className="h-64 mt-4" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.diseaseDistribution} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={54} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold">{t('admin.charts.cropDistribution')}</h2>
          <div className="h-64 mt-4" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.cropDistribution} dataKey="count" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {data.charts.cropDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold">{t('admin.charts.riskDistribution')}</h2>
          <div className="h-64 mt-4" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.riskDistribution} dataKey="count" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {data.charts.riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.name === 'HIGH' ? '#DC2626' : entry.name === 'MEDIUM' ? '#F59E0B' : '#10B981'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <section className="mt-6">
        <h2 className="font-semibold mb-3">{t('admin.recentActivity')}</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-ink-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
                <th className="px-4 py-3 font-semibold">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.activity.map((a) => (
                <tr key={a.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold">{a.type}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-ink-600">{a.detail}</td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="hidden">
        <SkeletonCard />
      </div>
    </div>
  );
}
