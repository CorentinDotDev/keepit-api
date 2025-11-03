# Configuration de la base de données

Ce projet supporte deux types de bases de données : **PostgreSQL** (par défaut en production) et **SQLite** (pour le développement local).

## PostgreSQL (Production / Docker)

### Configuration par défaut

Le projet est configuré pour utiliser PostgreSQL via Docker Compose. La configuration se trouve dans :

- [docker-compose.yml](docker-compose.yml) - Définit le service PostgreSQL
- [.env](.env) - Variables d'environnement
- [prisma/schema.prisma](prisma/schema.prisma) - Schéma de la base de données

### Démarrage avec Docker Compose

```bash
# Copier le fichier .env.example
cp .env.example .env

# Modifier les variables PostgreSQL dans .env
POSTGRES_PASSWORD=your-secure-password-here
JWT_SECRET=your-jwt-secret-here

# Démarrer les services
docker-compose up -d

# Les migrations Prisma s'exécutent automatiquement au démarrage
```

### Variables d'environnement PostgreSQL

```env
# PostgreSQL Configuration
POSTGRES_DB=notes_db
POSTGRES_USER=notes_user
POSTGRES_PASSWORD=change-me-in-production

# Database URL (générée automatiquement dans docker-compose)
DATABASE_URL=postgresql://notes_user:notes_password@db:5432/notes_db
```

### Migrations

Les migrations Prisma sont exécutées automatiquement au démarrage du conteneur via le script `docker-entrypoint.sh`.

Pour créer une nouvelle migration :

```bash
# Avec Docker en cours d'exécution
docker-compose exec express-notes-api npx prisma migrate dev --name description_migration

# Ou en local (nécessite PostgreSQL en local)
npx prisma migrate dev --name description_migration
```

## SQLite (Développement local)

### Configuration pour SQLite

Si vous souhaitez utiliser SQLite pour le développement local sans Docker :

1. Modifier [prisma/schema.prisma](prisma/schema.prisma) :

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Modifier votre fichier `.env` :

```env
DATABASE_URL=file:./dev.db
```

3. Générer le client Prisma et créer la base de données :

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Démarrer l'application :

```bash
npm run dev
```

## Basculer entre PostgreSQL et SQLite

Le schéma Prisma est compatible avec les deux bases de données. Pour basculer :

### Vers PostgreSQL

1. Modifier `prisma/schema.prisma` :
   ```prisma
   provider = "postgresql"
   ```

2. Modifier `.env` :
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/notes_db
   ```

3. Regénérer le client :
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

### Vers SQLite

1. Modifier `prisma/schema.prisma` :
   ```prisma
   provider = "sqlite"
   ```

2. Modifier `.env` :
   ```env
   DATABASE_URL=file:./dev.db
   ```

3. Regénérer le client :
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

## Commandes utiles

```bash
# Voir l'état de la base de données
npx prisma studio

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations (production)
npx prisma migrate deploy

# Créer une migration (développement)
npx prisma migrate dev --name nom_migration

# Réinitialiser la base de données (  supprime toutes les données)
npx prisma migrate reset

# Formater le schéma Prisma
npx prisma format
```

## Sauvegarde et restauration

### PostgreSQL

```bash
# Sauvegarde
docker-compose exec db pg_dump -U notes_user notes_db > backup.sql

# Restauration
docker-compose exec -T db psql -U notes_user notes_db < backup.sql
```

### SQLite

```bash
# Sauvegarde
cp prisma/dev.db backup/dev.db.backup

# Restauration
cp backup/dev.db.backup prisma/dev.db
```

## Troubleshooting

### PostgreSQL ne démarre pas

1. Vérifier les logs :
   ```bash
   docker-compose logs db
   ```

2. Vérifier que le port 5432 n'est pas déjà utilisé :
   ```bash
   lsof -i :5432
   ```

### Erreur de migration

1. Vérifier l'état des migrations :
   ```bash
   npx prisma migrate status
   ```

2. Résoudre les migrations en conflit :
   ```bash
   npx prisma migrate resolve --applied "migration_name"
   ```

### Erreur de connexion

Vérifier que :
- PostgreSQL est démarré : `docker-compose ps`
- Les credentials sont corrects dans `.env`
- Le healthcheck PostgreSQL passe : `docker-compose ps db`
