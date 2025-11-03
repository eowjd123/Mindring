// src/app/dashboard/books/page.tsx

"use client";

import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Library,
  Plus,
  Search,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

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
  const [books, setBooks] = useState<CompletedWork[]>([]);
  const [selectedBook, setSelectedBook] = useState<CompletedWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CompletedWork | null>(null);

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

  const deleteBook = async (bookId: string) => {
    try {
      const res = await fetch(`/api/works/${bookId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
        setCurrentPage(0);
        setIsPlaying(false);
        setIsFullscreen(false);
      }
      setPendingDelete(null);
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
      console.error(e);
    }
  };

  /* ========== 로딩 화면 ========== */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-teal-600 rounded-full animate-pulse mx-auto" />
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
        isFullscreen={isFullscreen}
        debugMode={debugMode}
        onNextPage={goToNextPage}
        onPrevPage={goToPreviousPage}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onDownload={downloadBook}
        onShare={shareBook}
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
      {/* Header - Preview page style */}
      <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left - Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Library className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Digital Library</h2>
                <p className="text-sm text-gray-600">당신만의 특별한 작품 컬렉션</p>
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  placeholder="작품 검색하기..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white border-2 border-gray-300 focus:border-teal-400 focus:ring-teal-100 rounded-lg shadow-sm"
                />
              </div>
              <Link
                href="/dashboard/create-work"
                className="inline-flex items-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4" />
                새 작품 만들기
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1920px] px-4 sm:px-6 py-6 space-y-8">
        <BookshelfSection
          title="완성된 작품"
          subtitle="소중한 추억이 담긴 완성작들"
          books={grouped.finished}
          onSelect={setSelectedBook}
          onDeleteRequest={(b) => setPendingDelete(b)}
        />

        <ShelfSection
          title="현재 읽고 있는 작품"
          subtitle="진행 중인 작품들"
          books={grouped.current.slice(0, 8)}
          onSelect={setSelectedBook}
          variant="current"
          onDeleteRequest={(b) => setPendingDelete(b)}
        />
      </main>

      {/* Delete Confirm Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingDelete(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">작품 삭제</h3>
            <p className="text-sm text-gray-600 mb-6">정말로 &quot;{pendingDelete.title}&quot; 작품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => deleteBook(pendingDelete.id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

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
  onDeleteRequest,
}: {
  title: string;
  subtitle: string;
  books: CompletedWork[];
  // eslint-disable-next-line no-unused-vars
  onSelect: (_: CompletedWork) => void;
  variant: "current" | "next" | "finished";
  // eslint-disable-next-line no-unused-vars
  onDeleteRequest: (_: CompletedWork) => void;
}) {
  const solidColors = {
    current: "bg-teal-600",
    next: "bg-teal-700",
    finished: "bg-teal-800",
  };

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
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
            <div className={`w-16 h-16 ${solidColors[variant]} rounded-2xl mx-auto flex items-center justify-center opacity-50`}>
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
                onDeleteRequest={() => onDeleteRequest(book)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* =====================
 * BookshelfSection - 이미지 스타일 책장 레이아웃
 * ===================== */
function BookshelfSection({
  title,
  subtitle,
  books,
  onSelect,
  onDeleteRequest,
}: {
  title: string;
  subtitle: string;
  books: CompletedWork[];
  // eslint-disable-next-line no-unused-vars
  onSelect: (book: CompletedWork) => void;
  // eslint-disable-next-line no-unused-vars
  onDeleteRequest: (book: CompletedWork) => void;
}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const shelfRef = React.useRef<HTMLDivElement>(null);

  // 상단/하단 책장으로 나누기 (각각 최대 10개)
  const topShelf = books.slice(0, 10);
  const bottomShelf = books.slice(10, 20);

  const scrollLeft = () => {
    if (shelfRef.current) {
      const newPosition = Math.max(0, scrollPosition - 400);
      shelfRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (shelfRef.current) {
      const maxScroll = shelfRef.current.scrollWidth - shelfRef.current.clientWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + 400);
      shelfRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="space-y-6">
      {/* Shelf-style container same as '현재 읽고 있는 작품' */}
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
        {/* 헤더 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            {title}
          </h2>
          <p className="text-gray-700 font-medium">{subtitle}</p>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-teal-800 rounded-2xl mx-auto flex items-center justify-center opacity-50">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 font-medium">아직 작품이 없습니다</p>
              <p className="text-sm text-gray-600">새로운 작품을 만들어보세요!</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* 좌측 네비게이션 화살표 */}
            {books.length > 10 && (
              <button
                onClick={scrollLeft}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border-2 border-gray-300 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                aria-label="이전 책 보기"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
            )}

            {/* 책장 컨테이너 */}
            <div
              ref={shelfRef}
              className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
              onScroll={(e) => setScrollPosition((e.target as HTMLDivElement).scrollLeft)}
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none'
              }}
            >
              <div className="space-y-12 min-w-max px-2 sm:px-4">
                {/* 상단 책장 */}
                <div className="relative pt-4">
                  {/* 책들 */}
                  <div className="flex gap-4 sm:gap-6 pt-2 px-4">
                    {topShelf.map((book) => (
                      <div key={book.id} className="w-[140px] h-[180px] md:w-[160px] md:h-[210px] xl:w-[200px] xl:h-[260px] flex-shrink-0 flex items-center justify-center">
                        <div className="w-full h-full">
                          <BookCover
                            book={book}
                            onClick={() => onSelect(book)}
                            variant="finished"
                            onDeleteRequest={() => onDeleteRequest(book)}
                          />
                        </div>
                      </div>
                    ))}
                    {/* 빈 슬롯 채우기 */}
                    {Array.from({ length: Math.max(0, 10 - topShelf.length) }).map((_, i) => (
                      <div key={`empty-top-${i}`} className="w-[140px] h-[180px] md:w-[160px] md:h-[210px] xl:w-[200px] xl:h-[260px] flex-shrink-0" />
                    ))}
                  </div>
                  {/* 책장 선(아래) */}
                  <div className="mt-3 h-3 bg-gradient-to-b from-white to-gray-300 rounded-md shadow-[0_8px_16px_rgba(0,0,0,0.15)]" />
                </div>

                {/* 하단 책장 */}
                {bottomShelf.length > 0 && (
                  <div className="relative mt-12 pt-4">
                    {/* 책들 */}
                    <div className="flex gap-4 sm:gap-6 pt-2 px-4">
                      {bottomShelf.map((book) => (
                        <div key={book.id} className="w-[140px] h-[180px] md:w-[160px] md:h-[210px] xl:w-[200px] xl:h-[260px] flex-shrink-0 flex items-center justify-center">
                          <div className="w-full h-full">
                            <BookCover
                              book={book}
                              onClick={() => onSelect(book)}
                              variant="finished"
                              onDeleteRequest={() => onDeleteRequest(book)}
                            />
                          </div>
                        </div>
                      ))}
                      {/* 빈 슬롯 채우기 */}
                      {Array.from({ length: Math.max(0, 10 - bottomShelf.length) }).map((_, i) => (
                        <div key={`empty-bottom-${i}`} className="w-[140px] h-[180px] md:w-[160px] md:h-[210px] xl:w-[200px] xl:h-[260px] flex-shrink-0" />
                      ))}
                    </div>
                    {/* 책장 선(아래) */}
                    <div className="mt-3 h-3 bg-gradient-to-b from-white to-gray-300 rounded-md shadow-[0_8px_16px_rgba(0,0,0,0.15)]" />
                  </div>
                )}
              </div>
            </div>

            {/* 우측 네비게이션 화살표 */}
            {books.length > 10 && (
              <button
                onClick={scrollRight}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border-2 border-gray-300 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                aria-label="다음 책 보기"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>
            )}
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
  onDeleteRequest,
}: {
  book: CompletedWork;
  onClick: () => void;
  variant: "current" | "next" | "finished";
  onDeleteRequest: () => void;
}) {
  // 표지 이미지 선택: 1) book.coverImage, 2) 첫 페이지의 메인 이미지, 3) 첫 이미지 요소
  const cover: string | undefined = (() => {
    if (book.coverImage && typeof book.coverImage === "string" && book.coverImage.trim()) {
      return book.coverImage;
    }
    const firstPage = book.pages && book.pages.length > 0 ? book.pages[0] : undefined;
    if (!firstPage || !firstPage.content) return undefined;
    // 메인 이미지 우선
    if (firstPage.content.image && typeof firstPage.content.image === "string") {
      return firstPage.content.image;
    }
    // elements에서 이미지 요소 탐색
    const imgEl = (firstPage.content.elements || []).find((el) => el.type === "image" && !!el.content);
    if (imgEl && typeof imgEl.content === "string") {
      return imgEl.content as string;
    }
    return undefined;
  })();

  const placeholderColors = {
    current: "bg-teal-600",
    next: "bg-teal-700",
    finished: "bg-teal-800",
  };

  return (
    <div
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200"
      title={book.title}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {cover ? (
        <div className="relative w-full h-full">
          <Image
            src={cover}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="100%"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className={`w-full h-full ${placeholderColors[variant]} flex flex-col items-center justify-center relative overflow-hidden`}>
          <Calendar className="h-12 w-12 text-white/90 mx-auto" />
          <div className="px-4 mt-2">
            <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
              {book.title}
            </p>
          </div>
        </div>
      )}

      {/* 페이지 수 배지 */}
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur text-white text-xs font-semibold rounded-full">
        {book._count.pages}p
      </div>

      {/* 삭제 버튼 */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteRequest();
          }}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded"
          aria-label="작품 삭제"
          title="작품 삭제"
        >
          삭제
        </button>
      </div>

      {/* 호버 정보 */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{book.title}</h3>
        <p className="text-xs text-gray-300">
          {new Date(book.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

/* =====================
 * 개선된 BookViewer 컴포넌트
 * ===================== */
interface ImprovedBookViewerProps {
  book: CompletedWork;
  currentPage: number;
  isFullscreen: boolean;
  debugMode: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onToggleFullscreen: () => void;
  // eslint-disable-next-line no-unused-vars
  onDownload: (_: string, __: "pdf" | "epub" | "images") => void;
  // eslint-disable-next-line no-unused-vars
  onShare: (_: CompletedWork, __: "kakao" | "email" | "link") => void;
  onBack: () => void;
}

function ImprovedBookViewer({
  book,
  currentPage,
  isFullscreen,
  debugMode,
  onNextPage,
  onPrevPage,
  onToggleFullscreen,
  onDownload,
  onShare,
  onBack,
}: ImprovedBookViewerProps) {
  // ✨ 표지 제외한 내지 페이지
  const contentPages = React.useMemo(() => getContentPages(book), [book]);

  // 현재/다음 페이지는 contentPages를 기준으로
  const currentPageData = contentPages[currentPage];
  const nextPage = contentPages[currentPage + 1];

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Header - Preview page style */}
      {!isFullscreen && (
        <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left - Title */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{book.title}</h2>
                  <p className="text-sm text-gray-600">
                    {contentPages.length}페이지 • {currentPage + 1}/{contentPages.length}페이지
                  </p>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="돌아가기"
                  aria-label="이전 페이지로 돌아가기"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={() => onDownload(book.id, "pdf")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  title="PDF 파일 다운로드"
                  aria-label="PDF 파일 다운로드"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={() => onShare(book, "link")}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  title="작품 공유하기"
                  aria-label="작품 공유하기"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">공유</span>
                </button>
                <button
                  onClick={onToggleFullscreen}
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
        {contentPages.length > 0 && currentPageData ? (
          <>
            {/* Book Viewer Container */}
            <div className="relative w-full max-w-7xl">
              <div 
                className="relative bg-white rounded-2xl shadow-xl overflow-hidden mx-auto border-2 border-gray-300 transition-all duration-700 ease-in-out"
                style={{ 
                  aspectRatio: "210 / 297", // A4 비율
                  maxHeight: isFullscreen ? '85vh' : '75vh', 
                  maxWidth: isFullscreen ? '90vw' : '80vw',
                  width: '100%',
                  transformStyle: 'preserve-3d'
                }}
              >
                <BookPagesViewer
                  currentPage={currentPageData}
                  nextPage={nextPage}
                  isLastPage={currentPage >= contentPages.length - 1}
                  debugMode={debugMode}
                />
              </div>

              {/* Left Navigation Button */}
              <button
                onClick={onPrevPage}
                disabled={currentPage === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border-2 border-gray-200"
                title="이전 페이지 (← 키)"
                aria-label={`이전 페이지로 이동 (현재 ${currentPage + 1}페이지)`}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Right Navigation Button */}
              <button
                onClick={onNextPage}
                disabled={currentPage >= contentPages.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border-2 border-gray-200"
                title="다음 페이지 (→ 키)"
                aria-label={`다음 페이지로 이동 (현재 ${currentPage + 1}페이지)`}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Fullscreen Controls */}
            {isFullscreen && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Top Controls Bar */}
                <div className="absolute top-0 left-0 right-0 pointer-events-auto">
                  <div className="bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-md">
                    <div className="flex items-center justify-between px-6 py-4">
                      {/* Center - Work Title */}
                      <div className="flex-1 text-center px-4">
                        <h2 className="text-white text-lg font-bold truncate max-w-md mx-auto">
                          {book.title}
                        </h2>
                        <p className="text-white/80 text-sm">
                          페이지 {currentPage + 1} / {contentPages.length}
                        </p>
                      </div>

                      {/* Right Side - Exit Fullscreen */}
                      <button
                        onClick={onToggleFullscreen}
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
                <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
                  <div className="bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-md">
                    <div className="flex items-center justify-center px-6 py-4">
                      {/* Page Navigation */}
                      <div className="flex items-center gap-6">
                        {/* Previous Page */}
                        <button
                          onClick={onPrevPage}
                          disabled={currentPage === 0}
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
                              {currentPage + 1}
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
                                width: `${((currentPage + 1) / contentPages.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Next Page */}
                        <button
                          onClick={onNextPage}
                          disabled={currentPage >= contentPages.length - 1}
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
              </div>
            )}
          </>
        ) : (
          /* No Pages */
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
                이 작품에는 표지만 있고 내용 페이지가 없습니다.
              </p>
            </div>
          </div>
        )}
      </div>

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
                <div className="relative w-full h-full rounded overflow-hidden">
                  <Image
                    src={element.content}
                    alt="Page element"
                    fill
                    className="object-cover rounded"
                    sizes="100%"
                  />
                </div>
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
                />
              </div>
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

