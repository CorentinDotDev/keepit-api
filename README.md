# Guide de déploiement rapide

Ce guide vous permet de déployer l'application de 0 en quelques minutes.

## Prérequis

- Docker et Docker Compose installés
- Git (pour cloner le projet)

## Déploiement en 3 étapes

### 1. Configuration

Copier le fichier d'exemple et configurer les variables d'environnement :

```bash
cp .env.example .env
```

Modifier `.env` pour définir vos propres secrets :

```env
# IMPORTANT : Changez ces valeurs en production !
JWT_SECRET=votre-secret-jwt-super-securise
POSTGRES_PASSWORD=votre-mot-de-passe-postgres-securise

# Les autres valeurs par défaut sont correctes pour un démarrage rapide
DATABASE_URL=postgresql://notes_user:votre-mot-de-passe-postgres-securise@db:5432/notes_db
POSTGRES_DB=notes_db
POSTGRES_USER=notes_user
```

### 2. Démarrage

```bash
docker-compose up -d
```

C'est tout ! L'application va :
1. ✅ Démarrer PostgreSQL
2. ✅ Attendre que la base soit prête
3. ✅ Exécuter automatiquement les migrations Prisma
4. ✅ Démarrer l'API

## Vérification

Testez que tout fonctionne :

```bash
# Vérifier que l'API répond
curl http://localhost:3000

# Créer un utilisateur
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123"}'

# Se connecter
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123"}'
```

## Accès

- **API** : http://localhost:3000
- **Documentation Swagger** : http://localhost:3000/api-docs
- **PostgreSQL** : localhost:5434
  - User: `notes_user` (ou valeur de `POSTGRES_USER`)
  - Password: valeur de `POSTGRES_PASSWORD`
  - Database: `notes_db` (ou valeur de `POSTGRES_DB`)

## Logs

Pour voir les logs de l'application :

```bash
# Tous les services
docker-compose logs -f

# API uniquement
docker-compose logs -f express-notes-api

# PostgreSQL uniquement
docker-compose logs -f db
```

## Redéploiement from scratch

Pour redéployer complètement (efface toutes les données !) :

```bash
# Arrêter et supprimer tout (conteneurs + volumes)
docker-compose down -v

# Rebuild si nécessaire
docker build -t registry.lefort.dev/express-notes-api:v1.6 .

# Redémarrer
docker-compose up -d
```

## Troubleshooting

### Le port 5432 est déjà utilisé

Si vous avez déjà PostgreSQL sur votre machine, le docker-compose utilise le port 5434 par défaut. Vous pouvez changer cela dans `docker-compose.yml` :

```yaml
db:
  ports:
    - "5435:5432"  # Changez 5434 par un autre port
```

### Les migrations ne s'appliquent pas

Vérifiez les logs :

```bash
docker-compose logs express-notes-api
```

Les migrations s'exécutent automatiquement au démarrage via `docker-entrypoint.sh`.

### Erreur de connexion à la base de données

Attendez quelques secondes que PostgreSQL démarre complètement. Le healthcheck garantit que l'API attend que PostgreSQL soit prêt.

## Base de données

### Backup

```bash
docker-compose exec db pg_dump -U notes_user notes_db > backup.sql
```

### Restore

```bash
docker-compose exec -T db psql -U notes_user notes_db < backup.sql
```

### Accès direct à PostgreSQL

```bash
docker-compose exec db psql -U notes_user -d notes_db
```

Puis dans le shell PostgreSQL :

```sql
-- Lister les tables
\dt

-- Voir les utilisateurs
SELECT * FROM users;

-- Voir les notes
SELECT * FROM notes;
```

## Production

Pour un déploiement en production, n'oubliez pas de :

1. ✅ Changer `JWT_SECRET` (utiliser `openssl rand -base64 32`)
2. ✅ Changer `POSTGRES_PASSWORD` avec un mot de passe fort
3. ✅ Configurer un proxy inverse (nginx) avec HTTPS
4. ✅ Mettre en place des backups automatiques de PostgreSQL
5. ✅ Configurer les limites de ressources dans docker-compose.yml
6. ✅ Activer les logs persistants
7. ✅ Configurer la surveillance et les alertes

Pour plus d'informations sur la configuration de la base de données, consultez [DATABASE.md](DATABASE.md).
