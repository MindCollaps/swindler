FROM oven/bun:1-alpine AS builder

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache nodejs

COPY package.json bun.lock tsconfig.json ./

RUN bun install

COPY . .
ARG DATABASE_URL=postgresql://swindler:swindler@db:5432/swindler
ENV DATABASE_URL=${DATABASE_URL}
RUN bun run prisma generate && bun run prepare && node node_modules/nuxt/bin/nuxt.mjs build


FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S app && adduser -S app -G app

RUN chown app:app /app

COPY --chown=app:app package.json ./
COPY --chown=app:app --from=builder /app/node_modules ./node_modules

COPY --chown=app:app --from=builder /app/.output ./.output
COPY --chown=app:app --from=builder /app/public ./public
COPY --chown=app:app prisma ./prisma
COPY --chown=app:app prisma.config.ts ./prisma.config.ts
COPY --chown=app:app .config/wordlists ./.config/wordlists
COPY --chown=app:app .config/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER app

EXPOSE 3000

CMD ["./entrypoint.sh"]
