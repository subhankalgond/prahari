import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type {
  AppNotification,
  Crop,
  CropInput,
  CropScan,
  LibraryEntry,
  NotificationType,
  RiskAlert,
  RiskLevel,
  ScanResult,
} from '../types';
import type { CreateUserData, DataStore, UserRecord } from './DataStore';
import { DEMO_ALERTS, DEMO_CROPS, DEMO_LIBRARY, DEMO_NOTIFICATIONS, DEMO_USER_ID } from '../demo/demoData';
import { mobileVariants, normalizeMobile } from '../utils/phone';

interface MemoryUser extends UserRecord {}

export class MemoryStore implements DataStore {
  private users: MemoryUser[] = [];
  private crops: Crop[] = [];
  private scans: (CropScan & { result: ScanResult | null })[] = [];
  private library: LibraryEntry[] = [];
  private alerts: RiskAlert[] = [];
  private notifications: AppNotification[] = [];
  private resets: { userId: string; tokenHash: string; expiresAt: Date; usedAt: Date | null }[] = [];
  private healthHistory: Map<string, { date: string; score: number; riskLevel: RiskLevel }[]> = new Map();

  constructor(seedDemo = true) {
    if (seedDemo) {
      this.seed();
    }
  }

  private seed(): void {
    const now = Date.now();
    this.users.push({
      id: DEMO_USER_ID,
      name: 'Ravi Kumar',
      mobile: '+919876543210',
      email: 'ravi.demo@prahari.in',
      passwordHash: bcrypt.hashSync('Demo@12345', 10),
      role: 'FARMER',
      language: 'en',
      state: 'Karnataka',
      district: 'Bengaluru Rural',
      taluk: 'Doddaballapur',
      village: 'Madhure',
      isActive: true,
      lastActiveAt: new Date(now - 3600_000).toISOString(),
      createdAt: new Date(now - 90 * 86400_000).toISOString(),
    });
    this.users.push({
      id: randomUUID(),
      name: 'Prahari Admin',
      mobile: '+919999000001',
      email: 'admin@prahari.in',
      passwordHash: bcrypt.hashSync('Admin@12345', 10),
      role: 'ADMIN',
      language: 'en',
      state: 'Karnataka',
      district: 'Bengaluru',
      taluk: null,
      village: null,
      isActive: true,
      lastActiveAt: new Date(now - 1800_000).toISOString(),
      createdAt: new Date(now - 120 * 86400_000).toISOString(),
    });
    this.crops.push(...DEMO_CROPS);
    this.library.push(...DEMO_LIBRARY);
    this.alerts.push(...DEMO_ALERTS);
    this.notifications.push(...DEMO_NOTIFICATIONS);

    // Demo scan history so the History page and admin charts have data.
    const scanSeeds: { daysAgo: number; cropIdx: number; condition: string; confidence: number; severity: 'LOW' | 'MODERATE' | 'HIGH' | null; healthy: boolean }[] = [
      { daysAgo: 1, cropIdx: 0, condition: 'Early Blight', confidence: 91, severity: 'MODERATE', healthy: false },
      { daysAgo: 3, cropIdx: 1, condition: 'Healthy', confidence: 96, severity: null, healthy: true },
      { daysAgo: 5, cropIdx: 2, condition: 'Thrips damage', confidence: 78, severity: 'MODERATE', healthy: false },
      { daysAgo: 8, cropIdx: 0, condition: 'Healthy', confidence: 94, severity: null, healthy: true },
      { daysAgo: 12, cropIdx: 1, condition: 'Blast', confidence: 64, severity: 'MODERATE', healthy: false },
      { daysAgo: 16, cropIdx: 0, condition: 'Healthy', confidence: 92, severity: null, healthy: true },
    ];
    for (const s of scanSeeds) {
      const crop = this.crops[s.cropIdx];
      const scanId = randomUUID();
      const createdAt = new Date(now - s.daysAgo * 86400_000).toISOString();
      const result: ScanResult = {
        id: randomUUID(),
        scanId,
        crop: crop.name,
        condition: s.condition,
        isHealthy: s.healthy,
        confidence: s.confidence,
        severity: s.healthy ? null : s.severity,
        status: s.healthy ? 'HEALTHY' : s.confidence < 60 ? 'LOW_CONFIDENCE' : 'NEEDS_ATTENTION',
        symptoms: s.healthy ? [] : ['Brown spots with concentric rings on older leaves'],
        causes: s.healthy ? [] : ['Warm humid weather and wet foliage'],
        actions: s.healthy ? [] : ['Remove infected leaves and monitor every 3 days'],
        prevention: s.healthy ? [] : ['Improve airflow and avoid evening overhead irrigation'],
        expertHelp: 'If symptoms continue or the result is uncertain, consult a qualified agricultural expert.',
        provider: 'demo',
        isDemo: true,
        createdAt,
      };
      this.scans.push({
        id: scanId,
        userId: crop.userId,
        cropId: crop.id,
        cropName: crop.name,
        imageUrl: null,
        status: 'COMPLETED',
        result,
        createdAt,
      });
    }
    for (const crop of this.crops) {
      this.healthHistory.set(crop.id, [
        { date: new Date(now - 30 * 86400_000).toISOString(), score: 90, riskLevel: 'LOW' },
        { date: new Date(now - 20 * 86400_000).toISOString(), score: 84, riskLevel: 'LOW' },
        { date: new Date(now - 10 * 86400_000).toISOString(), score: 76, riskLevel: 'MEDIUM' },
        { date: new Date(now - 2 * 86400_000).toISOString(), score: crop.healthScore, riskLevel: crop.riskLevel },
      ]);
    }
  }

