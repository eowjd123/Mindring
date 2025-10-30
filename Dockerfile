# ===== 1단계: 빌드 =====
FROM node:20-bullseye AS builder

WORKDIR /app

# package.json 먼저 복사
COPY package*.json ./

# Prisma 폴더를 미리 복사해야 npm ci 시점에 schema.prisma을 찾을 수 있음
COPY prisma ./prisma

# .env는 Prisma generate 시 필요할 수 있음
COPY .env .env

# 의존성 설치 (이 시점에 postinstall → prisma generate가 실행됨)
RUN npm ci

# 전체 코드 복사
COPY . .

# Prisma Client 재생성 (스키마 최신화)
RUN npx prisma generate

# Next.js 빌드
RUN npm run build


# ===== 2단계: 런타임 =====
FROM node:20-bullseye

WORKDIR /app

# 빌드 결과 복사
COPY --from=builder /app ./

# Prisma Client 재생성 (환경 맞춤)
RUN npx prisma generate

# 환경 변수 및 포트
ENV NODE_ENV=production
EXPOSE 3000

# 서버 실행
CMD ["npm", "run", "start"]
