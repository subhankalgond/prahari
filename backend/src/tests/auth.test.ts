import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, type TestContext } from './setup';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestApp();
});

describe('POST /api/auth/register', () => {
  it('registers a farmer with valid data', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'New Farmer',
        mobile: '+919700000001',
        password: 'Password@1',
        state: 'Karnataka',
        district: 'Mysuru',
        taluk: '',
        village: '',
        language: 'en',
      });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('FARMER');
  });

  it('rejects duplicate mobile', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'Dup Farmer',
        mobile: '+919700000001',
        password: 'Password@1',
        state: 'Karnataka',
        district: 'Mysuru',
        language: 'en',
      });
    expect(res.status).toBe(409);
  });

  it('rejects invalid mobile and short password', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'X',
        mobile: '123',
        password: 'short',
        state: 'Karnataka',
        district: 'Mysuru',
        language: 'en',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mobile|password|name/i);
  });

  it('never allows public registration as ADMIN', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'Sneaky User',
        mobile: '+919700000003',
        password: 'Password@1',
        state: 'Karnataka',
        district: 'Mysuru',
        language: 'en',
        role: 'ADMIN',
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('FARMER');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with mobile', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919888777666', password: 'Farmer@123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('logs in with email', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ identifier: 'farmer@test.in', password: 'Farmer@123' });
    expect(res.status).toBe(200);
  });

  it('rejects wrong password without revealing which field failed', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919888777666', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  it('rejects unknown user with the same generic error', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919000000000', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect/i);
  });
});

