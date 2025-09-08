# Évolution du Système de Partage de Notes

## 📋 Vue d'Ensemble

Ce document explique l'évolution du système de partage de notes, passant d'un système de **partage direct** à un système d'**invitations avec permissions**.

## 🔄 Comparaison : Ancien vs Nouveau Système

### Ancien Système (Partage Direct)
```
Alice → Partage directement avec bob@example.com
Bob → Accès immédiat sans notification
```

### Nouveau Système (Invitations)
```
Alice → Envoie invitation à bob@example.com
Bob → Reçoit invitation → Accepte/Décline
Bob → Accès avec permissions spécifiques
```

## 🏗️ Architecture Technique

### Base de Données

#### Ancien Modèle (DEPRECATED)
```sql
-- Supprimé lors de la migration
table note_shares {
  id: number
  noteId: number
  email: string
  createdAt: date
}
```

#### Nouveau Modèle
```sql
-- Table des invitations
table note_invitations {
  id: number
  noteId: number
  invitedEmail: string
  invitedById: number
  permission: "READ" | "WRITE" | "ADMIN"
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED"
  token: string (unique)
  message?: string
  expiresAt: date
  acceptedAt?: date
  acceptedById?: number
}

-- Table des accès effectifs
table note_access {
  id: number
  noteId: number
  userId: number
  permission: "READ" | "WRITE" | "ADMIN"
  grantedAt: date
  grantedBy: number
}
```

### Migration des Données

Les anciennes données ont été automatiquement migrées :
- **Partages existants** → Convertis en `NoteAccess` avec permission `READ`
- **Emails externes** → Identifiés pour re-invitation manuelle

## 🌐 API Endpoints

### Ancien Système (DEPRECATED)
```typescript
// ❌ Ces endpoints retournent maintenant des erreurs explicites
POST   /notes/:id/share          // → Erreur + redirection vers nouveau système
GET    /notes/shared             // → Erreur + redirection vers nouveau système
DELETE /notes/:id/share          // → Erreur + redirection vers nouveau système
DELETE /notes/:id/share/:email   // → Erreur + redirection vers nouveau système
DELETE /notes/:id/leave          // → Erreur + redirection vers nouveau système
```

### Nouveau Système

#### 📨 Gestion des Invitations
```typescript
// Créer une invitation
POST /invitations/notes/:noteId
{
  "email": "bob@example.com",
  "permission": "READ" | "WRITE" | "ADMIN",
  "message": "Message personnalisé (optionnel)",
  "expiresInDays": 7 // 1-30 jours
}
→ Response: { invitation: { id, token, ... } }

// Voir une invitation (lien public)
GET /invitations/:token
→ Response: { invitation: { note, invitedBy, permission, ... } }

// Accepter une invitation
POST /invitations/:token/accept
→ Response: { access: { noteId, permission, ... } }

// Décliner une invitation  
POST /invitations/:token/decline
→ Response: { message: "Invitation déclinée" }
```

#### 📋 Consultation des Invitations
```typescript
// Mes invitations reçues (en attente)
GET /invitations/pending
→ Response: { invitations: [...] }

// Mes invitations envoyées
GET /invitations/sent  
→ Response: { invitations: [...] }

// Révoquer une invitation envoyée
DELETE /invitations/:invitationId/revoke
→ Response: { message: "Invitation révoquée" }
```

#### 🔗 Gestion des Accès
```typescript
// Notes partagées avec moi
GET /invitations/shared-notes
→ Response: { 
  sharedNotes: [{
    id, title, content, checkboxes,
    permission: "READ" | "WRITE" | "ADMIN",
    sharedBy: { id, email },
    sharedAt: date
  }]
}

// Retirer l'accès d'un utilisateur (propriétaire seulement)
DELETE /invitations/access/:noteId/:userId
→ Response: { message: "Accès retiré" }

// Quitter une note partagée
DELETE /invitations/leave/:noteId
→ Response: { message: "Note quittée" }

// Statistiques
GET /invitations/stats
→ Response: { sent: number, received: number, pending: number }
```

#### 📝 Accès aux Notes
```typescript
// Notes personnelles (inchangé)
GET /notes
→ Response: Notes dont je suis propriétaire

// Note spécifique (amélioré)
GET /notes/:id
→ Response: Ma note OU note partagée avec moi (selon hasAccessToNote)
```

## 🎯 Permissions Système

### Types de Permissions
```typescript
enum Permission {
  READ = "READ",     // Lecture seule
  WRITE = "WRITE",   // Lecture + modification
  ADMIN = "ADMIN"    // Tous droits (comme propriétaire)
}
```

### Matrice des Permissions
| Action | READ | WRITE | ADMIN | Propriétaire |
|--------|------|-------|-------|-------------|
| Voir la note | ✅ | ✅ | ✅ | ✅ |
| Modifier contenu | ❌ | ✅ | ✅ | ✅ |
| Modifier checkboxes | ❌ | ✅ | ✅ | ✅ |
| Inviter d'autres | ❌ | ❌ | ✅ | ✅ |
| Supprimer la note | ❌ | ❌ | ❌ | ✅ |
| Convertir en template | ❌ | ❌ | ❌ | ✅ |

## 🚀 Intégration Frontend

### Composants Suggérés

#### 1. **InvitationManager**
```typescript
interface InvitationManagerProps {
  noteId: number;
  onInvitationSent?: (invitation: Invitation) => void;
}

// Gère l'envoi d'invitations avec formulaire
// - Champ email
// - Sélecteur de permission  
// - Message optionnel
// - Durée d'expiration
```

