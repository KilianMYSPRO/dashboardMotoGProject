# Utiliser une image Node.js officielle
FROM node:18-alpine

# CORRECTION: Définir les variables d'environnement pour Puppeteer AVANT l'installation
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Installer les dépendances système nécessaires pour Puppeteer (Chromium)
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      json-glib \
      udev \
      xvfb

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (npm ne téléchargera pas le navigateur grâce à la variable d'environnement)
RUN npm install

# Copier le reste du code de l'application
COPY . .

# Exposer le port que le serveur va utiliser
EXPOSE 3001

# Commande pour démarrer le serveur
CMD ["npm", "start"]
