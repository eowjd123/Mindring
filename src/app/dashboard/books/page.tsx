// src/app/dashboard/books/page.tsx

"use client";

import {
  Book,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
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
  X,
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
    type: 'text' | 'image' | 'placeholder';
    position: { x: number; y: number; width: number; height: number };
    style: Record<string, unknown>;
    content?: string;
    placeholder?: string;
  }>;
}

interface ServerPageResponse {
  id?: string;
  type?: string;
  contentType?: string;
  content?: PageContent;
  contentJson?: PageContent;
  order?: number;
  orderIndex?: number;
}

interface ServerWorkResponse {
  id: string;
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

const normalizePageType = (type?: string): "TEXT" | "IMAGE" | "MIXED" | "TEMPLATE" => {
  if (!type) return "TEXT";
  const t = type.toUpperCase();
  return t === "IMAGE" ? "IMAGE" : t === "MIXED" ? "MIXED" : t === "TEMPLATE" ? "TEMPLATE" : "TEXT";
};

const extractPageContent = (page: ServerPageResponse): PageContent => {
  const content = page.contentJson || page.content || {};
  
  // contentJson이 string인 경우 파싱
  let parsedContent = content;
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse content JSON:', e);
      parsedContent = {};
    }
  }
  
  return {
    text: parsedContent.text,
    image: parsedContent.imageUrl || parsedContent.image,
    imageUrl: parsedContent.imageUrl || parsedContent.image,
    fontSize: parsedContent.fontSize,
    fontFamily: parsedContent.fontFamily,
    fontWeight: parsedContent.fontWeight,
    color: parsedContent.color,
    textAlign: parsedContent.textAlign,
    imagePosition: parsedContent.imagePosition,
    imageSize: parsedContent.imageSize,
    textStyle: parsedContent.textStyle,
    imageStyle: parsedContent.imageStyle,
    elements: parsedContent.elements, // 템플릿 요소 지원
  };
};

