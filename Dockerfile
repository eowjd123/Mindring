# ---------- deps: 모든 빌드 의존성 설치(캔버스 네이티브, OpenSSL 등) ----------
FROM node:18-bookworm-slim AS deps

# node-canvas 빌드 및 이미지 처리 의존성 (+ openssl) 설치
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# npm install 전에 package 정보와 prisma 스키마를 먼저 복사
# (postinstall에 prisma generate가 있어도 스키마를 찾을 수 있게)
COPY package*.json ./
COPY prisma ./prisma

# 스크립트 실행 허용: node-canvas 네이티브 모듈과 prisma client 둘 다 생성
RUN npm ci

# ---------- builder: 앱 빌드 ----------
FROM node:18-bookworm-slim AS builder
WORKDIR /app

# node_modules 재사용
COPY --from=deps /app/node_modules ./node_modules

# 나머지 소스 복사
COPY . .

# prisma client를 한 번 더 보강(스키마 변경 대응)
RUN npx prisma generate

# Next 빌드
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN npm run build

# ---------- runner: 런타임만 포함한 슬림 이미지 ----------
FROM node:18-bookworm-slim AS runner

# 런타임에서도 Prisma가 OpenSSL을 필요로 할 수 있어 openssl만 별도 설치
RUN apt-get update && apt-get install -y \
    openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 필요한 산출물만 복사
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000
CMD ["npm", "run", "start"]

