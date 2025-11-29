# Mindring 프로젝트 전체 개발 내역

## 📋 프로젝트 개요

- **프로젝트명**: Mindring (마인드링)
- **플랫폼**: Next.js 15 기반 웹 애플리케이션
- **주요 목적**: 시니어를 위한 인지 건강 관리 및 디지털 콘텐츠 플랫폼
- **개발 기간**: 2024년

---

## 🏗️ 프로젝트 구조

### 기술 스택
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL (Prisma ORM)
- **Authentication**: OAuth (Kakao, Naver, Google, Apple)
- **AI**: OpenAI API
- **Icons**: Lucide React
- **Charts**: Recharts

### 주요 디렉토리 구조
```
src/app/
├── api/                    # API 라우트
├── dashboard/              # 대시보드 기능
├── services/               # 서비스 페이지
├── puzzle/                 # 퍼즐 게임
└── puzzle-home/            # 퍼즐 홈
```

---

## 🎯 주요 기능별 상세 내역

## 1. 🧠 인지 클래스 (Cognitive Class)

### 1.1 개요
인지 건강 검사 및 관리 서비스로, 다양한 인지 기능 평가 도구를 제공합니다.

### 1.2 구현 기능

#### 인지 클래스 메인 페이지
- **파일**: `src/app/services/cognitive/page.tsx`
- **기능**:
  - 6개 검사 도구 카드 표시
  - 현대적인 Glassmorphism 디자인
  - 반응형 레이아웃 (모바일/태블릿/데스크톱)
  - 스크롤 최적화 (한 화면 표시)

#### 검사 도구 목록
1. **온라인 치매 검사** - 인지 기능 종합 평가
2. **뇌 건강 체크리스트** - 뇌 건강 상태 점검
3. **노인 우울 척도** - 정서적 안정 상태 확인
4. **사회적 관계망과 지지척도** - 사회적 관계 평가
5. **생활만족도 척도** - 일상생활 만족도 측정
6. **죽음불안 척도** - 죽음에 대한 불안 수준 평가

### 1.3 온라인 치매 검사

#### 본인 치매 검사
- **파일**: `src/app/services/cognitive/dementia/self/page.tsx`
- **기능**:
  - 기본 정보 입력 (생년월일, 성별, 교육수준)
  - 14개 질문 (예/아니오 형식)
  - 진행률 표시
  - 단계별 네비게이션
  - 결과 계산 및 해석

#### 가족 치매 검사
- **파일**: `src/app/services/cognitive/dementia/family/page.tsx`
- **기능**:
  - 검사 대상자 정보 입력 (관계, 생년월일, 성별, 교육수준)
  - 15개 질문 (0, 1, 2, 9점 평가)
  - 10년 전 상태와 현재 상태 비교
  - 평균 점수 기반 평가

#### 검사 결과 계산 시스템
- **파일**: `src/app/services/cognitive/dementia/utils/resultCalculator.ts`
- **기능**:
  - 본인 검사: 예 답변 수 기반 위험도 평가
  - 가족 검사: 평균 점수 기반 위험도 평가
  - 위험도 레벨 분류 (정상/경계/위험/고위험)
  - 상황별 맞춤 권장 사항 생성
  - 평가 기준 상세 설명

#### 평가 기준
- **본인 검사**:
  - 정상: 0-3개 예 답변
  - 경계: 4-6개 예 답변
  - 위험: 7-9개 예 답변
  - 고위험: 10개 이상 예 답변

- **가족 검사**:
  - 정상: 평균 0~0.5점
  - 경계: 평균 0.5~1.0점
  - 위험: 평균 1.0~1.5점
  - 고위험: 평균 1.5점 이상

---

## 2. 📚 라이프북 (Lifebook)

### 2.1 개요
AI 기반 자서전 만들기 서비스로, 사용자가 자신의 인생 이야기를 디지털 북으로 제작할 수 있습니다.

### 2.2 구현 기능

#### 라이프북 서비스 페이지
- **파일**: `src/app/services/lifebook/page.tsx`
- **기능**: 서비스 소개 및 시작하기 버튼

#### 작품 만들기
- **파일**: `src/app/dashboard/create-work/page.tsx`
- **기능**:
  - 인쇄 사양 선택 (용지 크기, 커버 타입, 내지 종류)
  - 실시간 미리보기
  - 옵션별 상세 설명

