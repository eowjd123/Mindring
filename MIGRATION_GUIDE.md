# 데이터베이스 마이그레이션 가이드

## 문제
Prisma 스키마에 `isAdmin` 필드와 `CognitiveAssessment` 테이블이 추가되었지만, 데이터베이스에 반영되지 않았습니다.

## 해결 방법

### 방법 1: Prisma DB Push 사용 (권장)

터미널에서 다음 명령어를 실행하세요:

```bash
npx prisma db push
```

이 명령어는 스키마를 데이터베이스에 직접 적용합니다.

### 방법 2: 마이그레이션 파일 직접 실행

MySQL 클라이언트나 데이터베이스 관리 도구에서 다음 SQL을 실행하세요:

```sql
-- 1. User 테이블에 isAdmin 컬럼 추가
ALTER TABLE `User` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- 2. CognitiveAssessment 테이블 생성
CREATE TABLE `CognitiveAssessment` (
    `assessmentId` CHAR(25) NOT NULL,
    `userId` CHAR(25) NOT NULL,
    `assessmentType` VARCHAR(50) NOT NULL,
    `age` INTEGER NULL,
    `gender` VARCHAR(20) NULL,
    `testDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `answers` JSON NOT NULL,
    `totalScore` DOUBLE NULL,
    `averageScore` DOUBLE NULL,
    `percentage` DOUBLE NULL,
    `riskLevel` VARCHAR(50) NULL,
    `interpretation` VARCHAR(100) NULL,
    `message` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `recommendations` JSON NULL,
    `categoryScores` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`assessmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 인덱스 생성
CREATE INDEX `CognitiveAssessment_userId_assessmentType_testDate_idx` 
ON `CognitiveAssessment`(`userId`, `assessmentType`, `testDate`);

CREATE INDEX `CognitiveAssessment_userId_createdAt_idx` 
ON `CognitiveAssessment`(`userId`, `createdAt`);

CREATE INDEX `CognitiveAssessment_assessmentType_testDate_idx` 
ON `CognitiveAssessment`(`assessmentType`, `testDate`);

-- 4. 외래키 추가
ALTER TABLE `CognitiveAssessment` 
ADD CONSTRAINT `CognitiveAssessment_userId_fkey` 
FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) 
ON DELETE CASCADE ON UPDATE CASCADE;
```

### 방법 3: Node.js 스크립트 실행

프로젝트 루트에서 다음 명령어를 실행하세요:

```bash
node scripts/apply-migration-direct.js
```

## 확인 방법

마이그레이션이 성공적으로 적용되었는지 확인하려면:

1. **Prisma Studio 사용**:
   ```bash
   npx prisma studio
   ```
   브라우저에서 `User` 테이블에 `isAdmin` 컬럼이 있는지, `CognitiveAssessment` 테이블이 생성되었는지 확인하세요.

2. **데이터베이스 직접 확인**:
   - MySQL 클라이언트에서 `DESCRIBE User;` 실행하여 `isAdmin` 컬럼 확인
   - `SHOW TABLES;` 실행하여 `CognitiveAssessment` 테이블 확인

## 주의사항

- 이미 컬럼이나 테이블이 존재하는 경우 오류가 발생할 수 있습니다. 이 경우 해당 SQL 문을 건너뛰고 다음으로 진행하세요.
- 프로덕션 환경에서는 데이터 백업을 먼저 수행하세요.

