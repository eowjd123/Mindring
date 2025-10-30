# ===== 1단계: 빌드 =====
FROM node:20-bullseye AS builder
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사
COPY . .

# Prisma 스키마 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

# ===== 2단계: 런타임 =====
FROM node:20-bullseye
WORKDIR /app

# 빌드 결과 복사
COPY --from=builder /app ./

# 환경 변수 및 포트 설정
ENV NODE_ENV=production
EXPOSE 3000

# 서버 실행
CMD ["npm", "run", "start"]
