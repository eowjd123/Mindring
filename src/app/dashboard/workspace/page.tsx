// src/app/dashboard/workspace/page.tsx
"use client";

import {
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  Edit2,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import Link from "next/link";

/* ========= Types ========= */
type WorkStatus = "DRAFT" | "COMPLETED" | "PUBLISHED";
type SortKey = "updatedAt" | "createdAt" | "title";
type FilterStatus = "all" | WorkStatus;

type ServerPageType = "TEXT" | "IMAGE" | "MIXED" | "text" | "image" | "mixed";

interface WorkPage {
  id: string;
  type: "TEXT" | "IMAGE" | "MIXED";
  order: number;
}

interface WorkCount {
  pages: number;
}

interface Work {
  id: string;
  title: string;
  status: WorkStatus;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  pages: WorkPage[];
  _count: WorkCount;
}

/* 서버 응답 타입 (어댑터용) */
interface ServerWork {
  id: string;
  title: string;
  status?: string;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  pages?: Array<{
    id?: string;
    type?: ServerPageType;
    contentType?: ServerPageType;
    order?: number;
    orderIndex?: number;
  }>;
  _count?: { pages?: number };
}

/* ========= Status Config ========= */
const statusConfig: Record<
  WorkStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  DRAFT: {
    label: "작업중",
    color: "bg-yellow-100 text-yellow-800",
    icon: Edit2,
  },
  COMPLETED: {
    label: "완료",
    color: "bg-green-100 text-green-800",
    icon: FileText,
  },
  PUBLISHED: { label: "발행됨", color: "bg-blue-100 text-blue-800", icon: Eye },
};

/* ========= Helpers ========= */
const pageTypeAdapter = (t?: ServerPageType): WorkPage["type"] => {
  const up = (t ?? "").toString().toUpperCase();
  if (up === "IMAGE") return "IMAGE";
  if (up === "MIXED") return "MIXED";
  return "TEXT";
};

const statusAdapter = (s?: string): WorkStatus => {
  const up = (s ?? "").toUpperCase();
  if (up === "COMPLETED") return "COMPLETED";
  if (up === "PUBLISHED") return "PUBLISHED";
  return "DRAFT";
};

const toIsoStringOrNow = (v?: string) => (v ? v : new Date().toISOString());

const adaptServerWork = (w: ServerWork): Work => {
  const pagesRaw = w.pages ?? [];
  const pages: Work["pages"] = pagesRaw
    .map((p, i) => ({
      id: p.id ?? `page_${w.id}_${i}`,
      type: pageTypeAdapter(p.type ?? p.contentType),
      order:
        typeof p.order === "number"
          ? p.order
          : typeof p.orderIndex === "number"
          ? p.orderIndex
          : i,
    }))
    .sort((a, b) => a.order - b.order);

  const count = w._count?.pages ?? pages.length;

  return {
    id: w.id,
    title: w.title ?? "",
    status: statusAdapter(w.status),
    coverImage: w.coverImage,
    createdAt: toIsoStringOrNow(w.createdAt),
    updatedAt: toIsoStringOrNow(w.updatedAt),
    pages,
    _count: { pages: count },
  };
};

/* ========= API ========= */
async function fetchWorksFromServer(status?: WorkStatus): Promise<Work[]> {
  const url = new URL("/api/works", window.location.origin);
  if (status) url.searchParams.set("status", status);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    let msg = "Failed to load works";
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as ServerWork[];
  return data.map(adaptServerWork);
}

