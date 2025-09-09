"use client";

import { ChevronLeft, ChevronRight, Download, Edit, Share2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/* =========================
   Constants
   ========================= */

const API_PAGE_TYPES = ['TEXT', 'IMAGE', 'MIXED'] as const;
const CLIENT_PAGE_TYPES = ['text', 'image', 'mixed'] as const;

/* =========================
   Types
   ========================= */

type ApiPageType = typeof API_PAGE_TYPES[number];
type ClientPageType = typeof CLIENT_PAGE_TYPES[number];

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

interface PageContent {
  text?: string;
  image?: string;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
}

interface Page {
  id: string;
  type: ClientPageType;
  content: PageContent;
}

interface Work {
  id: string;
  title: string;
  coverImage?: string;
  pages: Page[];
  createdAt: Date;
  updatedAt: Date;
}

interface ApiPage {
  id: string;
  type: string;
  content?: PageContent | null;
}

interface ApiWork {
  id: string;
  title: string;
  coverImage?: string | null;
  pages?: ApiPage[];
  createdAt: string;
  updatedAt: string;
}

/* =========================
   Type Guards & Utils
   ========================= */

const isApiPageType = (value: string): value is ApiPageType =>
  (API_PAGE_TYPES as readonly string[]).includes(value);

const toClientPageType = (type: string): ClientPageType =>
  isApiPageType(type) ? (type.toLowerCase() as ClientPageType) : "text";

const createDefaultTextStyle = (): TextStyle => ({
  fontSize: 16,
  fontFamily: "Noto Sans KR",
  color: "#000000",
  align: "left",
  bold: false,
  italic: false,
});

const createDefaultImageStyle = (): ImageStyle => ({
  width: 300,
  height: 200,
  rotation: 0,
  flipH: false,
  flipV: false,
});

const validateApiWork = (data: unknown): data is ApiWork => {
  if (typeof data !== 'object' || data === null) return false;
  
  const work = data as Record<string, unknown>;
  return (
    typeof work.id === 'string' &&
    typeof work.title === 'string' &&
    typeof work.createdAt === 'string' &&
    typeof work.updatedAt === 'string'
  );
};

/* =========================
   Main Component
   ========================= */

export default function WorkPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const workId = params.id as string;
  const fromEdit = searchParams.get('from') === 'edit';

  // State
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 작품 데이터 로드
  useEffect(() => {
    const loadWork = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/works/${workId}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404 
              ? "작품을 찾을 수 없습니다."
              : "작품을 불러올 수 없습니다."
          );
        }

        const data = await response.json();
        
        if (!validateApiWork(data)) {
          throw new Error("잘못된 작품 데이터입니다.");
        }

        const apiWork: ApiWork = data;

        const normalized: Work = {
          id: apiWork.id,
          title: apiWork.title || "제목 없음",
          coverImage: apiWork.coverImage || undefined,
          pages: (apiWork.pages || []).map((p): Page => ({
            id: p.id,
            type: toClientPageType(p.type),
            content: p.content || {
              textStyle: createDefaultTextStyle(),
              imageStyle: createDefaultImageStyle(),
            },
          })),
          createdAt: new Date(apiWork.createdAt),
          updatedAt: new Date(apiWork.updatedAt),
        };

        setWork(normalized);
      } catch (err) {
        console.error("작품 로드 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (workId) {
      loadWork();
    }
  }, [workId]);

  // 페이지 제목 업데이트
  useEffect(() => {
    if (work) {
      document.title = `${work.title} - 미리보기`;
    }
    return () => {
      document.title = '디지털 노트';
    };
  }, [work]);

  // 네비게이션 함수들
  const goToNextPage = useCallback(() => {
    if (work && currentPageIndex < work.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }, [work, currentPageIndex]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [currentPageIndex]);

  const goToPage = useCallback((index: number) => {
    if (work && index >= 0 && index < work.pages.length) {
      setCurrentPageIndex(index);
    }
  }, [work]);

  // 뒤로가기 처리
  const handleBack = useCallback(() => {
    if (fromEdit) {
      router.push(`/dashboard/create-work/${workId}`);
    } else {
      router.push('/dashboard/works');
    }
  }, [fromEdit, router, workId]);

  // 편집하기
  const handleEdit = useCallback(() => {
    router.push(`/dashboard/create-work/${workId}`);
  }, [router, workId]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!work?.pages.length) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPreviousPage();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNextPage();
          break;
        case "Escape":
          e.preventDefault();
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            handleBack();
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
          goToPage(0);
          break;
        case "End":
          e.preventDefault();
          if (work) goToPage(work.pages.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [work, currentPageIndex, isFullscreen, goToNextPage, goToPreviousPage, goToPage, handleBack]);

  // PDF 다운로드
  const downloadPDF = useCallback(async () => {
    if (!work) return;

    try {
      const response = await fetch(`/api/works/${workId}/pdf`);
      if (!response.ok) throw new Error("PDF 생성 실패");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${work.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("PDF 다운로드 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    }
  }, [work, workId]);

  // 공유하기
  const shareWork = useCallback(async () => {
    if (!work) return;

    const shareUrl = window.location.origin + window.location.pathname;
    const shareText = `${work.title} - 디지털 작품을 확인해보세요!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: work.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // 사용자가 취소했거나 오류 발생 시 클립보드 복사로 대체
        if (error instanceof Error && error.name !== 'AbortError') {
          await fallbackCopyToClipboard(shareUrl);
        }
      }
    } else {
      await fallbackCopyToClipboard(shareUrl);
    }
  }, [work]);

  const fallbackCopyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("링크가 클립보드에 복사되었습니다!");
    } catch (error) {
      console.error("클립보드 복사 오류:", error);
      // 최후의 수단: 텍스트 선택
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert("링크가 클립보드에 복사되었습니다!");
      } catch (err) {
        alert("링크 복사 중 오류가 발생했습니다.");
      }
      document.body.removeChild(textArea);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">작품을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !work) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-4">오류 발생</h1>
          <p className="text-gray-400 mb-8">
            {error || "작품을 찾을 수 없습니다."}
          </p>
          <div className="space-x-4">
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = work.pages[currentPageIndex];

  return (
    <div
      className={`min-h-screen bg-gray-900 text-white ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title={fromEdit ? "편집으로 돌아가기" : "목록으로 돌아가기"}
                >
                  <X className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">{work.title}</h1>
                  <p className="text-sm text-gray-400">
                    {work.pages.length}페이지 • {currentPageIndex + 1}페이지 보는 중
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
        <div className="relative max-w-4xl w-full">
          {/* Page Content */}
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden aspect-[3/4] max-h-[80vh]">
            <PageViewer page={currentPage} />
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
              disabled={currentPageIndex === work.pages.length - 1}
              className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed -mr-6 transition-all"
              title="다음 페이지 (→ 키)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
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
      </div>

      {/* Bottom Controls */}
      {!isFullscreen && work.pages.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Page Thumbnails */}
            <div className="flex items-center justify-center space-x-2 mb-4 overflow-x-auto pb-2">
              {work.pages.map((page, index) => (
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
                {currentPageIndex + 1} / {work.pages.length}
              </span>
              <div className="flex-1 max-w-md">
                <div className="bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentPageIndex + 1) / work.pages.length) * 100
                      }%`,
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
          <div>← → : 페이지 이동</div>
          <div>Home/End : 처음/마지막 페이지</div>
          <div>F : 전체화면 토글</div>
          <div>ESC : 전체화면 종료</div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Page Viewer Component
   ========================= */

function PageViewer({ page }: { page: Page }) {
  const imageStyle = page.content.imageStyle;
  const textStyle = page.content.textStyle;

  return (
    <div className="w-full h-full flex flex-col relative bg-white text-black overflow-hidden">
      {/* Image Content */}
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
          />
        </div>
      )}

      {/* Text Content */}
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
      {!page.content.image && !page.content.text && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-lg">빈 페이지</p>
            <p className="text-sm">내용이 없습니다</p>
          </div>
        </div>
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
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-[8px] text-gray-400">빈 페이지</div>
        </div>
      )}
    </div>
  );
}