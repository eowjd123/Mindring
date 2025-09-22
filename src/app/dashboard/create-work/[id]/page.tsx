// app/dashboard/create-work/[id]/page.tsx
"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  FlipHorizontal,
  FlipVertical,
  Grid,
  GripVertical,
  Image as ImageIcon,
  Italic,
  Layout,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
    textAlign?: "left" | "center" | "right";
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
  };
}

interface TextElement extends BaseTemplateElement {
  type: "text";
  content?: string;
  placeholder?: string;
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
async function generateCoverFromTemplate(page: Page): Promise<string> {
  // 실제 구현에서는 HTML Canvas를 사용하여 템플릿을 이미지로 렌더링
  // 여기서는 placeholder 구현
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
}

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
          position: { x: 20, y: 40, width: 260, height: 60 },
          style: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#333333" },
          content: "나의 이야기",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "subtitle",
          type: "text",
          position: { x: 20, y: 120, width: 260, height: 40 },
          style: { fontSize: 16, textAlign: "center", color: "#666666" },
          content: "소중한 추억들",
          placeholder: "부제목을 입력하세요",
        } as TextElement,
        {
          id: "author",
          type: "text",
          position: { x: 20, y: 340, width: 260, height: 30 },
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
          position: { x: 20, y: 20, width: 260, height: 40 },
          style: { fontSize: 20, fontWeight: "bold", textAlign: "center", color: "#333333" },
          content: "제목을 입력해 주세요",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "main-image",
          type: "placeholder",
          position: { x: 20, y: 80, width: 260, height: 200 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드래그하여 여기에 추가해 주세요",
        } as PlaceholderElement,
        {
          id: "description",
          type: "text",
          position: { x: 20, y: 300, width: 260, height: 80 },
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
    description: "긴 텍스트 작성에 적합한 레이아웃",
    layout: {
      elements: [
        {
          id: "title",
          type: "text",
          position: { x: 20, y: 20, width: 260, height: 40 },
          style: { fontSize: 18, fontWeight: "bold", color: "#333333" },
          content: "텍스트를 입력해 주세요",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "content",
          type: "text",
          position: { x: 20, y: 80, width: 260, height: 300 },
          style: { fontSize: 14, color: "#555555", textAlign: "left" },
          content: "내용을 입력해 주세요",
          placeholder: "본문을 입력하세요",
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
          position: { x: 20, y: 20, width: 260, height: 40 },
          style: { fontSize: 14, textAlign: "center", color: "#555555" },
          content: "텍스트를 입력해 주세요",
          placeholder: "상단 텍스트를 입력하세요",
        } as TextElement,
        {
          id: "center-image",
          type: "placeholder",
          position: { x: 20, y: 80, width: 260, height: 200 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드래그하여 여기에 추가해 주세요",
        } as PlaceholderElement,
        {
          id: "bottom-text",
          type: "text",
          position: { x: 20, y: 300, width: 260, height: 80 },
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
          position: { x: 20, y: 20, width: 260, height: 30 },
          style: { fontSize: 16, fontWeight: "bold", color: "#333333" },
          content: "텍스트를 입력해 주세요",
          placeholder: "제목을 입력하세요",
        } as TextElement,
        {
          id: "image",
          type: "placeholder",
          position: { x: 20, y: 60, width: 260, height: 180 },
          style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 },
          placeholder: "사진을 드래그하여 여기에 추가해 주세요",
        } as PlaceholderElement,
        {
          id: "text",
          type: "text",
          position: { x: 20, y: 260, width: 260, height: 120 },
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
        { id: "image1", type: "placeholder", position: { x: 20, y: 20, width: 120, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "image2", type: "placeholder", position: { x: 160, y: 20, width: 120, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "image3", type: "placeholder", position: { x: 20, y: 130, width: 120, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "image4", type: "placeholder", position: { x: 160, y: 130, width: 120, height: 90 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "caption", type: "text", position: { x: 20, y: 240, width: 260, height: 140 }, style: { fontSize: 12, color: "#555555" }, content: "텍스트를 입력해 주세요", placeholder: "사진에 대한 설명을 입력하세요" } as TextElement,
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
        { id: "left-image", type: "placeholder", position: { x: 20, y: 20, width: 120, height: 160 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 8 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "right-text", type: "text", position: { x: 160, y: 20, width: 120, height: 80 }, style: { fontSize: 12, color: "#555555" }, content: "사진을 드래그하여 여기에 추가해 주세요", placeholder: "텍스트를 입력하세요" } as TextElement,
        { id: "right-image", type: "placeholder", position: { x: 160, y: 120, width: 120, height: 60 }, style: { backgroundColor: "#f0f0f0", border: "2px dashed #cccccc", borderRadius: 4 }, placeholder: "사진을 드래그하여 여기에 추가해 주세요" } as PlaceholderElement,
        { id: "bottom-text", type: "text", position: { x: 20, y: 200, width: 260, height: 180 }, style: { fontSize: 12, color: "#555555" }, content: "텍스트를 입력해 주세요", placeholder: "상세한 설명을 입력하세요" } as TextElement,
      ],
    },
  },
];

/* =========================
   UI Subcomponents
   ========================= */

interface EditablePageViewProps {
  page: Page;
  onUpdateElement: (elementId: string, content: string) => void;
  onUpdateElementImage: (elementId: string, imageUrl: string) => void;
  onSelectElement: (elementId: string) => void;
  selectedElementId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function EditablePageView({ page, onUpdateElement, onUpdateElementImage, onSelectElement, selectedElementId, fileInputRef }: EditablePageViewProps) {
  if (!page.content.elements || page.content.elements.length === 0) {
    return <PagePreview page={page} />;
  }

  const handleImageUpload = (elementId: string) => {
    onSelectElement(elementId);
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
            top: `${(element.position.y / 400) * 100}%`,
            width: `${(element.position.width / 300) * 100}%`,
            height: `${(element.position.height / 400) * 100}%`,
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
                    onChange={(e) => onUpdateElement(element.id, e.target.value)}
                    placeholder={element.placeholder || "텍스트를 입력하세요"}
                    className="w-full h-full bg-transparent border border-blue-300 outline-none resize-none text-xs leading-tight p-1"
                    style={{
                      fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 14)}px` : "12px",
                      color: element.style.color || "#333",
                      textAlign: element.style.textAlign || "left",
                      fontWeight: element.style.fontWeight || "normal",
                      fontStyle: element.style.fontStyle || "normal",
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
                      fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 14)}px` : "12px",
                      color: element.style.color || "#333",
                      textAlign: element.style.textAlign || "left",
                      fontWeight: element.style.fontWeight || "normal",
                      fontStyle: element.style.fontStyle || "normal",
                    }}
                  >
                    <span className="block">
                      {element.content || element.placeholder || "텍스트를 입력하세요"}
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
              <img src={element.content} alt="Page element" className="w-full h-full object-cover rounded" />
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
            top: `${(element.position.y / 400) * 100}%`,
            width: `${(element.position.width / 300) * 100}%`,
            height: `${(element.position.height / 400) * 100}%`,
            fontSize: element.style.fontSize ? `${(element.style.fontSize ?? 6) / 4}px` : "6px",
          }}
        >
          {element.type === "text" && (
            <div className="w-full h-full flex items-center text-gray-800 leading-tight">
              {element.content ?? element.placeholder}
            </div>
          )}
          {element.type === "placeholder" && (
            <div className="w-full h-full bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center">
              <ImageIcon className="w-3 h-3 text-gray-400" />
            </div>
          )}
          {element.type === "image" && (
            <img src={element.content} alt="Template element" className="w-full h-full object-cover" />
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
              top: `${(element.position.y / 400) * 100}%`,
              width: `${(element.position.width / 300) * 100}%`,
              height: `${(element.position.height / 400) * 100}%`,
              fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 12)}px` : "10px",
              minHeight: '20px',
              minWidth: '20px',
            }}
          >
            {element.type === "text" && (
              <div
                className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden p-1"
                style={{
                  color: element.style.color || "#333",
                  textAlign: element.style.textAlign || "left",
                  fontWeight: element.style.fontWeight || "normal",
                  fontStyle: element.style.fontStyle || "normal",
                }}
              >
                <span className="block text-xs">
                  {element.content || element.placeholder || "텍스트를 입력하세요"}
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
              <img src={element.content} alt="Page element" className="w-full h-full object-cover rounded" />
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
          <img
            src={page.content.image}
            alt="Page content"
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `rotate(${imageStyle?.rotation ?? 0}deg) scaleX(${imageStyle?.flipH ? -1 : 1}) scaleY(${imageStyle?.flipV ? -1 : 1})`,
            }}
          />
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
        return {
          ...prev,
          coverTemplateId: template.id,
          pages: hasExistingCover ? [newPage, ...prev.pages.slice(1)] : [newPage, ...prev.pages],
          updatedAt: new Date(),
        };
      }
      return { ...prev, pages: [...prev.pages, newPage], updatedAt: new Date() };
    });

    setSelectedPageId(newPage.id);
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

  /* ---------- File Upload ---------- */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === "string" && result.startsWith("data:") && selectedPageId && selectedElementId) {
        updateElementImage(selectedPageId, selectedElementId, result);
        setSelectedElementId(null);
      }
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
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
    setSelectedElementId(null);
  }, [selectedPageId]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
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
                className="text-2xl font-bold bg-transparent border-none outline-none focus:bg-white focus:px-2 focus:rounded"
                placeholder="작품 제목을 입력하세요"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={previewWork}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                <Eye className="mr-2 h-4 w-4" />
                {isSaving ? "저장 중..." : "저장 후 미리보기"}
              </button>
              
              <button
                onClick={saveAndContinue}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </button>

              <button
                onClick={completeWork}
                disabled={isSaving || work.pages.length === 0}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                title={work.pages.length === 0 ? "페이지를 추가한 후 완료할 수 있습니다" : "작품을 완료하고 라이브러리에 추가"}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isSaving ? "처리 중..." : "작품 완료"}
              </button>
            </div>
          </div>

          {saveError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm" role="alert">
              {saveError}
            </div>
          )}
          {saveMessage && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm" role="status">
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left Sidebar - Templates */}
          <div className="lg:col-span-1 space-y-4">
            {/* Cover Templates */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                표지 템플릿
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {COVER_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="group relative aspect-[3/4] bg-gray-100 rounded-md overflow-hidden border border-transparent hover:border-blue-500 transition-all"
                    type="button"
                  >
                    <div className="w-full h-full bg-white p-1">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-white/90 rounded px-1 py-0.5">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Templates */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <Layout className="mr-2 h-4 w-4" />
                내지 템플릿
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {PAGE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="group relative aspect-[3/4] bg-gray-100 rounded-md overflow-hidden border border-transparent hover:border-green-500 transition-all"
                    type="button"
                  >
                    <div className="w-full h-full bg-white p-1">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-white/90 rounded px-1 py-0.5">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                사진 업로드
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center px-3 py-6 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors"
                type="button"
              >
                <div className="text-center">
                  <ImageIcon className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">클릭하여 사진 업로드</p>
                  <p className="text-xs text-gray-500 mt-1">선택된 영역에 추가</p>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {/* Main Content - Pages */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">페이지 ({work.pages.length}개)</h2>
              </div>

              {work.pages.length === 0 ? (
                <div className="text-center py-12">
                  <Layout className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">템플릿을 선택해보세요</h3>
                  <p className="text-gray-600 mb-6">왼쪽에서 원하는 템플릿을 클릭하여 페이지를 추가하세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {work.pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={`relative group border-2 rounded-lg overflow-hidden transition-all max-w-lg mx-auto ${selectedPageId === page.id ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => setSelectedPageId(page.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedPageId(page.id);
                      }}
                    >
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">{index + 1}</div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeletePage(page.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                        type="button"
                        aria-label="페이지 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <div className="aspect-[3/4] bg-white cursor-pointer relative" style={{ minHeight: "500px" }}>
                        <div className="absolute inset-0">
                          <PagePreview page={page} />
                        </div>
                        
                        {selectedPageId === page.id && page.content.elements && page.content.elements.length > 0 && (
                          <div className="absolute inset-0 bg-white">
                            <EditablePageView
                              page={page}
                              onUpdateElement={(elementId, content) => updateElementContent(page.id, elementId, content)}
                              onUpdateElementImage={(elementId, imageUrl) => updateElementImage(page.id, elementId, imageUrl)}
                              onSelectElement={setSelectedElementId}
                              selectedElementId={selectedElementId}
                              fileInputRef={fileInputRef}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-gray-50 border-t">
                        <p className="text-sm font-medium text-center">
                          {page.templateId?.startsWith("cover")
                            ? "표지"
                            : page.templateId
                            ? PAGE_TEMPLATES.find((t) => t.id === page.templateId)?.name ||
                              COVER_TEMPLATES.find((t) => t.id === page.templateId)?.name ||
                              "템플릿 페이지"
                            : `${page.type} 페이지`}
                        </p>
                        <p className="text-xs text-gray-400 text-center mt-1">{page.templateId ? `템플릿: ${page.templateId}` : `타입: ${page.type}`}</p>
                      </div>
                    </div>
                  ))}

                  <div className="max-w-lg mx-auto">
                    <button
                      onClick={() => setShowTemplateSelector(true)}
                      className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center group"
                      style={{ minHeight: "500px" }}
                      type="button"
                    >
                      <div className="text-center">
                        <Plus className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-600 group-hover:text-gray-800">새 페이지 추가</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {selectedPage && selectedPage.content.elements && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">페이지 편집 도구</h3>
                  <div className="text-xs text-gray-600 mb-3">페이지의 텍스트나 이미지 영역을 직접 클릭하여 편집하세요.</div>
                  {selectedElementId && (
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-xs text-blue-800"><strong>선택된 요소:</strong> {selectedElementId}</p>
                      <p className="text-xs text-blue-600 mt-1">이미지 영역인 경우 사진 업로드 버튼을 클릭하여 이미지를 추가할 수 있습니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">페이지 템플릿 선택</h3>
                <button onClick={() => setShowTemplateSelector(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PAGE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="group relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                    type="button"
                  >
                    <div className="w-full h-full bg-white p-2">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white/90 rounded px-2 py-1">
                        <p className="text-xs font-medium truncate">{template.name}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h4 className="text-lg font-semibold mb-2">페이지 삭제</h4>
              <p className="text-sm text-gray-600">이 페이지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={cancelDeletePage} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50" type="button">취소</button>
                <button onClick={confirmDeletePage} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" type="button">삭제</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}