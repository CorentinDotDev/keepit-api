import request from 'supertest';
import app from './app';
import { AuthService } from '../services/auth.service';

describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.message).toBe('Inscription réussie');
    });

    it('should return error for duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const userData = {
        email,
        password: 'password123'
      };

      await AuthService.createUser(userData.email, userData.password);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe('Email déjà utilisé');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`;
      await AuthService.createUser(email, 'password123');

      const loginData = {
        email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: `nonexistent-${Date.now()}@example.com`,
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.error).toBe('Utilisateur non trouvé');
    });

    it('should return error for invalid password', async () => {
      const email = `wrongpass-${Date.now()}@example.com`;
      await AuthService.createUser(email, 'password123');

      const loginData = {
        email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Mot de passe invalide');
    });
  });

  describe('POST /auth/', () => {
    it('should return 400 for root auth endpoint', async () => {
      await request(app)
        .post('/auth/')
        .expect(400);
    });
  });
});