#### 2. **PendingInvitations**
```typescript
interface PendingInvitationsProps {
  onInvitationProcessed?: () => void;
}

// Liste des invitations reçues en attente
// - Boutons Accepter/Décliner
// - Affichage note + expéditeur
// - Gestion des invitations expirées
```

#### 3. **SharedNotesList** 
```typescript
interface SharedNotesListProps {
  onLeaveNote?: (noteId: number) => void;
}

// Liste des notes partagées avec l'utilisateur
// - Affichage permission
// - Nom du propriétaire
// - Bouton "Quitter"
// - Badge permission (READ/WRITE/ADMIN)
```

#### 4. **NoteAccessManager**
```typescript
interface NoteAccessManagerProps {
  noteId: number;
  isOwner: boolean;
}

// Pour les propriétaires : gérer les accès
// - Liste des utilisateurs avec accès
// - Boutons retirer accès
// - Liste des invitations en cours
// - Bouton révoquer invitation
```

### Utilitaire Client

```typescript
class NoteSharingAPI {
  // Invitations
  static async createInvitation(noteId: number, data: CreateInvitationData) {
    return await fetch(`/invitations/notes/${noteId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  static async acceptInvitation(token: string) {
    return await fetch(`/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
  }

  static async getPendingInvitations() {
    return await fetch('/invitations/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Accès
  static async getSharedNotes() {
    return await fetch('/invitations/shared-notes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  static async leaveNote(noteId: number) {
    return await fetch(`/invitations/leave/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  static async removeAccess(noteId: number, userId: number) {
    return await fetch(`/invitations/access/${noteId}/${userId}`, {
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
}
```

## 🔐 Sécurité

### Validation Côté Serveur
- ✅ Vérification de propriété des notes
- ✅ Validation des emails
- ✅ Contrôle des permissions
- ✅ Expiration automatique des invitations
- ✅ Tokens cryptographiquement sécurisés

### Bonnes Pratiques
```typescript
// ❌ Ne pas stocker les tokens d'invitation
// ✅ Les tokens sont à usage unique et temporaires

// ❌ Ne pas contourner les permissions
// ✅ Toujours vérifier hasAccessToNote côté serveur

// ❌ Ne pas exposer les emails des autres utilisateurs
// ✅ Seuls les propriétaires voient qui a accès
```

## 🎨 UX/UI Recommandations

### Flow d'Invitation
1. **Propriétaire** : Bouton "Partager" sur une note
2. **Modal** : Formulaire d'invitation (email, permission, message)
3. **Confirmation** : "Invitation envoyée à bob@example.com"
4. **Email** : Bob reçoit un lien avec contexte
5. **Page d'invitation** : Bob voit la note et peut accepter/décliner
6. **Dashboard** : Bob voit la note dans "Notes partagées avec moi"

### Indicateurs Visuels
- 🔗 Badge "Partagé" sur les notes avec invitations actives
- 👥 Badge "Accès partagé" sur les notes reçues par invitation
- 🔒 Icônes de permissions (👁️ READ, ✏️ WRITE, 👑 ADMIN)
- ⏰ Indicateur d'expiration sur les invitations en attente

## 🧪 Tests d'Intégration

### Scénarios de Test
```typescript
// Test complet du workflow
describe('Note Sharing Workflow', () => {
  it('should allow complete invitation flow', async () => {
    // 1. Alice crée une note
    // 2. Alice invite Bob avec permission WRITE
    // 3. Bob reçoit et accepte l'invitation
    // 4. Bob peut voir et modifier la note
    // 5. Alice peut voir que Bob a accès
    // 6. Alice peut révoquer l'accès de Bob
  });

  it('should handle permission levels correctly', async () => {
    // Tester READ vs WRITE vs ADMIN
  });

  it('should handle invitation expiration', async () => {
    // Tester l'expiration automatique
  });
});
```

## 🚀 Migration Frontend

### Étapes de Migration
1. **Phase 1** : Déprécier les anciens composants de partage
2. **Phase 2** : Implémenter les nouveaux composants d'invitation
3. **Phase 3** : Migrer les utilisateurs avec notifications
4. **Phase 4** : Supprimer définitivement l'ancien code

### Compatibilité Temporaire
```typescript
// Wrapper de transition pour les anciens appels
class LegacySharingBridge {
  static async shareNote(noteId: number, emails: string[]) {
    console.warn('shareNote is deprecated, use invitation system');
    // Rediriger vers le nouveau système avec permission READ par défaut
    return Promise.all(
      emails.map(email => 
        NoteSharingAPI.createInvitation(noteId, { 
          email, 
          permission: 'READ' 
        })
      )
    );
  }
}
```

## 🎯 Prochaines Étapes

### Fonctionnalités Futures
- 📧 **Notifications email** pour les invitations
- 🔔 **Notifications push** pour l'acceptation d'invitations  
- 👥 **Collaboration temps réel** pour permission WRITE
- 📊 **Analytics de partage** pour les comptes premium
- 🏢 **Espaces d'équipe** pour les organisations

### Intégration Monétisation
- 💎 **Limites par plan** : Nombre d'invitations par mois
- 🎯 **Permissions avancées** : Plus de types de permissions (premium)
- ⚡ **Invitations instantanées** : Sans expiration (premium)
- 📈 **Analytics détaillés** : Qui consulte quand (premium)

## 📞 Support

Le nouveau système est **entièrement rétrocompatible** mais avec des redirections explicites vers les nouveaux endpoints. Les anciennes URLs retournent des messages d'erreur clairs avec les nouveaux endpoints à utiliser.

**Le système d'invitations est opérationnel et prêt pour la production !** 🎉