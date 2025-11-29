# Prisma 스키마 및 데이터베이스 요약

## 데이터베이스 정보
- **Provider**: MySQL
- **Connection**: `DATABASE_URL` 환경 변수 사용

## 주요 모델 (총 20개)

### 1. 사용자 및 인증 관련
- **User**: 사용자 계정 (이메일, 비밀번호, 이름, 관리자 여부 등)
- **SocialAccount**: 소셜 로그인 계정 (카카오, 네이버, 구글, 애플)
- **Session**: 로그인 세션 관리
- **AuthLog**: 로그인 감사 로그

### 2. 작품 및 인쇄 관련
- **Work**: 작품 (책 단위)
- **Page**: 작품 내 페이지
- **PrintSpecification**: 인쇄 사양 정보
- **PrintOrder**: 인쇄 주문 내역
- **Export**: 내보낸 결과물 (PDF/이미지/Word 등)

### 3. 인생그래프 관련
- **LifeGraph**: 인생그래프 (전체 그래프 설정)
- **LifeGraphPoint**: 인생그래프의 개별 점
- **LifeGraphTag**: 태그 정의
- **LifeGraphPointTag**: 점-태그 연결 테이블
- **LifeGraphShare**: 그래프 공유 권한
- **LifeGraphComment**: 그래프 댓글/피드백

### 4. 인지 검사 관련
- **CognitiveAssessment**: 인지 검사 결과
  - 검사 유형: dementia_self, dementia_family, brain_health, depression, life_satisfaction, social_network, death_anxiety

### 5. 콘텐츠 관리 관련
- **ActivityResource**: 활동자료 (PDF, 이미지 등)
- **AcademyCourse**: 허브 아카데미 강좌

### 6. 게임 관련
- **PuzzleRecord**: 퍼즐 게임 기록 및 랭킹
  - 난이도: 4 (1단계), 9 (2단계), 16 (3단계), 36 (4단계)
  - 점수, 완료 시간, 이동 횟수 기록

## 주요 Enum 타입

1. **WorkStatus**: draft, completed
2. **PageContentType**: text, image, mixed
3. **PaperSize**: A4, SHIN
4. **CoverType**: soft_matte, hard, none
5. **InnerPaper**: plain, none
6. **PrintStatus**: pending, processing, completed, cancelled
7. **Emotion**: joy, sadness, anger, fear, surprise, neutral
8. **SharePermission**: read, comment, edit

## 주요 인덱스

### User
- `email` (유니크)
- `[email]`

### Work
- `[userId, status]`
- `[updatedAt]`

### CognitiveAssessment
- `[userId, assessmentType, testDate]`
- `[userId, createdAt]`
- `[assessmentType, testDate]`

### PuzzleRecord
- `[userId, completedAt]`
- `[puzzleId, difficulty, score]`
- `[score, completedAt]`
- `[completed, score]`

### ActivityResource
- `[category, visible]`
- `[visible, createdAt]`
- `[popularScore]`

### AcademyCourse
- `[category, visible]`
- `[visible, createdAt]`
- `[popularScore]`
- `[level]`

## 관계 (Relations)

### User → (1:N)
- SocialAccount[]
- Session[]
- Work[]
- LifeGraph[]
- LifeGraphTag[]
- PrintOrder[]
- CognitiveAssessment[]
- PuzzleRecord[]

### Work → (1:N)
- Page[]
- Export[]
- PrintOrder[]
- PrintSpecification (1:1)

### LifeGraph → (1:N)
- LifeGraphPoint[]
- LifeGraphShare[]
- LifeGraphComment[]

## 최근 추가된 기능

1. **퍼즐 랭킹 시스템** (PuzzleRecord)
   - 점수 계산: 난이도 보너스 - 시간 페널티 - 이동 페널티
   - 완료 시간, 이동 횟수, 점수 기록

2. **인지 검사 결과 저장** (CognitiveAssessment)
   - 7가지 검사 유형 지원
   - 점수, 위험도, 해석, 권장사항 저장

3. **콘텐츠 관리** (ActivityResource, AcademyCourse)
   - 관리자 기능으로 콘텐츠 CRUD
   - 카테고리, 태그, 인기도 점수 관리

## 데이터베이스 동기화 명령어

```bash
# 스키마 검증
npx prisma validate

# 데이터베이스에 스키마 적용 (개발 환경)
npx prisma db push

# 마이그레이션 생성 (프로덕션)
npx prisma migrate dev --name migration_name

# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 상태 확인
npx prisma migrate status

# Prisma Studio (GUI)
npx prisma studio
```

## 주의사항

1. **Cascade 삭제**: 대부분의 관계에서 `onDelete: Cascade`가 설정되어 있어, 부모 레코드 삭제 시 자식 레코드도 함께 삭제됩니다.

2. **인덱스**: 성능 최적화를 위해 자주 조회되는 필드에 인덱스가 설정되어 있습니다.

3. **JSON 필드**: 일부 모델에서 JSON 타입을 사용하여 유연한 데이터 저장이 가능합니다.

4. **Char 타입**: ID 필드는 `@db.Char(25)`로 고정 길이를 사용하여 성능을 최적화했습니다.

