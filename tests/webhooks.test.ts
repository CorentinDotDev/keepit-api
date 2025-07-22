import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './app';
import { AuthService } from '../services/auth.service';
import { WebhookService } from '../services/webhook.service';

describe('Webhooks Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    const email = `webhooks-${Date.now()}@example.com`;
    const user = await AuthService.createUser(email, 'password123');
    userId = user.id;
    authToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!);
  });

  describe('GET /webhooks', () => {
    it('should get all webhooks for authenticated user', async () => {
      await WebhookService.createWebhook({
        action: 'note_created',
        url: 'https://example.com/webhook',
        userId
      });

      const response = await request(app)
        .get('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].action).toBe('note_created');
      expect(response.body[0].url).toBe('https://example.com/webhook');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/webhooks')
        .expect(401);
    });

    it('should return empty array when no webhooks exist', async () => {
      const response = await request(app)
        .get('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should only return webhooks for authenticated user', async () => {
      await WebhookService.createWebhook({
        action: 'note_created',
        url: 'https://example.com/webhook1',
        userId
      });

      const response = await request(app)
        .get('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].url).toBe('https://example.com/webhook1');
    });
  });

  describe('POST /webhooks', () => {
    it('should create a new webhook successfully', async () => {
      const webhookData = {
        action: 'note_created',
        url: 'https://example.com/new-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(200);

      expect(response.body.action).toBe('note_created');
      expect(response.body.url).toBe('https://example.com/new-webhook');
      expect(response.body.userId).toBe(userId);
      expect(response.body.id).toBeDefined();
    });

    it('should create webhook with note_updated action', async () => {
      const webhookData = {
        action: 'note_updated',
        url: 'https://example.com/update-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(200);

      expect(response.body.action).toBe('note_updated');
      expect(response.body.url).toBe('https://example.com/update-webhook');
    });

    it('should create webhook with note_deleted action', async () => {
      const webhookData = {
        action: 'note_deleted',
        url: 'https://example.com/delete-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(200);

      expect(response.body.action).toBe('note_deleted');
      expect(response.body.url).toBe('https://example.com/delete-webhook');
    });

    it('should return 401 without authentication', async () => {
      const webhookData = {
        action: 'note_created',
        url: 'https://example.com/unauthorized-webhook'
      };

      await request(app)
        .post('/webhooks')
        .send(webhookData)
        .expect(401);
    });

    it('should handle missing action field', async () => {
      const webhookData = {
        url: 'https://example.com/no-action-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(200);

      expect(response.body.url).toBe('https://example.com/no-action-webhook');
      expect(response.body.action).toBeNull();
    });

    it('should handle missing url field', async () => {
      const webhookData = {
        action: 'note_created'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(200);

      expect(response.body.action).toBe('note_created');
      expect(response.body.url).toBeNull();
    });
  });
});