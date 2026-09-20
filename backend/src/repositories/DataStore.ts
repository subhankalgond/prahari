import type {
  AppNotification,
  Crop,
  CropInput,
  CropScan,
  LibraryEntry,
  NotificationType,
  PublicUser,
  RiskAlert,
  ScanResult,
  AlertType,
  RiskLevel,
} from '../types';

export interface UserRecord extends PublicUser {
  passwordHash: string;
  lastActiveAt: string;
}

export interface CreateUserData {
  name: string;
  mobile: string;
  email: string | null;
  passwordHash: string;
  state: string;
  district: string;
  taluk: string | null;
  village: string | null;
  language: string;
  role?: 'FARMER' | 'ADMIN';
}

export interface CropFilter {
  cropName?: string;
  userId?: string;
}

export interface DataStore {
  // Users
  createUser(data: CreateUserData): Promise<UserRecord>;
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByMobile(mobile: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserByLogin(identifier: string): Promise<UserRecord | null>;
  updateProfile(id: string, data: Partial<CreateUserData>): Promise<UserRecord>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  listFarmers(): Promise<UserRecord[]>;
  setFarmerActive(id: string, isActive: boolean): Promise<UserRecord>;
  touchLastActive(id: string): Promise<void>;

  // Password resets
  createPasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findValidPasswordReset(tokenHash: string): Promise<{ userId: string } | null>;
  markPasswordResetUsed(tokenHash: string): Promise<void>;

  // Crops
  createCrop(userId: string, input: CropInput): Promise<Crop>;
  findCrop(id: string): Promise<Crop | null>;
  listCrops(userId: string): Promise<Crop[]>;
  listAllCrops(): Promise<Crop[]>;
  updateCrop(id: string, input: Partial<CropInput>): Promise<Crop>;
  deleteCrop(id: string): Promise<void>;
  updateCropHealth(id: string, healthScore: number, riskLevel: RiskLevel): Promise<void>;

  // Scans
  createScan(userId: string, cropId: string, imageUrl: string | null): Promise<CropScan>;
  attachScanResult(scanId: string, result: Omit<ScanResult, 'id' | 'scanId' | 'createdAt'>): Promise<ScanResult>;
  attachScanFailure(scanId: string): Promise<void>;
  findScan(id: string): Promise<(CropScan & { result: ScanResult | null }) | null>;
  listScansByUser(userId: string): Promise<(CropScan & { result: ScanResult | null })[]>;
  listAllScans(): Promise<(CropScan & { cropName: string; farmerName: string; result: ScanResult | null })[]>;
  countScansSince(date: Date): Promise<number>;

  // Library (diseases and pests)
  listLibrary(filter: { cropName?: string; kind?: 'DISEASE' | 'PEST'; includeInactive?: boolean }): Promise<LibraryEntry[]>;
  findLibraryEntry(id: string): Promise<LibraryEntry | null>;
  createLibraryEntry(data: Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryEntry>;
  updateLibraryEntry(id: string, data: Partial<Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<LibraryEntry>;
  deleteLibraryEntry(id: string): Promise<void>;

  // Alerts (per-user rows; admin broadcasts fan out to all farmers)
  createAlert(data: Omit<RiskAlert, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>): Promise<RiskAlert>;
  listAlerts(userId: string): Promise<RiskAlert[]>;
  findAlert(id: string, userId: string): Promise<RiskAlert | null>;
  markAlertRead(id: string, userId: string): Promise<RiskAlert>;
  markAllAlertsRead(userId: string): Promise<void>;
  listActiveAlerts(): Promise<RiskAlert[]>;

  // Notifications
  createNotification(userId: string, type: NotificationType, title: string, body: string, link?: string): Promise<AppNotification>;
  listNotifications(userId: string): Promise<AppNotification[]>;
  markNotificationRead(id: string, userId: string): Promise<AppNotification>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Health history
  addHealthPoint(cropId: string, healthScore: number, riskLevel: RiskLevel): Promise<void>;
  listHealthHistory(cropId: string): Promise<{ date: string; score: number; riskLevel: RiskLevel }[]>;
}

export type { CropInput, AlertType, RiskLevel };
