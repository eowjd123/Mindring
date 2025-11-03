// app/dashboard/works/[id]/preview/page.tsx

"use client"

import { Book, ChevronLeft, ChevronRight, Download, Edit, FileText, Share2, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

/* =========================
   Types
   ========================= */

interface ImageStyle {
  width: number;
  height: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
}

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

interface PageContent {
  text?: string;
  image?: string;
  elements?: TemplateElement[];
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
}

interface Page {
  id: string;
  type: 'text' | 'image' | 'mixed' | 'template';
  templateId?: string;
  content: PageContent;
  order: number;
}

interface Work {
  id: string;
  title: string;
  status: string;
  coverImage?: string;
  coverTemplateId?: string;
  pages: Page[];
  printSpec?: {
    specId: string;
    paperSize: string;
    coverType: string;
    innerPaper: string;
    orientation: string;
    additionalOptions?: Record<string, unknown> | null;
  };
  exports?: Array<{
    id: string;
    fileType: string;
    filePath: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/* =========================
   Main Component
   ========================= */

export default function WorkPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.id as string;

  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cover' | 'pages'>('cover');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageTransitionDirection, setPageTransitionDirection] = useState<'forward' | 'backward' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // API에서 작품 데이터 가져오기
  useEffect(() => {
    const fetchWork = async () => {
      if (!workId) return;

      try {
        setLoading(true);
        setError(null);
        
        console.log('작품 조회 시작:', workId);
        
        const response = await fetch(`/api/works/${workId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('응답 상태:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API 응답 오류:', errorData);
          throw new Error(errorData.message || '작품을 불러올 수 없습니다');
        }

        const workData = await response.json();
        console.log('작품 데이터 로드 완료:', workData);
        
        // 페이지 데이터 처리 및 JSON 파싱
        if (workData.pages) {
          workData.pages = workData.pages.map((page: { 
            id: string; 
            content: unknown; 
            order: number; 
            type: string;
          }) => {
            try {
              // contentJson이 문자열인 경우 파싱
              let content = page.content;
              if (typeof page.content === 'string') {
                content = JSON.parse(page.content);
              }
              
              console.log('페이지 내용:', page.id, content);
              
              return {
                ...page,
                content: content as PageContent
              };
            } catch (parseError) {
              console.error('페이지 내용 파싱 오류:', parseError, page);
              return {
                ...page,
                content: {} as PageContent
              };
            }
          });
          
          // 페이지 정렬 (order 필드 기준)
          workData.pages.sort((a: Page, b: Page) => a.order - b.order);
        }

        setWork(workData);
      } catch (err) {
        console.error('작품 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '작품을 불러오는 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [workId]);

  // 표지를 제외한 내지 페이지들만 추출
  const contentPages = useMemo(() => {
    if (!work?.pages || work.pages.length === 0) return [];
    
    // 첫 번째 페이지가 표지인지 확인
    const firstPage = work.pages[0];
    const isFirstPageCover = firstPage && (
      // 1. 명시적으로 cover 템플릿 ID가 있는 경우
      (firstPage.templateId?.startsWith('cover-')) ||
      // 2. work에 coverTemplateId가 설정된 경우
      (work.coverTemplateId) ||
      // 3. 첫 번째 페이지가 template 타입이고 elements가 있는 경우 (대부분의 표지)
      (firstPage.type === 'template' && firstPage.content?.elements && firstPage.content.elements.length > 0) ||
      // 4. mixed 타입이지만 elements가 있고 표지와 유사한 구조인 경우
      (firstPage.type === 'mixed' && firstPage.content?.elements && 
       firstPage.content.elements.length > 0 &&
       // 표지와 유사한 요소들이 있는지 확인 (title, subtitle, author 등)
       firstPage.content.elements.some(el => 
         el.id?.includes('title') || 
         el.id?.includes('subtitle') || 
         el.id?.includes('author') ||
         (el.type === 'text' && el.style?.textAlign === 'center')
       ))
    );
    
    // 표지인 경우 첫 번째 페이지를 제외하고 반환
    return isFirstPageCover ? work.pages.slice(1) : work.pages;
  }, [work]);

  // 인쇄 스펙에 맞는 페이지 비율 계산 (CSS aspectRatio는 가로/세로 비율)
  // A4 세로: 210×297mm (가로×세로) → aspectRatio = 210/297 ≈ 0.707
  // 신국판: 152×225mm (가로×세로) → aspectRatio = 152/225 ≈ 0.676
  const pageAspectRatio = useMemo(() => {
    if (!work?.printSpec?.paperSize) return 210 / 297; // 기본값: A4 세로
    const size = work.printSpec.paperSize.toUpperCase();
    if (size.includes('A4')) {
      // A4 세로: 210×297mm (가로×세로)
      return 210 / 297; // 약 0.707
    } else if (size.includes('SHIN') || size.includes('신국판')) {
      // 신국판: 152×225mm (가로×세로)
      return 152 / 225; // 약 0.676
    }
    return 210 / 297; // 기본값: A4
  }, [work?.printSpec?.paperSize]);

  // 표지에서 페이지로 전환 (표지 페이지 제외)
  const openBook = useCallback(() => {
    setViewMode('pages');
    setCurrentPageIndex(0);
  }, []);

  // 페이지 네비게이션 (표지 제외된 페이지 기준) - 책 넘기는 효과 포함
  const goToNextPage = useCallback(() => {
    if (contentPages && currentPageIndex < contentPages.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setPageTransitionDirection('forward');
      // 애니메이션 시작 후 페이지 인덱스 변경
      setTimeout(() => {
        setCurrentPageIndex(prev => prev + 1);
      }, 50);
      // 애니메이션 종료
      setTimeout(() => {
        setIsTransitioning(false);
        setPageTransitionDirection(null);
      }, 750); // 700ms 애니메이션 + 50ms 버퍼
    }
  }, [contentPages, currentPageIndex, isTransitioning]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setPageTransitionDirection('backward');
      // 애니메이션 시작 후 페이지 인덱스 변경
      setTimeout(() => {
        setCurrentPageIndex(prev => prev - 1);
      }, 50);
      // 애니메이션 종료
      setTimeout(() => {
        setIsTransitioning(false);
        setPageTransitionDirection(null);
      }, 750); // 700ms 애니메이션 + 50ms 버퍼
    }
  }, [currentPageIndex, isTransitioning]);

  const goToPage = useCallback((index: number) => {
    if (contentPages && index >= 0 && index < contentPages.length) {
      setCurrentPageIndex(index);
    }
  }, [contentPages]);

  // 표지로 돌아가기
  const goToCover = useCallback(() => {
    setViewMode('cover');
    setCurrentPageIndex(0);
  }, []);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!contentPages?.length) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (viewMode === 'pages') {
            goToPreviousPage();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (viewMode === 'pages') {
            goToNextPage();
          } else if (viewMode === 'cover') {
            openBook();
          }
          break;
        case "Escape":
          e.preventDefault();
          if (isFullscreen) {
            setIsFullscreen(false);
          } else if (viewMode === 'pages') {
            goToCover();
          }
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case "Home":
          e.preventDefault();
          if (viewMode === 'pages') {
            goToPage(0);
          }
          break;
        case "End":
          e.preventDefault();
          if (viewMode === 'pages' && contentPages) {
            goToPage(contentPages.length - 1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [contentPages, currentPageIndex, viewMode, isFullscreen, goToNextPage, goToPreviousPage, goToPage, openBook, goToCover]);

  // 액션 함수들
  const handleEdit = useCallback(() => {
    // 현재 보고 있는 페이지 정보를 URL 파라미터로 전달
    const editUrl = `/dashboard/create-work/${workId}`;
    const params = new URLSearchParams();
    
    // 페이지 모드에서 편집을 누른 경우 현재 페이지 인덱스 전달
    if (viewMode === 'pages' && work && contentPages.length > 0) {
      // 표지가 있는 경우 실제 페이지 인덱스는 +1
      const actualPageIndex = work.pages.length > contentPages.length ? currentPageIndex + 1 : currentPageIndex;
      params.set('selectedPageIndex', actualPageIndex.toString());
      
      // 현재 페이지 ID도 전달 (더 정확한 매칭을 위해)
      const currentPageId = contentPages[currentPageIndex]?.id;
      if (currentPageId) {
        params.set('selectedPageId', currentPageId);
      }
    }
    
    // 표지 모드에서 편집을 누른 경우 첫 번째 페이지 선택
    if (viewMode === 'cover' && work && work.pages.length > 0) {
      params.set('selectedPageIndex', '0');
      params.set('selectedPageId', work.pages[0].id);
    }
    
    // 편집 페이지에서 돌아왔다는 정보 추가
    params.set('from', 'preview');
    
    const finalUrl = params.toString() ? `${editUrl}?${params.toString()}` : editUrl;
    router.push(finalUrl);
  }, [router, workId, viewMode, currentPageIndex, work, contentPages]);

  const downloadPDF = useCallback(async () => {
    if (!work) return;

    try {
      // PDF 내보내기 API 호출
      const response = await fetch(`/api/works/${workId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'pdf' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${work.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('PDF 다운로드에 실패했습니다');
      }
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  }, [work, workId]);

  const shareWork = useCallback(async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('링크 복사 오류:', err);
      alert('링크 복사 중 오류가 발생했습니다.');
    }
  }, []);

  // Enhanced Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="relative mb-8">
            {/* Enhanced Loading Animation */}
            <div className="w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-2 w-16 h-16 border-2 border-transparent border-b-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '2s' }}></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              작품을 불러오는 중...
            </h3>
            <p className="text-gray-400 text-lg">잠시만 기다려주세요</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Error State
  if (error || !work) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-lg mx-4">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="text-red-400 text-4xl">⚠️</div>
            </div>
            <div className="absolute inset-0 w-24 h-24 border-2 border-red-500/30 rounded-full animate-ping mx-auto"></div>
            <div className="absolute inset-2 w-20 h-20 border border-red-500/20 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                작품을 불러올 수 없습니다
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">{error}</p>
            </div>
            <div className="space-y-4">
          <button
            onClick={() => router.back()}
                className="group w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <span className="font-medium text-lg flex items-center justify-center space-x-2">
                  <span>돌아가기</span>
                  <div className="w-2 h-2 bg-white rounded-full group-hover:animate-pulse"></div>
                </span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="group w-full px-8 py-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105 border border-gray-600/50"
              >
                <span className="font-medium text-lg flex items-center justify-center space-x-2">
                  <span>다시 시도</span>
                  <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:animate-pulse"></div>
                </span>
          </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = contentPages[currentPageIndex];
  const nextPage = contentPages[currentPageIndex + 1];

  console.log('현재 페이지 정보:', { currentPage, nextPage, currentPageIndex, contentPagesLength: contentPages.length, pageAspectRatio });

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Header - Simplified */}
      {!isFullscreen && (
        <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left - Title */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Book className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{work.title}</h2>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'cover' ? '표지 보기' : `${contentPages.length}페이지 • ${currentPageIndex + 1}/${contentPages.length}페이지`}
                  </p>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="돌아가기"
                  aria-label="이전 페이지로 돌아가기"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  title="작품 편집하기"
                  aria-label="작품 편집하기"
                >
                  <Edit className="h-4 w-4" />
                  <span>편집</span>
                </button>
                <button
                  onClick={shareWork}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  title="작품 공유하기"
                  aria-label="작품 공유하기"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">공유</span>
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  title="PDF 파일 다운로드"
                  aria-label="PDF 파일 다운로드"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                  title="전체화면으로 보기 (F 키)"
                  aria-label="전체화면으로 보기"
                >
                  <span className="hidden sm:inline">전체화면</span>
                  <span className="sm:hidden">전체</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50">
        {viewMode === 'cover' ? (
          /* Cover View - Simplified */
          <div className={`relative w-full ${isFullscreen ? 'max-w-4xl' : 'max-w-md sm:max-w-lg'}`}>
            {/* Simplified Card */}
            <div className={`relative bg-white rounded-2xl shadow-xl border-2 border-gray-300 overflow-hidden ${isFullscreen ? 'p-8' : 'p-6'}`}>
              {/* Simple Header */}
              <div className={`relative z-10 flex items-center justify-between mb-6`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Book className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">작품 미리보기</h3>
                    <p className="text-sm text-gray-600">{contentPages.length}페이지</p>
                  </div>
                </div>
                
                <button
                  onClick={openBook}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                  title="책 열기"
                >
                  책 열기
                </button>
              </div>

              {/* Simplified Book Cover */}
              <div 
                className="relative bg-white rounded-xl shadow-lg overflow-hidden aspect-[3/4] max-h-[70vh] cursor-pointer hover:shadow-xl transition-all duration-200 border-2 border-gray-300"
                onClick={openBook}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBook();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="책을 열어서 내용을 보기"
              >
                <CoverViewer work={work} />
              </div>

              {/* Simple Instructions */}
              <div className="mt-6 text-center">
                <p className="text-base text-gray-700 font-medium">
                  표지를 클릭하여 책을 열어보세요
                </p>
              </div>
            </div>

            {/* Fullscreen Exit Button */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 sm:p-3 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-all duration-200 hover:scale-110"
                title="전체화면 종료 (ESC 키)"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}
          </div>
        ) : (
          /* Pages View - Simplified */
          <div className="relative w-full max-w-7xl">
            {contentPages.length > 0 ? (
              <>
                {/* Book Viewer Container */}
                <div className="relative w-full" style={{ perspective: '2000px' }}>
                  <div 
                    className={`relative bg-white rounded-2xl shadow-xl overflow-hidden mx-auto border-2 border-gray-300 transition-all duration-700 ease-in-out ${
                      isTransitioning && pageTransitionDirection === 'forward' ? 'transform-gpu' : ''
                    }`}
                    style={{ 
                      aspectRatio: pageAspectRatio, // 가로/세로 비율 (A4: 210/297 ≈ 0.707, 신국판: 152/225 ≈ 0.676)
                      maxHeight: isFullscreen ? '85vh' : '75vh', 
                      maxWidth: isFullscreen ? '90vw' : '80vw',
                      width: '100%',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <BookPagesViewer 
                      currentPage={currentPage} 
                      nextPage={nextPage}
                      nextNextPage={contentPages[currentPageIndex + 2]}
                      isLastPage={currentPageIndex >= contentPages.length - 1}
                      isTransitioning={isTransitioning}
                      transitionDirection={pageTransitionDirection}
                    />
                  </div>

                  {/* Left Navigation Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border-2 border-gray-200"
                    title="이전 페이지 (← 키)"
                    aria-label={`이전 페이지로 이동 (현재 ${currentPageIndex + 1}페이지)`}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  {/* Right Navigation Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPageIndex === contentPages.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border-2 border-gray-200"
                    title="다음 페이지 (→ 키)"
                    aria-label={`다음 페이지로 이동 (현재 ${currentPageIndex + 1}페이지)`}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </>
            ) : (
              /* No Pages - Life Graph Style */
              <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="py-16">
                  <div className="relative mb-8">
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-14 w-14 text-gray-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    내지 페이지가 없습니다
                  </h3>
                  <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                    이 작품에는 표지만 있고 내용 페이지가 없습니다.<br />
                    편집하기 버튼을 눌러 페이지를 추가해보세요.
                  </p>
                <button
                  onClick={handleEdit}
                    className="group bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white px-10 py-4 rounded-2xl hover:scale-105 shadow-lg font-medium flex items-center mx-auto transition-all duration-200 hover:shadow-teal-500/25"
                    title="작품 편집하기"
                    aria-label="작품 편집하기"
                >
                    <Edit className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                    📝 편집하기
                </button>
                </div>
              </div>
            )}

            {/* Fullscreen Controls - Enhanced UI/UX */}
            {isFullscreen && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Top Controls Bar */}
                <div className="absolute top-0 left-0 right-0 pointer-events-auto">
                  <div className="bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-md">
                    <div className="flex items-center justify-between px-6 py-4">
                      {/* Left Side - Back to Cover */}
            <button
              onClick={goToCover}
                        className="group flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/20"
              title="표지로 돌아가기 (ESC 키)"
            >
                        <Book className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                        <span className="text-sm font-medium hidden sm:inline">표지로</span>
            </button>

                      {/* Center - Work Title */}
                      <div className="flex-1 text-center px-4">
                        <h2 className="text-white text-lg font-bold truncate max-w-md mx-auto">
                          {work.title}
                        </h2>
                        <p className="text-white/80 text-sm">
                          {(viewMode as 'cover' | 'pages') === 'cover' ? '표지 보기' : `페이지 ${currentPageIndex + 1} / ${contentPages.length}`}
                        </p>
                      </div>

                      {/* Right Side - Exit Fullscreen */}
              <button
                onClick={() => setIsFullscreen(false)}
                        className="group flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/20"
                title="전체화면 종료 (ESC 키)"
              >
                        <span className="text-sm font-medium hidden sm:inline">종료</span>
                        <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Controls Bar */}
                {viewMode === 'pages' && contentPages.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
                    <div className="bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-md">
                      <div className="flex items-center justify-center px-6 py-4">
                        {/* Page Navigation */}
                        <div className="flex items-center gap-6">
                          {/* Previous Page */}
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPageIndex === 0}
                            className="group flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100 border border-white/20"
                            title="이전 페이지 (← 키)"
                          >
                            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
                            <span className="text-sm font-medium hidden sm:inline">이전</span>
                          </button>

                          {/* Page Info */}
                          <div className="flex items-center gap-4 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                              <span className="text-white text-lg font-bold">
                                {currentPageIndex + 1}
                              </span>
                              <span className="text-white/60 text-lg">/</span>
                              <span className="text-white/80 text-lg">
                                {contentPages.length}
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-32 sm:w-48 bg-white/20 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-teal-400 to-blue-400 h-2 rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${((currentPageIndex + 1) / contentPages.length) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Next Page */}
                          <button
                            onClick={goToNextPage}
                            disabled={currentPageIndex === contentPages.length - 1}
                            className="group flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100 border border-white/20"
                            title="다음 페이지 (→ 키)"
                          >
                            <span className="text-sm font-medium hidden sm:inline">다음</span>
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                          </button>
                        </div>
                      </div>
                    </div>
          </div>
        )}

                {/* Side Navigation (for pages view) */}
                {viewMode === 'pages' && contentPages.length > 0 && (
                  <>
                    {/* Left Navigation */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pointer-events-auto">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPageIndex === 0}
                        className="group p-4 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed -ml-8 transition-all duration-300 hover:scale-110 disabled:hover:scale-100 border border-white/20"
                        title="이전 페이지 (← 키)"
                      >
                        <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform duration-200" />
                      </button>
      </div>

                    {/* Right Navigation */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-auto">
                <button
                        onClick={goToNextPage}
                        disabled={currentPageIndex === contentPages.length - 1}
                        className="group p-4 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed -mr-8 transition-all duration-300 hover:scale-110 disabled:hover:scale-100 border border-white/20"
                        title="다음 페이지 (→ 키)"
                      >
                        <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                  </div>
                  </>
                )}
              </div>
            )}

            {/* Non-fullscreen Back to Cover Button */}
            {!isFullscreen && (
              <button
                onClick={goToCover}
                className="group absolute top-4 sm:top-6 left-4 sm:left-6 p-2 sm:p-3 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200"
                title="표지로 돌아가기 (ESC 키)"
              >
                <Book className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-200" />
                </button>
            )}
          </div>
        )}
            </div>

      {/* Bottom Navigation Bar - Simplified */}
      {!isFullscreen && viewMode === 'pages' && contentPages.length > 0 && (
        <div className="bg-white border-t-2 border-gray-300 shadow-sm">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-4">
            <div className="flex items-center justify-center gap-6">
              {/* Previous Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title="이전 페이지 (← 키)"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>이전</span>
              </button>

              {/* Page Info */}
              <div className="flex items-center gap-4 px-6 py-2 bg-gray-50 rounded-lg border-2 border-gray-200">
                <span className="text-lg font-bold text-gray-900">
                  {currentPageIndex + 1} / {contentPages.length}
                </span>
                <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentPageIndex + 1) / contentPages.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(((currentPageIndex + 1) / contentPages.length) * 100)}%
                </span>
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPageIndex === contentPages.length - 1}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title="다음 페이지 (→ 키)"
              >
                <span>다음</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Life Graph Style Keyboard Shortcuts Help */}
      {isFullscreen && (
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-white/95 backdrop-blur-md text-gray-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl text-sm border border-gray-200/50 shadow-2xl max-w-sm">
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
            <div className="font-bold text-teal-600 text-sm sm:text-base">⌨️ 키보드 단축키</div>
          </div>
          <div className="space-y-2 sm:space-y-3">
          {viewMode === 'cover' ? (
              <div className="flex items-center space-x-3">
                <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">→</kbd>
                <span className="text-sm">책 열기</span>
              </div>
          ) : (
            <>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">←</kbd>
                    <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">→</kbd>
                  </div>
                  <span className="text-sm">페이지 이동</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">Home</kbd>
                    <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">End</kbd>
                  </div>
                  <span className="text-sm">처음/마지막 페이지</span>
                </div>
                <div className="flex items-center space-x-3">
                  <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">ESC</kbd>
                  <span className="text-sm">표지로 돌아가기</span>
                </div>
            </>
          )}
            <div className="flex items-center space-x-3">
              <kbd className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded text-xs font-mono">F</kbd>
              <span className="text-sm">전체화면 토글</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Cover Viewer Component - 수정된 버전
   ========================= */

function CoverViewer({ work }: { work: Work }) {
  console.log('CoverViewer 렌더링:', work);
  console.log('페이지 배열:', work.pages);
  
  // 첫 번째 페이지가 표지인지 확인
  const coverPage = work.pages && work.pages.length > 0 ? work.pages[0] : null;
  console.log('첫 번째 페이지:', coverPage);
  
  // 표지 페이지 감지 로직 개선
  const isCoverPage = coverPage && (
    // 1. 명시적으로 cover 템플릿 ID가 있는 경우
    (coverPage.templateId?.startsWith('cover-')) ||
    // 2. work에 coverTemplateId가 설정된 경우
    (work.coverTemplateId) ||
    // 3. 첫 번째 페이지가 template 타입이고 elements가 있는 경우 (대부분의 표지)
    (coverPage.type === 'template' && coverPage.content?.elements && coverPage.content.elements.length > 0) ||
    // 4. mixed 타입이지만 elements가 있고 표지와 유사한 구조인 경우
    (coverPage.type === 'mixed' && coverPage.content?.elements && 
     coverPage.content.elements.length > 0 &&
     // 표지와 유사한 요소들이 있는지 확인 (title, subtitle, author 등)
     coverPage.content.elements.some(el => 
       el.id?.includes('title') || 
       el.id?.includes('subtitle') || 
       el.id?.includes('author') ||
       (el.type === 'text' && el.style?.textAlign === 'center')
     ))
  );
  
  console.log('표지 페이지 여부:', isCoverPage);
  console.log('표지 요소들:', coverPage?.content?.elements);
  
  // 표지 템플릿이나 표지 구조를 가진 페이지인 경우
  if (isCoverPage && coverPage && coverPage.content.elements && coverPage.content.elements.length > 0) {
    return (
      <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
        <div className="w-full h-full relative bg-white rounded-lg overflow-hidden shadow-lg">
          <div className="absolute inset-0 p-4">
            {coverPage.content.elements.map((element, index) => {
              console.log('렌더링할 요소:', element);
              return (
                <div
                  key={element.id || index}
                  className="absolute"
                  style={{
                    left: `${(element.position.x / 300) * 100}%`,
                    top: `${(element.position.y / 400) * 100}%`,
                    width: `${(element.position.width / 300) * 100}%`,
                    height: `${(element.position.height / 400) * 100}%`,
                    fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 24)}px` : '16px'
                  }}
                >
                  {element.type === 'text' && (
                    <div 
                      className="w-full h-full flex items-center justify-center text-gray-800 leading-tight overflow-hidden p-2"
                      style={{
                        color: element.style.color || '#333333',
                        textAlign: element.style.textAlign || 'center',
                        fontWeight: element.style.fontWeight || 'normal',
                        fontStyle: element.style.fontStyle || 'normal',
                      }}
                    >
                      <span className="block text-center">
                        {element.content || element.placeholder || '텍스트'}
                      </span>
                    </div>
                  )}
                  {element.type === 'placeholder' && (
                    <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded">
                      <div className="text-center text-gray-400">
                        <div className="text-3xl mb-2">🖼️</div>
                        <p className="text-sm">이미지 영역</p>
                      </div>
                    </div>
                  )}
                  {element.type === 'image' && element.content && (
                    <div className="relative w-full h-full rounded overflow-hidden">
                      <Image
                        src={element.content}
                        alt="Cover element"
                        fill
                        className="object-cover rounded"
                        sizes="100%"
                        onError={() => {
                          console.error('표지 이미지 로드 실패:', element.content);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  
  // coverImage가 있는 경우
  if (work.coverImage) {
    return (
      <div className="w-full h-full relative">
        <Image
          src={work.coverImage}
          alt="Cover"
          fill
          className="object-cover"
          sizes="100%"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-6">
          <h1 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
            {work.title}
          </h1>
          <p className="text-white/90 text-sm drop-shadow">
            {work.pages.length}페이지
          </p>
        </div>
      </div>
    );
  }
  
  // 기본 표지 (표지 페이지가 없는 경우)
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {work.title}
        </h1>
        <div className="w-24 h-24 mx-auto mb-4 bg-blue-200 rounded-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-blue-600" />
        </div>
        <p className="text-gray-600 mb-4">
          {work.pages.length}페이지의 이야기
        </p>
        {work.printSpec && (
          <div className="mt-4 text-sm text-gray-500">
            <p>{work.printSpec.paperSize} • {work.printSpec.coverType.replace('_', ' ')}</p>
          </div>
        )}
        
        {/* 첫 번째 페이지가 있지만 표지로 인식되지 않은 경우 정보 표시 */}
        {coverPage && (
          <div className="mt-6 p-4 bg-white/80 rounded-lg text-left max-w-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">첫 번째 페이지 정보</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>타입: {coverPage.type}</p>
              <p>템플릿 ID: {coverPage.templateId || 'none'}</p>
              <p>요소 수: {coverPage.content?.elements?.length || 0}</p>
              {coverPage.content?.elements && coverPage.content.elements.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">요소들:</p>
                  {coverPage.content.elements.slice(0, 3).map((el, i) => (
                    <p key={i} className="ml-2">• {el.type}: {el.id}</p>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => console.log('Cover page data:', coverPage)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              콘솔에서 상세 데이터 확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Book Pages Viewer Component
   ========================= */

function BookPagesViewer({ 
  currentPage, 
  nextPage,
  nextNextPage,
  isLastPage,
  isTransitioning,
  transitionDirection
}: { 
  currentPage: Page; 
  nextPage?: Page;
  nextNextPage?: Page;
  isLastPage: boolean;
  isTransitioning?: boolean;
  transitionDirection?: 'forward' | 'backward' | null;
}) {
  console.log('BookPagesViewer 렌더링:', { currentPage, nextPage, nextNextPage, isLastPage, isTransitioning, transitionDirection });
  
  // dFlip 스타일의 책 넘김 효과를 위한 상태
  // CSS transition을 사용하여 더 부드러운 애니메이션
  const rightPageRotate = isTransitioning && transitionDirection === 'forward' ? -180 : 0;
  const leftPageTranslate = isTransitioning && transitionDirection === 'forward' ? -100 : 0;
  
  return (
    <div className="w-full h-full flex bg-white relative overflow-hidden" style={{ 
      transformStyle: 'preserve-3d',
      perspective: '2000px'
    }}>
      {/* Left Page */}
      <div 
        className="flex-1 border-r border-gray-200 relative transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(${leftPageTranslate}%)`,
          transformStyle: 'preserve-3d',
          zIndex: isTransitioning && transitionDirection === 'forward' ? 1 : 2
        }}
      >
        <PageViewer page={currentPage} />
      </div>

      {/* Right Page - dFlip 스타일 3D 회전 */}
      <div 
        className="flex-1 relative transition-transform duration-700 ease-in-out"
        style={{
          transform: `rotateY(${rightPageRotate}deg)`,
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
          zIndex: isTransitioning && transitionDirection === 'forward' ? 3 : 1
        }}
      >
        {nextPage ? (
          <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* Front of page */}
            <div 
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)'
              }}
            >
              <PageViewer page={nextPage} />
            </div>
            {/* Back of page (flipped) */}
            <div 
              className="absolute inset-0 bg-white"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              {/* 뒤 페이지 내용 (다음 페이지) */}
              {nextNextPage ? (
                <PageViewer page={nextNextPage} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <p className="text-gray-400">끝</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">📖</div>
              </div>
              <p className="text-lg font-semibold mb-2">끝</p>
              {isLastPage && (
                <p className="text-sm text-gray-400">마지막 페이지입니다</p>
              )}
            </div>
          </div>
        )}
        
        {/* Page Fold Shadow - dFlip 스타일 */}
        {isTransitioning && transitionDirection === 'forward' && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 52%, transparent 100%)',
              opacity: Math.abs(rightPageRotate) > 0 ? 0.8 : 0
            }}
          />
        )}
      </div>
      
      {/* Global CSS for backface visibility */}
      <style jsx global>{`
        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}

/* =========================
   Page Viewer Component - 개선된 버전
   ========================= */

function PageViewer({ page }: { page: Page }) {
  const imageStyle = page.content.imageStyle;
  const textStyle = page.content.textStyle;

  console.log('PageViewer 렌더링:', page.id, page.type, page.content);
  console.log('페이지 요소들:', page.content.elements);

  return (
    <div className="w-full h-full flex flex-col relative bg-white text-black overflow-hidden">
      {/* Template-based pages (template 또는 mixed 타입 모두 지원) */}
      {(page.type === 'template' || page.type === 'mixed') && page.content.elements && page.content.elements.length > 0 ? (
        <div className="w-full h-full relative">
          {page.content.elements.map((element, index) => (
            <div
              key={element.id || `element-${index}`}
              className="absolute"
              style={{
                left: `${(element.position.x / 300) * 100}%`,
                top: `${(element.position.y / 400) * 100}%`,
                width: `${(element.position.width / 300) * 100}%`,
                height: `${(element.position.height / 400) * 100}%`,
                fontSize: element.style.fontSize ? `${Math.min(element.style.fontSize, 14)}px` : '12px'
              }}
            >
              {element.type === 'text' && (
                <div 
                  className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden p-1"
                  style={{
                    color: element.style.color || '#333333',
                    textAlign: element.style.textAlign || 'left',
                    fontWeight: element.style.fontWeight || 'normal',
                    fontStyle: element.style.fontStyle || 'normal'
                  }}
                >
                  <span className="line-clamp-6">
                    {element.content || element.placeholder || '텍스트 내용'}
                  </span>
                </div>
              )}
              {element.type === 'placeholder' && (
                <div className="w-full h-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <FileText className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">이미지 영역</span>
                  </div>
                </div>
              )}
              {element.type === 'image' && element.content && (
                <div className="relative w-full h-full rounded overflow-hidden">
                  <Image
                    src={element.content}
                    alt="Page element"
                    fill
                    className="object-cover rounded"
                    sizes="100%"
                    onError={() => {
                      console.error('이미지 로드 실패:', element.content);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Legacy 페이지 타입들 */}
          {page.content.image && (
            <div
              className={`${
                page.type === "mixed" ? "flex-1" : "w-full h-full"
              } flex items-center justify-center p-4`}
            >
              <div className="relative w-full h-full max-w-full max-h-full">
                <Image
                  src={page.content.image}
                  alt="Page content"
                  fill
                  className="object-contain"
                  sizes="100%"
                  style={{
                    transform: `
                      rotate(${imageStyle?.rotation || 0}deg)
                      scaleX(${imageStyle?.flipH ? -1 : 1})
                      scaleY(${imageStyle?.flipV ? -1 : 1})
                    `,
                  }}
                  onError={() => {
                    console.error('페이지 이미지 로드 실패:', page.content.image);
                  }}
                />
              </div>
            </div>
          )}

          {page.content.text && (
            <div
              className={`${
                page.type === "mixed" ? "flex-1" : "w-full h-full"
              } p-8 flex items-center overflow-y-auto`}
            >
              <div
                className="w-full leading-relaxed"
                style={{
                  fontSize: textStyle?.fontSize || 16,
                  color: textStyle?.color || "#000000",
                  textAlign: textStyle?.align || "left",
                  fontWeight: textStyle?.bold ? "bold" : "normal",
                  fontStyle: textStyle?.italic ? "italic" : "normal",
                  fontFamily: textStyle?.fontFamily || "inherit",
                }}
              >
                {page.content.text.split("\n").map((line, index) => (
                  <p key={index} className="mb-2">
                    {line || "\u00A0"}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Empty State with Debug Info */}
          {!page.content.image && !page.content.text && (!page.content.elements || page.content.elements.length === 0) && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center text-gray-500 p-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">빈 페이지</h3>
                <p className="text-sm mb-4">이 페이지에는 내용이 없습니다</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>페이지 ID: {page.id}</p>
                  <p>페이지 타입: {page.type}</p>
                  <p>요소 수: {page.content.elements?.length || 0}</p>
                  <p>텍스트: {page.content.text ? '있음' : '없음'}</p>
                  <p>이미지: {page.content.image ? '있음' : '없음'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