const classifyStatus = (raw?: string) => {
  const s = normalizeStatus(raw);
  if (["reading", "in_progress", "current", "currently_reading"].includes(s)) return "current";
  if (["queued", "next", "planned", "wishlist", "backlog"].includes(s)) return "next";
  if (["completed", "finished", "done", "published"].includes(s)) return "finished";
  return "finished";
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
          const next = p + 1;
          if (!selectedBook || next >= selectedBook.pages.length) {
            setIsPlaying(false); // 마지막 페이지에서 자동 정지
            return p;
          }
          return next;
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
          if (currentPage < selectedBook.pages.length - 1) setCurrentPage(currentPage + 1);
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
        case " ": // 스페이스바
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
  }, [selectedBook, currentPage, isFullscreen, isPlaying]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/works?status=completed", {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ServerWorkResponse[];

      const sorted = data.sort(
        (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
      );

      const mapped: CompletedWork[] = sorted.map((w) => {
        const pages =
          (w.pages || [])
            .map((p, idx) => ({
              id: p.id || `page_${idx}`,
              type: normalizePageType(p.contentType || p.type),
              content: extractPageContent(p),
              order:
                typeof p.orderIndex === "number"
                  ? p.orderIndex
                  : typeof p.order === "number"
                  ? p.order
                  : idx,
            }))
            .sort((a, b) => a.order - b.order) ?? [];

        return {
          id: w.id,
          title: w.title,
          coverImage: w.coverImage,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          status: w.status || "completed",
          pages,
          _count: { pages: w._count?.pages ?? pages.length },
        };
      });

      setBooks(mapped);
      setSelectedBook(null);
      setCurrentPage(0);
      setIsPlaying(false);
    } catch (e) {
      console.error("Load books failed:", e);
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

  const goToPage = useCallback((index: number) => {
    if (selectedBook && index >= 0 && index < selectedBook.pages.length) {
      setCurrentPage(index);
    }
  }, [selectedBook]);

  /* ========== 로딩 화면 ========== */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse mx-auto" />
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
        onNextPage={goToNextPage}
        onPrevPage={goToPreviousPage}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
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

  /* ========== 라이브러리 화면 (기존과 동일) ========== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 현대적인 상단 네비게이션 */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* 브랜드 섹션 */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Library className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Digital Library
                </h1>
                <p className="text-sm text-gray-500 font-medium">당신만의 특별한 작품 컬렉션</p>
              </div>
            </div>

            {/* 액션 섹션 */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="작품 검색하기..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-72 bg-white/70 backdrop-blur border-gray-200/60 focus:border-blue-300 focus:ring-blue-200/50 rounded-xl shadow-sm"
                />
              </div>
              <Link
                href="/dashboard/create-work"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                새 작품 만들기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Currently reading */}
        <ShelfSection
          title="📖 현재 읽고 있는 작품"
          subtitle="진행 중인 작품들"
          books={grouped.current.slice(0, 8)}
          onSelect={setSelectedBook}
          variant="current"
        />

        {/* Next up */}
        <ShelfSection
          title="📚 읽을 예정인 작품"
          subtitle="다음에 감상할 작품들"
          books={grouped.next.slice(0, 12)}
          onSelect={setSelectedBook}
          variant="next"
        />

        {/* Finished */}
        <ShelfSection
          title="✨ 완성된 작품"
          subtitle="소중한 추억이 담긴 완성작들"
          books={grouped.finished.slice(0, 16)}
          onSelect={setSelectedBook}
          variant="finished"
        />
      </main>

      {/* 푸터 정보 */}
      <div className="mt-20 py-8 bg-white/50 backdrop-blur border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p className="flex items-center justify-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>총 {books.length}개의 작품이 라이브러리에 저장되어 있습니다</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* =====================
 * ShelfSection (기존과 동일)
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
    current: "from-emerald-500 to-teal-500",
    next: "from-amber-500 to-orange-500",
    finished: "from-blue-500 to-purple-500",
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <button className="group flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
          <span className="text-sm font-medium">전체 보기</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className={`w-16 h-16 bg-gradient-to-r ${gradientColors[variant]} rounded-2xl mx-auto flex items-center justify-center opacity-50`}>
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
            <BookCover key={book.id} book={book} onClick={() => onSelect(book)} variant={variant} />
          ))}
        </div>
      )}
    </section>
  );
}

