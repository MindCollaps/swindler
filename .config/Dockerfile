FROM oven/bun:1-alpine AS builder

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache nodejs

COPY package.json bun.lock tsconfig.json ./

RUN bun install

COPY . .
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bun run prisma generate && bun run prepare && node node_modules/nuxt/bin/nuxt.mjs build


FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache wget

RUN npm install -g prisma

RUN addgroup -S app && adduser -S app -G app

RUN chown app:app /app

COPY --chown=app:app --from=builder /app/.output ./.output
COPY --chown=app:app --from=builder /app/public ./public
COPY --chown=app:app prisma ./prisma
COPY --chown=app:app .config/prisma.config.js ./prisma.config.js
COPY --chown=app:app .config/wordlists ./.config/wordlists

COPY --chown=app:app .config/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER app

EXPOSE 3000

CMD ["./entrypoint.sh"]
