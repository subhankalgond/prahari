import type { DataStore } from '../repositories/DataStore';
import type { AdminActivity, AdminStats } from '../types';

export async function getDashboardStats(store: DataStore): Promise<AdminStats> {
  const [farmers, crops, scans] = await Promise.all([
    store.listFarmers(),
    store.listAllCrops(),
    store.listAllScans(),
  ]);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const scansToday = scans.filter((s) => new Date(s.createdAt).getTime() >= startOfDay.getTime()).length;
  return {
    totalFarmers: farmers.filter((f) => f.isActive).length,
    activeCrops: crops.length,
    scansToday,
    totalScans: scans.length,
    highRiskCrops: crops.filter((c) => c.riskLevel === 'HIGH').length,
    activeAlerts: (await store.listActiveAlerts()).length,
  };
}

export async function getRecentActivity(store: DataStore, limit = 12): Promise<AdminActivity[]> {
  const [scans, crops, farmers] = await Promise.all([
    store.listAllScans(),
    store.listAllCrops(),
    store.listFarmers(),
  ]);
  const activity: AdminActivity[] = [];
  for (const s of scans.slice(0, limit)) {
    activity.push({
      id: `scan_${s.id}`,
      type: 'SCAN',
      title: `${s.farmerName} scanned ${s.cropName}`,
      detail: s.result ? `${s.result.condition} (${s.result.confidence}% confidence)` : 'Analysis pending',
      createdAt: s.createdAt,
    });
  }
  for (const c of crops.slice(0, limit)) {
    activity.push({
      id: `crop_${c.id}`,
      type: 'CROP',
      title: `Crop registered: ${c.name}`,
      detail: `${c.areaValue} ${c.areaUnit}${c.location ? ` at ${c.location}` : ''}`,
      createdAt: c.createdAt,
    });
  }
  for (const f of farmers.slice(0, limit)) {
    activity.push({
      id: `user_${f.id}`,
      type: 'USER',
      title: `Farmer joined: ${f.name}`,
      detail: `${f.village ?? ''}${f.village ? ', ' : ''}${f.district}`,
      createdAt: f.createdAt,
    });
  }
  return activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
