# Notes API - Guide Backend pour Agents IA

Cette documentation explique comment utiliser l'API Notes, une API REST TypeScript/Express pour la gestion de notes avec authentification et webhooks.

## 📋 Vue d'ensemble

- **Base URL**: `http://localhost:3000`
- **Documentation Swagger**: `http://localhost:3000/api-docs`
- **Architecture**: Express.js + TypeScript + Prisma ORM
- **Authentification**: JWT Bearer Token
- **Base de données**: SQLite (dev) via Prisma

## 🚀 Démarrage rapide

### Lancement du serveur
```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Build et démarrage en production
npm run build
npm start

# Tests
npm test
```

### Variables d'environnement requises
```env
JWT_SECRET=your_jwt_secret_here
DATABASE_URL="file:./dev.db"
```

## 🔐 Authentification

L'API utilise JWT Bearer Token pour l'authentification. Toutes les routes sauf `/auth/*` nécessitent un token.

### 1. Inscription d'un utilisateur
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Réponse (200)**:
```json
{
  "message": "Inscription réussie"
}
```

### 2. Connexion
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Réponse (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Utilisation du token
Ajoutez le header suivant à toutes les requêtes authentifiées :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Gestion des Notes

### Récupérer toutes les notes
```bash
curl -X GET http://localhost:3000/notes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Récupérer une note spécifique
```bash
curl -X GET http://localhost:3000/notes/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer une note
```bash
curl -X POST http://localhost:3000/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma nouvelle note",
    "content": "Contenu de la note",
    "color": "#ffffff",
    "isPinned": false,
    "checkboxes": [
      {
        "label": "Tâche 1",
        "checked": false
      },
      {
        "label": "Tâche 2", 
        "checked": true
      }
    ]
  }'
```

### Modifier une note
```bash
curl -X PATCH http://localhost:3000/notes/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Titre modifié",
    "isPinned": true
  }'
```

### Supprimer une note
```bash
curl -X DELETE http://localhost:3000/notes/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Modifier l'état d'une checkbox
```bash
curl -X PATCH http://localhost:3000/notes/checkbox/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checked": true
  }'
```

## 🔗 Webhooks

Les webhooks permettent de recevoir des notifications lors d'événements sur les notes.

### Actions disponibles
- `note_created`: Déclenché à la création d'une note
- `note_updated`: Déclenché à la modification d'une note  
- `note_deleted`: Déclenché à la suppression d'une note

### Récupérer les webhooks
```bash
curl -X GET http://localhost:3000/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer un webhook
```bash
curl -X POST http://localhost:3000/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "note_created",
    "url": "https://your-server.com/webhook"
  }'
```

### Payload reçu par le webhook
```json
{
  "action": "note_created",
  "note": {
    "id": 1,
    "title": "Ma nouvelle note",
    "content": "Contenu de la note",
    "color": "#ffffff",
    "isPinned": false,
    "isShared": false,
    "userId": 1,
    "checkboxes": [],
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  },
  "userId": 1,
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

### Sécurité des webhooks
- URLs internes bloquées (localhost, 127.0.0.1, réseaux privés)
- Rate limiting: 1 appel/seconde par webhook
- Timeout: 5 secondes
- Validation d'URL stricte

## 📊 Codes de statut et erreurs

### Codes de succès
- `200`: OK - Requête réussie
- `201`: Created - Ressource créée (non utilisé actuellement)

### Codes d'erreur
- `400`: Bad Request - Données invalides
- `401`: Unauthorized - Token manquant/invalide
- `403`: Forbidden - Accès interdit
- `404`: Not Found - Ressource non trouvée
- `500`: Internal Server Error - Erreur serveur

### Format des erreurs
```json
{
  "error": "Message d'erreur en français"
}
```

### Messages d'erreur courants
```javascript
// Authentification
"Email et mot de passe requis"
"Email invalide"
"Mot de passe trop court (minimum 6 caractères)"
"Email déjà utilisé"
"Utilisateur non trouvé"
"Mot de passe invalide"
"Token manquant"
"Token invalide"

