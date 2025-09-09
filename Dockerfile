# ----- Builder (Debian slim) -----
FROM node:18-bookworm-slim AS builder

# canvas 빌드에 필요한 도구/헤더
RUN apt-get update && apt-get install -y \
  python3 make g++ \
  libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# 메모리 보호 (t2)
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN npm run build

# ----- Runner (동일 base, 런타임 라이브러리만) -----
FROM node:18-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# canvas 런타임 라이브러리
RUN apt-get update && apt-get install -y \
  libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm","start"]  # package.json에 "start": "next start -p 3000"

