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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">작업실을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Briefcase className="mr-3 h-8 w-8 text-orange-600" />
                작업실
              </h1>
              <p className="text-gray-600 mt-2">작업중인 작품들을 관리하세요</p>
            </div>

            <Link
              href="/dashboard/create-work"
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />새 작품 만들기
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Load error */}
        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="작품 제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as FilterStatus)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">모든 상태</option>
                <option value="DRAFT">작업중</option>
                <option value="COMPLETED">완료</option>
                <option value="PUBLISHED">발행됨</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="updatedAt">최근 수정순</option>
              <option value="createdAt">생성일순</option>
              <option value="title">제목순</option>
            </select>
          </div>
        </div>

        {/* Works Grid */}
        {sortedWorks.length === 0 ? (
          <div className="text-center py-16">
            {works.length === 0 ? (
              <>
                <Briefcase className="mx-auto h-20 w-20 text-gray-300 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  아직 작업중인 작품이 없습니다
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  첫 번째 작품을 만들어서 나만의 디지털 노트를 시작해보세요
                </p>
                <Link
                  href="/dashboard/create-work"
                  className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 shadow-lg transition-all hover:shadow-xl"
                >
                  <Plus className="mr-2 h-5 w-5" />첫 작품 만들기
                </Link>
              </>
            ) : (
              <>
                <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-600">
                  다른 검색어나 필터를 시도해보세요
                </p>
              </>
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

        {/* Stats */}
        {works.length > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {works.length}
                </div>
                <div className="text-sm text-gray-600">전체 작품</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {works.filter((w) => w.status === "DRAFT").length}
                </div>
                <div className="text-sm text-gray-600">작업중</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {works.filter((w) => w.status === "COMPLETED").length}
                </div>
                <div className="text-sm text-gray-600">완료됨</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {works.reduce((sum, w) => sum + (w._count.pages ?? 0), 0)}
                </div>
                <div className="text-sm text-gray-600">총 페이지</div>
              </div>
            </div>
          </div>
        )}
      </div>
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
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Cover */}
      <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-100 relative overflow-hidden">
        {work.coverImage ? (
          <img
            src={work.coverImage}
            alt={work.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              {work.pages.length > 0 ? (
                work.pages[0].type === "IMAGE" ? (
                  <ImageIcon className="mx-auto h-12 w-12 text-orange-300 mb-2" />
                ) : (
                  <FileText className="mx-auto h-12 w-12 text-orange-300 mb-2" />
                )
              ) : (
                <Briefcase className="mx-auto h-12 w-12 text-orange-300 mb-2" />
              )}
              <p className="text-sm text-orange-500">표지 없음</p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}
        >
          <StatusIcon className="inline mr-1 h-3 w-3" />
          {statusInfo.label}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <Link
              href={`/dashboard/create-work/${work.id}`} // 기존: /dashboard/create-work?id=${work.id}
              className="p-2 bg-white/90 text-gray-700 rounded-lg hover:bg-white shadow-sm"
              title="편집"
            >
              <Edit2 className="h-4 w-4" />
            </Link>

            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="p-2 bg-white/90 text-red-600 rounded-lg hover:bg-white shadow-sm"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-semibold text-gray-900 mb-2 truncate"
          title={work.title}
        >
          {work.title}
        </h3>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <FileText className="mr-1 h-4 w-4" />
          <span>{work._count.pages}개 페이지</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            <span>{new Date(work.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>생성: {new Date(work.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Continue Button */}
        <Link
          href={`/dashboard/create-work/${work.id}`} // 기존: /dashboard/create-work?id=${work.id}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors group"
        >
          <span className="mr-2">작업 계속하기</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
