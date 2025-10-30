# ===== 1단계: 빌드 =====
FROM node:20-bullseye AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 전체 코드 복사 (prisma 포함)
COPY . .

# Prisma 스키마 존재 확인 + Client 생성
RUN ls -la prisma && npx prisma generate

# Next.js 빌드
RUN npm run build


# ===== 2단계: 런타임 =====
FROM node:20-bullseye

WORKDIR /app

# 빌드 결과 복사
COPY --from=builder /app ./

# Prisma Client 재생성 (런타임 환경 대비)
RUN npx prisma generate

# 환경 변수 및 포트
ENV NODE_ENV=production
EXPOSE 3000

# 서버 실행
CMD ["npm", "run", "start"]
