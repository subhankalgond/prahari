export type Role = 'FARMER' | 'ADMIN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type Severity = 'LOW' | 'MODERATE' | 'HIGH';

export interface User {
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
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface ScanWithResult extends CropScan {
  result: ScanResult | null;
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

export interface RiskAlert {
  id: string;
  userId: string;
  cropId: string | null;
  cropName: string | null;
  type: 'DISEASE_RISK' | 'PEST_RISK' | 'WEATHER' | 'GENERAL';
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
  type: 'DISEASE_RISK' | 'PEST_RISK' | 'WEATHER' | 'CROP_REMINDER' | 'SYSTEM';
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

export interface WeatherResponse {
  weather: {
    current: WeatherNow;
    forecast: ForecastDay[];
  };
  risk: RiskAssessment & { summary: string };
  isDemo: boolean;
  provider: string;
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

export interface AdminDashboardResponse {
  stats: AdminStats;
  activity: AdminActivity[];
  charts: {
    scansOverTime: { date: string; scans: number }[];
    diseaseDistribution: { name: string; count: number }[];
    cropDistribution: { name: string; count: number }[];
    riskDistribution: { name: string; count: number }[];
  };
}

export interface AdminFarmerRow {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  state: string;
  district: string;
  village: string | null;
  cropCount: number;
  lastActiveAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminScanRow {
  id: string;
  farmerName: string;
  cropName: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  result: ScanResult | null;
}

export interface HealthPoint {
  date: string;
  score: number;
  riskLevel: RiskLevel;
}
