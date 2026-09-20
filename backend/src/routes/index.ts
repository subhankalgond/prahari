import { Router, type Express } from 'express';
import type { DataStore } from '../repositories/DataStore';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/security';
import { authLimiter, apiLimiter } from '../middleware/common';
import { makeAuthController } from '../controllers/authController';
import { makeCropController, makeProfileController, makeNotificationController } from '../controllers/cropController';
import { makeScanController } from '../controllers/scanController';
import { makeLibraryController, makeAdminLibraryController } from '../controllers/libraryController';
import { makeAlertController, makeWeatherController, makeAdminAlertController } from '../controllers/alertController';
import { makeForecastController } from '../controllers/forecastController';
import { makeAdminController } from '../controllers/adminController';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  profileSchema,
  cropSchema,
  scanCreateSchema,
  reportScanSchema,
  librarySchema,
  alertSchema,
  passwordChangeSchema,
} from '../utils/validation';

export function registerRoutes(app: Express, store: DataStore): void {
  const api = Router();

  const auth = makeAuthController(store);
  const crops = makeCropController(store);
  const profile = makeProfileController(store);
  const notifications = makeNotificationController(store);
  const scans = makeScanController(store);
  const library = makeLibraryController(store);
  const adminLibrary = makeAdminLibraryController(store);
  const alerts = makeAlertController(store);
  const weather = makeWeatherController(store);
  const adminAlerts = makeAdminAlertController(store);
  const admin = makeAdminController(store);

  // ----- Auth -----
  api.post('/auth/register', authLimiter(), validateBody(registerSchema), asyncHandler(auth.register));
  api.post('/auth/login', authLimiter(), validateBody(loginSchema), asyncHandler(auth.login));
  api.post('/auth/logout', asyncHandler(auth.logout));
  api.post('/auth/forgot-password', authLimiter(), validateBody(forgotSchema), asyncHandler(auth.forgotPassword));
  api.post('/auth/reset-password', authLimiter(), validateBody(resetSchema), asyncHandler(auth.resetPassword));

  // ----- Profile -----
  api.get('/profile', authenticate, asyncHandler(profile.get));
  api.put('/profile', authenticate, validateBody(profileSchema), asyncHandler(profile.update));
  api.put('/profile/password', authenticate, validateBody(passwordChangeSchema), asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    const user = await store.findUserById(req.user!.id);
    if (!user) throw new Error('User not found');
    const bcrypt = await import('bcryptjs');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });
    const hash = await bcrypt.hash(newPassword, 10);
    await store.updatePassword(user.id, hash);
    res.json({ message: 'Password updated' });
  }));

  // ----- Crops -----
  api.get('/crops', authenticate, asyncHandler(crops.list));
  api.post('/crops', authenticate, validateBody(cropSchema), asyncHandler(crops.create));
  api.get('/crops/:id', authenticate, asyncHandler(crops.get));
  api.put('/crops/:id', authenticate, asyncHandler(crops.update));
  api.delete('/crops/:id', authenticate, asyncHandler(crops.remove));
  api.get('/crops/:id/history', authenticate, asyncHandler(crops.healthHistory));

  // ----- Scans -----
  api.post('/scans', authenticate, apiLimiter(), uploadMiddleware, validateBody(scanCreateSchema), asyncHandler(scans.create));
  api.get('/scans', authenticate, asyncHandler(scans.list));
  api.get('/scans/:id', authenticate, asyncHandler(scans.get));
  api.post('/scans/:id/report', authenticate, validateBody(reportScanSchema), asyncHandler(scans.report));

  // ----- Library (public read) -----
  api.get('/diseases', asyncHandler(library.list));
  api.get('/diseases/:id', asyncHandler(library.get));
  api.get('/pests', asyncHandler(library.list));
  api.get('/pests/:id', asyncHandler(library.get));

  // ----- Weather -----
  api.get('/weather', asyncHandler(weather.get));

  // ----- Disease forecast (Hutton / Wallin / TOMCAST) -----
  const forecast = makeForecastController();
  api.get('/forecast', asyncHandler(forecast.get));

  // ----- Alerts -----
  api.get('/alerts', authenticate, asyncHandler(alerts.list));
  api.get('/alerts/:id', authenticate, asyncHandler(alerts.get));
  api.put('/alerts/:id/read', authenticate, asyncHandler(alerts.markRead));
  api.put('/alerts/read-all', authenticate, asyncHandler(alerts.markAllRead));

  // ----- Notifications -----
  api.get('/notifications', authenticate, asyncHandler(notifications.list));
  api.put('/notifications/:id/read', authenticate, asyncHandler(notifications.markRead));
  api.put('/notifications/read-all', authenticate, asyncHandler(notifications.markAllRead));

  // ----- Admin -----
  const adminRouter = Router();
  adminRouter.use(authenticate, requireAdmin);
  adminRouter.get('/dashboard', asyncHandler(admin.dashboard));
  adminRouter.get('/farmers', asyncHandler(admin.farmers));
  adminRouter.get('/farmers/:id', asyncHandler(admin.farmer));
  adminRouter.put('/farmers/:id/status', asyncHandler(admin.setFarmerActive));
  adminRouter.get('/crops', asyncHandler(admin.crops));
  adminRouter.get('/scans', asyncHandler(admin.scans));
  adminRouter.get('/diseases', asyncHandler(adminLibrary.list));
  adminRouter.post('/diseases', validateBody(librarySchema), asyncHandler(adminLibrary.create));
  adminRouter.put('/diseases/:id', asyncHandler(adminLibrary.update));
  adminRouter.delete('/diseases/:id', asyncHandler(adminLibrary.remove));
  adminRouter.get('/pests', asyncHandler(adminLibrary.list));
  adminRouter.post('/pests', validateBody(librarySchema), asyncHandler(adminLibrary.create));
  adminRouter.put('/pests/:id', asyncHandler(adminLibrary.update));
  adminRouter.delete('/pests/:id', asyncHandler(adminLibrary.remove));
  adminRouter.get('/alerts', asyncHandler(adminAlerts.list));
  adminRouter.post('/alerts', validateBody(alertSchema), asyncHandler(adminAlerts.create));
  adminRouter.delete('/alerts/:id', asyncHandler(adminAlerts.remove));
  api.use('/admin', adminRouter);

  app.use('/api', api);
}