  // ---- Users ----
  async createUser(data: CreateUserData): Promise<UserRecord> {
    const user: MemoryUser = {
      id: randomUUID(),
      name: data.name,
      mobile: normalizeMobile(data.mobile),
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'FARMER',
      language: data.language,
      state: data.state,
      district: data.district,
      taluk: data.taluk ?? null,
      village: data.village ?? null,
      isActive: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return { ...user };
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const u = this.users.find((x) => x.id === id);
    return u ? { ...u } : null;
  }

  async findUserByMobile(mobile: string): Promise<UserRecord | null> {
    const u = this.users.find((x) => x.mobile === mobile);
    return u ? { ...u } : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const lower = email.toLowerCase();
    const u = this.users.find((x) => x.email && x.email.toLowerCase() === lower);
    return u ? { ...u } : null;
  }

  async findUserByLogin(identifier: string): Promise<UserRecord | null> {
    if (identifier.includes('@')) return this.findUserByEmail(identifier);
    for (const variant of mobileVariants(identifier)) {
      const user = await this.findUserByMobile(variant);
      if (user) return user;
    }
    return null;
  }

  async updateProfile(id: string, data: Partial<CreateUserData>): Promise<UserRecord> {
    const u = this.users.find((x) => x.id === id);
    if (!u) throw new Error('User not found');
    Object.assign(u, data);
    return { ...u };
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const u = this.users.find((x) => x.id === id);
    if (u) u.passwordHash = passwordHash;
  }

  async listFarmers(): Promise<UserRecord[]> {
    return this.users.filter((u) => u.role === 'FARMER').map((u) => ({ ...u }));
  }

  async setFarmerActive(id: string, isActive: boolean): Promise<UserRecord> {
    const u = this.users.find((x) => x.id === id && x.role === 'FARMER');
    if (!u) throw new Error('Farmer not found');
    u.isActive = isActive;
    return { ...u };
  }

  async touchLastActive(id: string): Promise<void> {
    const u = this.users.find((x) => x.id === id);
    if (u) u.lastActiveAt = new Date().toISOString();
  }

  // ---- Password resets ----
  async createPasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.resets.push({ userId, tokenHash, expiresAt, usedAt: null });
  }

  async findValidPasswordReset(tokenHash: string): Promise<{ userId: string } | null> {
    const r = this.resets.find(
      (r) => r.tokenHash === tokenHash && !r.usedAt && r.expiresAt.getTime() > Date.now(),
    );
    return r ? { userId: r.userId } : null;
  }

  async markPasswordResetUsed(tokenHash: string): Promise<void> {
    const r = this.resets.find((r) => r.tokenHash === tokenHash);
    if (r) r.usedAt = new Date();
  }