/* =====================
 * BookCover (기존과 동일)
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
    current: "from-emerald-400 via-teal-400 to-cyan-400",
    next: "from-amber-400 via-orange-400 to-red-400",
    finished: "from-blue-400 via-purple-400 to-pink-400",
  };

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-200/50"
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
        <div className={`w-full h-full bg-gradient-to-br ${gradientColors[variant]} flex flex-col items-center justify-center relative overflow-hidden`}>
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
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur text-white text-xs font-semibold rounded-lg">
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
  onNextPage: () => void;
  onPrevPage: () => void;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
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
  onNextPage,
  onPrevPage,
  onTogglePlay,
  onToggleFullscreen,
  onDownload,
  onShare,
  onPageChange,
  onBack,
}: ImprovedBookViewerProps) {
  const currentPageData = book.pages[currentPage];
  const nextPage = book.pages[currentPage + 1];

  return (
    <div className={`min-h-screen bg-gray-900 text-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* 헤더 - 전체화면이 아닐 때만 표시 */}
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
                    {currentPage + 1} / {book.pages.length}페이지
                    {book.status && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        book.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {book.status === 'completed' ? '완성' : '작업중'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
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
          </div>
        </div>
      )}

      {/* 메인 뷰어 영역 */}
      <div className="flex-1 flex items-center justify-center p-4">
        {book.pages.length > 0 ? (
          <>
            <div className="relative max-w-6xl w-full">
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: '16/10', maxHeight: '80vh' }}>
                <BookPagesViewer 
                  currentPage={currentPageData} 
                  nextPage={nextPage}
                  isLastPage={currentPage >= book.pages.length - 1}
                />
              </div>

              {/* 네비게이션 컨트롤 */}
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
                  disabled={currentPage === book.pages.length - 1}
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
          /* 빈 페이지 */
          <div className="bg-white rounded-lg shadow-2xl p-12 text-center text-gray-500" style={{ aspectRatio: '16/10', maxHeight: '80vh' }}>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">페이지가 없습니다</h3>
            <p className="mb-6">이 작품에는 아직 추가된 페이지가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 - 전체화면이 아닐 때만 표시 */}
      {!isFullscreen && book.pages.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* 페이지 썸네일 */}
            <div className="flex items-center justify-center space-x-2 mb-4 overflow-x-auto pb-2">
              {book.pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => onPageChange(index)}
                  className={`relative flex-shrink-0 w-12 h-16 rounded border-2 overflow-hidden transition-all ${
                    index === currentPage
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

            {/* 재생 컨트롤 및 진행률 */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={onPrevPage}
                disabled={currentPage === 0}
                className="p-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              
              <button
                onClick={onTogglePlay}
                disabled={book.pages.length <= 1}
                className="p-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              
              <button
                onClick={onNextPage}
                disabled={currentPage === book.pages.length - 1}
                className="p-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* 진행률 표시 */}
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {currentPage + 1} / {book.pages.length}
              </span>
              <div className="flex-1 max-w-md">
                <div className="bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentPage + 1) / book.pages.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 키보드 단축키 도움말 */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <div className="font-semibold mb-2">키보드 단축키</div>
          <div>← → : 페이지 이동</div>
          <div>스페이스바 : 재생/일시정지</div>
          <div>Home/End : 처음/마지막 페이지</div>
          <div>ESC : 전체화면 종료</div>
          <div>F : 전체화면 토글</div>
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
  isLastPage 
}: { 
  currentPage: CompletedWork['pages'][0]; 
  nextPage?: CompletedWork['pages'][0]; 
  isLastPage: boolean;
}) {
  return (
    <div className="w-full h-full flex bg-white">
      {/* 왼쪽 페이지 */}
      <div className="flex-1 border-r border-gray-200">
        <PageViewer page={currentPage} />
      </div>

      {/* 오른쪽 페이지 */}
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

/* =====================
 * PageViewer 컴포넌트
 * ===================== */
function PageViewer({ page }: { page: CompletedWork['pages'][0] }) {
  const imageStyle = page.content.imageStyle;
  const textStyle = page.content.textStyle;

  return (
    <div className="w-full h-full flex flex-col relative bg-white text-black overflow-hidden">
      {/* 템플릿 기반 페이지 */}
      {page.type === 'TEMPLATE' && page.content.elements ? (
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
                fontSize: typeof element.style.fontSize === 'number' ? `${Math.min(element.style.fontSize, 14)}px` : '12px'
              }}
            >
              {element.type === 'text' && (
                <div 
                  className="w-full h-full flex items-start text-gray-800 leading-tight overflow-hidden"
                  style={{
                    color: typeof element.style.color === 'string' ? element.style.color : '#333',
                    textAlign: typeof element.style.textAlign === 'string' ? element.style.textAlign as 'left' | 'center' | 'right' : 'left',
                    fontWeight: typeof element.style.fontWeight === 'string' ? element.style.fontWeight : 'normal',
                    fontStyle: typeof element.style.fontStyle === 'string' ? element.style.fontStyle : 'normal'
                  }}
                >
                  <span className="line-clamp-6">
                    {element.content || element.placeholder || '텍스트'}
                  </span>
                </div>
              )}
              {element.type === 'placeholder' && (
                <div className="w-full h-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 ml-1">이미지 없음</span>
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
                  console.error('페이지 이미지 로드 실패:', page.content.image);
                  e.currentTarget.style.display = 'none';
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
                  textAlign: textStyle?.align || page.content.textAlign || "left",
                  fontWeight: textStyle?.bold ? "bold" : page.content.fontWeight || "normal",
                  fontStyle: textStyle?.italic ? "italic" : "normal",
                  fontFamily: textStyle?.fontFamily || page.content.fontFamily || "inherit",
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
          {!page.content.image && !page.content.text && (!page.content.elements || page.content.elements.length === 0) && (
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
function PageThumbnail({ page }: { page: CompletedWork['pages'][0] }) {
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