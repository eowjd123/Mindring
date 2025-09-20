// app/dashboard/create-work/[id]/page.tsx
'use client';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
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
  X
} from 'lucide-react';
import React, { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

/* =========================
   Editable Page View Component
   ========================= */

interface EditablePageViewProps {
  page: Page;
  onUpdateElement: (elementId: string, content: string) => void;
  onUpdateElementImage: (elementId: string, imageUrl: string) => void;
  onSelectElement: (elementId: string) => void;
  selectedElementId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function EditablePageView({ 
  page, 
  onUpdateElement, 
  onUpdateElementImage, 
  onSelectElement, 
  selectedElementId,
  fileInputRef 
}: EditablePageViewProps) {
  if (!page.content.elements) return <PagePreview page={page} />;

  const handleImageUpload = (elementId: string) => {
    onSelectElement(elementId);
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full relative bg-white p-2">
      {page.content.elements.map((element) => (
        <div
          key={element.id}
          className={`absolute cursor-pointer group ${
            selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''
          }`}
          style={{
            left: `${(element.position.x / 300) * 100}%`,
            top: `${(element.position.y / 400) * 100}%`,
            width: `${(element.position.width / 300) * 100}%`,
            height: `${(element.position.height / 400) * 100}%`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement(element.id);
          }}
        >
          {element.type === 'text' && (
            <div className="w-full h-full relative">
              <textarea
                value={element.content || ''}
                onChange={(e) => onUpdateElement(element.id, e.target.value)}
                placeholder={element.placeholder}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-xs leading-tight p-1"
                style={{
                  fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 14)}px` : '12px',
                  color: element.style.color,
                  textAlign: element.style.textAlign,
                  fontWeight: element.style.fontWeight,
                  fontStyle: element.style.fontStyle,
                }}
              />
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                텍스트 편집
              </div>
            </div>
          )}
          
          {element.type === 'placeholder' && (
            <div 
              className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors relative"
              onClick={() => handleImageUpload(element.id)}
            >
              <div className="text-center">
                <ImageIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500 leading-tight">
                  클릭하여<br />이미지 추가
                </p>
              </div>
              <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                이미지 추가
              </div>
            </div>
          )}
          
          {element.type === 'image' && element.content && (
            <div className="w-full h-full relative">
              <img
                src={element.content}
                alt="Page element"
                className="w-full h-full object-cover rounded"
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center"
                onClick={() => handleImageUpload(element.id)}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                이미지 교체
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================
   Template System Types
   ========================= */

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'placeholder';
  position: { x: number; y: number; width: number; height: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
  };
  content?: string;
  placeholder?: string;
}

interface Template {
  id: string;
  type: 'cover' | 'page';
  category: 'text' | 'image' | 'mixed' | 'blank';
  name: string;
  thumbnail: string;
  description: string;
  layout: {
    elements: TemplateElement[];
  };
}

/* =========================
   Template Data
   ========================= */

const COVER_TEMPLATES: Template[] = [
  {
    id: 'cover-blank',
    type: 'cover',
    category: 'blank',
    name: '빈 표지',
    thumbnail: '/templates/cover-blank.png',
    description: '자유롭게 디자인할 수 있는 빈 표지',
    layout: {
      elements: []
    }
  },
  {
    id: 'cover-simple',
    type: 'cover',
    category: 'text',
    name: '목차페이지',
    thumbnail: '/templates/cover-simple.png',
    description: '심플한 텍스트 중심 표지',
    layout: {
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 20, y: 40, width: 260, height: 60 },
          style: {
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#333333'
          },
          content: '나의 이야기',
          placeholder: '제목을 입력하세요'
        },
        {
          id: 'subtitle',
          type: 'text',
          position: { x: 20, y: 120, width: 260, height: 40 },
          style: {
            fontSize: 16,
            textAlign: 'center',
            color: '#666666'
          },
          content: '소중한 추억들',
          placeholder: '부제목을 입력하세요'
        },
        {
          id: 'author',
          type: 'text',
          position: { x: 20, y: 340, width: 260, height: 30 },
          style: {
            fontSize: 14,
            textAlign: 'center',
            color: '#888888'
          },
          content: '작성자명',
          placeholder: '작성자를 입력하세요'
        }
      ]
    }
  },
  {
    id: 'cover-photo',
    type: 'cover',
    category: 'mixed',
    name: '그림일기 페이지지',
    thumbnail: '/templates/cover-photo.png',
    description: '사진과 텍스트가 조합된 표지',
    layout: {
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 20, y: 20, width: 260, height: 40 },
          style: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#333333'
          },
          content: '제목을 입력해 주세요',
          placeholder: '제목을 입력하세요'
        },
        {
          id: 'main-image',
          type: 'placeholder',
          position: { x: 20, y: 80, width: 260, height: 200 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 8
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 20, y: 300, width: 260, height: 80 },
          style: {
            fontSize: 14,
            textAlign: 'left',
            color: '#555555'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '설명을 입력하세요'
        }
      ]
    }
  }
];

const PAGE_TEMPLATES: Template[] = [
  {
    id: 'page-text-only',
    type: 'page',
    category: 'text',
    name: '텍스트 페이지',
    thumbnail: '/templates/page-text.png',
    description: '긴 텍스트 작성에 적합한 레이아웃',
    layout: {
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 20, y: 20, width: 260, height: 40 },
          style: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333333'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '제목을 입력하세요'
        },
        {
          id: 'content',
          type: 'text',
          position: { x: 20, y: 80, width: 260, height: 300 },
          style: {
            fontSize: 14,
            color: '#555555',
            textAlign: 'left'
          },
          content: '내용을 입력해 주세요',
          placeholder: '본문을 입력하세요'
        }
      ]
    }
  },
  {
    id: 'page-top-image-bottom',
    type: 'page',
    category: 'mixed',
    name: '상하 분할 레이아웃',
    thumbnail: '/templates/page-top-bottom.png',
    description: '상단 텍스트 + 중앙 이미지 + 하단 텍스트',
    layout: {
      elements: [
        {
          id: 'top-text',
          type: 'text',
          position: { x: 20, y: 20, width: 260, height: 40 },
          style: {
            fontSize: 14,
            textAlign: 'center',
            color: '#555555'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '상단 텍스트를 입력하세요'
        },
        {
          id: 'center-image',
          type: 'placeholder',
          position: { x: 20, y: 80, width: 260, height: 200 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 8
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'bottom-text',
          type: 'text',
          position: { x: 20, y: 300, width: 260, height: 80 },
          style: {
            fontSize: 14,
            textAlign: 'center',
            color: '#555555'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '하단 텍스트를 입력하세요'
        }
      ]
    }
  },
  {
    id: 'page-image-text',
    type: 'page',
    category: 'mixed',
    name: '이미지 + 텍스트',
    thumbnail: '/templates/page-mixed.png',
    description: '사진과 텍스트가 조합된 레이아웃',
    layout: {
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 20, y: 20, width: 260, height: 30 },
          style: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333333'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '제목을 입력하세요'
        },
        {
          id: 'image',
          type: 'placeholder',
          position: { x: 20, y: 60, width: 260, height: 180 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 8
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'text',
          type: 'text',
          position: { x: 20, y: 260, width: 260, height: 120 },
          style: {
            fontSize: 12,
            color: '#555555'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '설명을 입력하세요'
        }
      ]
    }
  },
  {
    id: 'page-gallery',
    type: 'page',
    category: 'image',
    name: '이미지 갤러리',
    thumbnail: '/templates/page-gallery.png',
    description: '여러 사진을 배치할 수 있는 갤러리',
    layout: {
      elements: [
        {
          id: 'image1',
          type: 'placeholder',
          position: { x: 20, y: 20, width: 120, height: 90 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 4
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'image2',
          type: 'placeholder',
          position: { x: 160, y: 20, width: 120, height: 90 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 4
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'image3',
          type: 'placeholder',
          position: { x: 20, y: 130, width: 120, height: 90 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 4
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'image4',
          type: 'placeholder',
          position: { x: 160, y: 130, width: 120, height: 90 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 4
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'caption',
          type: 'text',
          position: { x: 20, y: 240, width: 260, height: 140 },
          style: {
            fontSize: 12,
            color: '#555555'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '사진에 대한 설명을 입력하세요'
        }
      ]
    }
  },
  {
    id: 'page-complex',
    type: 'page',
    category: 'mixed',
    name: '복합 레이아웃',
    thumbnail: '/templates/page-complex.png',
    description: '다양한 요소가 조합된 자유 레이아웃',
    layout: {
      elements: [
        {
          id: 'left-image',
          type: 'placeholder',
          position: { x: 20, y: 20, width: 120, height: 160 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 8
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'right-text',
          type: 'text',
          position: { x: 160, y: 20, width: 120, height: 80 },
          style: {
            fontSize: 12,
            color: '#555555'
          },
          content: '사진을 드래그하여 여기에 추가해 주세요',
          placeholder: '텍스트를 입력하세요'
        },
        {
          id: 'right-image',
          type: 'placeholder',
          position: { x: 160, y: 120, width: 120, height: 60 },
          style: {
            backgroundColor: '#f0f0f0',
            border: '2px dashed #cccccc',
            borderRadius: 4
          },
          placeholder: '사진을 드래그하여 여기에 추가해 주세요'
        },
        {
          id: 'bottom-text',
          type: 'text',
          position: { x: 20, y: 200, width: 260, height: 180 },
          style: {
            fontSize: 12,
            color: '#555555'
          },
          content: '텍스트를 입력해 주세요',
          placeholder: '상세한 설명을 입력하세요'
        }
      ]
    }
  }
];

/* =========================
   Original Page Types (유지)
   ========================= */

interface Page {
  id: string;
  type: 'text' | 'image' | 'mixed' | 'template';
  templateId?: string;
  content: {
    text?: string;
    image?: string;
    elements?: TemplateElement[];
    imageStyle?: {
      width: number;
      height: number;
      rotation: number;
      flipH: boolean;
      flipV: boolean;
    };
    textStyle?: {
      fontSize: number;
      fontFamily: string;
      color: string;
      align: 'left' | 'center' | 'right';
      bold: boolean;
      italic: boolean;
    };
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

/* =========================
   Main Component
   ========================= */

export default function CreateWorkPage() {
  const router = useRouter();

  const [work, setWork] = useState<Work>({
    id: `temp-${Date.now()}`,
    title: '새로운 작품',
    pages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPage = work.pages.find(p => p.id === selectedPageId);

  /* ---------- Template Functions ---------- */

  const applyTemplate = (template: Template) => {
    if (template.type === 'cover') {
      // 표지도 실제 페이지로 추가
      const newPage: Page = {
        id: Date.now().toString(),
        type: 'template',
        templateId: template.id,
        content: {
          elements: template.layout.elements.map(el => ({ ...el }))
        }
      };

      setWork(prev => ({
        ...prev,
        coverTemplateId: template.id,
        pages: [newPage, ...prev.pages], // 표지는 맨 앞에 추가
        updatedAt: new Date()
      }));

      setSelectedPageId(newPage.id);
    } else {
      const newPage: Page = {
        id: Date.now().toString(),
        type: 'template',
        templateId: template.id,
        content: {
          elements: template.layout.elements.map(el => ({ ...el }))
        }
      };

      setWork(prev => ({
        ...prev,
        pages: [...prev.pages, newPage], // 내지는 맨 뒤에 추가
        updatedAt: new Date()
      }));

      setSelectedPageId(newPage.id);
    }
  };

  const updateElementContent = (pageId: string, elementId: string, content: string) => {
    setWork(prev => ({
      ...prev,
      pages: prev.pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              content: {
                ...page.content,
                elements: page.content.elements?.map(el =>
                  el.id === elementId ? { ...el, content } : el
                )
              }
            }
          : page
      ),
      updatedAt: new Date()
    }));
  };

  const updateElementImage = (pageId: string, elementId: string, imageUrl: string) => {
    setWork(prev => ({
      ...prev,
      pages: prev.pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              content: {
                ...page.content,
                elements: page.content.elements?.map(el =>
                  el.id === elementId 
                    ? { ...el, type: 'image' as const, content: imageUrl } 
                    : el
                )
              }
            }
          : page
      ),
      updatedAt: new Date()
    }));
  };

  /* ---------- File Upload ---------- */

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        if (selectedPageId && selectedElementId) {
          updateElementImage(selectedPageId, selectedElementId, result);
          setSelectedElementId(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Page Management ---------- */

  const deletePage = (pageId: string) => {
    if (!confirm('이 페이지를 삭제하시겠습니까?')) return;

    setWork(prev => ({
      ...prev,
      pages: prev.pages.filter(p => p.id !== pageId),
      updatedAt: new Date()
    }));

    if (selectedPageId === pageId) {
      setSelectedPageId(null);
    }
  };

  /* ---------- Save and Preview ---------- */

  const saveWork = async (): Promise<string | null> => {
    if (isSaving) return null;
    setIsSaving(true);

    try {
      // 실제 API 호출 구현 필요
      alert('작품이 저장되었습니다.');
      return work.id;
    } catch (error) {
      console.error('Save work error:', error);
      alert('저장 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const previewWork = async () => {
    const savedId = await saveWork();
    const id = savedId ?? work.id;
    router.push(`/dashboard/works/${id}/preview`);
  };

  /* =========================
     Render
     ========================= */

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
              >
                <Eye className="mr-2 h-4 w-4" />
                미리보기
              </button>
              <button
                onClick={saveWork}
                disabled={isSaving}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
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
                  >
                    <div className="w-full h-full bg-white p-1">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-white bg-opacity-90 rounded px-1 py-0.5">
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
                  >
                    <div className="w-full h-full bg-white p-1">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-white bg-opacity-90 rounded px-1 py-0.5">
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
              >
                <div className="text-center">
                  <ImageIcon className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">클릭하여 사진 업로드</p>
                  <p className="text-xs text-gray-500 mt-1">선택된 영역에 추가</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    템플릿을 선택해보세요
                  </h3>
                  <p className="text-gray-600 mb-6">
                    왼쪽에서 원하는 템플릿을 클릭하여 페이지를 추가하세요
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {work.pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={`relative group border-2 rounded-lg overflow-hidden transition-all max-w-lg mx-auto ${
                        selectedPageId === page.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPageId(page.id)}
                    >
                      {/* Page Number */}
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                        {index + 1}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(page.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {/* Page Content Preview */}
                      <div className="aspect-[3/4] bg-white cursor-pointer relative" style={{ minHeight: '500px' }}>
                        {selectedPageId === page.id ? (
                          <EditablePageView 
                            page={page} 
                            onUpdateElement={(elementId, content) => updateElementContent(page.id, elementId, content)}
                            onUpdateElementImage={(elementId, imageUrl) => updateElementImage(page.id, elementId, imageUrl)}
                            onSelectElement={setSelectedElementId}
                            selectedElementId={selectedElementId}
                            fileInputRef={fileInputRef}
                          />
                        ) : (
                          <PagePreview page={page} />
                        )}
                      </div>

                      {/* Page Info */}
                      <div className="p-3 bg-gray-50 border-top">
                        <p className="text-sm font-medium text-center">
                          {page.templateId ? 
                            PAGE_TEMPLATES.find(t => t.id === page.templateId)?.name || 
                            COVER_TEMPLATES.find(t => t.id === page.templateId)?.name ||
                            '템플릿 페이지'
                            : `${page.type} 페이지`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Page Button */}
                  <div className="max-w-lg mx-auto">
                    <button
                      onClick={() => setShowTemplateSelector(true)}
                      className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center group"
                      style={{ minHeight: '500px' }}
                    >
                      <div className="text-center">
                        <Plus className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-600 group-hover:text-gray-800">새 페이지 추가</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Page Editor */}
              {selectedPage && selectedPage.content.elements && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">페이지 편집 도구</h3>
                  <div className="text-xs text-gray-600 mb-3">
                    페이지의 텍스트나 이미지 영역을 직접 클릭하여 편집하세요.
                  </div>
                  {selectedElementId && (
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>선택된 요소:</strong> {selectedElementId}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        이미지 영역인 경우 사진 업로드 버튼을 클릭하여 이미지를 추가할 수 있습니다.
                      </p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">페이지 템플릿 선택</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PAGE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="group relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                  >
                    <div className="w-full h-full bg-white p-2">
                      <TemplatePreview template={template} />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white bg-opacity-90 rounded px-2 py-1">
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
    </div>
  );
}

/* =========================
   Template Preview Component
   ========================= */

interface TemplatePreviewProps {
  template: Template;
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="w-full h-full relative bg-white" style={{ fontSize: '8px' }}>
      {template.layout.elements.map((element) => (
        <div
          key={element.id}
          className="absolute"
          style={{
            left: `${(element.position.x / 300) * 100}%`,
            top: `${(element.position.y / 400) * 100}%`,
            width: `${(element.position.width / 300) * 100}%`,
            height: `${(element.position.height / 400) * 100}%`,
            ...element.style,
            fontSize: element.style.fontSize ? `${element.style.fontSize / 4}px` : '6px'
          }}
        >
          {element.type === 'text' && (
            <div className="w-full h-full flex items-center text-gray-800 leading-tight">
              {element.content || element.placeholder}
            </div>
          )}
          {element.type === 'placeholder' && (
            <div className="w-full h-full bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center">
              <ImageIcon className="w-3 h-3 text-gray-400" />
            </div>
          )}
          {element.type === 'image' && element.content && (
            <img
              src={element.content}
              alt="Template element"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================
   Page Preview Component
   ========================= */

interface PagePreviewProps {
  page: Page;
}

function PagePreview({ page }: PagePreviewProps) {
  // 템플릿 기반 페이지인 경우
  if (page.type === 'template' && page.content.elements) {
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
              fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 12)}px` : '10px'
            }}
          >
            {element.type === 'text' && (
              <div 
                className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden"
                style={{
                  color: element.style.color,
                  textAlign: element.style.textAlign,
                  fontWeight: element.style.fontWeight,
                  fontStyle: element.style.fontStyle
                }}
              >
                <span className="line-clamp-6">
                  {element.content || element.placeholder}
                </span>
              </div>
            )}
            {element.type === 'placeholder' && (
              <div className="w-full h-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
            {element.type === 'image' && element.content && (
              <img
                src={element.content}
                alt="Page element"
                className="w-full h-full object-cover rounded"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // 기존 레거시 페이지 타입들을 위한 fallback
  const imageStyle = page.content.imageStyle;
  const textStyle = page.content.textStyle;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Image Content */}
      {page.content.image && (
        <div
          className={`${
            page.type === 'mixed' ? 'flex-1' : 'w-full h-full'
          } flex items-center justify-center bg-gray-100`}
        >
          <img
            src={page.content.image}
            alt="Page content"
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `
                rotate(${imageStyle?.rotation || 0}deg)
                scaleX(${imageStyle?.flipH ? -1 : 1})
                scaleY(${imageStyle?.flipV ? -1 : 1})
              `
            }}
          />
        </div>
      )}

      {/* Text Content */}
      {page.content.text && (
        <div
          className={`${
            page.type === 'mixed' ? 'flex-1' : 'w-full h-full'
          } p-3 flex items-center`}
        >
          <p
            className="w-full line-clamp-6 text-xs leading-relaxed"
            style={{
              fontSize: Math.min(textStyle?.fontSize || 16, 12),
              color: textStyle?.color || '#000000',
              textAlign: textStyle?.align || 'left',
              fontWeight: textStyle?.bold ? 'bold' : 'normal',
              fontStyle: textStyle?.italic ? 'italic' : 'normal'
            }}
          >
            {page.content.text}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!page.content.image && !page.content.text && !page.content.elements && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            {page.type === 'image' && <ImageIcon className="mx-auto h-8 w-8 mb-2" />}
            {page.type === 'text' && <Type className="mx-auto h-8 w-8 mb-2" />}
            {page.type === 'mixed' && <Plus className="mx-auto h-8 w-8 mb-2" />}
            {page.type === 'template' && <Layout className="mx-auto h-8 w-8 mb-2" />}
            <p className="text-xs">
              {page.type === 'image'
                ? '이미지 없음'
                : page.type === 'text'
                ? '텍스트 없음'
                : page.type === 'template'
                ? '템플릿 페이지'
                : '내용 없음'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}