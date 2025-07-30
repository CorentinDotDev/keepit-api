# Frontend - Exemples d'intégration

Ce dossier contient des exemples pratiques d'intégration avec l'API Notes pour différents environnements frontend.

## 📁 Fichiers disponibles

### `api-client.js`
Client JavaScript universel pour l'API Notes.
- **Compatible**: Navigateur et Node.js
- **Features**: Authentification, CRUD notes, gestion webhooks
- **Gestion d'erreur**: Classe `APIError` personnalisée
- **Usage**: Import ES6 ou script classique

### `example-react.jsx`
Exemple d'application React complète.
- **Framework**: React avec hooks
- **Features**: Interface utilisateur complète, gestion d'état
- **Authentification**: Login/logout avec token persistence
- **UI**: Création, modification, suppression de notes

### `example-vanilla.html`
Application complète en HTML/CSS/JS vanilla.
- **Environnement**: Navigateur uniquement
- **Features**: Interface responsive, gestion webhooks
- **UI**: Design moderne avec CSS Grid/Flexbox
- **Démo**: Prêt à utiliser, ouvrir directement dans le navigateur

## 🚀 Utilisation rapide

### 1. Client API de base
```javascript
import { NotesAPIClient } from './api-client.js';

const client = new NotesAPIClient('http://localhost:3000');

// Authentification
await client.login('user@example.com', 'password123');

// Créer une note
const note = await client.createNote({
  title: 'Ma note',
  content: 'Contenu de la note',
  color: '#ffffff'
});

// Récupérer toutes les notes
const notes = await client.getNotes();
```

### 2. Exemple React
```bash
# Dans votre projet React
cp api-client.js src/
cp example-react.jsx src/components/NotesApp.jsx

# Puis importer dans votre App.js
import NotesApp from './components/NotesApp';
```

### 3. Démo HTML
```bash
# Démarrer l'API
npm run dev

# Ouvrir dans le navigateur
open frontend/example-vanilla.html
```

## 🔧 Configuration

### Variables d'environnement
```javascript
// Dans api-client.js, modifier si nécessaire
const client = new NotesAPIClient('http://localhost:3000');

// Ou via paramètre
const client = new NotesAPIClient(process.env.REACT_APP_API_URL);
```

### Authentification
Tous les exemples gèrent automatiquement :
- ✅ Inscription automatique si compte inexistant
- ✅ Stockage du token JWT
- ✅ Renouvellement d'authentification
- ✅ Gestion des erreurs 401

## 📱 Features implémentées

### Notes
- [x] Liste des notes avec tri (épinglées en premier)
- [x] Création avec titre, contenu, couleur
- [x] Modification (titre, contenu, épinglage)
- [x] Suppression avec confirmation
- [x] Gestion des checkboxes dans les notes
- [x] Affichage des dates de création/modification

### Webhooks
- [x] Liste des webhooks configurés
- [x] Création de nouveaux webhooks
- [x] Validation des URLs
- [x] Support des 3 actions (created/updated/deleted)

### Interface utilisateur
- [x] Design responsive (mobile-friendly)
- [x] Messages d'erreur et de succès
- [x] États de chargement
- [x] Validation côté client
- [x] Gestion des couleurs de notes

## 🔒 Sécurité

### Côté client
```javascript
// Validation automatique des données
try {
  await client.createNote({ title: '', content: '' }); // Échouera
} catch (error) {
  console.log(error.message); // "Titre invalide"
}

// Gestion des tokens expirés
client.on('unauthorized', () => {
  // Rediriger vers login
  window.location.href = '/login';
});
```

### Headers de sécurité
```javascript
// Le client ajoute automatiquement
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

## 🐛 Gestion d'erreurs

### Structure des erreurs
```javascript
try {
  await client.createNote(invalidData);
} catch (error) {
  console.log(error.name);     // "APIError"
  console.log(error.message);  // "Titre invalide (1-200 caractères)"
  console.log(error.status);   // 400
  console.log(error.data);     // { error: "Titre invalide..." }
}
```

### Codes d'erreur gérés
- `400`: Données invalides → Affichage du message d'erreur
- `401`: Non authentifié → Redirection vers login
- `404`: Ressource non trouvée → Message explicite
- `500`: Erreur serveur → Retry automatique possible

## 📊 Exemples de payload

### Création de note avec checkboxes
```javascript
await client.createNote({
  title: "Liste de courses",
  content: "N'oublie pas d'acheter :",
  color: "#ffe6cc",
  isPinned: true,
  checkboxes: [
    { label: "Lait", checked: false },
    { label: "Pain", checked: false },
    { label: "Œufs", checked: true }
  ]
});
```

### Webhook payload reçu
```javascript
// Ce que votre webhook recevra
{
  "action": "note_created",
  "note": {
    "id": 1,
    "title": "Liste de courses",
    "content": "N'oublie pas d'acheter :",
    "color": "#ffe6cc",
    "isPinned": true,
    "checkboxes": [...],
    "userId": 1,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  },
  "userId": 1,
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## 🎨 Personnalisation

### Styling React
```css
/* Ajouter dans votre CSS global ou styled-components */
.notes-app {
  font-family: 'Inter', sans-serif;
}

.note-item {
  transition: transform 0.2s;
}

.note-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Thème sombre
```javascript
// Modifier les couleurs dans example-vanilla.html
const darkTheme = {
  background: '#1a1a1a',
  text: '#ffffff',
  card: '#2d2d2d',
  border: '#404040'
};
```

## 🔄 Intégration avec d'autres frameworks

### Vue.js
```javascript
// composition API
import { ref, onMounted } from 'vue';
import { NotesAPIClient } from './api-client.js';

export default {
  setup() {
    const client = new NotesAPIClient();
    const notes = ref([]);
    
    onMounted(async () => {
      notes.value = await client.getNotes();
    });
    
    return { notes };
  }
}
```

### Angular
```typescript
// service
import { Injectable } from '@angular/core';
import { NotesAPIClient } from './api-client.js';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private client = new NotesAPIClient();
  
  async getNotes() {
    return await this.client.getNotes();
  }
}
```

## 📚 Ressources

- **API Documentation**: http://localhost:3000/api-docs
- **Backend Guide**: ../BACKEND.md
- **Tests**: ../tests/ (pour voir les cas d'usage)
- **Source**: ../routes/ (pour comprendre les endpoints)

## 🆘 Support

### Debug
```javascript
// Activer les logs détaillés
const client = new NotesAPIClient('http://localhost:3000');
client.debug = true; // Affiche toutes les requêtes

// Vérifier la connexion
try {
  await client.request('/');
  console.log('API accessible');
} catch (error) {
  console.log('API non disponible:', error.message);
}
```

### Issues communes
1. **CORS Error**: Vérifier que l'API tourne sur localhost:3000
2. **401 Unauthorized**: Token expiré, refaire le login
3. **Network Error**: API non démarrée ou port incorrect
4. **Validation Error**: Vérifier les limites (titre 200 chars, etc.)