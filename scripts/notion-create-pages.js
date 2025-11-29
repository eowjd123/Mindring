// scripts/notion-create-pages.js
// 노션에 기능별 하위 페이지를 생성하고 내용을 작성하는 스크립트

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// .env 파일 로드
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  }
}

loadEnvFile();

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
});

// 마크다운을 노션 블록으로 변환
function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');

  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code',
          code: {
            language: codeBlockLanguage || 'plain text',
            rich_text: [
              {
                type: 'text',
                text: { content: codeBlockContent.join('\n') },
              },
            ],
          },
        });
        codeBlockContent = [];
        codeBlockLanguage = '';
        inCodeBlock = false;
      } else {
        if (currentParagraph.length > 0) {
          blocks.push(createParagraphBlock(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        codeBlockLanguage = line.substring(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
      blocks.push({
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.substring(2).trim() } }],
        },
      });
      continue;
    }

    if (line.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
      blocks.push({
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.substring(3).trim() } }],
        },
      });
      continue;
    }

    if (line.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.substring(4).trim() } }],
        },
      });
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.substring(2).trim() } }],
        },
      });
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
      blocks.push({
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\.\s/, '').trim() } }],
        },
      });
      continue;
    }

    if (line.trim() === '---') {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
      blocks.push({
        type: 'divider',
        divider: {},
      });
      continue;
    }

    if (line.trim() === '') {
      if (currentParagraph.length > 0) {
        blocks.push(createParagraphBlock(currentParagraph.join('\n')));
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
    }
  }

  if (currentParagraph.length > 0) {
    blocks.push(createParagraphBlock(currentParagraph.join('\n')));
  }

  return blocks;
}

