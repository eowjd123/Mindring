// app/services/activities/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { FileText, Search, Download, Eye } from "lucide-react";

type Resource = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  tags: string[];
  category: string;
  createdAt: string;
  popularScore: number;
};

// 사이드 메뉴는 API에서 불러옵니다. (fallback 포함)

const TOPIC_PRESETS = [
  "김장",
  "김치",
  "가을",
  "겨울",
  "추억",
  "전통",
  "손운동",
  "두뇌훈련",
  "색칠",
];

// 데모 카테고리 목록 (실제 데이터는 API에서 관리)
const DEMO_CATEGORIES = [
  "미술",
  "요리",
  "운동",
  "음악",
  "언어",
  "수/과학",
  "인지훈련",
  "계절/행사",
];

// demo 데이터 (API 연동 전)
const DEMO_RESOURCES: Resource[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `r-${i + 1}`,
  title: i % 3 === 0 ? "김치 담그기" : i % 3 === 1 ? "가을 그림 색칠" : "전통 음식 알아보기",
  subtitle: "PDF 활동지 • 컬러 프린트",
  thumbnail: "/img/cover-fallback.png",
  tags: ["PDF", i % 2 ? "컬러" : "흑백", TOPIC_PRESETS[i % TOPIC_PRESETS.length]],
  category: DEMO_CATEGORIES[i % DEMO_CATEGORIES.length],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  popularScore: 100 - i,
}));

export default function ActivitiesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"new" | "popular" | "title">("new");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/activities-menu");
        const data = await res.json() as Array<{ visible: boolean; order: number; name: string }>;
        const visible = data.filter((d) => d.visible).sort((a, b) => a.order - b.order);
        // "전체" 중복 제거 후 맨 앞에 추가
        const categoryNames = visible.map((v) => v.name).filter((name) => name !== "전체");
        const names = ["전체", ...categoryNames];
        // 중복 제거 (Set 사용)
        const uniqueNames = Array.from(new Set(names));
        setCategories(uniqueNames);
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    const base = DEMO_RESOURCES.filter((r) =>
      category === "전체" ? true : r.category === category
    ).filter((r) =>
      query.trim() ? r.title.includes(query.trim()) || r.tags.some(t => t.includes(query.trim())) : true
    ).filter((r) =>
      selectedTopics.length ? selectedTopics.every(t => r.tags.includes(t)) : true
    );

    const sorted = [...base].sort((a, b) => {
      if (sortBy === "popular") return b.popularScore - a.popularScore;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });

    return sorted;
  }, [category, query, selectedTopics, sortBy]);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">활동자료</h1>
                <p className="text-sm text-gray-600 mt-0.5">다양한 활동 자료를 다운로드하세요</p>
              </div>
            </div>
            <Link 
              href="/dashboard" 
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-base font-medium transition-colors whitespace-nowrap"
            >
              대시보드
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1920px] px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 xl:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-4 h-fit lg:sticky lg:top-24 self-start shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">카테고리</h2>
            <nav className="space-y-2">
              {categories.map((c, index) => (
                <button
                  key={`category-${index}-${c}`}
                  onClick={() => { setCategory(c); setPage(1); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    category === c 
                      ? "bg-teal-600 text-white shadow-sm" 
                      : "hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <section className="lg:col-span-9 xl:col-span-10 space-y-4">
            {/* Search + chips */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="어떤 주제를 찾아볼까요?"
                    className="w-full rounded-lg border-2 border-gray-300 bg-white pl-10 pr-4 py-2.5 text-base outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    aria-label="활동자료 검색"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="sort" className="text-base text-gray-700 whitespace-nowrap font-medium">정렬</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value as "new" | "popular" | "title"); setPage(1); }}
                    className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-base focus:border-teal-400 focus:ring-2 focus:ring-teal-100 font-medium"
                    aria-label="정렬 기준 선택"
                  >
                    <option value="new">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="title">제목순</option>
                  </select>
                  <span className="ml-2 text-base text-gray-600 font-medium">총 {filtered.length}개</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {TOPIC_PRESETS.map((t) => {
                  const active = selectedTopics.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTopics((prev) =>
                          prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                        );
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-full text-base font-medium border-2 transition-colors ${
                        active 
                          ? "bg-teal-600 border-teal-600 text-white shadow-sm" 
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                      aria-pressed={active}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resource list */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
              {pageItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">조건에 맞는 자료가 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">다른 검색어나 카테고리를 시도해보세요.</p>
                </div>
              ) : (
                <ResourceGrid items={pageItems} />
              )}

              {/* Pagination */}
              {pageItems.length > 0 && (
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    이전
                  </button>
                  <span className="text-base text-gray-700 font-medium">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {items.map((r) => (
        <article key={r.id} className="group relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg hover:border-teal-300 transition-all">
          <div className="relative aspect-[3/4] bg-gray-100">
            <Image
              src={r.thumbnail ?? "/img/cover-fallback.png"}
              alt={r.title}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2 flex gap-1.5">
              {r.tags.slice(0, 2).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-white/95 border border-gray-200 rounded text-xs font-semibold text-gray-700 shadow-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.75rem] mb-1">{r.title}</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{r.subtitle}</p>
          </div>
          <div className="px-3 pb-3 flex flex-col gap-2">
            <span className="text-xs text-gray-600 font-medium">{r.category}</span>
            <div className="flex items-center gap-2">
              <button
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                title="활동자료 보기"
              >
                <Eye className="h-3 w-3" />
                <span>보기</span>
              </button>
              <button
                className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                title="PDF 다운로드"
                onClick={() => {
                  // 데모 단계: 실제 API 연동 전 안내
                  alert('다운로드는 준비 중입니다.');
                }}
              >
                <Download className="h-3 w-3" />
                <span>다운</span>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}


