WORKDIR /app
ENV NODE_ENV=production

# canvas 런타임에 필요한 런타임 라이브러리(헤더 X)
RUN apt-get update && apt-get install -y \
  libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
  && rm -rf /var/lib/apt/lists/*

# 프로덕션 의존성만 별도로 설치 (postinstall 무시)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# 빌드 산출물 및 필요한 리소스만 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# Next 설정 파일이 있으면 포함
COPY --from=builder /app/next.config.* ./
# (필요 시) 앱에서 참조하는 기타 파일들 추가로 복사

# 포트/커맨드
ENV PORT=3000
EXPOSE 3000

# package.json의 "start": "next start" 또는 앱의 start 스크립트를 사용
CMD ["npm", "start"]

