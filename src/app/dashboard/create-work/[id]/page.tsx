// app/dashboard/create-work/[id]/page.tsx
"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Layout,
  Menu,
  Plus,
  Redo,
  Strikethrough,
  Trash2,
  Underline,
  Undo,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

// 링크가 포함된 텍스트를 렌더링하는 함수
const renderTextWithLinks = (content: string, links: { start: number; end: number; url: string; text: string }[] = []) => {
  if (!links.length) return content;
  
  const parts = [];
  let lastIndex = 0;
  
  links.forEach((link, index) => {
    // 링크 앞의 텍스트
    if (link.start > lastIndex) {
      parts.push(content.slice(lastIndex, link.start));
    }
    
    // 링크 텍스트
    parts.push(
      <a
        key={index}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        {link.text}
      </a>
    );
    
    lastIndex = link.end;
  });
  
  // 마지막 링크 뒤의 텍스트
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts;
};

/* =========================
   Domain Types
   ========================= */

// 템플릿 요소 - 판별 가능한 유니온으로 엄격 타입화
interface BaseTemplateElement {
  id: string;
  position: { x: number; y: number; width: number; height: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: "left" | "center" | "right" | "justify";
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline" | "line-through";
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
  };
}

interface TextElement extends BaseTemplateElement {
  type: "text";
  content?: string;
  placeholder?: string;
  links?: { start: number; end: number; url: string; text: string }[];
}

interface ImageElement extends BaseTemplateElement {
  type: "image";
  content: string; // 이미지 URL 필수 (image로 전환된 경우)
}

interface PlaceholderElement extends BaseTemplateElement {
  type: "placeholder";
  placeholder?: string;
}

type TemplateElement = TextElement | ImageElement | PlaceholderElement;

interface Template {
  id: string;
  type: "cover" | "page";
  category: "text" | "image" | "mixed" | "blank";
  name: string;
  thumbnail: string;
  description: string;
  layout: { elements: TemplateElement[] };
}

interface PageContentStyleImage {
  width: number;
  height: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface PageContentStyleText {
  fontSize: number;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
}

type PageType = "text" | "image" | "mixed" | "template";

interface Page {
  id: string;
  type: PageType;
  templateId?: string;
  order?: number;
  content: {
    text?: string;
    image?: string;
    elements?: TemplateElement[];
    imageStyle?: PageContentStyleImage;
    textStyle?: PageContentStyleText;
  };
}

interface Work {
  id: string;
  title: string;
  coverImage?: string;
  coverTemplateId?: string;
  pages: Page[];
  createdAt: Date;
  updatedAt: Date;
}

// API 응답 타입
interface SavedWork {
  id: string;
  title: string;
  coverImage?: string;
  coverTemplateId?: string;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}

// API 요청 타입
interface SaveWorkRequest {
  title: string;
  coverImage?: string;
  coverTemplateId?: string;
  pages: Array<{
    id: string;
    type: PageType;
    templateId?: string;
    content: Page["content"];
  }>;
}

// 네트워크 응답 타입
interface WorkApiResponse {
  id: string;
  title: string;
  coverImage?: string;
  coverTemplateId?: string;
  pages: Array<{
    id: string;
    content: unknown; // JSON 파싱 전
    order: number;
    type: string;
    templateId?: string; // 옵셔널 필드로 추가
  }>;
  createdAt: string;
  updatedAt: string;
}

// 에러 응답 타입
interface ApiErrorResponse {
  details?: string;
  message?: string;
}

// 타입 가드 함수들
function isValidPageType(type: string): type is PageType {
  return ["text", "image", "mixed", "template"].includes(type);
}

function normalizePageType(type: string): PageType {
  if (isValidPageType(type)) {
    return type;
  }
  // 기본값으로 "text" 반환
  console.warn(`Invalid page type: ${type}, using "text" as fallback`);
  return "text";
}

// Helper functions for cover generation
async function generateDefaultCover(title: string): Promise<string> {
  // Canvas를 사용해서 기본 표지 이미지 생성
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Canvas를 사용할 수 없는 경우 기본 이미지 반환
      resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==");
      return;
    }

    // A4 비율로 캔버스 크기 설정 (210:297)
    canvas.width = 300;
    canvas.height = 424;

    // 배경색 설정 (그라데이션)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 제목 텍스트 그리기
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
    
    // 텍스트를 여러 줄로 나누기
    const words = title.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > canvas.width - 40 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // 제목 그리기 (중앙 정렬)
    const startY = canvas.height / 2 - (lines.length * 30) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * 35);
    });

    // 하단에 "Digital Library" 텍스트 추가
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Digital Library', canvas.width / 2, canvas.height - 30);

    // Canvas를 base64 데이터 URL로 변환
    resolve(canvas.toDataURL('image/png'));
  });
}

/* =========================
   Template Data
   ========================= */

// 폰트 크기 옵션
const BODY_FONT_SIZES = [10, 11, 12]; // 본문 폰트 크기 (pt)
const TITLE_FONT_SIZES = [50, 55, 60, 65, 70]; // 표기 폰트 크기 (pt)

// 폰트 패밀리 옵션
const FONT_FAMILIES = [
  { name: "나눔고딕", value: "Nanum Gothic" },
  { name: "맑은 고딕", value: "Malgun Gothic" },
  { name: "돋움", value: "Dotum" },
  { name: "굴림", value: "Gulim" },
  { name: "바탕", value: "Batang" },
  { name: "궁서", value: "Gungsuh" },
  { name: "Arial", value: "Arial" },
  { name: "Times New Roman", value: "Times New Roman" },
];

