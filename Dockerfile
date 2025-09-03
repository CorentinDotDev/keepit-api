# Utilise Node.js LTS
FROM node:20

# Crée un dossier pour l'app
WORKDIR /app

# Copie package.json et installe les dépendances
COPY package*.json ./
RUN npm install

# Copie tout le reste (src, prisma, etc.)
COPY . .

# Génère Prisma (optionnel si déjà fait en build)
RUN npx prisma generate

# Ouvre le port de ton API
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "run", "start"]