  // ---- Crops ----
  async createCrop(userId: string, input: CropInput): Promise<Crop> {
    const crop: Crop = {
      id: randomUUID(),
      userId,
      name: input.name,
      variety: input.variety ?? null,
      fieldName: input.fieldName ?? null,
      areaValue: input.areaValue,
      areaUnit: input.areaUnit,
      sowingDate: input.sowingDate,
      harvestDate: input.harvestDate ?? null,
      growthStage: input.growthStage,
      soilType: input.soilType ?? null,
      irrigationType: input.irrigationType ?? null,
      location: input.location ?? null,
      fieldBoundary: input.fieldBoundary ?? null,
      healthScore: 85,
      riskLevel: 'LOW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.crops.push(crop);
    this.healthHistory.set(crop.id, [{ date: crop.createdAt, score: 85, riskLevel: 'LOW' }]);
    return { ...crop };
  }

  async findCrop(id: string): Promise<Crop | null> {
    const c = this.crops.find((x) => x.id === id);
    return c ? { ...c } : null;
  }

  async listCrops(userId: string): Promise<Crop[]> {
    return this.crops.filter((c) => c.userId === userId).map((c) => ({ ...c }));
  }

  async listAllCrops(): Promise<Crop[]> {
    return this.crops.map((c) => ({ ...c }));
  }

  async updateCrop(id: string, input: Partial<CropInput>): Promise<Crop> {
    const c = this.crops.find((x) => x.id === id);
    if (!c) throw new Error('Crop not found');
    Object.assign(c, input, { updatedAt: new Date().toISOString() });
    return { ...c };
  }

  async deleteCrop(id: string): Promise<void> {
    this.crops = this.crops.filter((c) => c.id !== id);
    this.scans = this.scans.filter((s) => s.cropId !== id);
    this.healthHistory.delete(id);
  }

  async updateCropHealth(id: string, healthScore: number, riskLevel: RiskLevel): Promise<void> {
    const c = this.crops.find((x) => x.id === id);
    if (c) {
      c.healthScore = healthScore;
      c.riskLevel = riskLevel;
      c.updatedAt = new Date().toISOString();
    }
  }

  // ---- Scans ----
  async createScan(userId: string, cropId: string, imageUrl: string | null): Promise<CropScan> {
    const crop = this.crops.find((c) => c.id === cropId);
    const scan: CropScan & { result: ScanResult | null } = {
      id: randomUUID(),
      userId,
      cropId,
      cropName: crop?.name ?? 'Unknown crop',
      imageUrl,
      status: 'PENDING',
      result: null,
      createdAt: new Date().toISOString(),
    };
    const { result: _omit, ...scanBase } = scan;
    void _omit;
    this.scans.push(scan);
    return { ...scanBase };
  }

  async attachScanResult(scanId: string, result: Omit<ScanResult, 'id' | 'scanId' | 'createdAt'>): Promise<ScanResult> {
    const scan = this.scans.find((s) => s.id === scanId);
    if (!scan) throw new Error('Scan not found');
    const full: ScanResult = { ...result, id: randomUUID(), scanId, createdAt: new Date().toISOString() };
    scan.result = full;
    scan.status = 'COMPLETED';
    return { ...full };
  }

  async attachScanFailure(scanId: string): Promise<void> {
    const scan = this.scans.find((s) => s.id === scanId);
    if (scan) scan.status = 'FAILED';
  }

  async findScan(id: string): Promise<(CropScan & { result: ScanResult | null }) | null> {
    const s = this.scans.find((x) => x.id === id);
    return s ? { ...s } : null;
  }

  async listScansByUser(userId: string): Promise<(CropScan & { result: ScanResult | null })[]> {
    return this.scans
      .filter((s) => s.userId === userId)
      .map((s) => ({ ...s }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listAllScans(): Promise<(CropScan & { cropName: string; farmerName: string; result: ScanResult | null })[]> {
    return this.scans
      .map((s) => {
        const user = this.users.find((u) => u.id === s.userId);
        const crop = this.crops.find((c) => c.id === s.cropId);
        return { ...s, cropName: crop?.name ?? s.cropName, farmerName: user?.name ?? 'Unknown' };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async countScansSince(date: Date): Promise<number> {
    return this.scans.filter((s) => new Date(s.createdAt).getTime() >= date.getTime()).length;
  }

  // ---- Library ----
  async listLibrary(filter: { cropName?: string; kind?: 'DISEASE' | 'PEST'; includeInactive?: boolean }): Promise<LibraryEntry[]> {
    return this.library
      .filter((e) => (filter.includeInactive ? true : e.isActive))
      .filter((e) => (filter.cropName ? e.cropName.toLowerCase() === filter.cropName.toLowerCase() : true))
      .filter((e) => (filter.kind ? e.kind === filter.kind : true))
      .map((e) => ({ ...e, symptoms: [...e.symptoms], prevention: [...e.prevention], management: [...e.management] }));
  }

  async findLibraryEntry(id: string): Promise<LibraryEntry | null> {
    const e = this.library.find((x) => x.id === id);
    return e ? { ...e } : null;
  }

  async createLibraryEntry(data: Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryEntry> {
    const entry: LibraryEntry = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.library.push(entry);
    return { ...entry };
  }

  async updateLibraryEntry(id: string, data: Partial<Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<LibraryEntry> {
    const e = this.library.find((x) => x.id === id);
    if (!e) throw new Error('Library entry not found');
    Object.assign(e, data, { updatedAt: new Date().toISOString() });
    return { ...e };
  }

  async deleteLibraryEntry(id: string): Promise<void> {
    this.library = this.library.filter((e) => e.id !== id);
  }

  // ---- Alerts ----
  async createAlert(data: Omit<RiskAlert, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>): Promise<RiskAlert> {
    const alert: RiskAlert = {
      ...data,
      id: randomUUID(),
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.alerts.push(alert);
    return { ...alert };
  }

  async listAlerts(userId: string): Promise<RiskAlert[]> {
    return this.alerts.filter((a) => a.userId === userId).map((a) => ({ ...a }));
  }

  async findAlert(id: string, userId: string): Promise<RiskAlert | null> {
    const a = this.alerts.find((x) => x.id === id && x.userId === userId);
    return a ? { ...a } : null;
  }

  async markAlertRead(id: string, userId: string): Promise<RiskAlert> {
    const a = this.alerts.find((x) => x.id === id && x.userId === userId);
    if (!a) throw new Error('Alert not found');
    a.isRead = true;
    return { ...a };
  }

  async markAllAlertsRead(userId: string): Promise<void> {
    for (const a of this.alerts) {
      if (a.userId === userId) a.isRead = true;
    }
  }

  async listActiveAlerts(): Promise<RiskAlert[]> {
    return this.alerts.filter((a) => new Date(a.createdAt).getTime() > Date.now() - 14 * 86400_000);
  }

  // ---- Notifications ----
  async createNotification(userId: string, type: NotificationType, title: string, body: string, link?: string): Promise<AppNotification> {
    const n: AppNotification = {
      id: randomUUID(),
      userId,
      type,
      title,
      body,
      link: link ?? null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.push(n);
    return { ...n };
  }

  async listNotifications(userId: string): Promise<AppNotification[]> {
    return this.notifications
      .filter((n) => n.userId === userId)
      .map((n) => ({ ...n }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markNotificationRead(id: string, userId: string): Promise<AppNotification> {
    const n = this.notifications.find((x) => x.id === id && x.userId === userId);
    if (!n) throw new Error('Notification not found');
    n.isRead = true;
    return { ...n };
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    for (const n of this.notifications) {
      if (n.userId === userId) n.isRead = true;
    }
  }

  // ---- Health history ----
  async addHealthPoint(cropId: string, healthScore: number, riskLevel: RiskLevel): Promise<void> {
    const list = this.healthHistory.get(cropId) ?? [];
    list.push({ date: new Date().toISOString(), score: healthScore, riskLevel });
    this.healthHistory.set(cropId, list);
  }

  async listHealthHistory(cropId: string): Promise<{ date: string; score: number; riskLevel: RiskLevel }[]> {
    return [...(this.healthHistory.get(cropId) ?? [])];
  }
}
