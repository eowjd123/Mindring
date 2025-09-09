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
  FlipHorizontal,
  FlipVertical,
  GripVertical,
  Image as ImageIcon,
  Italic,
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
   Types
   ========================= */

interface Page {
  id: string;
  type: 'text' | 'image' | 'mixed';
  content: {
    text?: string;
    image?: string;
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
  pages: Page[];
  createdAt: Date;
  updatedAt: Date;
}

// 서버 응답 타입 정의
type ApiPageType = 'TEXT' | 'IMAGE' | 'MIXED';
type ClientPageType = 'text' | 'image' | 'mixed';

interface ApiPage {
  id: string;
  type: string;
  content?: Page['content'] | null;
}

interface ApiWork {
  id: string;
  title: string;
  coverImage?: string | null;
  pages?: ApiPage[];
  createdAt: string;
  updatedAt: string;
}

// 저장용 페이지 타입 (서버 전송용)
interface SavePageData {
  type: ClientPageType;
  content: Page['content'];
}

interface SaveWorkPayload {
  id?: string;
  title: string;
  coverImage?: string;
  pages: SavePageData[];
}

/* =========================
   Utils
   ========================= */

// Prisma cuid() 25자 영숫자 검증
const isDbId = (id: string): boolean => /^[a-z0-9]{25}$/i.test(id);

// API 페이지 타입 검증
const isApiPageType = (v: string): v is ApiPageType =>
  (['TEXT', 'IMAGE', 'MIXED'] as const).includes(v as ApiPageType);

// API 페이지 타입을 클라이언트 타입으로 변환
const toClientPageType = (t: string): ClientPageType =>
  isApiPageType(t) ? (t.toLowerCase() as ClientPageType) : 'text';

// FileReader 결과 타입 가드
const isDataURL = (result: string | ArrayBuffer | null | undefined): result is string =>
  typeof result === 'string' && result.startsWith('data:');

// 기본 페이지 스타일 생성
const createDefaultTextStyle = () => ({
  fontSize: 16,
  fontFamily: 'Noto Sans KR',
  color: '#000000',
  align: 'left' as const,
  bold: false,
  italic: false
});

const createDefaultImageStyle = () => ({
  width: 300,
  height: 200,
  rotation: 0,
  flipH: false,
  flipV: false
});

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
  const [isSaving, setIsSaving] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [showCoverSelector, setShowCoverSelector] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selectedPage = work.pages.find(p => p.id === selectedPageId);

  /* ---------- Page CRUD ---------- */

  const addPage = (type: ClientPageType) => {
    const newPage: Page = {
      id: Date.now().toString(),
      type,
      content: {
        text: type !== 'image' ? '텍스트를 입력하세요...' : undefined,
        textStyle: createDefaultTextStyle(),
        imageStyle: createDefaultImageStyle()
      }
    };

    setWork(prev => ({
      ...prev,
      pages: [...prev.pages, newPage],
      updatedAt: new Date()
    }));

    setSelectedPageId(newPage.id);
  };

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

  const updatePageContent = (pageId: string, updates: Partial<Page['content']>) => {
    setWork(prev => ({
      ...prev,
      pages: prev.pages.map(p =>
        p.id === pageId
          ? { ...p, content: { ...p.content, ...updates } }
          : p
      ),
      updatedAt: new Date()
    }));
  };

  /* ---------- Page Reordering ---------- */

  const movePageUp = (pageId: string) => {
    const pageIndex = work.pages.findIndex(p => p.id === pageId);
    if (pageIndex > 0) {
      const newPages = [...work.pages];
      [newPages[pageIndex], newPages[pageIndex - 1]] =
        [newPages[pageIndex - 1], newPages[pageIndex]];
      setWork(prev => ({ ...prev, pages: newPages, updatedAt: new Date() }));
    }
  };

