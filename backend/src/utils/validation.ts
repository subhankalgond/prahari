import { z } from 'zod';
import { GROWTH_STAGES, SOIL_TYPES, IRRIGATION_TYPES, AREA_UNITS, LANGUAGES } from '../types';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,14}$/, 'Enter a valid mobile number (10 to 14 digits)'),
  email: z.string().trim().email('Enter a valid email address').max(120).optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  state: z.string().trim().min(2, 'State is required').max(60),
  district: z.string().trim().min(2, 'District is required').max(60),
  taluk: z.string().trim().max(60).optional().or(z.literal('')),
  village: z.string().trim().max(60).optional().or(z.literal('')),
  language: z.enum(LANGUAGES),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your mobile number or email'),
  password: z.string().min(1, 'Enter your password'),
});

export const forgotSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your mobile number or email'),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).optional().or(z.literal('')).nullable(),
  state: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  taluk: z.string().trim().max(60).optional().or(z.literal('')).nullable(),
  village: z.string().trim().max(60).optional().or(z.literal('')).nullable(),
  language: z.enum(LANGUAGES),
});

export const cropSchema = z.object({
  name: z.string().trim().min(2, 'Crop name is required').max(60),
  variety: z.string().trim().max(60).optional().or(z.literal('')).nullable(),
  fieldName: z.string().trim().max(60).optional().or(z.literal('')).nullable(),
  areaValue: z.coerce.number().positive('Area must be greater than zero').max(100000),
  areaUnit: z.enum(AREA_UNITS),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid sowing date'),
  harvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid harvest date')
    .optional()
    .or(z.literal(''))
    .nullable(),
  growthStage: z.enum(GROWTH_STAGES),
  soilType: z.enum(SOIL_TYPES).optional().or(z.literal('')).nullable(),
  irrigationType: z.enum(IRRIGATION_TYPES).optional().or(z.literal('')).nullable(),
  location: z.string().trim().max(120).optional().or(z.literal('')).nullable(),
  fieldBoundary: z
    .array(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }))
    .max(24)
    .optional()
    .nullable(),
});

export const scanCreateSchema = z.object({
  // Accepts UUIDs (production) and prefixed demo ids (crop_0012).
  cropId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{6,64}$/, 'Select the crop you are scanning'),
  growthStage: z.enum(GROWTH_STAGES).optional(),
  symptoms: z.string().trim().max(500).optional().or(z.literal('')),
});

export const reportScanSchema = z.object({
  reason: z.string().trim().min(5, 'Tell us briefly what looks wrong').max(500),
});

export const librarySchema = z.object({
  name: z.string().trim().min(2).max(80),
  cropName: z.string().trim().min(2).max(60),
  kind: z.enum(['DISEASE', 'PEST']),
  description: z.string().trim().min(10).max(2000),
  symptoms: z.array(z.string().trim().min(1)).min(1, 'Add at least one symptom'),
  causes: z.array(z.string().trim().min(1)).min(1),
  favorable: z.array(z.string().trim().min(1)).optional().nullable(),
  prevention: z.array(z.string().trim().min(1)).min(1),
  management: z.array(z.string().trim().min(1)).min(1),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH']),
  isActive: z.boolean().optional(),
});

export const alertSchema = z.object({
  cropName: z.string().trim().max(60).optional().or(z.literal('')).nullable(),
  type: z.enum(['DISEASE_RISK', 'PEST_RISK', 'WEATHER', 'GENERAL']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(4).max(500),
  reasons: z.array(z.string().trim().min(1)).max(8).optional(),
  action: z.string().trim().max(500).optional().or(z.literal('')).nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().or(z.literal('')).nullable(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
});
