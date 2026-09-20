import type { NextFunction, Request, Response } from 'express';
import { unauthorized, forbidden } from '../utils/errors';

export interface AuthUser {
  id: string;
  role: 'FARMER' | 'ADMIN';
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    next(unauthorized('Please sign in to continue'));
    return;
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    next(unauthorized('Your session has expired. Please sign in again'));
  }
}

import jwt from 'jsonwebtoken';
import { config } from '../config';

export function signToken(userId: string, role: 'FARMER' | 'ADMIN', name: string): string {
  return jwt.sign({ role, name }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): { sub: string; role: 'FARMER' | 'ADMIN'; name: string } {
  const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string; role?: string; name?: string };
  if (!decoded.sub || !decoded.role) {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub, role: decoded.role as 'FARMER' | 'ADMIN', name: decoded.name ?? '' };
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  if (req.user.role !== 'ADMIN') {
    next(forbidden('Admin access required'));
    return;
  }
  next();
}
