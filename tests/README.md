# Tests de l'API Notes

Cette suite de tests couvre tous les endpoints de l'API de notes avec authentification et webhooks.

## Configuration

Les tests utilisent :
- **Jest** comme framework de test
- **Supertest** pour les tests HTTP
- **SQLite** en mémoire pour la base de données de test
- **TypeScript** avec ts-jest

## Structure des tests

### tests/auth.test.ts
Tests pour l'authentification :
- Inscription d'utilisateur
- Connexion avec credentials valides/invalides
- Gestion des erreurs (email dupliqué, utilisateur introuvable)

### tests/notes.test.ts  
Tests pour la gestion des notes :
- Récupération des notes (toutes et par ID)
- Création de notes avec/sans checkboxes
- Mise à jour des notes
- Suppression des notes
- Vérification de l'authentification requise

### tests/webhooks.test.ts
Tests pour la gestion des webhooks :
- Récupération des webhooks par utilisateur
- Création de webhooks
- Gestion des champs optionnels (action, url)
- Isolation des données par utilisateur

## Lancer les tests

```bash
# Tous les tests
npm test

# Tests en mode watch
npm run test:watch
```

## Configuration de la base de données

Les tests utilisent une base de données SQLite séparée (`test.db`) pour éviter les conflits avec les données de développement. La configuration est gérée automatiquement dans `tests/setup.ts`.

## Points importants

- Chaque test utilise des emails uniques avec timestamp pour éviter les conflits
- La base de données est nettoyée après tous les tests
- Les tokens JWT sont générés pour chaque test nécessitant l'authentification
- Les webhooks sont testés mais ne font pas d'appels HTTP réels