#### 작품 에디터
- **파일**: `src/app/dashboard/create-work/[id]/page.tsx`
- **주요 기능**:
  - 템플릿 관리 (커버 템플릿, 페이지 템플릿)
  - 페이지 편집 (텍스트, 이미지 요소)
  - 스타일 옵션 (폰트, 색상, 크기)
  - 링크 삽입 기능
  - 저장/미리보기/완료 기능
  - 페이지 삭제 모달

#### 작업실
- **파일**: `src/app/dashboard/workspace/page.tsx`
- **기능**:
  - 진행중/완료된 작품 목록
  - 검색/필터/정렬 기능
  - 작품 통계 표시
  - 작품 삭제 기능

#### 완성된 북 보기
- **파일**: `src/app/dashboard/books/page.tsx`
- **기능**: 완성된 작품 목록 및 미리보기

### 2.3 데이터베이스 스키마
- **Work**: 작품 정보
- **Page**: 페이지 정보
- **PrintSpecification**: 인쇄 사양
- **PrintOrder**: 인쇄 주문 내역
- **Export**: 내보내기 내역

---

## 3. 🧩 기억퍼즐 (Memory Puzzle)

### 3.1 개요
디지털 퍼즐 게임으로 인지 기능 향상을 위한 훈련 도구입니다.

### 3.2 구현 기능

#### 퍼즐 홈
- **파일**: `src/app/puzzle-home/page.tsx`
- **기능**:
  - 퍼즐 카테고리 선택 (컬러/그레이스케일)
  - 난이도 선택
  - 추천 퍼즐 표시
  - 퍼즐 목록 필터링

#### 퍼즐 게임
- **파일**: `src/app/puzzle/page.tsx`
- **기능**:
  - 퍼즐 조각 드래그 앤 드롭
  - 조각 회전 기능
  - 완성도 표시
  - 타이머 기능
  - 힌트 기능

#### 퍼즐 API
- **파일**: `src/app/api/puzzles/route.ts`
- **기능**:
  - 퍼즐 목록 조회
  - 퍼즐 생성
  - 난이도별 퍼즐 제공

---

## 4. 📊 인생그래프 (Life Graph)

### 4.1 개요
인생의 중요한 순간들을 감정과 함께 시각화하여 그래프로 표현하는 서비스입니다.

### 4.2 구현 기능

#### 인생그래프 대시보드
- **파일**: `src/app/dashboard/life-graph/dashboard/page.tsx`
- **기능**:
  - 타임라인 뷰
  - 감정별 통계
  - 10년 단위 평균 행복도
  - 최근 트렌드 분석
  - 이벤트 추가/수정/삭제

#### 인생그래프 메인
- **파일**: `src/app/dashboard/life-graph/page.tsx`
- **기능**: 그래프 시각화 및 이벤트 관리

#### 인생그래프 API
- **파일**: `src/app/api/life-graph/route.ts`
- **기능**:
  - 그래프 데이터 조회
  - 이벤트 CRUD 작업
  - 사용자 정보 관리
  - 그래프 내보내기

### 4.3 감정 타입
- **VERY_HAPPY**: 매우 행복
- **HAPPY**: 행복
- **NEUTRAL**: 보통
- **SAD**: 슬픔
- **VERY_SAD**: 매우 슬픔

---

## 5. 🤖 AI 도우미

### 5.1 개요
ChatGPT 기반 글쓰기 챗봇으로 문장 교정, 아이디어 제안, 음성 전사 기능을 제공합니다.

### 5.2 구현 기능

#### AI 챗봇 페이지
- **파일**: `src/app/dashboard/ai/page.tsx`
- **기능**:
  - 실시간 채팅 인터페이스
  - 메시지 히스토리
  - 음성 파일 업로드
  - 음성 전사 기능
  - 문장 교정 및 아이디어 제안

#### AI API
- **파일**: `src/app/api/ai/chat/route.ts`
- **기능**:
  - OpenAI API 연동
  - 음성 파일 처리
  - 채팅 응답 생성

---

## 6. 🎨 작품 만들기 및 작업실

### 6.1 작품 만들기
- **파일**: `src/app/dashboard/create-work/page.tsx`
- **기능**: 인쇄 사양 선택 및 작품 생성

