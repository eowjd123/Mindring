// scripts/notion-sync.js
// Node.js 버전 (TypeScript 컴파일 없이 실행 가능)

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
          // 따옴표 제거
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  }
}

// .env 파일 로드
loadEnvFile();

// 노션 API 클라이언트 초기화
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

    // 코드 블록 처리
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

    // 헤딩 처리
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

    // 리스트 처리
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

    // 구분선
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

    // 일반 텍스트
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
async function syncToNotion() {
  try {
    const notionToken = process.env.NOTION_API_TOKEN;
    const notionPageId = process.env.NOTION_PAGE_ID;

    if (!notionToken) {
      console.error('❌ NOTION_API_TOKEN 환경 변수가 설정되지 않았습니다.');
      console.log('\n설정 방법:');
      console.log('1. 노션에서 Integration 생성: https://www.notion.so/my-integrations');
      console.log('2. .env 파일에 NOTION_API_TOKEN=your_token 추가');
      process.exit(1);
    }

    if (!notionPageId) {
      console.error('❌ NOTION_PAGE_ID 환경 변수가 설정되지 않았습니다.');
      console.log('\n설정 방법:');
      console.log('1. 노션 페이지 URL에서 페이지 ID 추출');
      console.log('   예: https://www.notion.so/My-Page-abc123def456...');
      console.log('   페이지 ID: abc123def456... (32자리 문자열, 하이픈 제거)');
      console.log('2. .env 파일에 NOTION_PAGE_ID=your_page_id 추가');
      process.exit(1);
    }

    // 명령줄 인자로 파일명 지정 가능, 기본값은 PROJECT_OVERVIEW.md
    const fileName = process.argv[2] || 'PROJECT_OVERVIEW.md';
    const markdownPath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(markdownPath)) {
      console.error(`❌ ${markdownPath} 파일을 찾을 수 없습니다.`);
      process.exit(1);
    }

    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    console.log('✅ 마크다운 파일을 읽었습니다.');

    const blocks = markdownToNotionBlocks(markdownContent);
    console.log(`✅ ${blocks.length}개의 블록으로 변환했습니다.`);

    // 노션 페이지에 블록 추가 (청크 단위)
    const chunkSize = 100;
    for (let i = 0; i < blocks.length; i += chunkSize) {
      const chunk = blocks.slice(i, i + chunkSize);
      await notion.blocks.children.append({
        block_id: notionPageId,
        children: chunk,
      });
      console.log(`✅ 블록 ${i + 1}-${Math.min(i + chunkSize, blocks.length)} 추가 완료`);
    }

    console.log('\n🎉 노션에 개발 내역이 성공적으로 작성되었습니다!');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.code === 'object_not_found') {
      console.error('\n페이지 ID를 확인하거나, Integration이 해당 페이지에 접근 권한이 있는지 확인하세요.');
    }
    process.exit(1);
  }
}

syncToNotion();

