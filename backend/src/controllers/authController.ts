import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import type { DataStore, UserRecord } from '../repositories/DataStore';
import { signToken } from '../middleware/auth';
import { badRequest, conflict, unauthorized } from '../utils/errors';
import type { CreateUserData } from '../repositories/DataStore';

function toPublicUser(u: UserRecord) {
  return {
    id: u.id,
    name: u.name,
    mobile: u.mobile,
    email: u.email,
    role: u.role,
    language: u.language,
    state: u.state,
    district: u.district,
    taluk: u.taluk,
    village: u.village,
    isActive: u.isActive,
    createdAt: u.createdAt,
  };
}

export function makeAuthController(store: DataStore) {
  return {
    async register(req: Request, res: Response): Promise<void> {
      const data = req.body as CreateUserData & { password: string };
      const existingMobile = await store.findUserByMobile(data.mobile);
      if (existingMobile) {
        throw conflict('An account with this mobile number already exists');
      }
      if (data.email) {
        const existingEmail = await store.findUserByEmail(data.email);
        if (existingEmail) {
          throw conflict('An account with this email already exists');
        }
      }
      // Registration always creates FARMER accounts. Admins are seeded only.
      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await store.createUser({ ...data, email: data.email || null, passwordHash, role: 'FARMER' });
      const token = signToken(user.id, user.role, user.name);
      res.status(201).json({ token, user: toPublicUser(user) });
    },

    async login(req: Request, res: Response): Promise<void> {
      const { identifier, password } = req.body as { identifier: string; password: string };
      const user = await store.findUserByLogin(identifier);
      if (!user) {
        throw unauthorized('Mobile/email or password is incorrect');
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw unauthorized('Mobile/email or password is incorrect');
      }
      if (!user.isActive) {
        throw unauthorized('This account has been suspended. Contact support.');
      }
      await store.touchLastActive(user.id);
      const token = signToken(user.id, user.role, user.name);
      res.json({ token, user: toPublicUser(user) });
    },

    async logout(_req: Request, res: Response): Promise<void> {
      // Stateless JWT: the client discards the token.
      res.json({ message: 'Signed out' });
    },

    async forgotPassword(req: Request, res: Response): Promise<void> {
      const { identifier } = req.body as { identifier: string };
      const user = await store.findUserByLogin(identifier);
      // Always respond the same way to avoid account enumeration.
      if (user) {
        const token = crypto.randomBytes(24).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await store.createPasswordReset(user.id, tokenHash, expiresAt);
        // No mail provider is configured in this build; the token is returned
        // only in demo mode so the flow is testable end to end.
        if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
          res.json({ message: 'Reset token generated', resetToken: token, demoNotice: 'Email delivery is not configured in this environment.' });
          return;
        }
      }
      res.json({ message: 'If that account exists, a reset link has been sent.' });
    },

    async resetPassword(req: Request, res: Response): Promise<void> {
      const { token, password } = req.body as { token: string; password: string };
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const record = await store.findValidPasswordReset(tokenHash);
      if (!record) {
        throw badRequest('This reset link is invalid or has expired');
      }
      const passwordHash = await bcrypt.hash(password, 10);
      await store.updatePassword(record.userId, passwordHash);
      await store.markPasswordResetUsed(tokenHash);
      res.json({ message: 'Password updated. You can sign in now.' });
    },
  };
}
