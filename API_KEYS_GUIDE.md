# Guide des Clés API - Notes API

## Vue d'ensemble

L'API Notes supporte désormais deux types d'authentification :
- **JWT Bearer Token** : Accès complet à tous les endpoints
- **Clés API** : Accès limité aux notes avec permissions granulaires

## 🔐 Types d'authentification

### 1. JWT Bearer Token (existant)
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
}
```
- Accès à tous les endpoints (notes, webhooks, clés API)
- Obtenu via `/auth/login`

### 2. Clés API (nouveau)
```javascript
headers: {
  'X-API-Key': 'ak_6b6a37ca27908b8029c12bd85e4891b2f15a961a36a51f617724aad031a1582b'
}
```
- Accès limité aux notes selon les permissions
- **⚠️ Les webhooks ne sont PAS accessibles via les clés API**

## 🛠️ Gestion des Clés API

### Créer une clé API

**Endpoint :** `POST /api-keys`  
**Authentification :** JWT uniquement

```javascript
const response = await fetch('/api-keys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + jwtToken
  },
  body: JSON.stringify({
    name: 'Mon Application Mobile',
    permissions: ['read_notes', 'create_notes', 'update_notes'],
    expiresAt: '2025-12-31T23:59:59Z' // optionnel
  })
});

const data = await response.json();
// data.apiKey.key contient la clé complète (visible uniquement à la création)
```

**Permissions disponibles :**
- `read_notes` : Lire les notes
- `create_notes` : Créer des notes
- `update_notes` : Modifier les notes
- `delete_notes` : Supprimer les notes
- `share_notes` : Partager les notes

### Lister ses clés API

**Endpoint :** `GET /api-keys`  
**Authentification :** JWT uniquement

```javascript
const response = await fetch('/api-keys', {
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  }
});

const data = await response.json();
// data.apiKeys contient la liste (clés tronquées pour sécurité)
```

**Réponse exemple :**
```json
{
  "apiKeys": [
    {
      "id": 1,
      "name": "Mon Application Mobile",
      "key": "ak_6b6a37ca2...", // tronquée
      "permissions": ["read_notes", "create_notes"],
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "lastUsedAt": "2024-12-01T10:30:00.000Z",
      "createdAt": "2024-12-01T09:00:00.000Z"
    }
  ]
}
```

### Supprimer une clé API

**Endpoint :** `DELETE /api-keys/{keyId}`  
**Authentification :** JWT uniquement

```javascript
const response = await fetch(`/api-keys/${keyId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  }
});
```

### Obtenir les permissions disponibles

**Endpoint :** `GET /api-keys/permissions`  
**Authentification :** JWT uniquement

```javascript
const response = await fetch('/api-keys/permissions', {
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  }
});

const data = await response.json();
// data.permissions contient la liste avec libellés français
```

## 📝 Utilisation avec les Notes

### Opérations supportées par les clés API

| Opération | Endpoint | Permission requise |
|-----------|----------|-------------------|
| Lister les notes | `GET /notes` | `read_notes` |
| Lire une note | `GET /notes/{id}` | `read_notes` |
| Créer une note | `POST /notes` | `create_notes` |
| Modifier une note | `PATCH /notes/{id}` | `update_notes` |
| Supprimer une note | `DELETE /notes/{id}` | `delete_notes` |
| Réorganiser les notes | `PATCH /notes/reorder` | `update_notes` |
| Épingler/désépingler | `PATCH /notes/{id}/pin` | `update_notes` |
| Modifier une checkbox | `PATCH /notes/checkbox/{id}` | `update_notes` |
| Partager une note | `POST /notes/{id}/share` | `share_notes` |

### Exemples d'utilisation

**Lire les notes avec une clé API :**
```javascript
const notes = await fetch('/notes', {
  headers: {
    'X-API-Key': apiKey
  }
});
```

**Créer une note avec une clé API :**
```javascript
const newNote = await fetch('/notes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    title: 'Ma nouvelle note',
    content: 'Contenu de la note',
    color: '#ffeb3b'
  })
});
```

### Gestion des erreurs

**Erreur de permission :**
```json
{
  "error": "Permission requise: delete_notes"
}
```

**Clé API invalide :**
```json
{
  "error": "Clé API invalide ou expirée"
}
```

**Authentification manquante :**
```json
{
  "error": "Token JWT ou clé API requis"
}
```

## 🚫 Restrictions importantes

### Opérations réservées au JWT uniquement :

1. **Webhooks** (tous les endpoints `/webhooks`)
2. **Notes partagées** (endpoints spéciaux) :
   - `GET /notes/shared`
   - `DELETE /notes/{id}/share` (retirer le partage)
   - `DELETE /notes/{id}/share/{email}` (retirer pour un email)
   - `DELETE /notes/{id}/leave` (quitter le partage)
3. **Gestion des clés API** (tous les endpoints `/api-keys`)

### Tentative d'accès aux webhooks avec une clé API :
```javascript
// ❌ Ceci échouera
const webhooks = await fetch('/webhooks', {
  headers: {
    'X-API-Key': apiKey
  }
});
// Réponse: {"error": "Token manquant"}
```

## 🔧 Implémentation côté Front-End

### Classe utilitaire pour gérer l'authentification

```javascript
class NotesApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.jwtToken = null;
    this.apiKey = null;
  }

  setJwtToken(token) {
    this.jwtToken = token;
    this.apiKey = null; // Priorité au JWT
  }

  setApiKey(key) {
    this.apiKey = key;
    this.jwtToken = null; // Utiliser la clé API
  }

  getHeaders(contentType = 'application/json') {
    const headers = {};
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(this.baseURL + endpoint, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || 'Erreur API');
    }

    return response.json();
  }

  // Méthodes pour les notes (supportent JWT et API Key)
  async getNotes() {
    return this.request('/notes');
  }

  async createNote(noteData) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  }

  // Méthodes pour les clés API (JWT uniquement)
  async createApiKey(keyData) {
    if (!this.jwtToken) {
      throw new Error('JWT token requis pour gérer les clés API');
    }
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify(keyData)
    });
  }

  async getApiKeys() {
    if (!this.jwtToken) {
      throw new Error('JWT token requis pour gérer les clés API');
    }
    return this.request('/api-keys');
  }
}
```

### Exemple d'utilisation

```javascript
const api = new NotesApiClient('http://localhost:3000');

// Utilisation avec JWT
api.setJwtToken('eyJhbGciOiJIUzI1NiIs...');
const notes = await api.getNotes(); // ✅ Fonctionne
const apiKeys = await api.getApiKeys(); // ✅ Fonctionne

// Utilisation avec clé API
api.setApiKey('ak_6b6a37ca27908b8029c12bd85e4891b2...');
const notes = await api.getNotes(); // ✅ Fonctionne (si permission read_notes)
const apiKeys = await api.getApiKeys(); // ❌ Erreur : JWT requis
```

## 🔒 Bonnes pratiques de sécurité

1. **Stockage sécurisé** : Stockez les clés API de façon sécurisée (variables d'environnement, coffre-fort)
2. **Principe du moindre privilège** : N'accordez que les permissions nécessaires
3. **Expiration** : Définissez une date d'expiration pour les clés sensibles
4. **Rotation** : Renouvelez régulièrement les clés API
5. **Monitoring** : Surveillez l'utilisation via `lastUsedAt`
6. **Révocation** : Supprimez immédiatement les clés compromises

## 📚 Documentation complète

La documentation Swagger interactive est disponible à `/api-docs` avec tous les détails sur les schémas, exemples et codes d'erreur.