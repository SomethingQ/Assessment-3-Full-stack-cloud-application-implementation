# Simple single-stage Dockerfile, following the pattern used in the
# course lab: install deps, generate the Prisma client, build the
# TypeScript source, then apply migrations and start the server.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Apply any pending migrations against the `db` service before starting
# the API so the schema is always up to date when the container boots.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
