# Immagine per Coolify: build standalone di Next.js, utente non root.
FROM node:22-alpine AS dipendenze
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Il footer mostra dove gira l'app e quale versione: Coolify passa il commit come SOURCE_COMMIT.
ARG SOURCE_COMMIT=""
ENV MENSA_SERVER=comune MENSA_VERSIONE=$SOURCE_COMMIT
COPY --from=dipendenze /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS esecuzione
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 TZ=Europe/Rome
RUN addgroup -S mensa && adduser -S mensa -G mensa
COPY --from=build --chown=mensa:mensa /app/.next/standalone ./
COPY --from=build --chown=mensa:mensa /app/.next/static ./.next/static
COPY --from=build --chown=mensa:mensa /app/public ./public
# Per le migrazioni dal container: node scripts/migra.mjs con MENSA_DATABASE_ADMIN_URL.
COPY --from=build --chown=mensa:mensa /app/scripts ./scripts
COPY --from=build --chown=mensa:mensa /app/db ./db
COPY --from=dipendenze --chown=mensa:mensa /app/node_modules/postgres ./node_modules/postgres
USER mensa
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/salute || exit 1
CMD ["node", "server.js"]
