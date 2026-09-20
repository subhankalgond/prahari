// Shared domain types for Prahari backend

export type Role = 'FARMER' | 'ADMIN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type Severity = 'LOW' | 'MODERATE' | 'HIGH';
export type ScanStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type AlertType = 'DISEASE_RISK' | 'PEST_RISK' | 'WEATHER' | 'GENERAL';
export type NotificationType = 'DISEASE_RISK' | 'PEST_RISK' | 'WEATHER' | 'CROP_REMINDER' | 'SYSTEM';

export const GROWTH_STAGES = ['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY'] as const;
export type GrowthStage = (typeof GROWTH_STAGES)[number];

export const SOIL_TYPES = ['BLACK', 'ALLUVIAL', 'RED', 'LATERITE', 'SANDY', 'LOAMY'] as const;
export const IRRIGATION_TYPES = ['RAINFED', 'CANAL', 'WELL', 'BOREWELL', 'DRIP', 'SPRINKLER'] as const;

export const AREA_UNITS = ['acre', 'hectare', 'gunta'] as const;

export const LANGUAGES = ['en', 'hi', 'kn', 'mr'] as const;

export interface PublicUser {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  role: Role;
  language: string;
  state: string;
  district: string;
  taluk: string | null;
  village: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Crop {
  id: string;
  userId: string;
  name: string;
  variety: string | null;
  fieldName: string | null;
  areaValue: number;
  areaUnit: string;
  sowingDate: string;
  harvestDate: string | null;
  growthStage: string;
  soilType: string | null;
  irrigationType: string | null;
  location: string | null;
  fieldBoundary: { lat: number; lng: number }[] | null;
  healthScore: number;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CropInput {
  name: string;
  variety?: string | null;
  fieldName?: string | null;
  areaValue: number;
  areaUnit: string;
  sowingDate: string;
  harvestDate?: string | null;
  growthStage: string;
  soilType?: string | null;
  irrigationType?: string | null;
  location?: string | null;
  fieldBoundary?: { lat: number; lng: number }[] | null;
}

export interface LibraryEntry {
  id: string;
  name: string;
  cropName: string;
  kind: 'DISEASE' | 'PEST';
  description: string;
  symptoms: string[];
  causes: string[];
  favorable: string[] | null;
  prevention: string[];
  management: string[];
  severity: Severity;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  id: string;
  scanId: string;
  crop: string;
  condition: string;
  isHealthy: boolean;
  confidence: number;
  severity: Severity | null;
  status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'LOW_CONFIDENCE';
  symptoms: string[];
  causes: string[];
  actions: string[];
  prevention: string[];
  expertHelp: string;
  provider: string;
  isDemo: boolean;
  createdAt: string;
}

export interface CropScan {
  id: string;
  userId: string;
  cropId: string;
  cropName: string;
  imageUrl: string | null;
  status: ScanStatus;
  createdAt: string;
}

export interface ScanWithResult extends CropScan {
  result: ScanResult | null;
}

export interface RiskAlert {
  id: string;
  userId: string;
  cropId: string | null;
  cropName: string | null;
  type: AlertType;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  reasons: string[];
  weatherNote: string | null;
  action: string | null;
  score: number | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface WeatherNow {
  locationLabel: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  rainfallMm: number;
  windSpeed: number;
  condition: string;
  isDemo: boolean;
}

export interface ForecastDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  rainfallMm: number;
  condition: string;
}

export interface WeatherBundle {
  current: WeatherNow;
  forecast: ForecastDay[];
}

export interface RiskFactor {
  factor: string;
  value: string;
  points: number;
  detail: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  reasons: string[];
  factors: RiskFactor[];
  note: string;
}

export interface AdminStats {
  totalFarmers: number;
  activeCrops: number;
  scansToday: number;
  totalScans: number;
  highRiskCrops: number;
  activeAlerts: number;
}

export interface AdminActivity {
  id: string;
  type: 'SCAN' | 'CROP' | 'USER';
  title: string;
  detail: string;
  createdAt: string;
}