  const movePageDown = (pageId: string) => {
    const pageIndex = work.pages.findIndex(p => p.id === pageId);
    if (pageIndex < work.pages.length - 1) {
      const newPages = [...work.pages];
      [newPages[pageIndex], newPages[pageIndex + 1]] =
        [newPages[pageIndex + 1], newPages[pageIndex]];
      setWork(prev => ({ ...prev, pages: newPages, updatedAt: new Date() }));
    }
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newPages = [...work.pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    setWork(prev => ({ ...prev, pages: newPages, updatedAt: new Date() }));
  };

  /* ---------- Drag and Drop ---------- */

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPageId: string) => {
    e.preventDefault();
    if (!draggedPageId || draggedPageId === targetPageId) {
      setDraggedPageId(null);
      return;
    }
    const fromIndex = work.pages.findIndex(p => p.id === draggedPageId);
    const toIndex = work.pages.findIndex(p => p.id === targetPageId);
    movePage(fromIndex, toIndex);
    setDraggedPageId(null);
  };

  /* ---------- Cover Image Management ---------- */

  const setCoverImage = (imageUrl: string) => {
    setWork(prev => ({ ...prev, coverImage: imageUrl, updatedAt: new Date() }));
    setShowCoverSelector(false);
  };

  const setCoverFromPage = (page: Page) => {
    if (page.content.image) {
      setCoverImage(page.content.image);
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (isDataURL(result)) {
        setCoverImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setWork(prev => ({ ...prev, coverImage: undefined, updatedAt: new Date() }));
    setShowCoverSelector(false);
  };

  /* ---------- Image Upload ---------- */

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
      if (!isDataURL(result)) return;

      if (selectedPageId) {
        updatePageContent(selectedPageId, { image: result });
      } else {
        const newPage: Page = {
          id: Date.now().toString(),
          type: 'image',
          content: {
            image: result,
            imageStyle: createDefaultImageStyle()
          }
        };
        setWork(prev => ({
          ...prev,
          pages: [...prev.pages, newPage],
          updatedAt: new Date()
        }));
        setSelectedPageId(newPage.id);
      }
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Save and Preview ---------- */

  const saveWork = async (): Promise<string | null> => {
    if (isSaving) return null;
    setIsSaving(true);

    try {
      const needsCreate = !isDbId(work.id);
      
      const payload: SaveWorkPayload = {
        ...(needsCreate ? {} : { id: work.id }),
        title: work.title,
        coverImage: work.coverImage,
        pages: work.pages.map((p): SavePageData => ({
          type: p.type,
          content: p.content,
        })),
      };

      const response = await fetch('/api/works', {
        method: needsCreate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Save failed (${response.status}) ${errText}`);
      }

      const savedWork: ApiWork = await response.json();

      // API 응답을 클라이언트 형식으로 정규화
      const normalized: Work = {
        id: savedWork.id,
        title: savedWork.title ?? '작품',
        coverImage: savedWork.coverImage ?? undefined,
        pages: (savedWork.pages ?? []).map((p): Page => ({
          id: p.id,
          type: toClientPageType(p.type),
          content: p.content ?? {
            textStyle: createDefaultTextStyle(),
            imageStyle: createDefaultImageStyle()
          }
        })),
        createdAt: new Date(savedWork.createdAt),
        updatedAt: new Date(savedWork.updatedAt),
      };

      setWork(normalized);
      alert('작품이 저장되었습니다.');
      return normalized.id;
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

    if (!isDbId(id)) {
      alert('저장 후 미리보기를 이용해 주세요.');
      return;
    }

    router.push(`/dashboard/works/${id}/preview`);
  };

  /* ---------- Text Style Helpers ---------- */

  const updateTextStyle = (pageId: string, updates: Partial<NonNullable<Page['content']['textStyle']>>) => {
    const page = work.pages.find(p => p.id === pageId);
    if (!page) return;

    const currentTextStyle = page.content.textStyle ?? createDefaultTextStyle();
    updatePageContent(pageId, {
      textStyle: { ...currentTextStyle, ...updates }
    });
  };

  const updateImageStyle = (pageId: string, updates: Partial<NonNullable<Page['content']['imageStyle']>>) => {
    const page = work.pages.find(p => p.id === pageId);
    if (!page) return;

    const currentImageStyle = page.content.imageStyle ?? createDefaultImageStyle();
    updatePageContent(pageId, {
      imageStyle: { ...currentImageStyle, ...updates }
    });
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Page Tools */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">페이지 추가</h3>
              <div className="space-y-3">
                <button
                  onClick={() => addPage('image')}
                  className="w-full flex items-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <ImageIcon className="mr-3 h-5 w-5" />
                  사진 페이지
                </button>
                <button
                  onClick={() => addPage('text')}
                  className="w-full flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Type className="mr-3 h-5 w-5" />
                  텍스트 페이지
                </button>
                <button
                  onClick={() => addPage('mixed')}
                  className="w-full flex items-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Plus className="mr-3 h-5 w-5" />
                  혼합 페이지
                </button>
              </div>
            </div>

            {/* Cover Image Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">표지 이미지</h3>

              {work.coverImage ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={work.coverImage}
                      alt="표지 이미지"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCoverSelector(true)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      변경
                    </button>
                    <button
                      onClick={removeCoverImage}
                      className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-colors"
                    >
                      제거
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                      <p className="text-sm">표지 없음</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCoverSelector(true)}
                    className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    표지 이미지 설정
                  </button>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">사진 업로드</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">클릭하여 사진 업로드</p>
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

            {/* Page Properties */}
            {selectedPage && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">페이지 설정</h3>

                {/* Text Style Controls */}
                {(selectedPage.type === 'text' || selectedPage.type === 'mixed') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        폰트 크기
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={selectedPage.content.textStyle?.fontSize || 16}
                        onChange={(e) =>
                          updateTextStyle(selectedPage.id, {
                            fontSize: parseInt(e.target.value, 10)
                          })
                        }
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">
                        {selectedPage.content.textStyle?.fontSize || 16}px
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        폰트 색상
                      </label>
                      <input
                        type="color"
                        value={selectedPage.content.textStyle?.color || '#000000'}
                        onChange={(e) =>
                          updateTextStyle(selectedPage.id, {
                            color: e.target.value
                          })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        정렬
                      </label>
                      <div className="flex space-x-2">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() =>
                              updateTextStyle(selectedPage.id, { align })
                            }
                            className={`p-2 rounded transition-colors ${
                              selectedPage.content.textStyle?.align === align
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {align === 'left' && <AlignLeft className="h-4 w-4" />}
                            {align === 'center' && <AlignCenter className="h-4 w-4" />}
                            {align === 'right' && <AlignRight className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          updateTextStyle(selectedPage.id, {
                            bold: !selectedPage.content.textStyle?.bold
                          })
                        }
                        className={`p-2 rounded transition-colors ${
                          selectedPage.content.textStyle?.bold
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          updateTextStyle(selectedPage.id, {
                            italic: !selectedPage.content.textStyle?.italic
                          })
                        }
                        className={`p-2 rounded transition-colors ${
                          selectedPage.content.textStyle?.italic
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Style Controls */}
                {(selectedPage.type === 'image' || selectedPage.type === 'mixed') &&
                  selectedPage.content.image && (
                    <div className="space-y-4 mt-6">
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">이미지 편집</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() =>
                              updateImageStyle(selectedPage.id, {
                                rotation: (selectedPage.content.imageStyle?.rotation || 0) + 90
                              })
                            }
                            className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            title="시계방향 회전"
                          >
                            <RotateCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              updateImageStyle(selectedPage.id, {
                                rotation: (selectedPage.content.imageStyle?.rotation || 0) - 90
                              })
                            }
                            className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            title="반시계방향 회전"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              updateImageStyle(selectedPage.id, {
                                flipH: !selectedPage.content.imageStyle?.flipH
                              })
                            }
                            className={`p-2 rounded transition-colors ${
                              selectedPage.content.imageStyle?.flipH
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            title="좌우 대칭"
                          >
                            <FlipHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              updateImageStyle(selectedPage.id, {
                                flipV: !selectedPage.content.imageStyle?.flipV
                              })
                            }
                            className={`p-2 rounded transition-colors ${
                              selectedPage.content.imageStyle?.flipV
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            title="상하 대칭"
                          >
                            <FlipVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Main Content - Pages */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">페이지 ({work.pages.length}개)</h2>
                <div className="text-sm text-gray-500">
                  드래그하거나 화살표 버튼으로 순서를 변경할 수 있습니다
                </div>
              </div>

              {work.pages.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    첫 번째 페이지를 추가해보세요
                  </h3>
                  <p className="text-gray-600 mb-8">
                    사진이나 텍스트로 나만의 작품을 만들어보세요
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => addPage('image')}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ImageIcon className="mr-2 h-5 w-5" />
                      사진 페이지 추가
                    </button>
                    <button
                      onClick={() => addPage('text')}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Type className="mr-2 h-5 w-5" />
                      텍스트 페이지 추가
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {work.pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedPageId === page.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${draggedPageId === page.id ? 'opacity-50' : ''}`}
                      draggable
                      onClick={() => setSelectedPageId(page.id)}
                      onDragStart={(e) => handleDragStart(e, page.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, page.id)}
                    >
                      {/* Drag Handle */}
                      <div className="absolute top-2 left-8 bg-black/50 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <GripVertical className="h-3 w-3" />
                      </div>

                      {/* Page Number */}
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                        {index + 1}
                      </div>

                      {/* Page Order Controls */}
                      <div className="absolute top-2 right-12 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            movePageUp(page.id);
                          }}
                          disabled={index === 0}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="위로 이동"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            movePageDown(page.id);
                          }}
                          disabled={index === work.pages.length - 1}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="아래로 이동"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
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
                      <div className="aspect-[3/4] bg-white">
                        <PagePreview page={page} />
                      </div>

                      {/* Page Info */}
                      <div className="p-3 bg-gray-50 border-top">
                        <p className="text-sm font-medium capitalize">{page.type} 페이지</p>
                        {page.content.text && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {page.content.text}
                          </p>
                        )}
                      </div>

                      {/* Drop Indicator */}
                      {draggedPageId && draggedPageId !== page.id && (
                        <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                            여기에 놓기
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Page Editor */}
              {selectedPage && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">페이지 편집</h3>

                  {(selectedPage.type === 'text' || selectedPage.type === 'mixed') && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        텍스트 내용
                      </label>
                      <textarea
                        value={selectedPage.content.text || ''}
                        onChange={(e) =>
                          updatePageContent(selectedPage.id, { text: e.target.value })
                        }
                        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="텍스트를 입력하세요..."
                        style={{
                          fontSize: selectedPage.content.textStyle?.fontSize || 16,
                          color: selectedPage.content.textStyle?.color || '#000000',
                          textAlign: selectedPage.content.textStyle?.align || 'left',
                          fontWeight: selectedPage.content.textStyle?.bold ? 'bold' : 'normal',
                          fontStyle: selectedPage.content.textStyle?.italic ? 'italic' : 'normal'
                        }}
                      />
                    </div>
                  )}

                  {(selectedPage.type === 'image' || selectedPage.type === 'mixed') &&
                    !selectedPage.content.image && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          이미지 추가
                        </label>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-white transition-colors"
                        >
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">클릭하여 이미지 업로드</p>
                          </div>
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cover Selector Modal */}
      {showCoverSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">표지 이미지 선택</h3>
                <button
                  onClick={() => setShowCoverSelector(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Upload New Cover */}
              <div className="mb-8">
                <h4 className="text-lg font-medium mb-4">새 이미지 업로드</h4>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">클릭하여 표지 이미지 업로드</p>
                  </div>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
              </div>

              {/* Select from Pages */}
              {work.pages.filter((p) => p.content.image).length > 0 ? (
                <div>
                  <h4 className="text-lg font-medium mb-4">페이지에서 선택</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {work.pages
                      .filter((p) => p.content.image)
                      .map((page) => (
                        <button
                          key={page.id}
                          onClick={() => setCoverFromPage(page)}
                          className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all group"
                        >
                          <img
                            src={page.content.image!}
                            alt={`페이지 ${work.pages.indexOf(page) + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="bg-white text-gray-900 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              페이지 {work.pages.indexOf(page) + 1}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>이미지가 있는 페이지가 없습니다.</p>
                  <p className="text-sm">먼저 사진 페이지를 추가해보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
              // 미리보기 가독성: 12px 이하로 clamp
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
      {!page.content.image && !page.content.text && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            {page.type === 'image' && <ImageIcon className="mx-auto h-8 w-8 mb-2" />}
            {page.type === 'text' && <Type className="mx-auto h-8 w-8 mb-2" />}
            {page.type === 'mixed' && <Plus className="mx-auto h-8 w-8 mb-2" />}
            <p className="text-xs">
              {page.type === 'image'
                ? '이미지 없음'
                : page.type === 'text'
                ? '텍스트 없음'
                : '내용 없음'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}