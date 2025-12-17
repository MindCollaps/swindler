FROM oven/bun:1-alpine AS builder

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock tsconfig.json ./

RUN bun install

COPY . .
ARG DATABASE_URL=postgresql://swindler:swindler@db:5432/swindler
ENV DATABASE_URL=${DATABASE_URL}
RUN bun run prisma generate && bun run prepare && bun run build


FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S app && adduser -S app -G app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public

RUN chown -R app:app /app
USER app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
