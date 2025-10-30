// src/app/dashboard/books/page.tsx

"use client";

import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Library,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* =====================
 * 타입 정의
 * ===================== */
interface PageContent {
  text?: string;
  image?: string;
  imageUrl?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  imagePosition?: "top" | "bottom" | "left" | "right";
  imageSize?: "small" | "medium" | "large" | "full";
  textStyle?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    align?: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
  };
  imageStyle?: {
    width?: number;
    height?: number;
    rotation?: number;
    flipH?: boolean;
    flipV?: boolean;
  };
  elements?: Array<{
    id: string;
    type: "text" | "image" | "placeholder";
    position: { x: number; y: number; width: number; height: number };
    style: Record<string, string | number | boolean>;
    content?: string;
    placeholder?: string;
  }>;
}

interface ServerPageResponse {
  id?: string;
  pageId?: string;
  type?: string;
  contentType?: string;
  content?: PageContent | string;
  contentJson?: PageContent | string;
  contentJSON?: PageContent | string; // ← 추가 보호
  order?: number;
  orderIndex?: number;
}

interface ServerWorkResponse {
  id: string;
  workId?: string;
  title: string;
  coverImage?: string;
  status?: string;
  pages?: ServerPageResponse[];
  _count?: { pages?: number };
  createdAt: string;
  updatedAt: string;
}

interface CompletedWork {
  id: string;
  title: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  pages: Array<{
    id: string;
    type: "TEXT" | "IMAGE" | "MIXED" | "TEMPLATE";
    content: PageContent;
    order: number;
  }>;
  _count: { pages: number };
}

/* =====================
 * 유틸리티
 * ===================== */
const normalizeStatus = (status?: string): string => {
  if (!status) return "draft";
  return status.toLowerCase();
};

/** 느슨한 타입 정규화: 다양한 변형을 안전하게 매핑 */
const normalizePageType = (
  type?: string
): "TEXT" | "IMAGE" | "MIXED" | "TEMPLATE" => {
  if (!type) return "TEXT";
  const t = type.toLowerCase();
  if (t.includes("template") || t.includes("cover")) return "TEMPLATE";
  if (t.includes("mixed")) return "MIXED";
  if (t.includes("image") || t.includes("img")) return "IMAGE";
  return "TEXT";
};

/** 문자열/객체 모두 방어적으로 파싱 */
// 반환 타입을 제네릭 <T>로 받고, 기본적으로는 Record<string, unknown> 사용
const safeParse = <T = Record<string, unknown>>(raw: unknown): T => {
  if (!raw) return {} as T;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return {} as T;
    }
  }

  if (typeof raw === "object") return raw as T;

  return {} as T;
};

const extractPageContent = (page: ServerPageResponse): PageContent => {
  // 다양한 키를 모두 고려
  const rawContent =
    page.contentJson ?? page.contentJSON ?? page.content ?? undefined;

  const parsed = safeParse(rawContent) as PageContent;

  // 최종 결과(키 통합: imageUrl 우선)
  const finalContent: PageContent = {
    text: parsed.text,
    image: parsed.imageUrl || parsed.image,
    imageUrl: parsed.imageUrl || parsed.image,
    fontSize: parsed.fontSize,
    fontFamily: parsed.fontFamily,
    fontWeight: parsed.fontWeight,
    color: parsed.color,
    textAlign: parsed.textAlign,
    imagePosition: parsed.imagePosition,
    imageSize: parsed.imageSize,
    textStyle: parsed.textStyle,
    imageStyle: parsed.imageStyle,
    elements: parsed.elements,
  };

  return finalContent;
};

const classifyStatus = (raw?: string) => {
  const s = normalizeStatus(raw);
  if (["reading", "in_progress", "current", "currently_reading"].includes(s))
    return "current";
  if (["queued", "next", "planned", "wishlist", "backlog"].includes(s))
    return "next";
  if (["completed", "finished", "done", "published"].includes(s))
    return "finished";
  return "finished";
};

