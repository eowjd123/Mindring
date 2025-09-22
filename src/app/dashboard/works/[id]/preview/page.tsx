// app/dashboard/works/[id]/preview/page.tsx

"use client"

import { Book, ChevronLeft, ChevronRight, Download, Edit, FileText, Loader2, Share2, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

  // 표지에서 페이지로 전환 (표지 페이지 제외)
  const openBook = useCallback(() => {
    setViewMode('pages');
    setCurrentPageIndex(0);
  }, []);

  // 페이지 네비게이션 (표지 제외된 페이지 기준)
  const goToNextPage = useCallback(() => {
    if (contentPages && currentPageIndex < contentPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }, [contentPages, currentPageIndex]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [currentPageIndex]);

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
    } catch (error) {
      alert('링크 복사 중 오류가 발생했습니다.');
    }
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>작품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !work) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">작품을 불러올 수 없습니다</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentPage = contentPages[currentPageIndex];
  const nextPage = contentPages[currentPageIndex + 1];

  return (
    <div className={`min-h-screen bg-gray-900 text-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="돌아가기"
                >
                  <X className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">{work.title}</h1>
                  <p className="text-sm text-gray-400">
                    {viewMode === 'cover' ? '표지' : `${contentPages.length}페이지 • ${currentPageIndex + 1}페이지 보는 중`}
                    {work.status && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        work.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {work.status === 'completed' ? '완성' : '작업중'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </button>
                
                <button
                  onClick={shareWork}
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </button>
                
                <button
                  onClick={downloadPDF}
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </button>
                
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  전체화면
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {viewMode === 'cover' ? (
          /* Cover View */
          <div className="relative max-w-md w-full">
            <div 
              className="bg-white rounded-lg shadow-2xl overflow-hidden aspect-[3/4] max-h-[80vh] cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={openBook}
            >
              <CoverViewer work={work} />
            </div>
            
            {/* Cover Instructions */}
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-gray-400 text-sm mb-2">표지를 클릭하여 책을 열어보세요</p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <span>→ 키</span>
                <span>또는</span>
                <span>클릭</span>
              </div>
            </div>

            {/* Fullscreen Exit Button */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                title="전체화면 종료 (ESC 키)"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        ) : (
          /* Pages View */
          <div className="relative max-w-6xl w-full">
            {contentPages.length > 0 ? (
              <>
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: '16/10', maxHeight: '80vh' }}>
                  <BookPagesViewer 
                    currentPage={currentPage} 
                    nextPage={nextPage}
                    isLastPage={currentPageIndex >= contentPages.length - 1}
                  />
                </div>

                {/* Navigation Controls */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPageIndex === 0}
                    className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed -ml-6 transition-all"
                    title="이전 페이지 (← 키)"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    onClick={goToNextPage}
                    disabled={currentPageIndex === contentPages.length - 1}
                    className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed -mr-6 transition-all"
                    title="다음 페이지 (→ 키)"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </>
            ) : (
              /* No Pages */
              <div className="bg-white rounded-lg shadow-2xl p-12 text-center text-gray-500" style={{ aspectRatio: '16/10', maxHeight: '80vh' }}>
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">내지 페이지가 없습니다</h3>
                <p className="mb-6">이 작품에는 표지만 있고 내용 페이지가 없습니다.</p>
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  편집하기
                </button>
              </div>
            )}

            {/* Back to Cover Button */}
            <button
              onClick={goToCover}
              className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
              title="표지로 돌아가기 (ESC 키)"
            >
              <Book className="h-5 w-5" />
            </button>

            {/* Fullscreen Exit Button */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                title="전체화면 종료 (ESC 키)"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls - Pages Mode Only */}
      {!isFullscreen && viewMode === 'pages' && contentPages.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Page Thumbnails */}
            <div className="flex items-center justify-center space-x-2 mb-4 overflow-x-auto pb-2">
              {contentPages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => goToPage(index)}
                  className={`relative flex-shrink-0 w-12 h-16 rounded border-2 overflow-hidden transition-all ${
                    index === currentPageIndex
                      ? "border-blue-500 scale-110"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  title={`페이지 ${index + 1}로 이동`}
                >
                  <PageThumbnail page={page} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-1">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {currentPageIndex + 1} / {contentPages.length}
              </span>
              <div className="flex-1 max-w-md">
                <div className="bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentPageIndex + 1) / contentPages.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <div className="font-semibold mb-2">키보드 단축키</div>
          {viewMode === 'cover' ? (
            <div>→ : 책 열기</div>
          ) : (
            <>
              <div>← → : 페이지 이동</div>
              <div>Home/End : 처음/마지막 페이지</div>
              <div>ESC : 표지로 돌아가기</div>
            </>
          )}
          <div>F : 전체화면 토글</div>
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
                    <img
                      src={element.content}
                      alt="Cover element"
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.error('표지 이미지 로드 실패:', element.content);
                        // 이미지 로드 실패 시 placeholder로 대체
                        e.currentTarget.style.display = 'none';
                      }}
                    />
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
        <img
          src={work.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
          loading="lazy"
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
  isLastPage 
}: { 
  currentPage: Page; 
  nextPage?: Page; 
  isLastPage: boolean;
}) {
  return (
    <div className="w-full h-full flex bg-white">
      {/* Left Page */}
      <div className="flex-1 border-r border-gray-200">
        <PageViewer page={currentPage} />
      </div>

      {/* Right Page */}
      <div className="flex-1">
        {nextPage ? (
          <PageViewer page={nextPage} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">📖</div>
              <p className="text-lg">끝</p>
              {isLastPage && (
                <p className="text-sm mt-2">마지막 페이지입니다</p>
              )}
            </div>
          </div>
        )}
      </div>
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

  return (
    <div className="w-full h-full flex flex-col relative bg-white text-black overflow-hidden">
      {/* Template-based pages (template 또는 mixed 타입 모두 지원) */}
      {(page.type === 'template' || page.type === 'mixed') && page.content.elements ? (
        <div className="w-full h-full relative">
          {page.content.elements.map((element) => (
            <div
              key={element.id}
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
                  <div className="text-center text-gray-400">
                    <FileText className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">이미지 없음</span>
                  </div>
                </div>
              )}
              {element.type === 'image' && element.content && (
                <img
                  src={element.content}
                  alt="Page element"
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    console.error('이미지 로드 실패:', element.content);
                    e.currentTarget.style.display = 'none';
                  }}
                />
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
              <img
                src={page.content.image}
                alt="Page content"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `
                    rotate(${imageStyle?.rotation || 0}deg)
                    scaleX(${imageStyle?.flipH ? -1 : 1})
                    scaleY(${imageStyle?.flipV ? -1 : 1})
                  `,
                }}
                loading="lazy"
                onError={(e) => {
                  console.error('페이지 이미지 로드 실패:', page.content.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
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

          {/* Empty State */}
          {!page.content.image && !page.content.text && !page.content.elements && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-lg">빈 페이지</p>
                <p className="text-sm">내용이 없습니다</p>
                <p className="text-xs mt-2">페이지 타입: {page.type}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* =========================
   Page Thumbnail Component
   ========================= */

function PageThumbnail({ page }: { page: Page }) {
  return (
    <div className="w-full h-full bg-white overflow-hidden">
      {page.content.image ? (
        <img
          src={page.content.image}
          alt="Thumbnail"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : page.content.text ? (
        <div className="w-full h-full p-1 text-[6px] text-black overflow-hidden leading-tight">
          {page.content.text.substring(0, 50)}
          {page.content.text.length > 50 ? "..." : ""}
        </div>
      ) : page.content.elements && page.content.elements.length > 0 ? (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
          <FileText className="w-3 h-3 text-gray-400" />
        </div>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-[8px] text-gray-400">빈 페이지</div>
        </div>
      )}
    </div>
  );
}