const COVER_TEMPLATES: Template[] = [
  {
    id: "cover-blank",
    type: "cover",
    category: "blank",
    name: "빈 표지",
    thumbnail: "/templates/cover-blank.png",
    description: "자유롭게 디자인할 수 있는 빈 표지",
    layout: { elements: [] },
  },
  {
    id: "cover-simple",
    type: "cover",
    category: "text",
    name: "목차페이지",
    thumbnail: "/templates/cover-simple.png",
    description: "심플한 텍스트 중심 표지",
    layout: {
      elements: [
        {
          id: "title",
          type: "text",
          position: { x: 20, y: 65, width: 260, height: 60 },
          style: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#333333" },
          content: "나의 이야기",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "subtitle",
          type: "text",
          position: { x: 20, y: 145, width: 260, height: 40 },
          style: { fontSize: 16, textAlign: "center", color: "#666666" },
          content: "소중한 추억들",
          placeholder: "부제목을 입력하세요",
        } as TextElement,
        {
          id: "author",
          type: "text",
          position: { x: 20, y: 365, width: 260, height: 30 },
          style: { fontSize: 14, textAlign: "center", color: "#888888" },
          content: "작성자명",
          placeholder: "작성자를 입력하세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "cover-photo",
    type: "cover",
    category: "mixed",
    name: "그림일기 페이지",
    thumbnail: "/templates/cover-photo.png",
    description: "사진과 텍스트가 조합된 표지",
    layout: {
      elements: [
        {
          id: "title",
          type: "text",
          position: { x: 20, y: 45, width: 260, height: 40 },
          style: { fontSize: 20, fontWeight: "bold", textAlign: "center", color: "#333333" },
          content: "제목을 입력해 주세요",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "main-image",
          type: "placeholder",
          position: { x: 20, y: 105, width: 260, height: 200 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드래그하여 여기에 추가해 주세요",
        } as PlaceholderElement,
        {
          id: "description",
          type: "text",
          position: { x: 20, y: 325, width: 260, height: 80 },
          style: { fontSize: 14, textAlign: "left", color: "#555555" },
          content: "텍스트를 입력해 주세요",
          placeholder: "설명을 입력하세요",
        } as TextElement,
      ],
    },
  },
];

const PAGE_TEMPLATES: Template[] = [
  {
    id: "page-text-only",
    type: "page",
    category: "text",
    name: "텍스트 페이지",
    thumbnail: "/templates/page-text.png",
    description: "내용 입력 전용 레이아웃",
    layout: {
      elements: [
        {
          id: "content",
          type: "text",
          position: { x: 30, y: 45, width: 240, height: 360 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "내용을 입력해 주세요",
          placeholder: "내용을 입력하세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-top-image-bottom",
    type: "page",
    category: "mixed",
    name: "상하 분할 레이아웃",
    thumbnail: "/templates/page-top-bottom.png",
    description: "상단 텍스트 + 중앙 이미지 + 하단 텍스트",
    layout: {
      elements: [
        {
          id: "top-text",
          type: "text",
          position: { x: 20, y: 45, width: 260, height: 40 },
          style: { fontSize: 14, textAlign: "center", color: "#555555" },
          content: "텍스트를 입력해 주세요",
          placeholder: "상단 텍스트를 입력하세요",
        } as TextElement,
        {
          id: "center-image",
          type: "placeholder",
          position: { x: 20, y: 105, width: 255, height: 200 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드래그하여 여기에 추가해 주세요",
        } as PlaceholderElement,
        {
          id: "bottom-text",
          type: "text",
          position: { x: 20, y: 325, width: 245, height: 80 },
          style: { fontSize: 14, textAlign: "center", color: "#555555" },
          content: "텍스트를 입력해 주세요",
          placeholder: "하단 텍스트를 입력하세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-image-text",
    type: "page",
    category: "mixed",
    name: "이미지 + 텍스트",
    thumbnail: "/templates/page-mixed.png",
    description: "사진과 텍스트가 조합된 레이아웃",
    layout: {
      elements: [
        {
          id: "title",
          type: "text",
          position: { x: 20, y: 45, width: 260, height: 30 },
          style: { fontSize: 16, fontWeight: "bold", color: "#333333" },
          content: "텍스트를 입력해 주세요",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "image",
          type: "placeholder",
          position: { x: 20, y: 85, width: 260, height: 180 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드래그하여 여기에 추가해 주세요",
        } as PlaceholderElement,
        {
          id: "text",
          type: "text",
          position: { x: 20, y: 285, width: 260, height: 120 },
          style: { fontSize: 12, color: "#555555" },
          content: "텍스트를 입력해 주세요",
          placeholder: "설명을 입력하세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-gallery",
    type: "page",
    category: "image",
    name: "이미지 갤러리",
    thumbnail: "/templates/page-gallery.png",
    description: "여러 사진을 배치할 수 있는 갤러리",
    layout: {
      elements: [
        { id: "image1", type: "placeholder", position: { x: 20, y: 45, width: 120, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "image2", type: "placeholder", position: { x: 160, y: 45, width: 100, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "image3", type: "placeholder", position: { x: 20, y: 155, width: 120, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "image4", type: "placeholder", position: { x: 160, y: 155, width: 100, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "caption", type: "text", position: { x: 20, y: 265, width: 260, height: 140 }, style: { fontSize: 12, color: "#555555" }, content: "텍스트를 입력해 주세요", placeholder: "사진에 대한 설명을 입력하세요" } as TextElement,
      ],
    },
  },
  {
    id: "page-complex",
    type: "page",
    category: "mixed",
    name: "복합 레이아웃",
    thumbnail: "/templates/page-complex.png",
    description: "다양한 요소가 조합된 자유 레이아웃",
    layout: {
      elements: [
        { id: "left-image", type: "placeholder", position: { x: 20, y: 45, width: 120, height: 160 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "right-text", type: "text", position: { x: 160, y: 45, width: 100, height: 80 }, style: { fontSize: 12, color: "#555555" }, content: "사진을 드래그하여 여기에 추가해 주세요", placeholder: "텍스트를 입력하세요" } as TextElement,
        { id: "right-image", type: "placeholder", position: { x: 160, y: 145, width: 100, height: 60 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "bottom-text", type: "text", position: { x: 20, y: 475, width: 260, height: 180 }, style: { fontSize: 12, color: "#555555" }, content: "텍스트를 입력해 주세요", placeholder: "상세한 설명을 입력하세요" } as TextElement,
      ],
    },
  },
  {
    id: "page-triple-image-text",
    type: "page",
    category: "mixed",
    name: "3이미지+텍스트",
    thumbnail: "/templates/page-triple-image.png",
    description: "3개 이미지 영역과 텍스트 영역",
    layout: {
      elements: [
        {
          id: "top-left-image",
          type: "placeholder",
          position: { x: 20, y: 45, width: 130, height: 100 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "top-right-image",
          type: "placeholder",
          position: { x: 170, y: 45, width: 110, height: 100 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "bottom-image",
          type: "placeholder",
          position: { x: 20, y: 165, width: 260, height: 120 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "text-area",
          type: "text",
          position: { x: 30, y: 305, width: 240, height: 100 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "텍스트를 입력해 주세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-double-image-text",
    type: "page",
    category: "mixed",
    name: "2이미지+텍스트",
    thumbnail: "/templates/page-double-image.png",
    description: "2개 이미지 영역과 텍스트 영역",
    layout: {
      elements: [
        {
          id: "left-image",
          type: "placeholder",
          position: { x: 20, y: 45, width: 130, height: 200 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "right-image",
          type: "placeholder",
          position: { x: 170, y: 45, width: 110, height: 200 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "text-area",
          type: "text",
          position: { x: 30, y: 265, width: 240, height: 140 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "텍스트를 입력해 주세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-single-image-text",
    type: "page",
    category: "mixed",
    name: "1이미지+텍스트",
    thumbnail: "/templates/page-single-image.png",
    description: "1개 이미지 영역과 텍스트 영역",
    layout: {
      elements: [
        {
          id: "image",
          type: "placeholder",
          position: { x: 20, y: 45, width: 280, height: 180 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "text-area",
          type: "text",
          position: { x: 30, y: 245, width: 240, height: 160 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "텍스트를 입력해 주세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-text-centered",
    type: "page",
    category: "text",
    name: "중앙 정렬 텍스트",
    thumbnail: "/templates/page-text-centered.png",
    description: "중앙 정렬된 텍스트 레이아웃",
    layout: {
      elements: [
        {
          id: "title",
          type: "text",
          position: { x: 20, y: 75, width: 280, height: 50 },
          style: { fontSize: 20, fontWeight: "bold", color: "#333333", textAlign: "center" },
          content: "제목을 입력해 주세요",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "content",
          type: "text",
          position: { x: 30, y: 145, width: 240, height: 260 },
          style: { fontSize: 14, color: "#555555", textAlign: "center" },
          content: "내용을 입력해 주세요",
          placeholder: "본문을 입력하세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-image-gallery",
    type: "page",
    category: "image",
    name: "이미지 갤러리",
    thumbnail: "/templates/page-gallery.png",
    description: "4개 이미지 갤러리 레이아웃",
    layout: {
      elements: [
        {
          id: "image-1",
          type: "placeholder",
          position: { x: 20, y: 45, width: 130, height: 130 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "image-2",
          type: "placeholder",
          position: { x: 170, y: 45, width: 110, height: 130 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "image-3",
          type: "placeholder",
          position: { x: 20, y: 195, width: 130, height: 130 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "image-4",
          type: "placeholder",
          position: { x: 170, y: 195, width: 110, height: 130 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
      ],
    },
  },
  {
    id: "page-vertical-double-image-text",
    type: "page",
    category: "mixed",
    name: "세로 2이미지+텍스트",
    thumbnail: "/templates/page-vertical-double.png",
    description: "상단 2개 세로 이미지와 하단 텍스트 영역",
    layout: {
      elements: [
        {
          id: "top-image-1",
          type: "placeholder",
          position: { x: 20, y: 45, width: 280, height: 120 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "top-image-2",
          type: "placeholder",
          position: { x: 20, y: 185, width: 280, height: 120 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "text-area",
          type: "text",
          position: { x: 30, y: 325, width: 240, height: 80 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "텍스트를 입력해 주세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-horizontal-double-image-text",
    type: "page",
    category: "mixed",
    name: "가로 2이미지+텍스트",
    thumbnail: "/templates/page-horizontal-double.png",
    description: "상단 2개 가로 이미지와 하단 텍스트 영역",
    layout: {
      elements: [
        {
          id: "left-image",
          type: "placeholder",
          position: { x: 20, y: 45, width: 130, height: 120 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "right-image",
          type: "placeholder",
          position: { x: 170, y: 45, width: 110, height: 120 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "text-area",
          type: "text",
          position: { x: 30, y: 185, width: 240, height: 200 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "텍스트를 입력해 주세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-large-image-small-text",
    type: "page",
    category: "mixed",
    name: "큰 이미지+작은 텍스트",
    thumbnail: "/templates/page-large-image.png",
    description: "큰 이미지 영역과 작은 텍스트 영역",
    layout: {
      elements: [
        {
          id: "large-image",
          type: "placeholder",
          position: { x: 20, y: 45, width: 280, height: 280 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "small-text",
          type: "text",
          position: { x: 30, y: 345, width: 240, height: 60 },
          style: { fontSize: 12, color: "#555555", textAlign: "center" },
          content: "텍스트를 입력해 주세요",
          placeholder: "텍스트를 입력해 주세요",
        } as TextElement,
      ],
    },
  },
  {
    id: "page-text-image-text",
    type: "page",
    category: "mixed",
    name: "텍스트-이미지-텍스트",
    thumbnail: "/templates/page-text-image-text.png",
    description: "텍스트, 이미지, 텍스트 순서의 레이아웃",
    layout: {
      elements: [
        {
          id: "top-text",
          type: "text",
          position: { x: 30, y: 45, width: 240, height: 80 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "상단 텍스트를 입력하세요",
        } as TextElement,
        {
          id: "center-image",
          type: "placeholder",
          position: { x: 20, y: 145, width: 260, height: 180 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드롭하여 이미지를 추가 해 주세요.",
        } as PlaceholderElement,
        {
          id: "bottom-text",
          type: "text",
          position: { x: 30, y: 345, width: 240, height: 60 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "텍스트를 입력해 주세요",
          placeholder: "하단 텍스트를 입력하세요",
        } as TextElement,
      ],
    },
  },
];

/* =========================
   UI Subcomponents
   ========================= */

interface EditablePageViewProps {
  page: Page;
  // eslint-disable-next-line no-unused-vars
  onUpdateElement: (_elementId: string, _content: string) => void;
  // eslint-disable-next-line no-unused-vars
  onUpdateElementImage?: (_elementId: string, _imageUrl: string) => void;
  // eslint-disable-next-line no-unused-vars
  onSelectElement: (_elementId: string) => void;
  selectedElementId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function EditablePageView({ page, onUpdateElement: _onUpdateElement, onSelectElement, selectedElementId, fileInputRef }: EditablePageViewProps) {
  if (!page.content.elements || page.content.elements.length === 0) {
    return <PagePreview page={page} />;
  }

  const handleImageUpload = (_elementId: string) => {
    onSelectElement(_elementId);
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full relative bg-white p-2">
      {page.content.elements.map((element) => (
        <div
          key={element.id}
          className={`absolute cursor-pointer group ${selectedElementId === element.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:ring-1 hover:ring-gray-300"}`}
          style={{
            left: `${(element.position.x / 300) * 100}%`,
              top: `${(element.position.y / 450) * 100}%`,
            width: `${(element.position.width / 300) * 100}%`,
              height: `${(element.position.height / 450) * 100}%`,
            minHeight: '20px',
            minWidth: '20px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement(element.id);
          }}
        >
          {element.type === "text" && (
            <div className="w-full h-full relative">
              {selectedElementId === element.id ? (
                <>
                  <textarea
                    value={element.content ?? ""}
                    onChange={(e) => _onUpdateElement(element.id, e.target.value)}
                    placeholder={element.placeholder || "텍스트를 입력하세요"}
                    className="w-full h-full bg-transparent border border-blue-300 outline-none resize-none text-xs leading-tight p-1"
                    style={{
                      fontFamily: element.style.fontFamily || "inherit",
                      fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 14)}px` : "12px",
                      color: element.style.color || "#333",
                      textAlign: element.style.textAlign || "left",
                      fontWeight: element.style.fontWeight || "normal",
                      fontStyle: element.style.fontStyle || "normal",
                      textDecoration: element.style.textDecoration || "none",
                    }}
                    autoFocus
                  />
                  <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-100 pointer-events-none z-20">
                    편집 중
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden p-1 bg-white border border-dashed border-gray-300"
                    style={{
                      fontFamily: element.style.fontFamily || "inherit",
                      fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 14)}px` : "12px",
                      color: element.style.color || "#333",
                      textAlign: element.style.textAlign || "left",
                      fontWeight: element.style.fontWeight || "normal",
                      fontStyle: element.style.fontStyle || "normal",
                      textDecoration: element.style.textDecoration || "none",
                    }}
                  >
                    <span className="block">
                      {renderTextWithLinks(element.content || element.placeholder || "텍스트를 입력하세요", element.links)}
                    </span>
                  </div>
                  <div className="absolute -top-6 left-0 bg-gray-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    클릭하여 편집
                  </div>
                </>
              )}
            </div>
          )}

          {element.type === "placeholder" && (
            <button
              type="button"
              className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors relative"
              onClick={() => handleImageUpload(element.id)}
            >
              <div className="text-center">
                <ImageIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500 leading-tight">클릭하여<br />이미지 추가</p>
              </div>
              <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                이미지 추가
              </div>
            </button>
          )}

          {element.type === "image" && (
            <div className="w-full h-full relative">
              <Image
                src={element.content}
                alt="Page element"
                fill
                className="object-contain rounded"
                sizes="100%"
              />
              <button
                type="button"
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center"
                onClick={() => handleImageUpload(element.id)}
                aria-label="이미지 교체"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </button>
              <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                이미지 교체
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface TemplatePreviewProps { template: Template }
function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="w-full h-full relative bg-white" style={{ fontSize: "8px" }}>
      {template.layout.elements.map((element) => (
        <div
          key={element.id}
          className="absolute"
          style={{
            left: `${(element.position.x / 300) * 100}%`,
            top: `${(element.position.y / 450) * 100}%`,
            width: `${(element.position.width / 300) * 100}%`,
            height: `${(element.position.height / 450) * 100}%`,
            fontSize: element.style.fontSize ? `${(element.style.fontSize ?? 6) / 4}px` : "6px",
          }}
        >
          {element.type === "text" && (
            <div 
              className="w-full h-full flex items-center leading-tight"
              style={{
                fontFamily: element.style.fontFamily || "inherit",
                fontWeight: element.style.fontWeight || "normal",
                fontStyle: element.style.fontStyle || "normal",
                textAlign: element.style.textAlign || "left",
                color: element.style.color || "#374151",
                textDecoration: element.style.textDecoration || "none",
              }}
            >
              {element.content ?? element.placeholder}
            </div>
          )}
          {element.type === "placeholder" && (
            <div className="w-full h-full bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center">
              <ImageIcon className="w-3 h-3 text-gray-400" />
            </div>
          )}
          {element.type === "image" && (
            <div className="relative w-full h-full">
              <Image
                src={element.content}
                alt="Template element"
                fill
                className="object-contain"
                sizes="100%"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface PagePreviewProps { page: Page }
function PagePreview({ page }: PagePreviewProps) {
  // elements 배열이 있으면 템플릿으로 처리
  if (page.content.elements && page.content.elements.length > 0) {
    return (
      <div className="w-full h-full relative bg-white">
        {page.content.elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${(element.position.x / 300) * 100}%`,
              top: `${(element.position.y / 450) * 100}%`,
              width: `${(element.position.width / 300) * 100}%`,
              height: `${(element.position.height / 450) * 100}%`,
              fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 12)}px` : "10px",
              minHeight: '20px',
              minWidth: '20px',
            }}
          >
            {element.type === "text" && (
              <div
                className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden p-1"
                style={{
                  fontFamily: element.style.fontFamily || "inherit",
                  color: element.style.color || "#333",
                  textAlign: element.style.textAlign || "left",
                  fontWeight: element.style.fontWeight || "normal",
                  fontStyle: element.style.fontStyle || "normal",
                  textDecoration: element.style.textDecoration || "none",
                }}
              >
                <span className="block text-xs">
                  {renderTextWithLinks(element.content || element.placeholder || "텍스트를 입력하세요", element.links)}
                </span>
              </div>
            )}
            {element.type === "placeholder" && (
              <div className="w-full h-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">이미지 영역</span>
                </div>
              </div>
            )}
            {element.type === "image" && (
              <div className="relative w-full h-full">
                <Image 
                  src={element.content} 
                  alt="Page element" 
                  fill
                  className="object-contain rounded"
                  sizes="100%"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const imageStyle = page.content.imageStyle;
  const textStyle = page.content.textStyle;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {page.content.image && (
        <div className={`${page.type === "mixed" ? "flex-1" : "w-full h-full"} flex items-center justify-center bg-gray-100`}>
          <div className="relative w-full h-full max-w-full max-h-full">
            <Image
              src={page.content.image}
              alt="Page content"
              fill
              className="object-contain"
              sizes="100%"
              style={{
                transform: `rotate(${imageStyle?.rotation ?? 0}deg) scaleX(${imageStyle?.flipH ? -1 : 1}) scaleY(${imageStyle?.flipV ? -1 : 1})`,
              }}
            />
          </div>
        </div>
      )}

      {page.content.text && (
        <div className={`${page.type === "mixed" ? "flex-1" : "w-full h-full"} p-3 flex items-center`}>
          <p
            className="w-full line-clamp-6 text-xs leading-relaxed"
            style={{
              fontSize: Math.min(textStyle?.fontSize ?? 16, 12),
              color: textStyle?.color ?? "#000000",
              textAlign: textStyle?.align ?? "left",
              fontWeight: textStyle?.bold ? "bold" : "normal",
              fontStyle: textStyle?.italic ? "italic" : "normal",
            }}
          >
            {page.content.text}
          </p>
        </div>
      )}

      {!page.content.image && !page.content.text && (!page.content.elements || page.content.elements.length === 0) && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            {page.type === "image" && <ImageIcon className="mx-auto h-8 w-8 mb-2" />}
            {page.type === "text" && <Plus className="mx-auto h-8 w-8 mb-2" />}
            {page.type === "mixed" && <Plus className="mx-auto h-8 w-8 mb-2" />}
            {page.type === "template" && <Layout className="mx-auto h-8 w-8 mb-2" />}
            <p className="text-xs">{page.type === "image" ? "이미지 없음" : page.type === "text" ? "텍스트 없음" : page.type === "template" ? "템플릿 페이지 (요소 없음)" : "내용 없음"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Main Component
   ========================= */

export default function CreateWorkPage() {
  const router = useRouter();
  const params = useParams();
  const routeId = String(params.id ?? "editor");

  const [work, setWork] = useState<Work>({
    id: `temp-${Date.now()}`,
    title: "새로운 작품",
    pages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPage = useMemo(() => work.pages.find((p) => p.id === selectedPageId) ?? null, [work.pages, selectedPageId]);

  /* ---------- Load Work Data ---------- */
  useEffect(() => {
    const loadWorkData = async () => {
      if (routeId === "editor" || routeId.startsWith("temp-")) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/works/${routeId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('작품을 불러올 수 없습니다');
        }

        const workData: WorkApiResponse = await response.json();
        
        const processedPages: Page[] = workData.pages ? workData.pages.map((page) => {
          try {
            let content = page.content;
            if (typeof page.content === 'string') {
              content = JSON.parse(page.content);
            }
            
            let pageType = normalizePageType(page.type);
            if (content && typeof content === 'object' && 'elements' in content && Array.isArray(content.elements) && content.elements.length > 0) {
              pageType = "template";
            }
            
            const processedPage = {
              id: page.id,
              type: pageType,
              order: page.order,
              templateId: page.templateId,
              content: content as Page["content"]
            };
            
            return processedPage;
            
          } catch (parseError) {
            console.error('페이지 내용 파싱 오류:', parseError, page);
            return {
              id: page.id,
              type: "text" as PageType,
              order: page.order,
              content: {} as Page["content"]
            };
          }
        }) : [];
        
        processedPages.sort((a: Page, b: Page) => (a.order ?? 0) - (b.order ?? 0));

        setWork({
          id: workData.id,
          title: workData.title,
          coverImage: workData.coverImage,
          coverTemplateId: workData.coverTemplateId,
          pages: processedPages,
          createdAt: new Date(workData.createdAt),
          updatedAt: new Date(workData.updatedAt),
        });

        const searchParams = new URLSearchParams(window.location.search);
        const fromPreview = searchParams.get('from');
        const selectedPageIndex = searchParams.get('selectedPageIndex');
        const selectedPageIdFromUrl = searchParams.get('selectedPageId');
        
        if (fromPreview === 'preview' && processedPages) {
          if (selectedPageIdFromUrl) {
            const pageExists = processedPages.find((page: Page) => page.id === selectedPageIdFromUrl);
            if (pageExists) {
              setSelectedPageId(selectedPageIdFromUrl);
            }
          }
          else if (selectedPageIndex !== null) {
            const pageIndex = parseInt(selectedPageIndex, 10);
            if (pageIndex >= 0 && pageIndex < processedPages.length) {
              setSelectedPageId(processedPages[pageIndex].id);
            }
          }
        }
        else if (processedPages && processedPages.length > 0) {
          setTimeout(() => {
            setSelectedPageId(processedPages[0].id);
          }, 100);
        }

      } catch (error) {
        console.error('작품 로딩 오류:', error);
        setSaveError(error instanceof Error ? error.message : '작품을 불러오는 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadWorkData();
  }, [routeId]);

  /* ---------- Template Functions ---------- */
  const applyTemplate = (template: Template) => {
    // 첫 페이지는 반드시 표지 템플릿을 선택하도록 강제
    if (work.pages.length === 0 && template.type !== "cover") {
      setSaveError("먼저 표지 템플릿을 선택해주세요.");
      setShowTemplateSelector(true);
      return;
    }
    const newPage: Page = {
      id: String(Date.now()),
      type: "template",
      templateId: template.id,
      content: { elements: template.layout.elements.map((el) => ({ ...el })) },
    };

    setWork((prev) => {
      const isCoverTemplate = template.type === "cover";
      if (isCoverTemplate) {
        const hasExistingCover = prev.pages.length > 0 && prev.pages[0].type === "template" && prev.pages[0].templateId?.startsWith("cover");
        const newPages = hasExistingCover ? [newPage, ...prev.pages.slice(1)] : [newPage, ...prev.pages];
        return {
          ...prev,
          coverTemplateId: template.id,
          pages: newPages,
          updatedAt: new Date(),
        };
      }
      const newPages = [...prev.pages, newPage];
      return { ...prev, pages: newPages, updatedAt: new Date() };
    });

    // Calculate the new page index after adding
    const newIndex = template.type === "cover" 
      ? (work.pages.length > 0 && work.pages[0].templateId?.startsWith("cover") ? 0 : 0)
      : work.pages.length;
    
    setTimeout(() => {
      setSelectedPageId(newPage.id);
      setCurrentPageIndex(newIndex);
    }, 100);
    setShowTemplateSelector(false);
  };

  const updateElementContent = (pageId: string, elementId: string, content: string) => {
    setWork((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              content: {
                ...page.content,
                elements: page.content.elements?.map((el) => (el.id === elementId && el.type === "text" ? { ...el, content } : el)),
              },
            }
          : page,
      ),
      updatedAt: new Date(),
    }));
  };

  const updateElementImage = (pageId: string, elementId: string, imageUrl: string) => {
    setWork((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              content: {
                ...page.content,
                elements: page.content.elements?.map((el) => (el.id === elementId ? (el.type === "image" ? { ...el, content: imageUrl } : { ...el, type: "image", content: imageUrl }) : el)),
              },
            }
          : page,
      ),
      updatedAt: new Date(),
    }));
  };


  /* ---------- Page Management ---------- */
  const requestDeletePage = (pageId: string) => setPendingDeleteId(pageId);
  const confirmDeletePage = () => {
    if (!pendingDeleteId) return;
    setWork((prev) => ({
      ...prev,
      pages: prev.pages.filter((p) => p.id !== pendingDeleteId),
      updatedAt: new Date(),
    }));
    if (selectedPageId === pendingDeleteId) {
      setSelectedPageId(null);
      setSelectedElementId(null);
    }
    setPendingDeleteId(null);
  };
  const cancelDeletePage = () => setPendingDeleteId(null);

  useEffect(() => {
    // 페이지가 바뀔 때만 선택된 요소 초기화 (불필요한 렌더 방지)
    if (selectedElementId !== null) {
      setSelectedElementId(null);
    }
  }, [selectedPageId, selectedElementId]);

  /* ---------- Save and Preview ---------- */
  const saveWork = async (): Promise<string | null> => {
    if (isSaving) return null;
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const payload: SaveWorkRequest & {
        workId?: string;
        printSpec?: { paperSize: string; coverType: string; innerPaper: string; orientation: string };
      } = {
        workId: work.id.startsWith("temp-") || routeId === "editor" ? undefined : work.id,
        title: work.title,
        coverImage: work.coverImage,
        coverTemplateId: work.coverTemplateId,
        pages: work.pages.map((page) => ({ id: page.id, type: page.type, templateId: page.templateId, content: page.content })),
        printSpec: { paperSize: "A4", coverType: "soft_matte", innerPaper: "plain", orientation: "portrait" },
      };

      const response = await fetch(`/api/works/editor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse | undefined = await response.json().catch(() => undefined);
        throw new Error(errorData?.details ?? "작품 저장에 실패했습니다.");
      }

      const savedWork: SavedWork = await response.json();
      setSaveMessage("작품이 저장되었습니다.");
      return savedWork.id ?? work.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      setSaveError(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const previewWork = async () => {
    const savedId = await saveWork();
    if (savedId) router.push(`/dashboard/works/${savedId}/preview?from=edit`);
  };

  const saveAndContinue = async () => {
    const savedId = await saveWork();
    if (savedId) setWork((prev) => ({ ...prev, id: savedId, updatedAt: new Date() }));
  };

const completeWork = async (): Promise<string | null> => {
  if (isSaving) return null;
  setIsSaving(true);
  setSaveError(null);

  try {
    // 1. 먼저 표지 이미지를 준비
    let coverImageToSave: string = work.coverImage || "";
    
    // 표지가 없는 경우 첫 번째 페이지에서 생성
    if (!coverImageToSave && work.pages.length > 0) {
      const firstPage = work.pages[0];
      
      // 첫 번째 페이지가 표지 템플릿인 경우 - 템플릿 내용을 표지로 사용
      if (firstPage.templateId?.startsWith('cover') && firstPage.content.elements) {
        // 첫 번째 텍스트 요소의 내용을 표지 제목으로 사용하거나
        // 첫 번째 이미지 요소를 표지 이미지로 사용
        const imageElement = firstPage.content.elements.find(el => el.type === 'image') as ImageElement | undefined;
        if (imageElement?.content) {
          coverImageToSave = imageElement.content;
        } else {
          // 이미지가 없으면 기본 표지 생성
          coverImageToSave = await generateDefaultCover(work.title);
        }
      }
      // 첫 번째 페이지에 이미지가 있는 경우
      else if (firstPage.content.image) {
        coverImageToSave = firstPage.content.image;
      }
      // 기본 표지 생성
      else {
        coverImageToSave = await generateDefaultCover(work.title);
      }
    }

    // 표지 이미지가 여전히 없으면 기본 표지 생성
    if (!coverImageToSave) {
      coverImageToSave = await generateDefaultCover(work.title);
    }

    // 2. 작품 정보를 먼저 업데이트 (표지 이미지 포함)
    const payload: SaveWorkRequest & {
      workId?: string;
      printSpec?: { paperSize: string; coverType: string; innerPaper: string; orientation: string };
      status?: string;
    } = {
      workId: work.id.startsWith("temp-") || routeId === "editor" ? undefined : work.id,
      title: work.title,
      coverImage: coverImageToSave, // 표지 이미지 포함
      coverTemplateId: work.coverTemplateId,
      pages: work.pages.map((page) => ({ id: page.id, type: page.type, templateId: page.templateId, content: page.content })),
      printSpec: { paperSize: "A4", coverType: "soft_matte", innerPaper: "plain", orientation: "portrait" },
      status: "completed", // 상태도 함께 업데이트
    };

    const response = await fetch(`/api/works/editor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse | undefined = await response.json().catch(() => undefined);
      throw new Error(errorData?.details ?? "작품 완료 처리에 실패했습니다.");
    }

    const savedWork: SavedWork = await response.json();
    const savedId = savedWork.id ?? work.id;

    // 3. 로컬 상태 업데이트
    setWork(prev => ({
      ...prev,
      id: savedId,
      coverImage: coverImageToSave,
      updatedAt: new Date(),
    }));

    alert("작품이 완료되었습니다! 만든 북 보기에서 확인할 수 있습니다.");
    router.push('/dashboard/books');

    return savedId;
    } catch (error) {
      console.error("Complete work error:", error);
      const errorMessage = error instanceof Error ? error.message : "작품 완료 처리 중 오류가 발생했습니다.";
      setSaveError(errorMessage);
      alert(errorMessage);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Sync currentPageIndex with selectedPageId (only when changed)
  useEffect(() => {
    if (!selectedPageId || work.pages.length === 0) return;
    const index = work.pages.findIndex(p => p.id === selectedPageId);
    if (index !== -1 && index !== currentPageIndex) {
      setCurrentPageIndex(index);
    }
  }, [selectedPageId, work.pages, currentPageIndex]);

  // Update selectedPageId from index only on initial/empty state to avoid loops
  useEffect(() => {
    if (work.pages.length === 0) return;
    if (!selectedPageId) {
      const id = work.pages[currentPageIndex]?.id;
      if (id) setSelectedPageId(id);
    }
  }, [currentPageIndex, work.pages, selectedPageId]);

  const currentPage = work.pages[currentPageIndex] || null;
  const leftPage = currentPageIndex > 0 ? work.pages[currentPageIndex - 1] : null;
  const rightPage = currentPage;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">작품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Top Toolbar - Project style */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-gray-200 shadow-md">
        <div className="mx-auto max-w-[1920px] px-3 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                title="템플릿 메뉴"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <button
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                title="실행 취소"
              >
                <Undo className="w-5 h-5 text-gray-700" />
              </button>
              <button
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                title="다시 실행"
              >
                <Redo className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Center - Page Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 2))}
                disabled={currentPageIndex === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="이전 페이지로"
              >
                <ChevronLeft className="w-4 h-4" />
                이전페이지
              </button>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md">
                <Plus className="w-5 h-5 text-teal-600" />
                <span className="text-base font-semibold text-gray-900">
                  {work.pages.length > 0 ? `${currentPageIndex + 1} / ${work.pages.length}` : "0"}
                </span>
              </div>
              <button
                onClick={() => setCurrentPageIndex(Math.min(work.pages.length - 1, currentPageIndex + 2))}
                disabled={currentPageIndex >= work.pages.length - 1}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="다음 페이지로"
              >
                다음페이지
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right - Help */}
            <button
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
              title="도움말"
            >
              <HelpCircle className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {saveError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm shadow-lg" role="alert">
              {saveError}
            </div>
          )}
          {saveMessage && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm shadow-lg" role="status">
              {saveMessage}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Template Sidebar (Left) - Toggleable */}
        {showTemplates && (
          <aside className="w-64 bg-white border-r-2 border-gray-300 shadow-lg overflow-y-auto z-20">
            <div className="p-4">
              <div className="mb-4">
                <input
                  type="text"
                  value={work.title}
                  onChange={(e) =>
                    setWork((prev) => ({
                      ...prev,
                      title: e.target.value,
                      updatedAt: new Date(),
                    }))
                  }
                  className="w-full text-lg font-bold bg-transparent border-b-2 border-gray-300 outline-none pb-2 focus:border-teal-400 transition-colors"
                  placeholder="작품 제목"
                />
              </div>

              {/* Cover Templates */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">표지 템플릿</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {COVER_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="group relative bg-gray-50 rounded-xl overflow-hidden border-2 border-transparent hover:border-teal-400 transition-all duration-200 hover:shadow-lg p-1"
                      type="button"
                    >
                      <div className="aspect-[3/4] bg-white rounded-lg mb-1 overflow-hidden">
                        <TemplatePreview template={template} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-900 truncate">{template.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Templates */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Layout className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">내지 템플릿</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PAGE_TEMPLATES.filter((t) => t.id !== "page-complex").map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="group relative bg-gray-50 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all duration-200 hover:shadow-lg p-1"
                      type="button"
                    >
                      <div className="aspect-[3/4] bg-white rounded-lg mb-1 overflow-hidden">
                        <TemplatePreview template={template} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-900 truncate">{template.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Canvas Area */}
        <main className="flex-1 flex items-start justify-center bg-white border-2 border-gray-300 rounded-2xl m-4 pt-3 pb-8 px-8 overflow-auto shadow-lg">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-start justify-center gap-6">
              {/* Left page (now editable when selected) */}
              <div
                className="relative w-[420px] h-[630px] bg-white border border-gray-300 rounded-lg shadow cursor-pointer"
                onClick={() => { if (leftPage) setSelectedPageId(leftPage.id); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && leftPage) setSelectedPageId(leftPage.id); }}
                title={leftPage ? '왼쪽 페이지 선택' : undefined}
              >
                {leftPage ? (
                  <div className="absolute inset-0">
                    {leftPage.content.elements && leftPage.content.elements.length > 0 && selectedPageId === leftPage.id ? (
                      <EditablePageView
                        page={leftPage}
                        onUpdateElement={(elementId, content) => updateElementContent(leftPage.id, elementId, content)}
                        onSelectElement={setSelectedElementId}
                        selectedElementId={selectedElementId}
                        fileInputRef={fileInputRef}
                      />
                    ) : (
                      <PagePreview page={leftPage} />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">왼쪽 페이지 없음</div>
                )}
              </div>

              {/* Right page (current - editable) or placeholder if none */}
              <div className="relative w-[420px] h-[630px] bg-white border-2 border-gray-400 rounded-lg shadow-xl">
                {rightPage ? (
                  rightPage.content.elements && rightPage.content.elements.length > 0 ? (
                    <div className="absolute inset-0">
                      {selectedPageId === rightPage.id ? (
                        <EditablePageView
                          page={rightPage}
                          onUpdateElement={(elementId, content) => updateElementContent(rightPage.id, elementId, content)}
                          onSelectElement={setSelectedElementId}
                          selectedElementId={selectedElementId}
                          fileInputRef={fileInputRef}
                        />
                      ) : (
                        <PagePreview page={rightPage} />
                      )}
                    </div>
                  ) : (
                    <PagePreview page={rightPage} />
                  )
                ) : (
                  <button
                    onClick={() => setShowTemplateSelector(true)}
                    className="absolute inset-0 flex items-center justify-center text-gray-600 hover:text-teal-700"
                    type="button"
                    title="템플릿 추가"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-6 w-6 text-teal-700" />
                      </div>
                      <p className="text-sm font-semibold">페이지를 추가하세요</p>
                      <p className="text-xs text-gray-500 mt-1">템플릿을 선택하여 오른쪽 페이지를 채울 수 있습니다</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Side Edit Panel - visible when a text element is selected */}
              {selectedPage && selectedElementId && (() => {
                const selectedElement = selectedPage.content.elements?.find(el => el.id === selectedElementId);
                const updateElementStyle = (styleUpdates: Partial<BaseTemplateElement['style']>) => {
                  if (!selectedPage || !selectedPage.content.elements) return;
                  const updatedElements = selectedPage.content.elements.map(el =>
                    el.id === selectedElementId ? { ...el, style: { ...el.style, ...styleUpdates } } : el
                  );
                  setWork(prev => ({
                    ...prev,
                    pages: prev.pages.map(page => page.id === selectedPage.id
                      ? { ...page, content: { ...page.content, elements: updatedElements } }
                      : page
                    ),
                    updatedAt: new Date(),
                  }));
                };
                if (selectedElement && selectedElement.type === 'text') {
                  return (
                    <div className="hidden xl:block w-64 p-3 bg-white border border-gray-200 rounded-xl shadow sticky top-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">페이지 편집 도구</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">글꼴</label>
                          <select
                            value={selectedElement.style?.fontFamily || 'Nanum Gothic'}
                            onChange={e => updateElementStyle({ fontFamily: e.target.value })}
                            className="w-full appearance-none bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {FONT_FAMILIES.map((font) => (
                              <option key={font.value} value={font.value}>{font.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">크기</label>
                          <select
                            value={selectedElement.style?.fontSize || 12}
                            onChange={e => updateElementStyle({ fontSize: parseInt(e.target.value) })}
                            className="w-full appearance-none bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <optgroup label="본문">
                              {BODY_FONT_SIZES.map(size => (
                                <option key={size} value={size}>{size}pt</option>
                              ))}
                            </optgroup>
                            <optgroup label="표기">
                              {TITLE_FONT_SIZES.map(size => (
                                <option key={size} value={size}>{size}pt</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button onClick={() => updateElementStyle({ fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.fontWeight === 'bold' ? 'bg-gray-200' : ''}`} title="굵게"><Bold className="h-3 w-3" /></button>
                          <button onClick={() => updateElementStyle({ fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.fontStyle === 'italic' ? 'bg-gray-200' : ''}`} title="기울임"><Italic className="h-3 w-3" /></button>
                          <button onClick={() => updateElementStyle({ textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.textDecoration === 'underline' ? 'bg-gray-200' : ''}`} title="밑줄"><Underline className="h-3 w-3" /></button>
                          <button onClick={() => updateElementStyle({ textDecoration: selectedElement.style?.textDecoration === 'line-through' ? 'none' : 'line-through' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.textDecoration === 'line-through' ? 'bg-gray-200' : ''}`} title="취소선"><Strikethrough className="h-3 w-3" /></button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button onClick={() => updateElementStyle({ textAlign: 'left' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.textAlign === 'left' ? 'bg-gray-200' : ''}`} title="왼쪽 정렬"><AlignLeft className="h-3 w-3" /></button>
                          <button onClick={() => updateElementStyle({ textAlign: 'center' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.textAlign === 'center' ? 'bg-gray-200' : ''}`} title="가운데 정렬"><AlignCenter className="h-3 w-3" /></button>
                          <button onClick={() => updateElementStyle({ textAlign: 'right' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.textAlign === 'right' ? 'bg-gray-200' : ''}`} title="오른쪽 정렬"><AlignRight className="h-3 w-3" /></button>
                          <button onClick={() => updateElementStyle({ textAlign: 'justify' })} className={`p-1.5 rounded hover:bg-gray-100 ${selectedElement.style?.textAlign === 'justify' ? 'bg-gray-200' : ''}`} title="양쪽 정렬"><AlignJustify className="h-3 w-3" /></button>
                        </div>

                        <div className="pt-1">
                          <button className="w-full py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300" title="링크 추가" disabled>링크 추가</button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </main>

        {/* Right Tool Sidebars */}
          <div className="absolute right-4 top-20 flex gap-3 z-10">
          {/* Primary Tools - Colored Circles */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title="이미지 추가"
            >
              <Upload className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (!file || !selectedPageId || !selectedElementId) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                  if (dataUrl) updateElementImage(selectedPageId, selectedElementId, dataUrl);
                };
                reader.readAsDataURL(file);
                e.currentTarget.value = '';
              }}
            />
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="w-14 h-14 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title="페이지 추가"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-14 h-14 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title="템플릿 메뉴"
            >
              <Layout className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => previewWork()}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title="미리보기"
            >
              <Eye className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => {
                if (currentPage) {
                  const pageIndex = work.pages.findIndex(p => p.id === currentPage.id);
                  if (pageIndex >= 0) requestDeletePage(currentPage.id);
                }
              }}
              className="w-14 h-14 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title="삭제"
            >
              <Trash2 className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Secondary Tools - White Circles */}
          <div className="flex flex-col gap-3">
            <button
              className="w-14 h-14 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
              title="채팅"
            >
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">💬</span>
              </div>
            </button>
            <button
              className="w-14 h-14 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
              title="이모지"
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">😊</span>
              </div>
            </button>
            <button
              className="w-14 h-14 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
              title="음악"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">♪</span>
              </div>
            </button>
            <button
              className="w-14 h-14 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
              title="팔레트"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🎨</span>
              </div>
            </button>
            <button
              className="w-14 h-14 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
              title="AI 도우미"
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="sticky bottom-0 z-20 bg-white border-t-2 border-gray-300 shadow-lg">
        <div className="mx-auto max-w-[1920px] px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="이전 페이지"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-teal-500 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">
                {work.pages.length > 0 ? `${currentPageIndex + 1} / ${work.pages.length}` : "0"}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPageIndex(Math.min(work.pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex >= work.pages.length - 1}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="다음 페이지"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Right Action Buttons */}
      <div className="fixed bottom-20 right-6 z-30 flex flex-col gap-3">
        <button
          onClick={() => {
            saveAndContinue();
            router.push('/dashboard/workspace');
          }}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          내 작업실로 보내기
        </button>
        <button
          onClick={completeWork}
          disabled={isSaving || work.pages.length === 0}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={work.pages.length === 0 ? "페이지를 추가한 후 완료할 수 있습니다" : "작품을 완료하고 라이브러리에 추가"}
        >
          만든 북 보기로 보내기
        </button>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <Layout className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{work.pages.length === 0 ? "표지 템플릿 선택" : "페이지 템플릿 선택"}</h2>
                </div>
                <button onClick={() => setShowTemplateSelector(false)} className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" type="button">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(work.pages.length === 0 ? COVER_TEMPLATES : PAGE_TEMPLATES.filter((t) => t.id !== "page-complex")).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="group relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border-2 border-transparent hover:border-teal-400 transition-all duration-200 hover:shadow-lg"
                    type="button"
                  >
                    <div className="w-full h-full bg-white p-3">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/95 rounded-xl px-3 py-2 shadow-sm">
                        <p className="text-sm font-semibold truncate text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500 truncate">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md mx-4">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
              </div>
                <h4 className="text-xl font-bold text-gray-900">페이지 삭제</h4>
              </div>
              <p className="text-gray-600 mb-6">이 페이지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
              <div className="flex justify-end gap-3">
                <button onClick={cancelDeletePage} className="px-6 py-3 rounded-full border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium" type="button">취소</button>
                <button onClick={confirmDeletePage} className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg hover:shadow-xl font-medium" type="button">삭제</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}