/** 표지처럼 보이는 페이지 감지 (휴리스틱) */
const isCoverLikePage = (page?: CompletedWork["pages"][0] | undefined): boolean => {
  if (!page) return false;

  // 1) TEMPLATE 이고 elements가 풍부한 경우 표지일 확률 높음
  if (page.type === "TEMPLATE" && page.content.elements && page.content.elements.length > 0) {
    // 가운데 정렬 텍스트, title/subtitle/author 등의 id가 있으면 더 표지스러움
    const hasCoverishText =
      page.content.elements.some((el) =>
        el.type === "text" &&
        (String(el.id || "").toLowerCase().includes("title") ||
         String(el.id || "").toLowerCase().includes("subtitle") ||
         String(el.id || "").toLowerCase().includes("author") ||
         (typeof el.style?.textAlign === "string" && ["center"].includes(String(el.style.textAlign)))
        )
      );
    return hasCoverishText || page.content.elements.length >= 2;
  }

  // 2) MIXED 타입인데 elements가 있고 중심 정렬 위주인 경우
  if (page.type === "MIXED" && page.content.elements && page.content.elements.length > 0) {
    const centeredTexts = page.content.elements.filter(
      (el) => el.type === "text" && (el.style?.textAlign as string) === "center"
    );
    return centeredTexts.length >= 1 && page.content.elements.length >= 2;
  }

  // 3) 단일 큰 이미지 한 장만 있는 경우도 표지로 쓰일 때가 많음
  if (
    page.type === "IMAGE" &&
    page.content.image &&
    !page.content.text &&
    (!page.content.elements || page.content.elements.length === 0)
  ) {
    return true;
  }

  return false;
};

/** 작품에서 표지를 제외한 내지 페이지 배열 */
const getContentPages = (book: CompletedWork): CompletedWork["pages"] => {
  if (!book.pages || book.pages.length === 0) return [];
  const first = book.pages[0];
  return isCoverLikePage(first) ? book.pages.slice(1) : book.pages;
};


/* =====================
 * 메인 컴포넌트
 * ===================== */
