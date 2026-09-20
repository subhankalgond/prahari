import request from 'supertest';
import bcrypt from 'bcryptjs';
import type { Express } from 'express';
import { createApp } from '../app';
import { MemoryStore } from '../repositories/memoryStore';
import type { DataStore, UserRecord } from '../repositories/DataStore';

export interface TestContext {
  app: Express;
  store: DataStore;
  farmerToken: string;
  adminToken: string;
  farmerId: string;
}

export async function createTestApp(): Promise<TestContext> {
  const store = new MemoryStore(false);
  const app = createApp(store);

  const farmer = await store.createUser({
    name: 'Test Farmer',
    mobile: '+919888777666',
    email: 'farmer@test.in',
    passwordHash: await bcrypt.hash('Farmer@123', 10),
    state: 'Karnataka',
    district: 'Tumkur',
    taluk: null,
    village: null,
    language: 'en',
  });
  await store.createUser({
    name: 'Test Admin',
    mobile: '+919888777111',
    email: 'admin@test.in',
    passwordHash: await bcrypt.hash('Admin@123', 10),
    state: 'Karnataka',
    district: 'Bengaluru',
    taluk: null,
    village: null,
    language: 'en',
    role: 'ADMIN',
  });

  const loginRes = async (identifier: string, password: string): Promise<string> => {
    const res = await request(app).post('/api/auth/login').send({ identifier, password });
    return res.body.token as string;
  };
  const farmerToken = await loginRes('+919888777666', 'Farmer@123');
  const adminToken = await loginRes('admin@test.in', 'Admin@123');

  return { app, store, farmerToken, adminToken, farmerId: (farmer as UserRecord).id };
}
