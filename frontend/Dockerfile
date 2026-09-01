# Simple single-stage Dockerfile matching the pattern used in the course
# lab: install deps, build, then run `next start`. NEXT_PUBLIC_API_URL is
# a build-time ARG because Next.js inlines NEXT_PUBLIC_* values into the
# client bundle at build time.
FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
