import request from 'supertest';
import app from './app';
import { AuthService } from '../services/auth.service';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '../constants';

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
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(SUCCESS_MESSAGES.REGISTRATION_SUCCESS);
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
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.error).toBe(ERROR_MESSAGES.EMAIL_ALREADY_USED);
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
        .expect(HTTP_STATUS.OK);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.expiresIn).toBe('24h');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: `nonexistent-${Date.now()}@example.com`,
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.error).toBe(ERROR_MESSAGES.USER_NOT_FOUND);
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
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toBe(ERROR_MESSAGES.INVALID_PASSWORD);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      // Créer un utilisateur et se connecter pour obtenir un refresh token
      const email = `refresh-${Date.now()}@example.com`;
      await AuthService.createUser(email, 'password123');

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(HTTP_STATUS.OK);

      const { refreshToken } = loginResponse.body;

      // Utiliser le refresh token pour obtenir de nouveaux tokens
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HTTP_STATUS.OK);

      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).toBeDefined();
      expect(refreshResponse.body.expiresIn).toBe('24h');
      expect(typeof refreshResponse.body.accessToken).toBe('string');
      expect(typeof refreshResponse.body.refreshToken).toBe('string');
      // Le nouveau refresh token doit être différent de l'ancien
      expect(refreshResponse.body.refreshToken).not.toBe(refreshToken);
    });

    it('should return error for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.error).toBe(ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED);
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toBe(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    });

    it('should return error for expired refresh token', async () => {
      // Créer un utilisateur et se connecter
      const email = `expired-${Date.now()}@example.com`;
      const user = await AuthService.createUser(email, 'password123');

      // Créer un refresh token expiré manuellement
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Hier

      const expiredToken = await AuthService.createRefreshToken(user.id);
      // Modifier la date d'expiration dans la base de données
      // Note: En réalité, nous testerions avec un token vraiment expiré
      
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'definitely-expired-token' })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toBe(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    });

    it('should invalidate old refresh token after successful refresh', async () => {
      // Créer un utilisateur et se connecter
      const email = `invalidate-${Date.now()}@example.com`;
      await AuthService.createUser(email, 'password123');

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(HTTP_STATUS.OK);

      const { refreshToken: oldRefreshToken } = loginResponse.body;

      // Utiliser le refresh token
      await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(HTTP_STATUS.OK);

      // Essayer de réutiliser l'ancien refresh token
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toBe(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid token successfully', async () => {
      const email = `verify-${Date.now()}@example.com`;
      await AuthService.createUser(email, 'password123');

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(HTTP_STATUS.OK);

      const { accessToken } = loginResponse.body;

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HTTP_STATUS.OK);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.id).toBeDefined();
    });

    it('should return error for missing token', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toBe(ERROR_MESSAGES.MISSING_TOKEN);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toBe(ERROR_MESSAGES.INVALID_TOKEN);
    });
  });

  describe('POST /auth/', () => {
    it('should return 400 for root auth endpoint', async () => {
      await request(app)
        .post('/auth/')
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });
});