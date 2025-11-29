// scripts/notion-update-cognitive.js
// 인지 클래스 하위 페이지에 뇌 건강 체크리스트 내용 추가

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

// 메인 함수
async function updateCognitivePage() {
  try {
    const parentPageId = process.env.NOTION_PAGE_ID;

    if (!parentPageId) {
      console.error('❌ NOTION_PAGE_ID 환경 변수가 설정되지 않았습니다.');
      process.exit(1);
    }

    console.log('📝 뇌 건강 체크리스트 내용을 부모 페이지에 추가 중...\n');
    
    // 부모 페이지에 직접 추가
    const cognitivePageId = parentPageId;

    // 뇌 건강 체크리스트 내용 추가
    const brainHealthContent = `---

## 🧠 뇌 건강 체크리스트

### 개요
뇌 건강 체크리스트는 일상생활 습관을 점검하여 뇌 건강 상태를 확인하는 자가 평가 도구입니다. 10개의 주요 카테고리로 구성되어 있으며, 각 항목에 대해 5단계 평가를 통해 뇌 건강 지수를 산출합니다.

### 체크리스트 구성

총 10개의 카테고리로 구성:

1. **식단** - 균형 잡힌 식단 유지
2. **운동** - 규칙적인 운동 (주 3~5회, 30분 이상)
3. **수면** - 충분한 수면 (하루 7~9시간)
4. **정신적 활동** - 독서, 퍼즐, 학습 등
5. **사회적 교류** - 가족, 친구와의 만남
6. **스트레스 관리** - 명상, 요가, 취미 활동
7. **건강 검진** - 정기적인 건강 점검
8. **금연 및 절주** - 흡연 금지, 적당한 음주
9. **뇌 손상 예방** - 안전 습관
10. **긍정적 태도** - 긍정적인 마음가짐

### 평가 시스템

각 항목에 대해 5단계로 평가:
- **항상 (5점)**: 매일 또는 거의 매일 실천
- **자주 (4점)**: 주 3~4회 실천
- **가끔 (3점)**: 주 1~2회 실천
- **거의 안함 (2점)**: 월 1~2회 실천
- **전혀 안함 (1점)**: 거의 실천하지 않음

### 결과 해석

- **우수** (평균 4.5점 이상): 뇌 건강 상태가 매우 양호
- **양호** (평균 3.5~4.4점): 뇌 건강 상태가 양호
- **보통** (평균 2.5~3.4점): 개선 필요
- **부족** (평균 2.5점 미만): 즉시 개선 필요

### 구현 파일
- **파일**: \`src/app/services/cognitive/brain-health/page.tsx\`
- **경로**: \`/services/cognitive/brain-health\`

### 주요 기능
- 10개 카테고리 체크리스트
- 5단계 평가 시스템
- 점수 계산 및 결과 해석
- 카테고리별 상세 분석
- 맞춤 권장 사항 제공

### UI/UX 특징
- 보라색-핑크 그라데이션 테마
- 카테고리별 고유 아이콘
- 진행률 표시
- 반응형 디자인
- 현대적인 Glassmorphism 디자인`;

    const blocks = markdownToNotionBlocks(brainHealthContent);
    const chunkSize = 100;

    console.log(`📝 뇌 건강 체크리스트 내용 추가 중... (${blocks.length}개 블록)\n`);

    for (let i = 0; i < blocks.length; i += chunkSize) {
      const chunk = blocks.slice(i, i + chunkSize);
      await notion.blocks.children.append({
        block_id: cognitivePageId,
        children: chunk,
      });
      console.log(`✅ 블록 ${i + 1}-${Math.min(i + chunkSize, blocks.length)} 추가 완료`);
    }

    console.log('\n🎉 인지 클래스 페이지에 뇌 건강 체크리스트 내용이 추가되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.code === 'object_not_found') {
      console.error('\n페이지 ID를 확인하거나, Integration이 해당 페이지에 접근 권한이 있는지 확인하세요.');
    }
    process.exit(1);
  }
}

updateCognitivePage();

