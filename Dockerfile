# ========== 1) deps ==========
FROM node:18-bookworm-slim AS deps
RUN apt-get update && apt-get install -y \
  python3 make g++ \
  libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
# prisma postinstall만 스킵하고, 나머지(특히 canvas) 스크립트는 실행
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
RUN npm ci

# ========== 2) builder ==========
FROM node:18-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 여기서 prisma generate 실행
RUN npx prisma generate
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN npm run build

# ========== 3) runner ==========
FROM node:18-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y \
  libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
# 런타임 의존성만
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.* ./
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]

