import type { DataStore, CreateUserData, UserRecord } from './DataStore';
import type {
  AppNotification,
  Crop,
  CropInput,
  CropScan,
  LibraryEntry,
  RiskAlert,
  RiskLevel,
  ScanResult,
} from '../types';
import { mobileVariants, normalizeMobile } from '../utils/phone';

// Prisma-backed DataStore for production PostgreSQL mode.
// Loaded lazily so demo mode never requires a generated Prisma client.

/* eslint-disable @typescript-eslint/no-explicit-any */

const EXPERT_HELP =
  'If symptoms continue or the result is uncertain, consult a qualified agricultural expert or your local Krishi Vigyan Kendra.';

type PrismaClient = any;

let cached: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (!cached) {
    const { PrismaClient } = require('@prisma/client');
    cached = new PrismaClient();
  }
  return cached;
}

function iso(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  return typeof value === 'string' ? value : value.toISOString();
}

export class PrismaStore implements DataStore {
  private db: PrismaClient;

  constructor() {
    this.db = getClient();
  }

  // ---- Users ----
  async createUser(data: CreateUserData): Promise<UserRecord> {
    const u = await this.db.user.create({
      data: {
        name: data.name,
        mobile: normalizeMobile(data.mobile),
        email: data.email ?? null,
        passwordHash: data.passwordHash,
        role: data.role ?? 'FARMER',
        language: data.language,
        state: data.state,
        district: data.district,
        taluk: data.taluk ?? null,
        village: data.village ?? null,
      },
    });
    return this.mapUser(u);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const u = await this.db.user.findUnique({ where: { id } });
    return u ? this.mapUser(u) : null;
  }

