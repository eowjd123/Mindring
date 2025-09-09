// src/app/dashboard/books/page.tsx
"use client";

import {
  Book,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
} from "lucide-react";
import React, { useEffect, useState } from "react";

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
  _count: {
    pages: number;
  };
}

// Kakao SDK 타입
declare global {
  interface Window {
    Kakao?: {
      Link: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
        }) => void;
      };
    };
  }
}

/* =====================
 * 유틸리티 함수
 * ===================== */
const normalizeStatus = (status?: string): string => {
  if (!status) return "draft";
  const normalized = status.toLowerCase();
  return normalized;
};

const normalizePageType = (type?: string): "TEXT" | "IMAGE" | "MIXED" => {
  if (!type) return "TEXT";
  const normalized = type.toUpperCase();
  if (normalized === "IMAGE") return "IMAGE";
  if (normalized === "MIXED") return "MIXED";
  return "TEXT";
};

const extractPageContent = (page: ServerPageResponse): PageContent => {
  // contentJson을 우선으로 하고, 없으면 content 사용
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

/* =====================
 * 메인 컴포넌트
 * ===================== */
export default function BooksPage() {
  const [books, setBooks] = useState<CompletedWork[]>([]);
  const [selectedBook, setSelectedBook] = useState<CompletedWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval, setPlayInterval] = useState(4);

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isPlaying && selectedBook && selectedBook.pages.length > 1) {
      interval = setInterval(() => {
        setCurrentPage((prev) => {
          const nextPage = prev + 1;
          if (nextPage >= selectedBook.pages.length) {
            setIsPlaying(false);
            return prev;
          }
          return nextPage;
        });
      }, playInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playInterval, selectedBook]);

  // BooksPage 내부 loadBooks 교체