// Notes
"Note non trouvée"
"Accès non autorisé"
"Titre invalide (1-200 caractères)"
"Contenu trop long (max 10000 caractères)"
"Checkbox non trouvée"

// Webhooks
"Action et URL requis"
"Action invalide"
"URL invalide" 
"URL interne non autorisée"
"Erreur création webhook"
```

## 🏗️ Modèles de données

### Utilisateur
```typescript
{
  id: number
  email: string (max 255 caractères)
  password: string (hashé avec bcrypt)
}
```

### Note
```typescript
{
  id: number
  title: string (max 200 caractères)
  content: string (max 10000 caractères)
  color?: string | null
  isPinned: boolean (default: false)
  isShared: boolean (default: false)
  userId: number
  checkboxes: Checkbox[]
  createdAt: Date
  updatedAt: Date
}
```

### Checkbox
```typescript
{
  id: number
  label: string
  checked: boolean (default: false)
  noteId: number
}
```

### Webhook
```typescript
{
  id: number
  action: 'note_created' | 'note_updated' | 'note_deleted'
  url: string
  userId: number
}
```

## 🔒 Sécurité

### Authentification JWT
- Tokens expirés après 24h
- Secret JWT configuré via variable d'environnement
- Middleware d'authentification sur toutes les routes protégées

### Validation des données
- Validation stricte des emails, URLs, longueurs de champ
- Échappement automatique SQL via Prisma ORM
- Hachage bcrypt des mots de passe

### Protection SSRF
- Blocage des URLs internes dans les webhooks
- Validation des formats d'URL
- Timeout et rate limiting

## 🧪 Tests

### Lancer les tests
```bash
npm test
```

### Structure des tests
- `tests/auth.test.ts`: Tests d'authentification
- `tests/notes.test.ts`: Tests CRUD des notes et checkboxes
- `tests/webhooks.test.ts`: Tests de gestion des webhooks

### Couverture
- 35 tests couvrant tous les endpoints
- Tests d'authentification, validation, et gestion d'erreurs
- Utilisation de base de données de test isolée

## ⚡ Performance et limitations

### Rate limiting
- Webhooks: 1 appel/seconde par webhook
- Pas de rate limiting général sur l'API (à implémenter si nécessaire)

### Limites de taille
- Email: 255 caractères max
- Titre de note: 200 caractères max  
- Contenu de note: 10 000 caractères max
- Mot de passe: 6 caractères minimum

### Timeouts
- Webhooks: 5 secondes
- Pas de timeout général sur les requêtes API

## 🚨 Gestion d'erreurs pour agents IA

### Stratégie recommandée
1. **Toujours vérifier le code de statut** avant de traiter la réponse
2. **Parser le JSON d'erreur** pour obtenir le message explicite
3. **Implémenter une logique de retry** pour les erreurs 5xx
4. **Valider les données** côté client avant envoi
5. **Gérer l'expiration des tokens** (renouveler si 401)

### Exemple de gestion d'erreur
```javascript
const response = await fetch('/notes', {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (!response.ok) {
  const error = await response.json();
  
  switch (response.status) {
    case 401:
      // Token expiré, redemander l'authentification
      throw new Error('Authentication required');
    case 404:
      // Ressource non trouvée
      throw new Error(`Resource not found: ${error.error}`);
    case 400:
      // Données invalides
      throw new Error(`Validation error: ${error.error}`);
    default:
      throw new Error(`API Error: ${error.error}`);
  }
}

const data = await response.json();
```

## 📚 Ressources supplémentaires

- **Documentation Swagger complète**: http://localhost:3000/api-docs
- **Tests**: Voir les fichiers `tests/*.test.ts` pour des exemples d'usage
- **Code source**: Architecture modulaire dans `controllers/`, `services/`, `routes/`
- **Configuration**: `constants.ts` pour toutes les constantes et limites