  async findUserByMobile(mobile: string): Promise<UserRecord | null> {
    const u = await this.db.user.findUnique({ where: { mobile } });
    return u ? this.mapUser(u) : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const u = await this.db.user.findUnique({ where: { email } });
    return u ? this.mapUser(u) : null;
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
    const u = await this.db.user.update({ where: { id }, data: { ...data } });
    return this.mapUser(u);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { passwordHash } });
  }

  async listFarmers(): Promise<UserRecord[]> {
    const users = await this.db.user.findMany({ where: { role: 'FARMER' }, orderBy: { createdAt: 'desc' } });
    return users.map((u: any) => this.mapUser(u));
  }

  async setFarmerActive(id: string, isActive: boolean): Promise<UserRecord> {
    const u = await this.db.user.update({ where: { id }, data: { isActive } });
    return this.mapUser(u);
  }

  async touchLastActive(id: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { lastActiveAt: new Date() } });
  }

  // ---- Password resets ----
  async createPasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.passwordReset.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findValidPasswordReset(tokenHash: string): Promise<{ userId: string } | null> {
    const r = await this.db.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    return r ? { userId: r.userId } : null;
  }

  async markPasswordResetUsed(tokenHash: string): Promise<void> {
    await this.db.passwordReset.updateMany({ where: { tokenHash, usedAt: null }, data: { usedAt: new Date() } });
  }

  // ---- Crops ----
  async createCrop(userId: string, input: CropInput): Promise<Crop> {
    const c = await this.db.crop.create({
      data: {
        userId,
        name: input.name,
        variety: input.variety ?? null,
        fieldName: input.fieldName ?? null,
        areaValue: input.areaValue,
        areaUnit: input.areaUnit,
        sowingDate: new Date(input.sowingDate),
        harvestDate: input.harvestDate ? new Date(input.harvestDate) : null,
        growthStage: input.growthStage,
        soilType: input.soilType ?? null,
        irrigationType: input.irrigationType ?? null,
        location: input.location ?? null,
        fieldBoundary: input.fieldBoundary ? (input.fieldBoundary as any) : undefined,
      },
    });
    await this.db.healthHistory.create({
      data: { cropId: c.id, healthScore: 85, riskLevel: 'LOW' },
    });
    return this.mapCrop(c);
  }

  async findCrop(id: string): Promise<Crop | null> {
    const c = await this.db.crop.findUnique({ where: { id } });
    return c ? this.mapCrop(c) : null;
  }

  async listCrops(userId: string): Promise<Crop[]> {
    const crops = await this.db.crop.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } });
    return crops.map((c: any) => this.mapCrop(c));
  }

  async listAllCrops(): Promise<Crop[]> {
    const crops = await this.db.crop.findMany({ where: { isActive: true }, include: { user: true } });
    return crops.map((c: any) => this.mapCrop(c));
  }

  async updateCrop(id: string, input: Partial<CropInput>): Promise<Crop> {
    const data: Record<string, unknown> = { ...input };
    if (input.sowingDate) data.sowingDate = new Date(input.sowingDate);
    if (input.harvestDate !== undefined) {
      data.harvestDate = input.harvestDate ? new Date(input.harvestDate) : null;
    }
    const c = await this.db.crop.update({ where: { id }, data });
    return this.mapCrop(c);
  }

  async deleteCrop(id: string): Promise<void> {
    await this.db.crop.update({ where: { id }, data: { isActive: false } });
  }

  async updateCropHealth(id: string, healthScore: number, riskLevel: RiskLevel): Promise<void> {
    await this.db.$transaction([
      this.db.crop.update({ where: { id }, data: { healthScore, riskLevel } }),
      this.db.healthHistory.create({ data: { cropId: id, healthScore, riskLevel } }),
    ]);
  }

  // ---- Scans ----
  async createScan(userId: string, cropId: string, imageUrl: string | null): Promise<CropScan> {
    const crop = await this.db.crop.findUnique({ where: { id: cropId } });
    const s = await this.db.cropScan.create({
      data: { userId, cropId, imageUrl: imageUrl ?? null, status: 'PENDING' },
    });
    return {
      id: s.id,
      userId: s.userId,
      cropId: s.cropId,
      cropName: crop?.name ?? 'Unknown crop',
      imageUrl: s.imageUrl,
      status: s.status,
      createdAt: iso(s.createdAt),
    };
  }

  async attachScanResult(scanId: string, result: Omit<ScanResult, 'id' | 'scanId' | 'createdAt'>): Promise<ScanResult> {
    await this.db.scanResult.create({
      data: {
        scanId,
        condition: result.condition,
        isHealthy: result.isHealthy,
        confidence: result.confidence,
        severity: result.severity ?? null,
        symptoms: result.symptoms,
        causes: result.causes,
        actions: result.actions,
        prevention: result.prevention,
        provider: result.provider,
        isDemo: result.isDemo,
      },
    });
    const scan = await this.db.cropScan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED' },
      include: { result: true, crop: true },
    });
    return {
      id: scan.result.id,
      scanId,
      crop: scan.crop?.name ?? 'Unknown crop',
      condition: scan.result.condition,
      isHealthy: scan.result.isHealthy,
      confidence: scan.result.confidence,
      severity: scan.result.severity,
      status: scan.result.isHealthy ? 'HEALTHY' : scan.result.confidence < 60 ? 'LOW_CONFIDENCE' : 'NEEDS_ATTENTION',
      symptoms: scan.result.symptoms ?? [],
      causes: scan.result.causes ?? [],
      actions: scan.result.actions ?? [],
      prevention: scan.result.prevention ?? [],
      expertHelp: EXPERT_HELP,
      provider: scan.result.provider,
      isDemo: scan.result.isDemo,
      createdAt: iso(scan.result.createdAt),
    };
  }

  async attachScanFailure(scanId: string): Promise<void> {
    await this.db.cropScan.update({ where: { id: scanId }, data: { status: 'FAILED' } });
  }

  async findScan(id: string): Promise<(CropScan & { result: ScanResult | null }) | null> {
    const s = await this.db.cropScan.findUnique({ where: { id }, include: { result: true, crop: true } });
    if (!s) return null;
    return {
      id: s.id,
      userId: s.userId,
      cropId: s.cropId,
      cropName: s.crop?.name ?? 'Unknown crop',
      imageUrl: s.imageUrl,
      status: s.status,
      createdAt: iso(s.createdAt),
      result: s.result ? this.mapResult(s.result, s.crop?.name ?? 'Unknown crop') : null,
    };
  }

  async listScansByUser(userId: string): Promise<(CropScan & { result: ScanResult | null })[]> {
    const scans = await this.db.cropScan.findMany({
      where: { userId },
      include: { result: true, crop: true },
      orderBy: { createdAt: 'desc' },
    });
    return scans.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      cropId: s.cropId,
      cropName: s.crop?.name ?? 'Unknown crop',
      imageUrl: s.imageUrl,
      status: s.status,
      createdAt: iso(s.createdAt),
      result: s.result ? this.mapResult(s.result, s.crop?.name ?? 'Unknown crop') : null,
    }));
  }

  async listAllScans(): Promise<(CropScan & { cropName: string; farmerName: string; result: ScanResult | null })[]> {
    const scans = await this.db.cropScan.findMany({
      include: { result: true, crop: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return scans.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      cropId: s.cropId,
      cropName: s.crop?.name ?? 'Unknown crop',
      farmerName: s.user?.name ?? 'Unknown',
      imageUrl: s.imageUrl,
      status: s.status,
      createdAt: iso(s.createdAt),
      result: s.result ? this.mapResult(s.result, s.crop?.name ?? 'Unknown crop') : null,
    }));
  }

  async countScansSince(date: Date): Promise<number> {
    return this.db.cropScan.count({ where: { createdAt: { gte: date } } });
  }

  // ---- Library ----
  async listLibrary(filter: { cropName?: string; kind?: 'DISEASE' | 'PEST'; includeInactive?: boolean }): Promise<LibraryEntry[]> {
    const where: Record<string, unknown> = {};
    if (!filter.includeInactive) where.isActive = true;
    if (filter.cropName) where.cropName = { equals: filter.cropName, mode: 'insensitive' };
    if (filter.kind) where.kind = filter.kind;
    const rows = await this.db.disease.findMany({ where, orderBy: { updatedAt: 'desc' } });
    return rows.map((r: any) => this.mapLibrary(r));
  }

  async findLibraryEntry(id: string): Promise<LibraryEntry | null> {
    const r = await this.db.disease.findUnique({ where: { id } });
    return r ? this.mapLibrary(r) : null;
  }

  async createLibraryEntry(data: Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryEntry> {
    const r = await this.db.disease.create({ data: { ...data, favorable: data.favorable ?? [] } });
    return this.mapLibrary(r);
  }

  async updateLibraryEntry(id: string, data: Partial<Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<LibraryEntry> {
    const r = await this.db.disease.update({ where: { id }, data });
    return this.mapLibrary(r);
  }

  async deleteLibraryEntry(id: string): Promise<void> {
    await this.db.disease.delete({ where: { id } });
  }

  // ---- Alerts ----
  async createAlert(data: Omit<RiskAlert, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>): Promise<RiskAlert> {
    const r = await this.db.riskAlert.create({
      data: {
        userId: data.userId,
        cropId: data.cropId,
        type: data.type,
        riskLevel: data.riskLevel,
        title: data.title,
        description: data.description,
        reasons: data.reasons,
        weatherNote: data.weatherNote,
        action: data.action,
        score: data.score,
        startsAt: new Date(),
      },
    });
    return this.mapAlert(r, null);
  }

  async listAlerts(userId: string): Promise<RiskAlert[]> {
    const rows = await this.db.riskAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map((r: any) => this.mapAlert(r, r.crop));
  }

  async findAlert(id: string, userId: string): Promise<RiskAlert | null> {
    const r = await this.db.riskAlert.findFirst({ where: { id, userId }, include: { crop: true } });
    return r ? this.mapAlert(r, r.crop) : null;
  }

  async markAlertRead(id: string, userId: string): Promise<RiskAlert> {
    const existing = await this.db.riskAlert.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Alert not found');
    const r = await this.db.riskAlert.update({ where: { id }, data: { isRead: true }, include: { crop: true } });
    return this.mapAlert(r, r.crop);
  }

  async markAllAlertsRead(userId: string): Promise<void> {
    await this.db.riskAlert.updateMany({ where: { userId }, data: { isRead: true } });
  }

  async listActiveAlerts(): Promise<RiskAlert[]> {
    const rows = await this.db.riskAlert.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      include: { crop: true },
    });
    return rows.map((r: any) => this.mapAlert(r, r.crop));
  }

  // ---- Notifications ----
  async createNotification(userId: string, type: any, title: string, body: string, link?: string): Promise<AppNotification> {
    const n = await this.db.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
    return this.mapNotification(n);
  }

  async listNotifications(userId: string): Promise<AppNotification[]> {
    const rows = await this.db.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map((r: any) => this.mapNotification(r));
  }

  async markNotificationRead(id: string, userId: string): Promise<AppNotification> {
    const existing = await this.db.notification.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Notification not found');
    const n = await this.db.notification.update({ where: { id }, data: { isRead: true } });
    return this.mapNotification(n);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({ where: { userId }, data: { isRead: true } });
  }

  // ---- Health history ----
  async addHealthPoint(cropId: string, healthScore: number, riskLevel: RiskLevel): Promise<void> {
    await this.db.healthHistory.create({ data: { cropId, healthScore, riskLevel } });
  }

  async listHealthHistory(cropId: string): Promise<{ date: string; score: number; riskLevel: RiskLevel }[]> {
    const rows = await this.db.healthHistory.findMany({ where: { cropId }, orderBy: { createdAt: 'asc' }, take: 60 });
    return rows.map((r: any) => ({ date: iso(r.createdAt), score: r.healthScore, riskLevel: r.riskLevel }));
  }

  // ---- Mappers ----
  private mapUser(u: any): UserRecord {
    return {
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      language: u.language,
      state: u.state,
      district: u.district,
      taluk: u.taluk,
      village: u.village,
      isActive: u.isActive,
      lastActiveAt: iso(u.lastActiveAt),
      createdAt: iso(u.createdAt),
    };
  }

  private mapCrop(c: any): Crop {
    return {
      id: c.id,
      userId: c.userId,
      name: c.name,
      variety: c.variety,
      fieldName: c.fieldName,
      areaValue: c.areaValue,
      areaUnit: c.areaUnit,
      sowingDate: iso(c.sowingDate),
      harvestDate: c.harvestDate ? iso(c.harvestDate) : null,
      growthStage: c.growthStage,
      soilType: c.soilType,
      irrigationType: c.irrigationType,
      location: c.location,
      fieldBoundary: (c.fieldBoundary as { lat: number; lng: number }[] | null) ?? null,
      healthScore: c.healthScore,
      riskLevel: c.riskLevel,
      createdAt: iso(c.createdAt),
      updatedAt: iso(c.updatedAt),
    };
  }

  private mapResult(r: any, cropName: string): ScanResult {
    return {
      id: r.id,
      scanId: r.scanId,
      crop: cropName,
      condition: r.condition,
      isHealthy: r.isHealthy,
      confidence: r.confidence,
      severity: r.severity,
      status: r.isHealthy ? 'HEALTHY' : r.confidence < 60 ? 'LOW_CONFIDENCE' : 'NEEDS_ATTENTION',
      symptoms: r.symptoms ?? [],
      causes: r.causes ?? [],
      actions: r.actions ?? [],
      prevention: r.prevention ?? [],
      expertHelp: EXPERT_HELP,
      provider: r.provider,
      isDemo: r.isDemo,
      createdAt: iso(r.createdAt),
    };
  }

  private mapLibrary(r: any): LibraryEntry {
    return {
      id: r.id,
      name: r.name,
      cropName: r.cropName,
      kind: r.kind,
      description: r.description,
      symptoms: r.symptoms ?? [],
      causes: r.causes ?? [],
      favorable: r.favorable ?? [],
      prevention: r.prevention ?? [],
      management: r.management ?? [],
      severity: r.severity,
      isActive: r.isActive,
      createdAt: iso(r.createdAt),
      updatedAt: iso(r.updatedAt),
    };
  }

  private mapAlert(r: any, crop: any): RiskAlert {
    return {
      id: r.id,
      userId: r.userId,
      cropId: r.cropId ?? null,
      cropName: crop?.name ?? null,
      type: r.type,
      riskLevel: r.riskLevel,
      title: r.title,
      description: r.description,
      reasons: r.reasons ?? [],
      weatherNote: r.weatherNote,
      action: r.action,
      score: r.score,
      isRead: r.isRead,
      createdAt: iso(r.createdAt),
      updatedAt: iso(r.updatedAt),
    };
  }

  private mapNotification(n: any): AppNotification {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      isRead: n.isRead,
      createdAt: iso(n.createdAt),
    };
  }
}
