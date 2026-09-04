import request from 'supertest';
import createApp from '../app';
import database from '../database/connection';

const app = createApp();

beforeAll(async () => {
  await database.connect();
});

afterAll(async () => {
  await database.disconnect();
});

describe('Auth - Register Individual', () => {
  const endpoint = '/api/v1/auth/register/individual';

  it('should reject missing fields', async () => {
    const res = await request(app).post(endpoint).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post(endpoint).send({
      fullName: 'Test User',
      email: 'invalid-email',
      mobileNumber: '9876543210',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
      role: 'patient',
      acceptTerms: true,
    });
    expect(res.status).toBe(400);
  });

  it('should reject mismatched passwords', async () => {
    const res = await request(app).post(endpoint).send({
      fullName: 'Test User',
      email: 'test@test.com',
      mobileNumber: '9876543210',
      password: 'Test@1234',
      confirmPassword: 'Mismatch@1234',
      role: 'patient',
      acceptTerms: true,
    });
    expect(res.status).toBe(400);
  });
});

describe('Auth - Login', () => {
  const endpoint = '/api/v1/auth/login';

  it('should reject invalid credentials', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'nonexistent@test.com',
      password: 'WrongPass@123',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing email', async () => {
    const res = await request(app).post(endpoint).send({ password: 'test' });
    expect(res.status).toBe(400);
  });
});

describe('Health Check', () => {
  it('should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