function createParagraphBlock(text) {
  return {
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

// 하위 페이지 생성 및 내용 작성
async function createChildPage(parentPageId, title, content) {
  try {
    // 하위 페이지 생성
    const childPage = await notion.pages.create({
      parent: {
        page_id: parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
    });

    console.log(`✅ 하위 페이지 생성: ${title} (${childPage.id})`);

    // 내용 작성
    if (content) {
      const blocks = markdownToNotionBlocks(content);
      const chunkSize = 100;
      
      for (let i = 0; i < blocks.length; i += chunkSize) {
        const chunk = blocks.slice(i, i + chunkSize);
        await notion.blocks.children.append({
          block_id: childPage.id,
          children: chunk,
        });
        console.log(`   📝 블록 ${i + 1}-${Math.min(i + chunkSize, blocks.length)} 추가 완료`);
      }
    }

    return childPage.id;
  } catch (error) {
    console.error(`❌ 페이지 생성 실패 (${title}):`, error.message);
    throw error;
  }
}

// 메인 함수
async function createFeaturePages() {
  try {
    const parentPageId = process.env.NOTION_PAGE_ID;

    if (!parentPageId) {
      console.error('❌ NOTION_PAGE_ID 환경 변수가 설정되지 않았습니다.');
      process.exit(1);
    }

    console.log('🚀 기능별 하위 페이지 생성 시작...\n');

    // 1. 인지 클래스
    const cognitiveContent = `# 인지 클래스 (Cognitive Class)

## 개요
인지 건강 검사 및 관리 서비스로, 다양한 인지 기능 평가 도구를 제공합니다.

## 주요 기능

### 인지 클래스 메인 페이지
- **파일**: \`src/app/services/cognitive/page.tsx\`
- **기능**:
  - 6개 검사 도구 카드 표시
  - 현대적인 Glassmorphism 디자인
  - 반응형 레이아웃 (모바일/태블릿/데스크톱)
  - 스크롤 최적화 (한 화면 표시)

### 검사 도구 목록
1. **온라인 치매 검사** - 인지 기능 종합 평가
2. **뇌 건강 체크리스트** - 뇌 건강 상태 점검
3. **노인 우울 척도** - 정서적 안정 상태 확인
4. **사회적 관계망과 지지척도** - 사회적 관계 평가
5. **생활만족도 척도** - 일상생활 만족도 측정
6. **죽음불안 척도** - 죽음에 대한 불안 수준 평가

## 온라인 치매 검사

### 본인 치매 검사
- **파일**: \`src/app/services/cognitive/dementia/self/page.tsx\`
- **기능**:
  - 기본 정보 입력 (생년월일, 성별, 교육수준)
  - 14개 질문 (예/아니오 형식)
  - 진행률 표시
  - 단계별 네비게이션
  - 결과 계산 및 해석

### 가족 치매 검사
- **파일**: \`src/app/services/cognitive/dementia/family/page.tsx\`
- **기능**:
  - 검사 대상자 정보 입력 (관계, 생년월일, 성별, 교육수준)
  - 15개 질문 (0, 1, 2, 9점 평가)
  - 10년 전 상태와 현재 상태 비교
  - 평균 점수 기반 평가

### 검사 결과 계산 시스템
- **파일**: \`src/app/services/cognitive/dementia/utils/resultCalculator.ts\`
- **기능**:
  - 본인 검사: 예 답변 수 기반 위험도 평가
  - 가족 검사: 평균 점수 기반 위험도 평가
  - 위험도 레벨 분류 (정상/경계/위험/고위험)
  - 상황별 맞춤 권장 사항 생성
  - 평가 기준 상세 설명

### 평가 기준
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

## 기술 스택
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Lucide React

## 참고 자료
- 서울시 치매센터 온라인 치매 검사
- S-IQCODE 표준
- MMSE, MoCA 검사 도구`;

    // 2. 라이프북
    const lifebookContent = `# 라이프북 (Lifebook)

## 개요
AI 기반 자서전 만들기 서비스로, 사용자가 자신의 인생 이야기를 디지털 북으로 제작할 수 있습니다.

## 주요 기능

### 라이프북 서비스 페이지
- **파일**: \`src/app/services/lifebook/page.tsx\`
- **기능**: 서비스 소개 및 시작하기 버튼

### 작품 만들기
- **파일**: \`src/app/dashboard/create-work/page.tsx\`
- **기능**:
  - 인쇄 사양 선택 (용지 크기, 커버 타입, 내지 종류)
  - 실시간 미리보기
  - 옵션별 상세 설명

### 작품 에디터
- **파일**: \`src/app/dashboard/create-work/[id]/page.tsx\`
- **주요 기능**:
  - 템플릿 관리 (커버 템플릿, 페이지 템플릿)
  - 페이지 편집 (텍스트, 이미지 요소)
  - 스타일 옵션 (폰트, 색상, 크기)
  - 링크 삽입 기능
  - 저장/미리보기/완료 기능
  - 페이지 삭제 모달

### 작업실
- **파일**: \`src/app/dashboard/workspace/page.tsx\`
- **기능**:
  - 진행중/완료된 작품 목록
  - 검색/필터/정렬 기능
  - 작품 통계 표시
  - 작품 삭제 기능

### 완성된 북 보기
- **파일**: \`src/app/dashboard/books/page.tsx\`
- **기능**: 완성된 작품 목록 및 미리보기

## 데이터베이스 스키마
- **Work**: 작품 정보
- **Page**: 페이지 정보
- **PrintSpecification**: 인쇄 사양
- **PrintOrder**: 인쇄 주문 내역
- **Export**: 내보내기 내역

## API 엔드포인트
- \`/api/works\` - 작품 목록/생성
- \`/api/works/[id]\` - 작품 조회/수정/삭제
- \`/api/works/[id]/pages\` - 페이지 관리
- \`/api/works/[id]/export\` - 작품 내보내기`;

    // 3. 기억퍼즐
    const puzzleContent = `# 기억퍼즐 (Memory Puzzle)

## 개요
디지털 퍼즐 게임으로 인지 기능 향상을 위한 훈련 도구입니다.

## 주요 기능

### 퍼즐 홈
- **파일**: \`src/app/puzzle-home/page.tsx\`
- **기능**:
  - 퍼즐 카테고리 선택 (컬러/그레이스케일)
  - 난이도 선택
  - 추천 퍼즐 표시
  - 퍼즐 목록 필터링

### 퍼즐 게임
- **파일**: \`src/app/puzzle/page.tsx\`
- **기능**:
  - 퍼즐 조각 드래그 앤 드롭
  - 조각 회전 기능
  - 완성도 표시
  - 타이머 기능
  - 힌트 기능

### 퍼즐 API
- **파일**: \`src/app/api/puzzles/route.ts\`
- **기능**:
  - 퍼즐 목록 조회
  - 퍼즐 생성
  - 난이도별 퍼즐 제공

## 기술 특징
- 드래그 앤 드롭 인터페이스
- 실시간 완성도 계산
- 난이도별 퍼즐 제공
- 반응형 디자인`;

    // 4. 인생그래프
    const lifeGraphContent = `# 인생그래프 (Life Graph)

## 개요
인생의 중요한 순간들을 감정과 함께 시각화하여 그래프로 표현하는 서비스입니다.

## 주요 기능

### 인생그래프 대시보드
- **파일**: \`src/app/dashboard/life-graph/dashboard/page.tsx\`
- **기능**:
  - 타임라인 뷰
  - 감정별 통계
  - 10년 단위 평균 행복도
  - 최근 트렌드 분석
  - 이벤트 추가/수정/삭제

### 인생그래프 메인
- **파일**: \`src/app/dashboard/life-graph/page.tsx\`
- **기능**: 그래프 시각화 및 이벤트 관리

### 인생그래프 API
- **파일**: \`src/app/api/life-graph/route.ts\`
- **기능**:
  - 그래프 데이터 조회
  - 이벤트 CRUD 작업
  - 사용자 정보 관리
  - 그래프 내보내기

## 감정 타입
- **VERY_HAPPY**: 매우 행복
- **HAPPY**: 행복
- **NEUTRAL**: 보통
- **SAD**: 슬픔
- **VERY_SAD**: 매우 슬픔

## 데이터 시각화
- 타임라인 차트
- 감정 통계 차트
- 10년 단위 평균 행복도
- Recharts 라이브러리 사용`;

    // 5. AI 도우미
    const aiContent = `# AI 도우미

## 개요
ChatGPT 기반 글쓰기 챗봇으로 문장 교정, 아이디어 제안, 음성 전사 기능을 제공합니다.

## 주요 기능

### AI 챗봇 페이지
- **파일**: \`src/app/dashboard/ai/page.tsx\`
- **기능**:
  - 실시간 채팅 인터페이스
  - 메시지 히스토리
  - 음성 파일 업로드
  - 음성 전사 기능
  - 문장 교정 및 아이디어 제안

### AI API
- **파일**: \`src/app/api/ai/chat/route.ts\`
- **기능**:
  - OpenAI API 연동
  - 음성 파일 처리
  - 채팅 응답 생성

## 기술 스택
- OpenAI API (GPT 모델)
- 음성 파일 처리
- 실시간 채팅 인터페이스

## 주요 기능
- 문장 교정
- 아이디어 제안
- 음성 전사
- 대화형 인터페이스`;

    // 6. 인증 시스템
    const authContent = `# 인증 시스템

## 개요
사용자 인증 및 세션 관리를 위한 시스템입니다.

## 주요 기능

### 로그인/회원가입
- **파일**: 
  - \`src/app/login/page.tsx\`
  - \`src/app/signup/page.tsx\`
- **기능**:
  - 이메일/비밀번호 로그인
  - OAuth 로그인 (Kakao, Naver, Google, Apple)
  - 회원가입 폼
  - 세션 관리

### OAuth 인증
- **파일**: \`src/app/api/auth/[provider]/callback/route.ts\`
- **지원 제공자**:
  - Kakao
  - Naver
  - Google
  - Apple

### 인증 API
- **파일**: 
  - \`src/app/api/auth/login/route.ts\`
  - \`src/app/api/auth/signup/route.ts\`
  - \`src/app/api/auth/logout/route.ts\`

## 보안 기능
- 세션 기반 인증
- 비밀번호 해싱 (bcrypt)
- OAuth 보안 연동
- API 요청 검증

## 데이터베이스
- **User**: 사용자 정보
- **SocialAccount**: 소셜 계정 연동
- **Session**: 세션 관리
- **AuthLog**: 인증 로그`;

    // 7. 기타 서비스
    const otherServicesContent = `# 기타 서비스

## 마음색칠
- **파일**: \`src/app/services/coloring/page.tsx\`
- **기능**: 인지 훈련 컬러링 체험 (준비 중)

## 활동자료
- **파일**: \`src/app/services/activities/page.tsx\`
- **기능**: 활동지・학습지 모음

## 허브 아카데미
- **파일**: \`src/app/services/academy/page.tsx\`
- **기능**: 자격증 취득・자기계발 강좌

## 시니어 종합검사
- **파일**: \`src/app/services/assessment/page.tsx\`
- **기능**: 인지・정서・사회 기능 평가차트 (준비 중)

## 사회공헌 사업
- **파일**: \`src/app/services/social/page.tsx\`
- **기능**: 봉사・나눔 실천`;

    // 8. 기술 스택 및 인프라
    const techStackContent = `# 기술 스택 및 인프라

## 기술 스택

### Frontend
- **Next.js**: 15.1.0
- **React**: 18.3.1
- **TypeScript**: 5.x
- **Tailwind CSS**: 3.4.1

### Backend
- **Prisma**: 6.14.0
- **MySQL**: 데이터베이스
- **Node.js**: 런타임

### 주요 라이브러리
- **lucide-react**: 아이콘
- **framer-motion**: 애니메이션
- **recharts**: 차트
- **openai**: AI 기능
- **canvas**: 이미지 처리
- **sharp**: 이미지 최적화

## 데이터베이스 스키마

### 주요 모델
- **User**: 사용자 정보
- **Work**: 작품 정보
- **Page**: 페이지 정보
- **LifeGraph**: 인생그래프
- **PrintSpecification**: 인쇄 사양
- **Session**: 세션 관리

## API 구조
- RESTful API 설계
- Next.js API Routes
- 인증 미들웨어
- 에러 핸들링

## 배포 환경
- **프로덕션 URL**: http://125.6.37.205:3000
- **데이터베이스**: MySQL (180.210.83.9:3306)
- **환경 변수**: .env 파일 관리`;

    // 하위 페이지 생성
    const pages = [
      { title: '🧠 인지 클래스', content: cognitiveContent },
      { title: '📚 라이프북', content: lifebookContent },
      { title: '🧩 기억퍼즐', content: puzzleContent },
      { title: '📊 인생그래프', content: lifeGraphContent },
      { title: '🤖 AI 도우미', content: aiContent },
      { title: '🔐 인증 시스템', content: authContent },
      { title: '🎨 기타 서비스', content: otherServicesContent },
      { title: '⚙️ 기술 스택 및 인프라', content: techStackContent },
    ];

    const createdPages = [];

    for (const page of pages) {
      try {
        const pageId = await createChildPage(parentPageId, page.title, page.content);
        createdPages.push({ title: page.title, id: pageId });
        console.log('');
      } catch (error) {
        console.error(`페이지 생성 실패: ${page.title}`, error.message);
      }
    }

    console.log('\n🎉 모든 하위 페이지 생성 완료!');
    console.log(`\n생성된 페이지 (${createdPages.length}개):`);
    createdPages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

createFeaturePages();

