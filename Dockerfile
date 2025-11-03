# Utilise Node.js LTS
FROM node:20

# Crée un dossier pour l'app
WORKDIR /app

# Copie package.json et installe les dépendances
COPY package*.json ./
RUN npm install

# Copie tout le reste (src, prisma, etc.)
COPY . .

# Génère le client Prisma
RUN npx prisma generate

# Ouvre le port de ton API
EXPOSE 3000

# Script de démarrage avec migration automatique
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]