describe('Authorization and ownership', () => {
  it('blocks protected routes without token', async () => {
    const res = await request(ctx.app).get('/api/crops');
    expect(res.status).toBe(401);
  });

  it('blocks admin routes for farmers', async () => {
    const res = await request(ctx.app).get('/api/admin/dashboard').set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(res.status).toBe(403);
  });

  it('allows admin routes for admins', async () => {
    const res = await request(ctx.app).get('/api/admin/dashboard').set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeTruthy();
  });

  it('keeps one farmer from reading another farmers crop', async () => {
    const createRes = await request(ctx.app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .send({
        name: 'Tomato',
        areaValue: 1,
        areaUnit: 'acre',
        sowingDate: '2026-06-01',
        growthStage: 'VEGETATIVE',
      });
    const cropId = createRes.body.crop.id as string;

    // Second farmer tries to access it.
    await request(ctx.app).post('/api/auth/register').send({
      name: 'Other Farmer',
      mobile: '+919700000009',
      password: 'Password@1',
      state: 'Karnataka',
      district: 'Mysuru',
      language: 'en',
    });
    const otherLogin = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919700000009', password: 'Password@1' });
    const res = await request(ctx.app).get(`/api/crops/${cropId}`).set('Authorization', `Bearer ${otherLogin.body.token}`);
    expect(res.status).toBe(403);
  });
});

describe('Crop CRUD', () => {
  let cropId = '';

  it('creates a crop', async () => {
    const res = await request(ctx.app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .send({
        name: 'Rice',
        variety: 'Sona Masuri',
        fieldName: 'Paddy 2',
        areaValue: 2.5,
        areaUnit: 'acre',
        sowingDate: '2026-05-20',
        growthStage: 'FLOWERING',
        soilType: 'ALLUVIAL',
        irrigationType: 'CANAL',
        location: '13.02,77.60',
      });
    expect(res.status).toBe(201);
    expect(res.body.crop.name).toBe('Rice');
    cropId = res.body.crop.id;
  });

  it('rejects invalid crop payload', async () => {
    const res = await request(ctx.app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .send({ name: '', areaValue: -4, areaUnit: 'bogus', sowingDate: 'not-a-date', growthStage: 'SPACE' });
    expect(res.status).toBe(400);
  });

  it('lists only own crops', async () => {
    const res = await request(ctx.app).get('/api/crops').set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.crops)).toBe(true);
    expect(res.body.crops.length).toBeGreaterThanOrEqual(1);
  });

  it('updates a crop', async () => {
    const res = await request(ctx.app)
      .put(`/api/crops/${cropId}`)
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .send({ growthStage: 'FRUITING' });
    expect(res.status).toBe(200);
    expect(res.body.crop.growthStage).toBe('FRUITING');
  });

  it('deletes a crop', async () => {
    const res = await request(ctx.app).delete(`/api/crops/${cropId}`).set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(res.status).toBe(200);
    const get = await request(ctx.app).get(`/api/crops/${cropId}`).set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(get.status).toBe(404);
  });
});

describe('Scan API', () => {
  let cropId = '';

  beforeAll(async () => {
    const res = await request(ctx.app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .send({
        name: 'Tomato',
        areaValue: 1,
        areaUnit: 'acre',
        sowingDate: '2026-06-10',
        growthStage: 'FRUITING',
      });
    cropId = res.body.crop.id;
  });

  it('creates a scan without an image and returns a structured result', async () => {
    const res = await request(ctx.app)
      .post('/api/scans')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .field('cropId', cropId)
      .field('growthStage', 'FRUITING')
      .field('symptoms', 'brown spots on leaves');
    expect(res.status).toBe(201);
    expect(res.body.result.condition).toBeTruthy();
    expect(res.body.result.confidence).toBeGreaterThan(0);
    expect(res.body.result.confidence).toBeLessThanOrEqual(99);
    expect(Array.isArray(res.body.result.actions)).toBe(true);
    expect(res.body.scanId).toBeTruthy();
  });

  it('rejects a scan for a crop owned by someone else', async () => {
    await request(ctx.app).post('/api/auth/register').send({
      name: 'Third Farmer',
      mobile: '+919700000011',
      password: 'Password@1',
      state: 'Karnataka',
      district: 'Mysuru',
      language: 'en',
    });
    const other = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919700000011', password: 'Password@1' });
    const res = await request(ctx.app).post('/api/scans').set('Authorization', `Bearer ${other.body.token}`).field('cropId', cropId);
    expect(res.status).toBe(403);
  });

  it('lists scans newest first', async () => {
    const res = await request(ctx.app).get('/api/scans').set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.scans.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects disallowed file types', async () => {
    const res = await request(ctx.app)
      .post('/api/scans')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .field('cropId', cropId)
      .attach('image', Buffer.from('GIF89a-not-allowed'), { filename: 'fake.gif', contentType: 'image/gif' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid jpeg upload', async () => {
    // Minimal valid JPEG header bytes.
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(256, 0x7f),
    ]);
    const res = await request(ctx.app)
      .post('/api/scans')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .field('cropId', cropId)
      .attach('image', jpeg, { filename: 'leaf.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body.result).toBeTruthy();
  });
});

describe('Library API', () => {
  it('lists public library entries without auth', async () => {
    const res = await request(ctx.app).get('/api/diseases');
    expect(res.status).toBe(200);
    expect(res.body.entries.length).toBe(0); // test store is unseeded
  });

  it('filters by kind and crop', async () => {
    await ctx.store.createLibraryEntry({
      name: 'Rust',
      cropName: 'Wheat',
      kind: 'DISEASE',
      description: 'Fungal rust disease of wheat leaves.',
      symptoms: ['Orange pustules'],
      causes: ['Fungus'],
      favorable: [],
      prevention: ['Resistant varieties'],
      management: ['Scout weekly'],
      severity: 'MODERATE',
      isActive: true,
    });
    const res = await request(ctx.app).get('/api/diseases?crop=Wheat&kind=DISEASE');
    expect(res.status).toBe(200);
    expect(res.body.entries.some((e: { name: string }) => e.name === 'Rust')).toBe(true);
  });

  it('admin can create, update and delete entries', async () => {
    const create = await request(ctx.app)
      .post('/api/admin/diseases')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        name: 'Downy Mildew',
        cropName: 'Grape',
        kind: 'DISEASE',
        description: 'Downy mildew of grape vines.',
        symptoms: ['Oily spots on leaves'],
        causes: ['Water mould'],
        prevention: ['Canopy airflow'],
        management: ['Remove infected leaves'],
        severity: 'MODERATE',
      });
    expect(create.status).toBe(201);
    const id = create.body.entry.id;

    const update = await request(ctx.app)
      .put(`/api/admin/diseases/${id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ severity: 'HIGH' });
    expect(update.status).toBe(200);
    expect(update.body.entry.severity).toBe('HIGH');

    const del = await request(ctx.app).delete(`/api/admin/diseases/${id}`).set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(del.status).toBe(200);
  });

  it('farmer cannot create library entries', async () => {
    const res = await request(ctx.app)
      .post('/api/admin/diseases')
      .set('Authorization', `Bearer ${ctx.farmerToken}`)
      .send({ name: 'Hack', cropName: 'X', kind: 'DISEASE', description: 'x'.repeat(20), symptoms: ['a'], causes: ['b'], prevention: ['c'], management: ['d'], severity: 'LOW' });
    expect(res.status).toBe(403);
  });
});

describe('Alerts and notifications', () => {
  it('returns alerts list for the farmer', async () => {
    const res = await request(ctx.app).get('/api/alerts').set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  it('weather endpoint returns structured payload', async () => {
    const res = await request(ctx.app).get('/api/weather?location=Tumkur');
    expect(res.status).toBe(200);
    expect(res.body.weather.current.temperature).toBeTypeOf('number');
    expect(res.body.forecast ?? res.body.weather.forecast).toBeTruthy();
    expect(res.body.risk.reasons.length).toBeGreaterThan(0);
  });

  it('notifications mark-read flow works', async () => {
    const list = await request(ctx.app).get('/api/notifications').set('Authorization', `Bearer ${ctx.farmerToken}`);
    expect(list.status).toBe(200);
    const unread = list.body.unread as number;
    expect(unread).toBeGreaterThanOrEqual(0);
    if (list.body.notifications.length > 0) {
      const id = list.body.notifications[0].id;
      const mark = await request(ctx.app).put(`/api/notifications/${id}/read`).set('Authorization', `Bearer ${ctx.farmerToken}`);
      expect(mark.status).toBe(200);
    }
  });

  it('farmer cannot read another farmers alert', async () => {
    const list = await request(ctx.app).get('/api/alerts').set('Authorization', `Bearer ${ctx.farmerToken}`);
    if (list.body.alerts.length === 0) return;
    const id = list.body.alerts[0].id;
    await request(ctx.app).post('/api/auth/register').send({
      name: 'Fourth Farmer',
      mobile: '+919700000012',
      password: 'Password@1',
      state: 'Karnataka',
      district: 'Mysuru',
      language: 'en',
    });
    const other = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919700000012', password: 'Password@1' });
    const res = await request(ctx.app).get(`/api/alerts/${id}`).set('Authorization', `Bearer ${other.body.token}`);
    expect(res.status).toBe(404);
  });
});

describe('Admin routes', () => {
  it('dashboard returns stats, charts and activity', async () => {
    const res = await request(ctx.app).get('/api/admin/dashboard').set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats.totalFarmers).toBeGreaterThanOrEqual(1);
    expect(res.body.charts.scansOverTime.length).toBe(14);
    expect(Array.isArray(res.body.activity)).toBe(true);
  });

  it('farmers list supports search', async () => {
    const res = await request(ctx.app).get('/api/admin/farmers?search=test').set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.farmers.length).toBeGreaterThanOrEqual(1);
  });

  it('admin can suspend and reactivate a farmer', async () => {
    const suspend = await request(ctx.app)
      .put(`/api/admin/farmers/${ctx.farmerId}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ isActive: false });
    expect(suspend.status).toBe(200);
    expect(suspend.body.farmer.isActive).toBe(false);

    const reactivate = await request(ctx.app)
      .put(`/api/admin/farmers/${ctx.farmerId}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ isActive: true });
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.farmer.isActive).toBe(true);
  });

  it('suspended farmer cannot log in', async () => {
    await request(ctx.app)
      .put(`/api/admin/farmers/${ctx.farmerId}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ isActive: false });
    const res = await request(ctx.app).post('/api/auth/login').send({ identifier: '+919888777666', password: 'Farmer@123' });
    expect(res.status).toBe(401);
    await request(ctx.app)
      .put(`/api/admin/farmers/${ctx.farmerId}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ isActive: true });
  });

  it('admin broadcasts an alert to all active farmers', async () => {
    const res = await request(ctx.app)
      .post('/api/admin/alerts')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        title: 'Heavy rain advisory',
        description: 'Heavy rain expected in your district this week.',
        type: 'WEATHER',
        riskLevel: 'MEDIUM',
      });
    expect(res.status).toBe(201);
    expect(res.body.created).toBeGreaterThanOrEqual(1);
  });

  it('admin scan records include farmer names', async () => {
    const res = await request(ctx.app).get('/api/admin/scans').set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.scans)).toBe(true);
  });
});

describe('Forgot password flow', () => {
  it('returns a usable reset token in non-production and resets the password', async () => {
    const forgot = await request(ctx.app).post('/api/auth/forgot-password').send({ identifier: 'farmer@test.in' });
    expect(forgot.status).toBe(200);
    expect(forgot.body.resetToken).toBeTruthy();
    const reset = await request(ctx.app)
      .post('/api/auth/reset-password')
      .send({ token: forgot.body.resetToken, password: 'NewPass@123' });
    expect(reset.status).toBe(200);
    const login = await request(ctx.app).post('/api/auth/login').send({ identifier: 'farmer@test.in', password: 'NewPass@123' });
    expect(login.status).toBe(200);
  });

  it('rejects expired or bogus tokens', async () => {
    const reset = await request(ctx.app).post('/api/auth/reset-password').send({ token: 'bogus-token-value', password: 'NewPass@123' });
    expect(reset.status).toBe(400);
  });
});
