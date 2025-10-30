# ===== 1단계: 빌드 =====
FROM node:20-bullseye AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 전체 소스 복사 (Prisma 포함)
COPY . .

# Prisma Client 생성 (schema.prisma 존재 보장됨)
RUN npx prisma generate

# Next.js 빌드
RUN npm run build


# ===== 2단계: 런타임 =====
FROM node:20-bullseye

WORKDIR /app

# 빌드 결과 복사
COPY --from=builder /app ./

# Prisma Client 포함한 상태 유지
RUN npx prisma generate

# 환경 변수 및 포트 설정
ENV NODE_ENV=production
EXPOSE 3000

# 서버 실행
CMD ["npm", "run", "start"]
