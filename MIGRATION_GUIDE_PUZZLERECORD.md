# PuzzleRecord 테이블 마이그레이션 가이드

## 생성된 마이그레이션

마이그레이션 파일이 생성되었습니다:
- `prisma/migrations/20250128000000_add_puzzle_record/migration.sql`

## 마이그레이션 적용 방법

### 방법 1: Prisma migrate deploy (프로덕션/스테이징)

```bash
npx prisma migrate deploy
```

### 방법 2: Prisma migrate dev (개발 환경)

```bash
npx prisma migrate dev
```

### 방법 3: Prisma db push (개발 환경, 빠른 프로토타이핑)

```bash
npx prisma db push --accept-data-loss
```

### 방법 4: 직접 SQL 실행

MySQL 클라이언트에서 다음 SQL을 실행:

```sql
-- CreateTable
CREATE TABLE `PuzzleRecord` (
    `recordId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `puzzleId` VARCHAR(191) NOT NULL,
    `difficulty` INTEGER NOT NULL,
    `completionTime` INTEGER NULL,
    `moves` INTEGER NULL,
    `score` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`recordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_userId_completedAt` ON `PuzzleRecord`(`userId`, `completedAt`);

-- CreateIndex
CREATE INDEX `idx_puzzleId_difficulty_score` ON `PuzzleRecord`(`puzzleId`, `difficulty`, `score`);

-- CreateIndex
CREATE INDEX `idx_score_completedAt` ON `PuzzleRecord`(`score`, `completedAt`);

-- CreateIndex
CREATE INDEX `idx_completed_score` ON `PuzzleRecord`(`completed`, `score`);

-- AddForeignKey
ALTER TABLE `PuzzleRecord` ADD CONSTRAINT `PuzzleRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
```

## 마이그레이션 확인

### 마이그레이션 상태 확인

```bash
npx prisma migrate status
```

### Prisma Studio로 테이블 확인

```bash
npx prisma studio
```

Prisma Studio가 열리면 `PuzzleRecord` 테이블이 목록에 표시되어야 합니다.

## 마이그레이션 적용 후

1. **Prisma 클라이언트 재생성** (자동으로 실행되지만 확인):
   ```bash
   npx prisma generate
   ```

2. **Next.js 개발 서버 재시작**:
   - 현재 실행 중인 서버 중지 (Ctrl+C)
   - `npm run dev`로 다시 시작

3. **브라우저에서 확인**:
   - `/puzzle-home/rankings` 페이지 접속
   - 에러가 해결되었는지 확인

## 문제 해결

### 마이그레이션이 적용되지 않는 경우

1. 데이터베이스 연결 확인:
   ```bash
   # .env 파일의 DATABASE_URL 확인
   cat .env | grep DATABASE_URL
   ```

2. 마이그레이션 히스토리 확인:
   ```bash
   npx prisma migrate status
   ```

3. 강제 적용 (주의: 데이터 손실 가능):
   ```bash
   npx prisma migrate resolve --applied 20250128000000_add_puzzle_record
   npx prisma migrate deploy
   ```

### 테이블이 이미 존재하는 경우

마이그레이션을 "이미 적용됨"으로 표시:
```bash
npx prisma migrate resolve --applied 20250128000000_add_puzzle_record
```

## 참고

- 마이그레이션 파일은 `prisma/migrations/` 폴더에 저장됩니다.
- 프로덕션 환경에서는 `prisma migrate deploy`를 사용하세요.
- 개발 환경에서는 `prisma migrate dev` 또는 `prisma db push`를 사용할 수 있습니다.

