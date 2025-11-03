# Migration vers PostgreSQL

## Résumé des changements

Ce document résume les modifications apportées pour supporter PostgreSQL comme base de données par défaut tout en gardant la compatibilité avec SQLite.

## Fichiers modifiés

### 1. Configuration de la base de données

#### [prisma/schema.prisma](prisma/schema.prisma)
- **Changement** : `provider = "postgresql"` (était `"sqlite"`)
- **Note** : Le schéma reste compatible avec SQLite, seul le provider change

#### [.env](.env)
- **Ajout** : Configuration PostgreSQL par défaut
  ```env
  DATABASE_URL=postgresql://notes_user:notes_password@localhost:5432/notes_db
  POSTGRES_DB=notes_db
  POSTGRES_USER=notes_user
  POSTGRES_PASSWORD=notes_password
  ```
- **Note** : Instructions pour SQLite en commentaire

#### [.env.example](.env.example)
- **Mise à jour** : PostgreSQL comme configuration par défaut
- **Ajout** : Variables PostgreSQL documentées
- **Conservation** : Instructions SQLite en commentaire

### 2. Configuration Docker

#### [docker-compose.yml](docker-compose.yml)
- **Modification** : `DATABASE_URL` utilise maintenant les variables PostgreSQL
  ```yaml
  DATABASE_URL=postgresql://${POSTGRES_USER:-notes_user}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-notes_db}
  ```
- **Amélioration** : `depends_on` avec `condition: service_healthy` pour garantir que PostgreSQL est prêt

#### [Dockerfile](Dockerfile)
- **Ajout** : Support du script `docker-entrypoint.sh`
- **Ajout** : `ENTRYPOINT` pour exécuter les migrations automatiquement

#### [docker-entrypoint.sh](docker-entrypoint.sh) (nouveau fichier)
- **Création** : Script de démarrage qui :
  1. Attend que PostgreSQL soit prêt
  2. Exécute `prisma migrate deploy`
  3. Démarre l'application

### 3. Configuration de build

#### [.dockerignore](.dockerignore)
- **Ajout** : Exclusion des fichiers SQLite (`*.db`, `*.db-journal`)
- **Ajout** : Exclusion des dossiers de tests et données

#### [.gitignore](.gitignore)
- **Modification** : Les migrations Prisma ne sont PLUS ignorées
- **Raison** : Les migrations doivent être versionnées

### 4. Documentation

#### [DATABASE.md](DATABASE.md) (nouveau fichier)
- **Création** : Guide complet pour :
  - Configuration PostgreSQL
  - Configuration SQLite
  - Basculer entre les deux
  - Migrations
  - Troubleshooting

## Prochaines étapes

### 1. Créer la migration initiale

Une fois PostgreSQL démarré via Docker :

```bash
# Démarrer PostgreSQL
docker-compose up -d db

# Attendre que PostgreSQL soit prêt
docker-compose exec db pg_isready -U notes_user -d notes_db

# Créer la migration initiale
npx prisma migrate dev --name init
```

### 2. Tester l'application avec PostgreSQL

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f express-notes-api

# Tester l'API
curl http://localhost:3000/health
```

### 3. Migration des données existantes (si nécessaire)

Si vous avez des données SQLite existantes à migrer :

```bash
# 1. Exporter depuis SQLite
sqlite3 prisma/dev.db .dump > data_backup.sql

# 2. Adapter le SQL pour PostgreSQL (manuel ou outils comme pgloader)

# 3. Importer dans PostgreSQL
docker-compose exec -T db psql -U notes_user notes_db < data_postgres.sql
```

## Compatibilité

Le schéma Prisma est conçu pour être compatible avec les deux bases de données :

- ✅ Types de données compatibles
- ✅ Relations identiques
- ✅ Contraintes supportées
- ✅ Indexes compatibles

Pour basculer entre PostgreSQL et SQLite, consultez [DATABASE.md](DATABASE.md).

## Rollback

Pour revenir à SQLite :

1. Modifier `prisma/schema.prisma` : `provider = "sqlite"`
2. Modifier `.env` : `DATABASE_URL=file:./dev.db`
3. Regénérer : `npx prisma generate && npx prisma migrate dev`

## Support

Pour toute question ou problème, consultez :
- [DATABASE.md](DATABASE.md) - Guide complet de configuration
- [CLAUDE.md](CLAUDE.md) - Documentation du projet
- Documentation Prisma : https://www.prisma.io/docs