export default function WorkspacePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortKey>("updatedAt");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const list = await fetchWorksFromServer();
        if (!cancelled) setWorks(list);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error
              ? e.message
              : "작업 목록을 불러오는 중 오류가 발생했습니다."
          );
          setWorks([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredWorks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return works.filter((w) => {
      const matchesSearch = q.length === 0 || w.title.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ? true : w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [works, searchQuery, statusFilter]);

  const sortedWorks = useMemo(() => {
    const arr = [...filteredWorks];
    arr.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "updatedAt":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });
    return arr;
  }, [filteredWorks, sortBy]);

  const deleteWork = async (workId: string) => {
    const ok = window.confirm(
      "이 작품을 삭제하시겠습니까? 삭제된 작품은 복구할 수 없습니다."
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/works/${workId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("작품 삭제 중 오류가 발생했습니다.");
        return;
      }
      setWorks((prev) => prev.filter((w) => w.id !== workId));
    } catch (e) {
      console.error("Delete work error:", e);
      alert("작품 삭제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">작업실을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-5">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-end mb-3 sm:mb-4">
            <nav className="flex items-center gap-4 sm:gap-6 text-sm text-gray-600">
              <a 
                className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105" 
                href="/dashboard"
                title="대시보드로 이동"
              >
                <span className="group-hover:text-gray-900 transition-colors">대시보드</span>
              </a>
              <a 
                className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105" 
                href="/dashboard/life-graph"
                title="인생그래프로 이동"
              >
                <span className="group-hover:text-gray-900 transition-colors">인생그래프</span>
              </a>
              <a 
                className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105" 
                href="/api/auth/logout"
                title="로그아웃"
              >
                <span className="group-hover:text-gray-900 transition-colors">로그아웃</span>
              </a>
            </nav>
          </div>

          {/* Main Header Row */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                <div className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg width="24" height="24" viewBox="0 0 48 48" className="text-white">
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
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">그레이트 시니어</h1>
                <p className="text-sm text-gray-600">네트워크</p>
              </div>
            </div>

            {/* Page Title */}
            <div className="flex-1 text-center lg:text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-3 rounded-2xl border border-teal-100">
                <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-xl">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">작업실</h2>
                  <p className="text-sm text-gray-600">작업중인 작품들을 관리하세요</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/dashboard/create-work"
                className="group bg-teal-600 hover:bg-teal-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg"
                title="새 작품 만들기"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden sm:inline">새 작품 만들기</span>
                <span className="sm:hidden">새 작품</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Load error */}
        {loadError && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-lg">
            {loadError}
          </div>
        )}

        {/* Enhanced Search and Filter Bar */}
        <div className="mb-8 bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200/50 hover:shadow-3xl transition-all duration-500 group">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-100/30 to-blue-100/30 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 rounded-full translate-y-10 -translate-x-10 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Enhanced Search */}
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="🔍 작품 제목으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400 bg-white/80 backdrop-blur-sm text-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Status Filter */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" />
                  <span className="text-sm font-medium text-gray-600">상태</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as FilterStatus)
                  }
                  className="px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400 bg-white/80 backdrop-blur-sm text-lg font-medium"
                >
                  <option value="all">📋 모든 상태</option>
                  <option value="DRAFT">✏️ 작업중</option>
                  <option value="COMPLETED">✅ 완료</option>
                  <option value="PUBLISHED">📤 발행됨</option>
                </select>
              </div>

              {/* Enhanced Sort */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">정렬</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400 bg-white/80 backdrop-blur-sm text-lg font-medium"
                >
                  <option value="updatedAt">🕒 최근 수정순</option>
                  <option value="createdAt">📅 생성일순</option>
                  <option value="title">🔤 제목순</option>
                </select>
              </div>
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <div className="mt-4 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200">
                <div className="flex items-center space-x-2 text-sm text-teal-700">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    &quot;{searchQuery}&quot; 검색 결과: {filteredWorks.length}개 작품
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Works Grid */}
        {sortedWorks.length === 0 ? (
          <div className="text-center py-16">
            {works.length === 0 ? (
              <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl shadow-2xl p-12 sm:p-16 border border-gray-200/50 hover:shadow-3xl transition-all duration-500 group overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100/30 to-blue-100/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="relative z-10">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-12 w-12 text-teal-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce"></div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-teal-700 transition-colors duration-300">
                    🎨 아직 작업중인 작품이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                    첫 번째 작품을 만들어서 나만의 디지털 노트를 시작해보세요.<br />
                    <span className="text-teal-600 font-medium">창의적인 이야기를 담아보세요!</span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                      href="/dashboard/create-work"
                      className="group/btn inline-flex items-center px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-all duration-300 shadow-lg hover:scale-105 font-medium text-lg"
                    >
                      <Plus className="mr-2 h-6 w-6 group-hover/btn:rotate-90 transition-transform duration-200" />
                      첫 작품 만들기
                    </Link>
                    
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                      <span>간단하고 쉽게 시작할 수 있어요</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl shadow-2xl p-12 sm:p-16 border border-gray-200/50 hover:shadow-3xl transition-all duration-500 group overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100/30 to-red-100/30 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-100/30 to-indigo-100/30 rounded-full translate-y-10 -translate-x-10 group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="relative z-10">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-10 w-10 text-orange-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors duration-300">
                    🔍 검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    다른 검색어나 필터를 시도해보세요
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                    >
                      검색 초기화
                    </button>
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="px-6 py-3 bg-teal-200 hover:bg-teal-300 text-teal-800 rounded-xl transition-all duration-200 font-medium"
                    >
                      필터 초기화
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onDelete={() => void deleteWork(work.id)}
              />
            ))}
          </div>
        )}

        {/* Enhanced Stats */}
        {works.length > 0 && (
          <div className="mt-12 relative bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-200/50 hover:shadow-3xl transition-all duration-500 group overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-teal-100/30 to-blue-100/30 rounded-full -translate-y-14 translate-x-14 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-8 flex items-center group-hover:text-teal-700 transition-colors duration-300">
                📊 작업실 통계
                <div className="ml-auto w-3 h-3 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full animate-pulse"></div>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Total Works */}
                <div className="group/stat text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl hover:from-teal-100 hover:to-teal-200 transition-all duration-300 hover:scale-105 border border-teal-200/50">
                  <div className="text-3xl font-bold text-teal-600 mb-2 group-hover/stat:text-teal-700 transition-colors duration-300">
                    {works.length}
                  </div>
                  <div className="text-sm text-teal-700 font-medium">전체 작품</div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full mx-auto mt-2 animate-pulse"></div>
                </div>
                
                {/* Draft Works */}
                <div className="group/stat text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl hover:from-yellow-100 hover:to-orange-200 transition-all duration-300 hover:scale-105 border border-yellow-200/50">
                  <div className="text-3xl font-bold text-yellow-600 mb-2 group-hover/stat:text-yellow-700 transition-colors duration-300">
                    {works.filter((w) => w.status === "DRAFT").length}
                  </div>
                  <div className="text-sm text-yellow-700 font-medium">작업중</div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mt-2 animate-pulse"></div>
                </div>
                
                {/* Completed Works */}
                <div className="group/stat text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl hover:from-green-100 hover:to-emerald-200 transition-all duration-300 hover:scale-105 border border-green-200/50">
                  <div className="text-3xl font-bold text-green-600 mb-2 group-hover/stat:text-green-700 transition-colors duration-300">
                    {works.filter((w) => w.status === "COMPLETED").length}
                  </div>
                  <div className="text-sm text-green-700 font-medium">완료됨</div>
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-2 animate-pulse"></div>
                </div>
                
                {/* Total Pages */}
                <div className="group/stat text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 hover:scale-105 border border-blue-200/50">
                  <div className="text-3xl font-bold text-blue-600 mb-2 group-hover/stat:text-blue-700 transition-colors duration-300">
                    {works.reduce((sum, w) => sum + (w._count.pages ?? 0), 0)}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">총 페이지</div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mt-2 animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Summary */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span className="font-medium">작업 진행률</span>
                  <span className="font-bold text-teal-600">
                    {Math.round((works.filter((w) => w.status === "COMPLETED").length / works.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-400 to-teal-600 h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(works.filter((w) => w.status === "COMPLETED").length / works.length) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ========= Work Card ========= */
interface WorkCardProps {
  work: Work;
  onDelete: () => void;
}

function WorkCard({ work, onDelete }: WorkCardProps) {
  const statusInfo = statusConfig[work.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="group bg-gradient-to-br from-white via-gray-50/30 to-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border border-gray-200/50 hover:-translate-y-2 hover:scale-105 transform-gpu">
      {/* Enhanced Cover */}
      <div className="aspect-[4/3] bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100/20 via-transparent to-blue-100/20"></div>
        
        {work.coverImage ? (
          <img
            src={work.coverImage}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center group-hover:scale-110 transition-transform duration-300">
              {work.pages.length > 0 ? (
                work.pages[0].type === "IMAGE" ? (
                  <ImageIcon className="mx-auto h-16 w-16 text-teal-400 mb-3 group-hover:text-teal-500 transition-colors duration-300" />
                ) : (
                  <FileText className="mx-auto h-16 w-16 text-teal-400 mb-3 group-hover:text-teal-500 transition-colors duration-300" />
                )
              ) : (
                <Briefcase className="mx-auto h-16 w-16 text-teal-400 mb-3 group-hover:text-teal-500 transition-colors duration-300" />
              )}
              <p className="text-sm text-teal-600 font-medium">표지 없음</p>
            </div>
          </div>
        )}

        {/* Enhanced Status Badge */}
        <div
          className={`absolute top-4 left-4 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg backdrop-blur-sm border border-white/20 ${statusInfo.color}`}
        >
          <StatusIcon className="inline mr-2 h-4 w-4" />
          {statusInfo.label}
        </div>

        {/* Enhanced Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/create-work/${work.id}`}
              className="p-3 bg-white/95 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-white/20"
              title="편집"
            >
              <Edit2 className="h-5 w-5" />
            </Link>

            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="p-3 bg-white/95 backdrop-blur-sm text-red-600 rounded-2xl hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-white/20"
              title="삭제"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Enhanced Content */}
      <div className="p-6 relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-teal-100/30 to-blue-100/30 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>
        
        <div className="relative z-10">
          <h3
            className="font-bold text-gray-900 mb-4 truncate text-lg group-hover:text-teal-700 transition-colors duration-300"
            title={work.title}
          >
            {work.title}
          </h3>

          <div className="flex items-center text-sm text-gray-600 mb-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-3">
            <FileText className="mr-2 h-5 w-5 text-teal-500" />
            <span className="font-medium">{work._count.pages}개 페이지</span>
            <div className="ml-auto w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-6 space-y-2">
            <div className="flex items-center bg-gray-50 rounded-lg p-2">
              <Clock className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">{new Date(work.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-2">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">{new Date(work.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Enhanced Continue Button */}
          <Link
            href={`/dashboard/create-work/${work.id}`}
            className="w-full flex items-center justify-center px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-all duration-300 group/btn shadow-lg hover:scale-105 font-medium"
          >
            <span className="mr-2">작업 계속하기</span>
            <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </div>
  );
}
