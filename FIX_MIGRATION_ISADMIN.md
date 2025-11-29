# 마이그레이션 오류 해결: isAdmin 컬럼 중복

## 문제
`isAdmin` 컬럼이 이미 존재하여 마이그레이션이 실패했습니다.

## 해결 방법

### 방법 1: 마이그레이션을 "이미 적용됨"으로 표시 (권장)

이미 `isAdmin` 컬럼이 존재한다면, 해당 마이그레이션을 "이미 적용됨"으로 표시하고 다음 마이그레이션을 진행합니다:

```bash
npx prisma migrate resolve --applied 20250101000000_add_isadmin_cognitive_assessment
npx prisma migrate deploy
```

### 방법 2: 마이그레이션 파일 수정

마이그레이션 파일을 수정하여 컬럼이 이미 존재하는 경우를 처리합니다:

1. `prisma/migrations/20250101000000_add_isadmin_cognitive_assessment/migration.sql` 파일 열기
2. 다음으로 변경:

```sql
-- AlterTable: Add isAdmin field to User table (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'User' 
  AND COLUMN_NAME = 'isAdmin');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `User` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false',
  'SELECT "Column isAdmin already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

3. 마이그레이션 다시 적용:
```bash
npx prisma migrate resolve --rolled-back 20250101000000_add_isadmin_cognitive_assessment
npx prisma migrate deploy
```

### 방법 3: 수동으로 마이그레이션 적용

1. 마이그레이션 파일에서 `isAdmin` 컬럼 추가 부분을 제거하거나 주석 처리
2. 나머지 부분만 실행 (CognitiveAssessment 테이블 생성)
3. 마이그레이션을 "이미 적용됨"으로 표시:
```bash
npx prisma migrate resolve --applied 20250101000000_add_isadmin_cognitive_assessment
```

## 확인

마이그레이션 상태 확인:
```bash
npx prisma migrate status
```

모든 마이그레이션이 적용되었는지 확인:
```bash
npx prisma migrate deploy
```

## 다음 단계

마이그레이션이 성공적으로 적용되면:
1. `npx prisma generate` 실행
2. Next.js 개발 서버 재시작
3. `/puzzle-home/rankings` 페이지 확인