### 6.2 작품 에디터
- **파일**: `src/app/dashboard/create-work/[id]/page.tsx`
- **주요 기능**:
  - 템플릿 기반 페이지 편집
  - 텍스트/이미지 요소 추가
  - 스타일 커스터마이징
  - 실시간 미리보기
  - 저장 및 완료 기능

### 6.3 작업실
- **파일**: `src/app/dashboard/workspace/page.tsx`
- **기능**:
  - 작품 목록 관리
  - 상태별 필터링 (초안/진행중/완료)
  - 검색 및 정렬
  - 작품 통계

### 6.4 작품 미리보기
- **파일**: `src/app/dashboard/works/[id]/preview/page.tsx`
- **기능**: 완성된 작품 미리보기

---

## 7. 🔐 인증 시스템

### 7.1 구현 기능

#### 로그인/회원가입
- **파일**: 
  - `src/app/login/page.tsx`
  - `src/app/signup/page.tsx`
- **기능**:
  - 이메일/비밀번호 로그인
  - OAuth 로그인 (Kakao, Naver, Google, Apple)
  - 회원가입 폼
  - 세션 관리

#### OAuth 인증
- **파일**: `src/app/api/auth/[provider]/callback/route.ts`
- **지원 제공자**:
  - Kakao
  - Naver
  - Google
  - Apple

