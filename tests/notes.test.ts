import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './app';
import { AuthService } from '../services/auth.service';
import { NoteService } from '../services/note.service';

describe('Notes Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    const email = `notes-${Date.now()}@example.com`;
    const user = await AuthService.createUser(email, 'password123');
    userId = user.id;
    authToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!);
  });

  describe('GET /notes', () => {
    it('should get all notes for authenticated user', async () => {
      await NoteService.createNote({
        title: 'Test Note',
        content: 'Test content',
        userId
      });

      const response = await request(app)
        .get('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Note');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/notes')
        .expect(401);
    });

    it('should return empty array when no notes exist', async () => {
      const response = await request(app)
        .get('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /notes/:id', () => {
    it('should get specific note by id', async () => {
      const note = await NoteService.createNote({
        title: 'Specific Note',
        content: 'Specific content',
        userId
      });

      const response = await request(app)
        .get(`/notes/${note.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(note.id);
      expect(response.body.title).toBe('Specific Note');
    });

    it('should return null for non-existent note', async () => {
      const response = await request(app)
        .get('/notes/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('POST /notes', () => {
    it('should create a new note successfully', async () => {
      const noteData = {
        title: 'New Note',
        content: 'New content',
        color: '#ffffff',
        isPinned: false,
        checkboxes: [
          { label: 'Task 1', checked: false },
          { label: 'Task 2', checked: true }
        ]
      };

      const response = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(200);

      expect(response.body.title).toBe('New Note');
      expect(response.body.content).toBe('New content');
      expect(response.body.checkboxes).toHaveLength(2);
      expect(response.body.userId).toBe(userId);
    });

    it('should create note without checkboxes', async () => {
      const noteData = {
        title: 'Simple Note',
        content: 'Simple content'
      };

      const response = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(200);

      expect(response.body.title).toBe('Simple Note');
      expect(response.body.content).toBe('Simple content');
      expect(response.body.checkboxes).toHaveLength(0);
      expect(response.body.color).toBeNull();
      expect(response.body.isPinned).toBe(false);
    });

    it('should create note with only title and content', async () => {
      const noteData = {
        title: 'Minimal Note',
        content: 'Minimal content'
      };

      const response = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(200);

      expect(response.body.title).toBe('Minimal Note');
      expect(response.body.content).toBe('Minimal content');
      expect(response.body.userId).toBe(userId);
      expect(response.body.id).toBeDefined();
      expect(response.body.checkboxes).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const noteData = {
        title: 'Unauthorized Note',
        content: 'Unauthorized content'
      };

      await request(app)
        .post('/notes')
        .send(noteData)
        .expect(401);
    });
  });

  describe('PATCH /notes/:id', () => {
    it('should update note successfully', async () => {
      // Créer une note d'abord
      const createdNote = await NoteService.createNote({
        title: 'Original Title',
        content: 'Original content',
        userId
      });

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        isPinned: true
      };

      const response = await request(app)
        .patch(`/notes/${createdNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.content).toBe('Updated content');
      expect(response.body.isPinned).toBe(true);
    });

    it('should return 500 for non-existent note', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .patch('/notes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(500);
    });
  });

  describe('DELETE /notes/:id', () => {
    it('should delete note and associated checkboxes successfully', async () => {
      // Créer une note d'abord
      const createdNote = await NoteService.createNote({
        title: 'Note to Delete',
        content: 'Content to delete',
        userId,
        checkboxes: [{ label: 'Checkbox to delete', checked: false }]
      });

      const response = await request(app)
        .delete(`/notes/${createdNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Supprimé');

      const deletedNote = await NoteService.findNoteById(createdNote.id);
      expect(deletedNote).toBeNull();
    });

    it('should return 500 for non-existent note', async () => {
      await request(app)
        .delete('/notes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete('/notes/1')
        .expect(401);
    });
  });

  describe('PATCH /notes/checkbox/:checkboxId', () => {
    it('should update checkbox state successfully', async () => {
      // Créer une note avec une checkbox
      const createdNote = await NoteService.createNote({
        title: 'Note avec checkbox',
        content: 'Test checkbox',
        userId,
        checkboxes: [{ label: 'Tâche test', checked: false }]
      });

      const checkboxId = createdNote.checkboxes[0].id;

      // Cocher la checkbox
      const response = await request(app)
        .patch(`/notes/checkbox/${checkboxId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ checked: true })
        .expect(200);

      expect(response.body.id).toBe(checkboxId);
      expect(response.body.checked).toBe(true);
      expect(response.body.label).toBe('Tâche test');
    });

    it('should uncheck checkbox successfully', async () => {
      // Créer une note avec une checkbox cochée
      const createdNote = await NoteService.createNote({
        title: 'Note avec checkbox cochée',
        content: 'Test checkbox',
        userId,
        checkboxes: [{ label: 'Tâche cochée', checked: true }]
      });

      const checkboxId = createdNote.checkboxes[0].id;

      // Décocher la checkbox
      const response = await request(app)
        .patch(`/notes/checkbox/${checkboxId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ checked: false })
        .expect(200);

      expect(response.body.id).toBe(checkboxId);
      expect(response.body.checked).toBe(false);
      expect(response.body.label).toBe('Tâche cochée');
    });

    it('should return 404 for non-existent checkbox', async () => {
      const response = await request(app)
        .patch('/notes/checkbox/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ checked: true })
        .expect(404);

      expect(response.body.error).toBe('Checkbox non trouvée');
    });

    it('should return 404 for checkbox belonging to another user', async () => {
      // Créer un autre utilisateur
      const otherUser = await AuthService.createUser(`other-${Date.now()}@example.com`, 'password123');
      
      // Créer une note avec checkbox pour l'autre utilisateur
      const otherNote = await NoteService.createNote({
        title: 'Note d\'un autre utilisateur',
        content: 'Test',
        userId: otherUser.id,
        checkboxes: [{ label: 'Tâche privée', checked: false }]
      });

      const checkboxId = otherNote.checkboxes[0].id;

      // Essayer de modifier la checkbox avec le token de l'utilisateur actuel
      const response = await request(app)
        .patch(`/notes/checkbox/${checkboxId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ checked: true })
        .expect(404);

      expect(response.body.error).toBe('Checkbox non trouvée');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch('/notes/checkbox/1')
        .send({ checked: true })
        .expect(401);
    });
  });
});