const loadBooks = async () => {
  try {
    console.log('📚 작품 목록을 불러오는 중...');

    // ✅ 서버에서 완료된 것만 받아오기
    const response = await fetch('/api/works?status=completed', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.error('❌ API 응답 오류:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as ServerWorkResponse[];
    console.log('📦 서버에서 받은 원본 데이터:', data);

    // ✅ 혹시 모를 상태 문자열 대비(완성만 남기기) + 최신순 정렬
    const completedWorks = data
      .filter((work) => normalizeStatus(work.status) === 'completed')
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    const transformedBooks: CompletedWork[] = completedWorks.map((work) => {
      const transformedPages = (work.pages || [])
        .map((page, index) => ({
          id: page.id || `page_${index}`,
          type: normalizePageType(page.contentType || page.type),
          content: extractPageContent(page),
          order:
            typeof page.orderIndex === 'number'
              ? page.orderIndex
              : typeof page.order === 'number'
              ? page.order
              : index,
        }))
        .sort((a, b) => a.order - b.order);

      return {
        id: work.id,
        title: work.title,
        coverImage: work.coverImage,
        createdAt: work.createdAt,
        updatedAt: work.updatedAt,
        status: work.status || 'completed',
        pages: transformedPages,
        _count: { pages: work._count?.pages || transformedPages.length },
      };
    });

    console.log('📚 최종 변환된 북 목록:', transformedBooks);
    setBooks(transformedBooks);

    // ✅ 항상 목록 뷰로 보이도록 초기화
    setSelectedBook(null);
    setCurrentPage(0);
    setIsPlaying(false);
  } catch (error) {
    console.error('❌ 북 로딩 오류:', error);
  } finally {
    setIsLoading(false);
  }
};


  const downloadBook = async (
    bookId: string,
    format: "pdf" | "epub" | "images"
  ) => {
    try {
      const response = await fetch(
        `/api/works/${bookId}/export?format=${format}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedBook?.title || "book"}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("다운로드 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    }
  };

  const shareBook = async (
    book: CompletedWork,
    method: "kakao" | "email" | "link"
  ) => {
    const shareUrl = `${window.location.origin}/dashboard/books/${book.id}/view`;
    const shareText = `${book.title} - 내가 만든 디지털 노트를 확인해보세요!`;

    switch (method) {
      case "kakao":
        if (window.Kakao) {
          window.Kakao.Link.sendDefault({
            objectType: "feed",
            content: {
              title: book.title,
              description: shareText,
              imageUrl: book.coverImage || "/default-cover.png",
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          });
        } else {
          alert("카카오톡 SDK가 로드되지 않았습니다.");
        }
        break;

      case "email": {
        const emailSubject = encodeURIComponent(
          `${book.title} - 디지털 노트 공유`
        );
        const emailBody = encodeURIComponent(
          `안녕하세요,\n\n${shareText}\n\n다음 링크에서 확인하실 수 있습니다:\n${shareUrl}`
        );
        window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
        break;
      }

      case "link":
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert("링크가 클립보드에 복사되었습니다.");
        } catch (error) {
          console.error("Copy to clipboard failed:", error);
          prompt("다음 링크를 복사하세요:", shareUrl);
        }
        break;
    }
  };

  const nextPage = () => {
    if (selectedBook && currentPage < selectedBook.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">완성된 북을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Book className="mr-3 h-8 w-8 text-indigo-600" />
                만든 북 보기
              </h1>
              <p className="text-gray-600 mt-2">
                완성된 작품을 보고 공유하세요
              </p>
              {/* 디버그 정보 */}
              <p className="text-xs text-gray-400 mt-1">
                완성된 작품 수: {books.length}
              </p>
            </div>

            {selectedBook && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">재생 간격:</span>
                  <select
                    value={playInterval}
                    onChange={(e) => setPlayInterval(parseInt(e.target.value))}
                    className="text-sm border-none bg-transparent focus:ring-0"
                  >
                    <option value="2">2초</option>
                    <option value="3">3초</option>
                    <option value="4">4초</option>
                    <option value="5">5초</option>
                    <option value="10">10초</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSelectedBook(null);
                    setCurrentPage(0);
                    setIsPlaying(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  목록으로
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedBook ? (
          /* Book Viewer */
          <BookViewer
            book={selectedBook}
            currentPage={currentPage}
            isPlaying={isPlaying}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            onTogglePlay={togglePlay}
            onDownload={downloadBook}
            onShare={shareBook}
            onPageChange={setCurrentPage}
          />
        ) : (
          /* Book Library */
          <div>
            {books.length === 0 ? (
              <div className="text-center py-16">
                <Book className="mx-auto h-20 w-20 text-gray-300 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  아직 완성된 작품이 없습니다
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  작업실에서 작품을 완성하면 여기에서 확인할 수 있습니다
                </p>
                <div className="space-y-4">
                  <Link
                    href="/dashboard/create-work"
                    className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg transition-all hover:shadow-xl"
                  >
                    새 작품 만들기
                  </Link>
                  <br />
                  <button
                    onClick={loadBooks}
                    className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    목록 새로고침
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onSelect={() => {
                      setSelectedBook(book);
                      setCurrentPage(0);
                      setIsPlaying(false);
                    }}
                    onDownload={downloadBook}
                    onShare={shareBook}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================
 * BookCard 컴포넌트
 * ===================== */
interface BookCardProps {
  book: CompletedWork;
  onSelect: () => void;
  onDownload: (bookId: string, format: "pdf" | "epub" | "images") => void;
  onShare: (book: CompletedWork, method: "kakao" | "email" | "link") => void;
}

function BookCard({ book, onSelect, onDownload, onShare }: BookCardProps) {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Cover */}
      <div
        className="aspect-[3/4] bg-gradient-to-br from-indigo-100 to-blue-100 relative overflow-hidden cursor-pointer"
        onClick={onSelect}
      >
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="h-16 w-16 text-indigo-300" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-white">
              <Eye className="inline mr-2 h-4 w-4" />
              읽기
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="font-semibold text-gray-900 mb-2 truncate"
          title={book.title}
        >
          {book.title}
        </h3>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <FileText className="mr-1 h-4 w-4" />
          <span>{book._count.pages}개 페이지</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>{new Date(book.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onSelect}
            className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Eye className="mr-2 h-4 w-4" />
            읽기
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative group">
              <button className="w-full flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="mr-1 h-4 w-4" />
                다운로드
              </button>
              {/* Download Dropdown */}
              <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  <button
                    onClick={() => onDownload(book.id, "pdf")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    PDF 다운로드
                  </button>
                  <button
                    onClick={() => onDownload(book.id, "images")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    이미지 다운로드
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="w-full flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Share2 className="mr-1 h-4 w-4" />
                공유
              </button>
              {/* Share Dropdown */}
              <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  <button
                    onClick={() => onShare(book, "kakao")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    카카오톡
                  </button>
                  {/* <button
                    onClick={() => onShare(book, "email")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    이메일
                  </button> */}
                  <button
                    onClick={() => onShare(book, "link")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    링크 복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================
 * BookViewer 컴포넌트
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
}: BookViewerProps) {
  const currentPageData = book.pages[currentPage];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Book Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {book.title}
            </h2>
            <p className="text-sm text-gray-600">
              {currentPage + 1} / {book.pages.length} 페이지
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Download Button */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  <button
                    onClick={() => onDownload(book.id, "pdf")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    PDF로 내려받기
                  </button>
                  <button
                    onClick={() => onDownload(book.id, "images")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    이미지로 내려받기
                  </button>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Share2 className="mr-2 h-4 w-4" />
                공유하기
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  <button
                    onClick={() => onShare(book, "kakao")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    카카오톡으로 공유
                  </button>
                  <button
                    onClick={() => onShare(book, "email")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    이메일로 공유
                  </button>
                  <button
                    onClick={() => onShare(book, "link")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    링크 복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Content */}
      <div className="aspect-[4/3] bg-gray-100 relative">
        {currentPageData ? (
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* 이미지 페이지 */}
            {currentPageData.type === "IMAGE" &&
              currentPageData.content.image && (
                <img
                  src={currentPageData.content.image}
                  alt="Page content"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  style={{
                    transform: `
                    rotate(${
                      currentPageData.content.imageStyle?.rotation || 0
                    }deg)
                    scaleX(${
                      currentPageData.content.imageStyle?.flipH ? -1 : 1
                    })
                    scaleY(${
                      currentPageData.content.imageStyle?.flipV ? -1 : 1
                    })
                  `,
                  }}
                />
              )}

            {/* 텍스트 페이지 */}
            {currentPageData.type === "TEXT" &&
              currentPageData.content.text && (
                <div
                  className="w-full h-full flex items-center bg-white rounded-lg shadow-sm p-8"
                  style={{
                    fontSize:
                      currentPageData.content.fontSize ||
                      currentPageData.content.textStyle?.fontSize ||
                      16,
                    color:
                      currentPageData.content.color ||
                      currentPageData.content.textStyle?.color ||
                      "#000000",
                    textAlign:
                      currentPageData.content.textAlign ||
                      currentPageData.content.textStyle?.align ||
                      "left",
                    fontWeight:
                      currentPageData.content.fontWeight ||
                      (currentPageData.content.textStyle?.bold
                        ? "bold"
                        : "normal"),
                    fontStyle: currentPageData.content.textStyle?.italic
                      ? "italic"
                      : "normal",
                    fontFamily:
                      currentPageData.content.fontFamily ||
                      currentPageData.content.textStyle?.fontFamily ||
                      "inherit",
                  }}
                >
                  <div className="whitespace-pre-wrap">
                    {currentPageData.content.text}
                  </div>
                </div>
              )}

            {/* 혼합 페이지 */}
            {currentPageData.type === "MIXED" && (
              <div className="w-full h-full bg-white rounded-lg shadow-sm overflow-hidden">
                {currentPageData.content.image && (
                  <div className="h-1/2 flex items-center justify-center bg-gray-50">
                    <img
                      src={currentPageData.content.image}
                      alt="Page content"
                      className="max-w-full max-h-full object-contain"
                      style={{
                        transform: `
                          rotate(${
                            currentPageData.content.imageStyle?.rotation || 0
                          }deg)
                          scaleX(${
                            currentPageData.content.imageStyle?.flipH ? -1 : 1
                          })
                          scaleY(${
                            currentPageData.content.imageStyle?.flipV ? -1 : 1
                          })
                        `,
                      }}
                    />
                  </div>
                )}
                {currentPageData.content.text && (
                  <div
                    className="h-1/2 p-6 overflow-y-auto"
                    style={{
                      fontSize:
                        currentPageData.content.fontSize ||
                        currentPageData.content.textStyle?.fontSize ||
                        16,
                      color:
                        currentPageData.content.color ||
                        currentPageData.content.textStyle?.color ||
                        "#000000",
                      textAlign:
                        currentPageData.content.textAlign ||
                        currentPageData.content.textStyle?.align ||
                        "left",
                      fontWeight:
                        currentPageData.content.fontWeight ||
                        (currentPageData.content.textStyle?.bold
                          ? "bold"
                          : "normal"),
                      fontStyle: currentPageData.content.textStyle?.italic
                        ? "italic"
                        : "normal",
                      fontFamily:
                        currentPageData.content.fontFamily ||
                        currentPageData.content.textStyle?.fontFamily ||
                        "inherit",
                    }}
                  >
                    <div className="whitespace-pre-wrap">
                      {currentPageData.content.text}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">페이지 내용이 없습니다</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex items-center justify-center space-x-4">
          {/* Previous Button */}
          <button
            onClick={onPrevPage}
            disabled={currentPage === 0}
            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="이전 페이지"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={book.pages.length <= 1}
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? "일시정지" : "자동재생"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={onNextPage}
            disabled={currentPage === book.pages.length - 1}
            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="다음 페이지"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Page Indicator */}
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            {book.pages.map((_, index) => (
              <button
                key={index}
                onClick={() => onPageChange(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentPage
                    ? "bg-indigo-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                title={`${index + 1}페이지`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