export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<CompletedWork[]>([]);
  const [selectedBook, setSelectedBook] = useState<CompletedWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase();
    return books.filter((b) => b.title.toLowerCase().includes(q));
  }, [books, searchQuery]);

  // 선반용 그룹
  const grouped = useMemo(() => {
    const current: CompletedWork[] = [];
    const next: CompletedWork[] = [];
    const finished: CompletedWork[] = [];
    filtered.forEach((b) => {
      const bucket = classifyStatus(b.status);
      if (bucket === "current") current.push(b);
      else if (bucket === "next") next.push(b);
      else finished.push(b);
    });
    const sortByUpdated = (arr: CompletedWork[]) =>
      arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return {
      current: sortByUpdated(current),
      next: sortByUpdated(next),
      finished: sortByUpdated(finished),
    };
  }, [filtered]);

  useEffect(() => {
    loadBooks();
  }, []);

  // 자동 재생 로직
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && selectedBook && selectedBook.pages.length > 1) {
      t = setInterval(() => {
        setCurrentPage((p) => {
          const nxt = p + 1;
          if (!selectedBook || nxt >= selectedBook.pages.length) {
            setIsPlaying(false); // 마지막 페이지에서 자동 정지
            return p;
          }
          return nxt;
        });
      }, playInterval * 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isPlaying, playInterval, selectedBook]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!selectedBook) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (currentPage > 0) setCurrentPage(currentPage - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentPage < selectedBook.pages.length - 1)
            setCurrentPage(currentPage + 1);
          break;
        case "Escape":
          e.preventDefault();
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            setSelectedBook(null);
            setCurrentPage(0);
            setIsPlaying(false);
          }
          break;
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case "d":
        case "D":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setDebugMode(!debugMode);
          }
          break;
        case "Home":
          e.preventDefault();
          setCurrentPage(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentPage(selectedBook.pages.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedBook, currentPage, isFullscreen, isPlaying, debugMode]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      // 최신 데이터 강제
      const res = await fetch("/api/works", {
        method: "GET",
        cache: "no-store", // ← 추가: 최신 데이터 보장
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as ServerWorkResponse[];

      const sorted = data.sort(
        (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
      );

      const mapped: CompletedWork[] =
        sorted.map((w) => {
          const workId = w.id || w.workId || "unknown";
          const pages =
            (w.pages || [])
              .map((p, idx) => {
                const pageId = p.id || p.pageId || `page_${idx}`;
                const pageType = normalizePageType(p.contentType || p.type);
                const pageContent = extractPageContent(p);

                return {
                  id: pageId,
                  type: pageType,
                  content: pageContent,
                  order:
                    typeof p.orderIndex === "number"
                      ? p.orderIndex
                      : typeof p.order === "number"
                      ? p.order
                      : idx,
                };
              })
              .sort((a, b) => a.order - b.order) ?? [];

          return {
            id: workId,
            title: w.title,
            coverImage: w.coverImage,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            status: w.status || "draft",
            pages,
            _count: { pages: w._count?.pages ?? pages.length },
          };
        }) ?? [];

      setBooks(mapped);
      setSelectedBook(null);
      setCurrentPage(0);
      setIsPlaying(false);
    } catch (e) {
      console.error("❌ Load books failed:", e);
      alert(
        `작품 로딩 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBook = async (
    bookId: string,
    format: "pdf" | "epub" | "images"
  ) => {
    try {
      const res = await fetch(`/api/works/${bookId}/export?format=${format}`);
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedBook?.title || "book"}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("다운로드 중 오류가 발생했습니다.");
      console.error(e);
    }
  };

  const shareBook = async (
    book: CompletedWork,
    method: "kakao" | "email" | "link"
  ) => {
    const shareUrl = `${window.location.origin}/dashboard/works/${book.id}/preview?from=books`;
    if (method === "link") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("링크가 복사되었습니다.");
      } catch (e) {
        console.error(e);
        prompt("아래 링크를 복사하세요:", shareUrl);
      }
    }
  };

  const goToNextPage = useCallback(() => {
    if (selectedBook && currentPage < selectedBook.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [selectedBook, currentPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (index: number) => {
      if (selectedBook && index >= 0 && index < selectedBook.pages.length) {
        setCurrentPage(index);
      }
    },
    [selectedBook]
  );

  /* ========== 로딩 화면 ========== */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full animate-pulse mx-auto" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">라이브러리 로딩 중</h2>
            <p className="text-gray-600">소중한 작품들을 불러오고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ========== 개선된 단일 작품 뷰어 ========== */
  if (selectedBook) {
    return (
      <ImprovedBookViewer
        book={selectedBook}
        currentPage={currentPage}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        debugMode={debugMode}
        onNextPage={goToNextPage}
        onPrevPage={goToPreviousPage}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onToggleDebug={() => setDebugMode(!debugMode)}
        onDownload={downloadBook}
        onShare={shareBook}
        onPageChange={setCurrentPage}
        onBack={() => {
          setSelectedBook(null);
          setCurrentPage(0);
          setIsPlaying(false);
          setIsFullscreen(false);
        }}
      />
    );
  }

  /* ========== 라이브러리 화면 ========== */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header - Main page style */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-end mb-2">
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <a className="hover:text-gray-900 transition-colors" href="/dashboard" title="메인 홈" aria-label="메인 홈">대시보드</a>
              <a className="hover:text-gray-900 transition-colors" href="/dashboard/life-graph">인생그래프</a>
              <a className="hover:text-gray-900 transition-colors" href="/dashboard/workspace">작업실</a>
              <a className="hover:text-gray-900 transition-colors" href="/api/auth/logout">로그아웃</a>
            </nav>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex flex-col items-center gap-2 flex-shrink-0 -mt-8">
              <div className="h-12 w-12 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" className="text-teal-400">
                  <g transform="translate(24,24)">
                    <circle cx="0" cy="0" r="3" fill="currentColor" />
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(0)"/>
                    <circle cx="16" cy="0" r="2" fill="currentColor"/>
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(60)"/>
                    <circle cx="8" cy="13.86" r="2" fill="currentColor"/>
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(120)"/>
                    <circle cx="-8" cy="13.86" r="2" fill="currentColor"/>
                  </g>
                </svg>
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">그레이트 시니어</h1>
                <p className="text-sm text-gray-600">네트워크</p>
              </div>
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-3">
                <Library className="h-6 w-6 text-teal-500" />
                Digital Library
              </h2>
              <p className="text-gray-600 mt-1">당신만의 특별한 작품 컬렉션</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  placeholder="작품 검색하기..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-72 bg-white/70 backdrop-blur border-2 border-gray-300 focus:border-teal-400 focus:ring-teal-100 rounded-full shadow-sm"
                />
              </div>
              <Link
                href="/dashboard/create-work"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-400 to-teal-600 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                새 작품 만들기
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 space-y-16">
        <ShelfSection
          title="📖 현재 읽고 있는 작품"
          subtitle="진행 중인 작품들"
          books={grouped.current.slice(0, 8)}
          onSelect={setSelectedBook}
          variant="current"
        />

        <ShelfSection
          title="✨ 완성된 작품"
          subtitle="소중한 추억이 담긴 완성작들"
          books={grouped.finished.slice(0, 16)}
          onSelect={setSelectedBook}
          variant="finished"
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">Great Senior</span>
                <span className="text-lg text-gray-600">network</span>
                <span className="ml-4 text-sm text-gray-500">제휴문의 | 이메일 무단 수집 거부</span>
              </div>
              <div className="text-sm text-gray-600 space-y-2 max-w-2xl">
                <p><span className="font-medium">마인드라</span> 대표자 서현숙 <span className="ml-4 font-medium">사업자등록번호:</span> 255-37-01508</p>
                <p>경기도 고양시 일산동구 중앙로 1036 4층(고양중장년기술창업센터, 1-1층)</p>
                <p><span className="font-medium">통신판매신고번호:</span> 제2025-고양일산동-0921호</p>
                <p className="text-gray-500 pt-2">Copyright 2025. MINDRA INC. All rights reserved.</p>
              </div>
            </div>
            <div className="lg:text-right">
              <p className="text-sm text-gray-500 mb-2">FAMILY SITE</p>
              <div className="flex items-center justify-start lg:justify-end">
                <span className="text-lg font-bold text-gray-900">Mind<span className="text-teal-500">ra</span></span>
                <button aria-label="패밀리 사이트 메뉴 열기" className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center lg:justify-end space-x-2 text-gray-500">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm">총 {books.length}개의 작품이 라이브러리에 저장되어 있습니다</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =====================
 * ShelfSection
 * ===================== */
function ShelfSection({
  title,
  subtitle,
  books,
  onSelect,
  variant,
}: {
  title: string;
  subtitle: string;
  books: CompletedWork[];
  onSelect: (b: CompletedWork) => void;
  variant: "current" | "next" | "finished";
}) {
  const gradientColors = {
    current: "from-teal-400 to-teal-600",
    next: "from-teal-500 to-teal-700",
    finished: "from-teal-600 to-teal-800",
  };

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              {title}
            </h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <button className="group flex items-center space-x-2 text-gray-500 hover:text-teal-600 transition-colors">
            <span className="text-sm font-medium">전체 보기</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div
              className={`w-16 h-16 bg-gradient-to-r ${gradientColors[variant]} rounded-2xl mx-auto flex items-center justify-center opacity-50`}
            >
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 font-medium">아직 작품이 없습니다</p>
              <p className="text-sm text-gray-400">새로운 작품을 만들어보세요!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {books.map((book) => (
              <BookCover
                key={book.id}
                book={book}
                onClick={() => onSelect(book)}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* =====================
 * BookCover
 * ===================== */
function BookCover({
  book,
  onClick,
  variant,
}: {
  book: CompletedWork;
  onClick: () => void;
  variant: "current" | "next" | "finished";
}) {
  const cover = book.coverImage;

  const gradientColors = {
    current: "from-teal-400 via-teal-500 to-teal-600",
    next: "from-teal-500 via-teal-600 to-teal-700",
    finished: "from-teal-600 via-teal-700 to-teal-800",
  };

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200"
      title={book.title}
    >
      {cover ? (
        <div className="relative w-full h-full">
          <img
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradientColors[variant]} flex flex-col items-center justify-center relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="relative z-10 text-center space-y-4">
            <Calendar className="h-12 w-12 text-white/90 mx-auto" />
            <div className="px-4">
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
                {book.title}
              </p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/10 rounded-full" />
        </div>
      )}

      {/* 페이지 수 배지 */}
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur text-white text-xs font-semibold rounded-full">
        {book._count.pages}p
      </div>

      {/* 호버 정보 */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{book.title}</h3>
        <p className="text-xs text-gray-300">
          {new Date(book.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}

/* =====================
 * 개선된 BookViewer 컴포넌트
 * ===================== */
interface ImprovedBookViewerProps {
  book: CompletedWork;
  currentPage: number;
  isPlaying: boolean;
  isFullscreen: boolean;
  debugMode: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onToggleDebug: () => void;
  onDownload: (bookId: string, format: "pdf" | "epub" | "images") => void;
  onShare: (book: CompletedWork, method: "kakao" | "email" | "link") => void;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

function ImprovedBookViewer({
  book,
  currentPage,
  isPlaying,
  isFullscreen,
  debugMode,
  onNextPage,
  onPrevPage,
  onTogglePlay,
  onToggleFullscreen,
  onToggleDebug,
  onDownload,
  onShare,
  onPageChange,
  onBack,
}: ImprovedBookViewerProps) {
  // ✨ 표지 제외한 내지 페이지
  const contentPages = React.useMemo(() => getContentPages(book), [book]);

  // 현재/다음 페이지는 contentPages를 기준으로
  const currentPageData = contentPages[currentPage];
  const nextPage = contentPages[currentPage + 1];

  return (
    <div className={`min-h-screen bg-gray-900 text-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {!isFullscreen && (
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="라이브러리로 돌아가기"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">{book.title}</h1>
                  <p className="text-sm text-gray-400">
                    {/* ✅ 개수도 contentPages 기준 */}
                    {Math.min(currentPage + 1, contentPages.length)} / {contentPages.length}페이지
                    {book.status && (
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          book.status === "completed" ? "bg-green-600" : "bg-yellow-600"
                        }`}
                      >
                        {book.status === "completed" ? "완성" : "작업중"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onToggleDebug}
                  className="px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="디버그 모드 토글 (Ctrl+D)"
                >
                  DEBUG
                </button>

                <button
                  onClick={() => onDownload(book.id, "pdf")}
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </button>

                <button
                  onClick={() => onShare(book, "link")}
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </button>

                <button
                  onClick={onToggleFullscreen}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {debugMode && currentPageData && (
              <div className="mt-4 p-4 bg-gray-700 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>작품 정보:</strong><br />
                    ID: {book.id}<br />
                    제목: {book.title}<br />
                    상태: {book.status}<br />
                    {/* ✅ contentPages 기준 */}
                    페이지 수(내지): {contentPages.length}<br />
                    현재 페이지: {currentPage + 1}
                  </div>
                  <div>
                    <strong>현재 페이지 정보:</strong><br />
                    ID: {currentPageData.id}<br />
                    타입: {currentPageData.type}<br />
                    텍스트: {currentPageData.content.text ? "있음" : "없음"}<br />
                    이미지: {currentPageData.content.image ? "있음" : "없음"}<br />
                    요소: {currentPageData.content.elements?.length || 0}개
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-white">페이지 콘텐츠 상세보기</summary>
                  <pre className="mt-2 p-2 bg-gray-800 text-[10px] overflow-auto max-h-40 whitespace-pre-wrap">
                    {JSON.stringify(currentPageData.content, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메인 뷰어 */}
      <div className="flex-1 flex items-center justify-center p-4">
        {contentPages.length > 0 && currentPageData ? (
          <>
            <div className="relative max-w-6xl w-full">
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: "16/10", maxHeight: "80vh" }}>
                <BookPagesViewer
                  currentPage={currentPageData}
                  nextPage={nextPage}
                  isLastPage={currentPage >= contentPages.length - 1}
                  debugMode={debugMode}
                />
              </div>

              {/* 좌우 네비 */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button
                  onClick={onPrevPage}
                  disabled={currentPage === 0}
                  className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed -ml-6 transition-all"
                  title="이전 페이지 (← 키)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={onNextPage}
                  disabled={currentPage >= contentPages.length - 1}
                  className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed -mr-6 transition-all"
                  title="다음 페이지 (→ 키)"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* 전체화면 종료 버튼 */}
            {isFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                title="전체화면 종료 (ESC 키)"
              >
                <Minimize2 className="h-6 w-6" />
              </button>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl p-12 text-center text-gray-500" style={{ aspectRatio: "16/10", maxHeight: "80vh" }}>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">내지 페이지가 없습니다</h3>
            <p className="mb-6">이 작품에는 표지만 있고 내용 페이지가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 썸네일/진행률도 contentPages 기준 */}
      {!isFullscreen && contentPages.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center space-x-2 mb-4 overflow-x-auto pb-2">
              {contentPages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => onPageChange(index)}
                  className={`relative flex-shrink-0 w-12 h-16 rounded border-2 overflow-hidden transition-all ${
                    index === currentPage ? "border-blue-500 scale-110" : "border-gray-600 hover:border-gray-500"
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

            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {Math.min(currentPage + 1, contentPages.length)} / {contentPages.length}
              </span>
              <div className="flex-1 max-w-md">
                <div className="bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${contentPages.length ? ((currentPage + 1) / contentPages.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <div className="font-semibold mb-2">키보드 단축키</div>
          <div>← → : 페이지 이동</div>
          <div>스페이스바 : 재생/일시정지</div>
          <div>Home/End : 처음/마지막 페이지</div>
          <div>ESC : 전체화면 종료</div>
          <div>F : 전체화면 토글</div>
          <div>Ctrl+D : 디버그 토글</div>
        </div>
      )}
    </div>
  );
}


/* =====================
 * BookPagesViewer 컴포넌트
 * ===================== */
function BookPagesViewer({
  currentPage,
  nextPage,
  isLastPage,
  debugMode,
}: {
  currentPage: CompletedWork["pages"][0];
  nextPage?: CompletedWork["pages"][0];
  isLastPage: boolean;
  debugMode?: boolean;
}) {
  return (
    <div className="w-full h-full flex bg-white">
      {/* 왼쪽 페이지 */}
      <div className="flex-1 border-r border-gray-200">
        <PageViewer page={currentPage} debugMode={debugMode} />
      </div>

      {/* 오른쪽 페이지 */}
      <div className="flex-1">
        {nextPage ? (
          <PageViewer page={nextPage} debugMode={debugMode} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">📖</div>
              <p className="text-lg">끝</p>
              {isLastPage && <p className="text-sm mt-2">마지막 페이지입니다</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================
 * PageViewer 컴포넌트
 * ===================== */
function PageViewer({
  page,
  debugMode,
}: {
  page: CompletedWork["pages"][0];
  debugMode?: boolean;
}) {
  const imageStyle = page.content.imageStyle;
  const textStyle = page.content.textStyle;

  return (
    <div className="w-full h-full flex flex-col relative bg-white text-black overflow-hidden">
      {/* 디버그 정보 오버레이 */}
      {debugMode && (
        <div className="absolute top-2 left-2 z-10 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div>페이지: {page.id}</div>
          <div>타입: {page.type}</div>
          <div>텍스트: {page.content.text ? "있음" : "없음"}</div>
          <div>이미지: {page.content.image ? "있음" : "없음"}</div>
          <div>요소: {page.content.elements?.length || 0}개</div>
        </div>
      )}

      {/* 템플릿/믹스드 기반 페이지 - elements 렌더링 지원 */}
      {(page.type === "TEMPLATE" || page.type === "MIXED") &&
      page.content.elements &&
      page.content.elements.length > 0 ? (
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
                fontSize:
                  typeof element.style.fontSize === "number"
                    ? `${Math.min(element.style.fontSize as number, 14)}px`
                    : "12px",
              }}
            >
              {element.type === "text" && (
                <div
                  className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden p-1"
                  style={{
                    color:
                      (element.style.color as string) ??
                      "#333",
                    textAlign:
                      (element.style.textAlign as
                        | "left"
                        | "center"
                        | "right") ?? "left",
                    fontWeight:
                      (element.style.fontWeight as string) ??
                      "normal",
                    fontStyle:
                      (element.style.fontStyle as string) ?? "normal",
                  }}
                >
                  <span className="line-clamp-6">
                    {element.content || element.placeholder || "텍스트"}
                  </span>
                </div>
              )}
              {element.type === "placeholder" && (
                <div className="w-full h-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <BookOpen className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">이미지 없음</span>
                  </div>
                </div>
              )}
              {element.type === "image" && element.content && (
                <img
                  src={element.content}
                  alt="Page element"
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    console.error("이미지 로드 실패:", element.content);
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 이미지 콘텐츠 */}
          {page.content.image && (
            <div
              className={`${
                page.type === "MIXED" ? "flex-1" : "w-full h-full"
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
                  console.error("페이지 이미지 로드 실패:", page.content.image);
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* 텍스트 콘텐츠 */}
          {page.content.text && (
            <div
              className={`${
                page.type === "MIXED" ? "flex-1" : "w-full h-full"
              } p-8 flex items-center overflow-y-auto`}
            >
              <div
                className="w-full leading-relaxed"
                style={{
                  fontSize: textStyle?.fontSize || page.content.fontSize || 16,
                  color: textStyle?.color || page.content.color || "#000000",
                  textAlign:
                    textStyle?.align || page.content.textAlign || "left",
                  fontWeight: textStyle?.bold
                    ? "bold"
                    : page.content.fontWeight || "normal",
                  fontStyle: textStyle?.italic ? "italic" : "normal",
                  fontFamily:
                    textStyle?.fontFamily ||
                    page.content.fontFamily ||
                    "inherit",
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

          {/* 빈 상태 */}
          {!page.content.image &&
            !page.content.text &&
            (!page.content.elements || page.content.elements.length === 0) && (
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

/* =====================
 * PageThumbnail 컴포넌트
 * ===================== */
function PageThumbnail({ page }: { page: CompletedWork["pages"][0] }) {
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
          <BookOpen className="w-3 h-3 text-gray-400" />
        </div>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-[8px] text-gray-400">빈 페이지</div>
        </div>
      )}
    </div>
  );
}
