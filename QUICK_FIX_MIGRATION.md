# 빠른 마이그레이션 오류 해결

## 문제
`isAdmin` 컬럼이 이미 존재하여 마이그레이션이 실패했습니다.

## 즉시 해결 방법

터미널에서 다음 명령어를 순서대로 실행하세요:

```bash
# 1. 실패한 마이그레이션을 "이미 적용됨"으로 표시
npx prisma migrate resolve --applied 20250101000000_add_isadmin_cognitive_assessment

# 2. 나머지 마이그레이션 적용
npx prisma migrate deploy

# 3. Prisma 클라이언트 재생성
npx prisma generate
```

## 설명

`isAdmin` 컬럼이 이미 데이터베이스에 존재하므로, 해당 마이그레이션을 "이미 적용됨"으로 표시하고 다음 마이그레이션(PuzzleRecord 테이블 생성)을 진행합니다.

## 확인

마이그레이션이 성공적으로 적용되었는지 확인:

```bash
npx prisma migrate status
```

모든 마이그레이션이 "Applied" 상태여야 합니다.

## 다음 단계

1. Next.js 개발 서버 재시작 (Ctrl+C 후 `npm run dev`)
2. 브라우저에서 `/puzzle-home/rankings` 페이지 확인