#### 인증 API
- **파일**: 
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/signup/route.ts`
  - `src/app/api/auth/logout/route.ts`

---

## 8. 📄 기타 서비스

### 8.1 마음색칠
- **파일**: `src/app/services/coloring/page.tsx`
- **기능**: 인지 훈련 컬러링 체험 (준비 중)

### 8.2 활동자료
- **파일**: `src/app/services/activities/page.tsx`
- **기능**: 활동지・학습지 모음

### 8.3 허브 아카데미
- **파일**: `src/app/services/academy/page.tsx`
- **기능**: 자격증 취득・자기계발 강좌

### 8.4 시니어 종합검사
- **파일**: `src/app/services/assessment/page.tsx`
- **기능**: 인지・정서・사회 기능 평가차트 (준비 중)

### 8.5 사회공헌 사업
- **파일**: `src/app/services/social/page.tsx`
- **기능**: 봉사・나눔 실천

---

## 9. 🗄️ 데이터베이스 스키마

### 9.1 주요 모델

#### User
- 사용자 정보
- OAuth 연동 정보
- 세션 관리

#### Work
- 작품 정보
- 상태 관리 (초안/진행중/완료)
- 공유 토큰

#### Page
- 페이지 정보
- 콘텐츠 타입 (텍스트/이미지)
- 순서 관리

#### PrintSpecification
- 인쇄 사양
- 용지 크기, 커버 타입, 내지 종류

#### LifeGraph
- 인생그래프 정보
- 이벤트 데이터
- 감정 정보

#### AuthLog
- 인증 로그
- 로그인 이력

---

## 10. 🎨 UI/UX 특징

### 10.1 디자인 시스템
- **Glassmorphism**: 반투명 효과
- **그라데이션**: 현대적인 색상 조합
- **애니메이션**: 부드러운 전환 효과
- **반응형**: 모바일/태블릿/데스크톱 지원

### 10.2 컴포넌트
- **Button**: 다양한 variant 지원
- **Card**: 재사용 가능한 카드 컴포넌트
- **Input**: 폼 입력 컴포넌트
- **Modal**: 모달 다이얼로그

---

## 11. 🔧 API 구조

### 11.1 인증 API
- `/api/auth/login` - 로그인
- `/api/auth/signup` - 회원가입
- `/api/auth/logout` - 로그아웃
- `/api/auth/[provider]/start` - OAuth 시작
- `/api/auth/[provider]/callback` - OAuth 콜백

### 11.2 작품 API
- `/api/works` - 작품 목록/생성
- `/api/works/[id]` - 작품 조회/수정/삭제
- `/api/works/[id]/pages` - 페이지 관리
- `/api/works/[id]/export` - 작품 내보내기
- `/api/works/editor` - 에디터 데이터

### 11.3 인생그래프 API
- `/api/life-graph` - 그래프 조회/생성
- `/api/life-graph/[id]` - 그래프 상세
- `/api/life-graph/events` - 이벤트 관리
- `/api/life-graph/user-info` - 사용자 정보
- `/api/life-graph/export` - 그래프 내보내기

### 11.4 퍼즐 API
- `/api/puzzles` - 퍼즐 목록/생성

### 11.5 AI API
- `/api/ai/chat` - AI 채팅

---

## 12. 📦 주요 패키지

### 12.1 핵심 패키지
- `next`: 15.1.0
- `react`: 18.3.1
- `typescript`: 5.x
- `prisma`: 6.14.0
- `@prisma/client`: 6.14.0

### 12.2 UI/UX 패키지
- `tailwindcss`: 3.4.1
- `lucide-react`: 0.542.0
- `framer-motion`: 12.23.12
- `recharts`: 3.1.2

### 12.3 기능 패키지
- `openai`: 5.16.0
- `canvas`: 3.2.0
- `sharp`: 0.33.4
- `jose`: 6.0.13
- `bcryptjs`: 3.0.2
- `@notionhq/client`: 2.2.15

---

## 13. 🚀 배포 및 환경 설정

### 13.1 환경 변수
- `DATABASE_URL`: 데이터베이스 연결 문자열
- `SESSION_SECRET`: 세션 암호화 키
- `NEXTAUTH_URL`: 애플리케이션 URL
- `OPENAI_API_KEY`: OpenAI API 키
- `NOTION_API_TOKEN`: 노션 API 토큰
- OAuth 클라이언트 ID/Secret (Kakao, Naver, Google, Apple)

### 13.2 배포 환경
- **프로덕션 URL**: http://125.6.37.205:3000
- **데이터베이스**: MySQL (180.210.83.9:3306)

---

## 14. 📝 개발 일정 및 진행 상황

### 14.1 완료된 기능
- ✅ 인지 클래스 및 치매 검사
- ✅ 라이프북 (작품 만들기)
- ✅ 기억퍼즐
- ✅ 인생그래프
- ✅ AI 도우미
- ✅ 인증 시스템
- ✅ 대시보드

### 14.2 진행 중/예정 기능
- ⏳ 마음색칠 상세 기능
- ⏳ 시니어 종합검사 상세 기능
- ⏳ 활동자료 관리 기능
- ⏳ 허브 아카데미 강좌 시스템

---

## 15. 🔒 보안 및 개인정보 보호

### 15.1 보안 기능
- 세션 기반 인증
- 비밀번호 해싱 (bcrypt)
- OAuth 보안 연동
- API 요청 검증

### 15.2 개인정보 보호
- 검사 결과 암호화 저장 (예정)
- 개인정보 보호 정책 준수
- 안전한 데이터 전송

---

## 16. 📚 참고 자료 및 표준

### 16.1 검사 도구 표준
- S-IQCODE (Self-Informant Questionnaire on Cognitive Decline in the Elderly)
- MMSE (Mini-Mental State Examination)
- MoCA (Montreal Cognitive Assessment)
- 서울시 치매센터 온라인 치매 검사

### 16.2 기술 문서
- Next.js 공식 문서
- Prisma 공식 문서
- OpenAI API 문서
- 노션 API 문서

---

## 17. 👥 개발 팀 및 기여자

- **개발자**: AI Assistant (Claude)
- **프로젝트 관리**: Mindring Team
- **디자인**: Modern UI/UX Design System

---

## 18. 📅 최종 업데이트

**마지막 업데이트**: 2024년
**문서 버전**: 2.0
**프로젝트 상태**: 개발 진행 중

---

## 19. 🎯 향후 개발 계획

### 19.1 단기 계획
- 검사 결과 저장 기능
- 검사 이력 조회 기능
- 결과 비교 및 추이 분석
- 추가 검사 도구 구현

### 19.2 중기 계획
- 사용자 인증 완전 연동
- 검사 결과 데이터베이스 저장
- 전문의 상담 예약 연동
- 검사 결과 PDF 다운로드

### 19.3 장기 계획
- AI 기반 개인화 추천
- 검사 결과 기반 맞춤 프로그램 추천
- 가족 구성원 간 결과 공유 기능
- 모바일 앱 연동

---

**문서 작성일**: 2024년
**작성자**: AI Assistant

