import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { api } from '../../lib/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../contexts/ToastContext';
import type { AdminFarmerRow } from '../../types';
import { Badge, Button, ErrorState, PageHeader, Spinner } from '../../components/ui';

export default function AdminFarmers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, retry } = useFetch<{ farmers: AdminFarmerRow[] }>(
    `/api/admin/farmers${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    [search],
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleActive(farmer: AdminFarmerRow) {
    setBusyId(farmer.id);
    try {
      await api.put(`/api/admin/farmers/${farmer.id}/status`, { isActive: !farmer.isActive });
      toast('success', farmer.isActive ? t('admin.farmersTable.suspend') : t('admin.farmersTable.activate'));
      retry();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  }

  const rows = (data?.farmers ?? []).filter((f) => (statusFilter ? (statusFilter === 'active' ? f.isActive : !f.isActive) : true));

  return (
    <div>
      <PageHeader title={t('admin.farmers')} />

      <div className="card p-4 mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            type="search"
            className="field-input pl-10"
            placeholder={t('admin.farmersTable.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('admin.farmersTable.searchPlaceholder')}
          />
        </div>
        <select className="field-input sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t('admin.farmersTable.status')}>
          <option value="">{t('library.allSeverities') === '' ? '' : 'All'}</option>
          <option value="active">{t('admin.farmersTable.active')}</option>
          <option value="suspended">{t('admin.farmersTable.suspended')}</option>
        </select>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={retry} />}

      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-ink-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.farmer')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.phone')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.location')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.crops')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.lastActive')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.farmersTable.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3">{f.mobile}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {f.village ? `${f.village}, ` : ''}
                    {f.district}
                  </td>
                  <td className="px-4 py-3">{f.cropCount}</td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{new Date(f.lastActiveAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge tone={f.isActive ? 'green' : 'red'}>{f.isActive ? t('admin.farmersTable.active') : t('admin.farmersTable.suspended')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant={f.isActive ? 'secondary' : 'primary'}
                      loading={busyId === f.id}
                      onClick={() => toggleActive(f)}
                      className="!min-h-[36px] !px-3 !py-1.5 text-xs"
                    >
                      {f.isActive ? t('admin.farmersTable.suspend') : t('admin.farmersTable.activate')}
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-600">
                    {t('library.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
