# PuzzleRecord 테이블 생성 가이드

## 문제
데이터베이스에 `PuzzleRecord` 테이블이 존재하지 않아 에러가 발생합니다.

## 해결 방법

### 방법 1: Prisma db push 사용 (권장)

```bash
npx prisma db push --accept-data-loss
```

이 명령어는 Prisma 스키마를 기반으로 데이터베이스에 테이블을 생성합니다.

### 방법 2: 마이그레이션 사용

```bash
# 마이그레이션 생성
npx prisma migrate dev --name add_puzzle_record

# 또는 기존 마이그레이션 적용
npx prisma migrate deploy
```

### 방법 3: 직접 SQL 실행

MySQL 클라이언트나 데이터베이스 관리 도구에서 다음 SQL을 실행:

```sql
CREATE TABLE IF NOT EXISTS PuzzleRecord (
  recordId CHAR(25) PRIMARY KEY,
  userId CHAR(25) NOT NULL,
  puzzleId VARCHAR(191) NOT NULL,
  difficulty INT NOT NULL,
  completionTime INT,
  moves INT,
  score INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completedAt DATETIME(3),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_userId_completedAt (userId, completedAt),
  INDEX idx_puzzleId_difficulty_score (puzzleId, difficulty, score),
  INDEX idx_score_completedAt (score, completedAt),
  INDEX idx_completed_score (completed, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 방법 4: 스크립트 사용

```bash
node scripts/create-puzzlerecord-table.js
```

## 확인

테이블이 생성되었는지 확인:

```bash
# Prisma Studio로 확인
npx prisma studio

# 또는 직접 쿼리
npx prisma db execute --stdin
# 그 다음: SELECT COUNT(*) FROM PuzzleRecord;
```

## 주의사항

- `--accept-data-loss` 플래그는 기존 데이터를 삭제할 수 있으므로 주의하세요.
- 프로덕션 환경에서는 마이그레이션을 사용하는 것이 좋습니다.
- 테이블 생성 후 Next.js 개발 서버를 재시작하세요.

