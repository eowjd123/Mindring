"use client";

import {
  Book,
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  Library,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import Link from "next/link";

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
    type: "TEXT" | "IMAGE" | "MIXED";
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

const normalizePageType = (type?: string): "TEXT" | "IMAGE" | "MIXED" => {
  if (!type) return "TEXT";
  const t = type.toUpperCase();
  return t === "IMAGE" ? "IMAGE" : t === "MIXED" ? "MIXED" : "TEXT";
};

const extractPageContent = (page: ServerPageResponse): PageContent => {
  const content = page.contentJson || page.content || {};
  return {
    text: content.text,
    image: content.imageUrl || content.image,
    imageUrl: content.imageUrl || content.image,
    fontSize: content.fontSize,
    fontFamily: content.fontFamily,
    fontWeight: content.fontWeight,
    color: content.color,
    textAlign: content.textAlign,
    imagePosition: content.imagePosition,
    imageSize: content.imageSize,
    textStyle: content.textStyle,
    imageStyle: content.imageStyle,
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
  const [books, setBooks] = useState<CompletedWork[]>([]);
  const [selectedBook, setSelectedBook] = useState<CompletedWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && selectedBook && selectedBook.pages.length > 1) {
      t = setInterval(() => {
        setCurrentPage((p) => {
          const next = p + 1;
          if (!selectedBook || next >= selectedBook.pages.length) return p;
          return next;
        });
      }, playInterval * 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isPlaying, playInterval, selectedBook]);

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
    const shareUrl = `${window.location.origin}/dashboard/books/${book.id}/view`;
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

  /* ========== 단일 작품 뷰어 ========== */
  if (selectedBook) {
    return (
      <BookViewer
        book={selectedBook}
        currentPage={currentPage}
        isPlaying={isPlaying}
        onNextPage={() => {
          if (currentPage < selectedBook.pages.length - 1)
            setCurrentPage(currentPage + 1);
        }}
        onPrevPage={() => {
          if (currentPage > 0) setCurrentPage(currentPage - 1);
        }}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onDownload={downloadBook}
        onShare={shareBook}
        onPageChange={setCurrentPage}
        onBack={() => {
          setSelectedBook(null);
          setCurrentPage(0);
          setIsPlaying(false);
        }}
      />
    );
  }

  /* ========== 현대적인 라이브러리 ========== */
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
 * BookCover (현대적인 표지 디자인)
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
 * BookViewer (현대적인 뷰어 디자인)
 * ===================== */
interface BookViewerProps {
  book: CompletedWork;
  currentPage: number;
  isPlaying: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onTogglePlay: () => void;
  onDownload: (bookId: string, format: "pdf" | "epub" | "images") => void;
  onShare: (book: CompletedWork, method: "kakao" | "email" | "link") => void;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

function BookViewer({
  book,
  currentPage,
  isPlaying,
  onNextPage,
  onPrevPage,
  onTogglePlay,
  onDownload,
  onShare,
  onPageChange,
  onBack,
}: BookViewerProps) {
  const current = book.pages[currentPage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 현대적인 헤더 */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">라이브러리로 돌아가기</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{book.title}</h2>
                <p className="text-sm text-gray-500">
                  <span className="inline-flex items-center space-x-2">
                    <span>{currentPage + 1} / {book.pages.length}</span>
                    <span>•</span>
                    <span>{book._count.pages}페이지</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => onDownload(book.id, "pdf")}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF 다운로드
              </button>
              <button
                onClick={() => onShare(book, "link")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Share2 className="mr-2 h-4 w-4" />
                공유하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 책 뷰어 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {/* 페이지 콘텐츠 */}
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-8">
            {current ? (
              <>
                {current.type === "IMAGE" && current.content.image && (
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={current.content.image}
                      alt="페이지 이미지"
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                    />
                  </div>
                )}
                {current.type === "TEXT" && current.content.text && (
                  <div
                    className="w-full h-full overflow-auto bg-white rounded-2xl shadow-inner p-8 prose prose-lg max-w-none"
                    style={{
                      fontSize: current.content.fontSize || 16,
                      color: current.content.color || "#374151",
                      textAlign: current.content.textAlign || "left",
                      fontFamily: current.content.fontFamily || "system-ui",
                    }}
                  >
                    {current.content.text}
                  </div>
                )}
                {current.type === "MIXED" && (
                  <div className="w-full h-full space-y-6">
                    <div className="flex-1 flex items-center justify-center bg-white rounded-2xl shadow-inner p-6">
                      {current.content.image && (
                        <img
                          src={current.content.image}
                          alt="페이지 이미지"
                          className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                        />
                      )}
                    </div>
                    <div
                      className="flex-1 bg-white rounded-2xl shadow-inner p-6 overflow-auto prose max-w-none"
                      style={{
                        fontSize: current.content.fontSize || 16,
                        color: current.content.color || "#374151",
                        textAlign: current.content.textAlign || "left",
                        fontFamily: current.content.fontFamily || "system-ui",
                      }}
                    >
                      {current.content.text}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">페이지를 찾을 수 없습니다</p>
              </div>
            )}
          </div>

          {/* 현대적인 컨트롤 패널 */}
          <div className="p-8 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200/50">
            {/* 메인 컨트롤 */}
            <div className="flex items-center justify-center space-x-6 mb-8">
              <button
                onClick={onPrevPage}
                disabled={currentPage === 0}
                className="p-4 bg-white border-2 border-gray-200 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <SkipBack className="h-5 w-5 text-gray-700" />
              </button>
              
              <button
                onClick={onTogglePlay}
                disabled={book.pages.length <= 1}
                className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              
              <button
                onClick={onNextPage}
                disabled={currentPage === book.pages.length - 1}
                className="p-4 bg-white border-2 border-gray-200 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <SkipForward className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* 페이지 인디케이터 */}
            <div className="flex items-center justify-center space-x-3 overflow-x-auto pb-2">
              {book.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`relative flex-shrink-0 transition-all duration-300 ${
                    i === currentPage
                      ? "w-12 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg"
                      : "w-4 h-4 bg-gray-300 hover:bg-gray-400 rounded-full"
                  }`}
                  title={`${i + 1}페이지로 이동`}
                >
                  {i === currentPage && (
                    <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* 진행률 표시 */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="font-medium">읽기 진행률</span>
                <span className="font-bold text-blue-600">
                  {Math.round(((currentPage + 1) / book.pages.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
                  style={{
                    width: `${((currentPage + 1) / book.pages.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}