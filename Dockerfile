# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/studio-web/package.json ./apps/studio-web/

RUN npm ci --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/
COPY apps/studio-web/ ./apps/studio-web/

RUN npm run build --workspace=packages/shared \
  && npm run build --workspace=apps/api \
  && npm run build --workspace=apps/studio-web

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/studio-web/package.json ./apps/studio-web/

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/studio-web/dist ./apps/studio-web/dist

USER appuser

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "apps/api/dist/server.js"]
