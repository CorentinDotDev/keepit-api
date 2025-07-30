import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './app';
import { AuthService } from '../services/auth.service';
import { WebhookService } from '../services/webhook.service';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, WEBHOOK_ACTIONS } from '../constants';

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
        action: WEBHOOK_ACTIONS.NOTE_CREATED,
        url: 'https://example.com/webhook',
        userId
      });

      const response = await request(app)
        .get('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].action).toBe(WEBHOOK_ACTIONS.NOTE_CREATED);
      expect(response.body[0].url).toBe('https://example.com/webhook');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/webhooks')
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return empty array when no webhooks exist', async () => {
      const response = await request(app)
        .get('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual([]);
    });

    it('should only return webhooks for authenticated user', async () => {
      await WebhookService.createWebhook({
        action: WEBHOOK_ACTIONS.NOTE_CREATED,
        url: 'https://example.com/webhook1',
        userId
      });

      const response = await request(app)
        .get('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.OK);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].url).toBe('https://example.com/webhook1');
    });
  });

  describe('POST /webhooks', () => {
    it('should create a new webhook successfully', async () => {
      const webhookData = {
        action: WEBHOOK_ACTIONS.NOTE_CREATED,
        url: 'https://example.com/new-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(HTTP_STATUS.OK);

      expect(response.body.action).toBe(WEBHOOK_ACTIONS.NOTE_CREATED);
      expect(response.body.url).toBe('https://example.com/new-webhook');
      expect(response.body.userId).toBe(userId);
      expect(response.body.id).toBeDefined();
    });

    it('should create webhook with note_updated action', async () => {
      const webhookData = {
        action: WEBHOOK_ACTIONS.NOTE_UPDATED,
        url: 'https://example.com/update-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(HTTP_STATUS.OK);

      expect(response.body.action).toBe(WEBHOOK_ACTIONS.NOTE_UPDATED);
      expect(response.body.url).toBe('https://example.com/update-webhook');
    });

    it('should create webhook with note_deleted action', async () => {
      const webhookData = {
        action: WEBHOOK_ACTIONS.NOTE_DELETED,
        url: 'https://example.com/delete-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(HTTP_STATUS.OK);

      expect(response.body.action).toBe(WEBHOOK_ACTIONS.NOTE_DELETED);
      expect(response.body.url).toBe('https://example.com/delete-webhook');
    });

    it('should return 401 without authentication', async () => {
      const webhookData = {
        action: WEBHOOK_ACTIONS.NOTE_CREATED,
        url: 'https://example.com/unauthorized-webhook'
      };

      await request(app)
        .post('/webhooks')
        .send(webhookData)
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 400 for missing action field', async () => {
      const webhookData = {
        url: 'https://example.com/no-action-webhook'
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.error).toBe(ERROR_MESSAGES.ACTION_URL_REQUIRED);
    });

    it('should return 400 for missing url field', async () => {
      const webhookData = {
        action: WEBHOOK_ACTIONS.NOTE_CREATED
      };

      const response = await request(app)
        .post('/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(webhookData)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.error).toBe(ERROR_MESSAGES.ACTION_URL_REQUIRED);
    });
  });

  describe('DELETE /webhooks/:id', () => {
    it('should delete webhook successfully', async () => {
      // Créer un webhook d'abord
      const createdWebhook = await WebhookService.createWebhook({
        action: WEBHOOK_ACTIONS.NOTE_CREATED,
        url: 'https://example.com/webhook-to-delete',
        userId
      });

      const response = await request(app)
        .delete(`/webhooks/${createdWebhook.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.OK);

      expect(response.body.message).toBe(SUCCESS_MESSAGES.WEBHOOK_DELETED);

      // Vérifier que le webhook a été supprimé
      const deletedWebhook = await WebhookService.findWebhookById(createdWebhook.id);
      expect(deletedWebhook).toBeNull();
    });

    it('should return 404 for non-existent webhook', async () => {
      const response = await request(app)
        .delete('/webhooks/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.error).toBe(ERROR_MESSAGES.WEBHOOK_NOT_FOUND);
    });

    it('should return 403 for webhook belonging to another user', async () => {
      // Créer un autre utilisateur
      const otherUser = await AuthService.createUser(`other-${Date.now()}@example.com`, 'password123');
      
      // Créer un webhook pour l'autre utilisateur
      const otherWebhook = await WebhookService.createWebhook({
        action: WEBHOOK_ACTIONS.NOTE_CREATED,
        url: 'https://example.com/other-webhook',
        userId: otherUser.id
      });

      // Essayer de supprimer le webhook avec le token de l'utilisateur actuel
      const response = await request(app)
        .delete(`/webhooks/${otherWebhook.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.FORBIDDEN);

      expect(response.body.error).toBe(ERROR_MESSAGES.ACCESS_DENIED);

      // Vérifier que le webhook n'a pas été supprimé
      const stillExists = await WebhookService.findWebhookById(otherWebhook.id);
      expect(stillExists).not.toBeNull();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete('/webhooks/1')
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should handle invalid webhook ID gracefully', async () => {
      const response = await request(app)
        .delete('/webhooks/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.error).toBe(ERROR_MESSAGES.WEBHOOK_NOT_FOUND);
    });
  });
});