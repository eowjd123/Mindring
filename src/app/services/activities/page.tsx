// app/services/activities/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useMemo, useState } from "react";

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

// demo 데이터 (API 연동 전)
const DEMO_RESOURCES: Resource[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `r-${i + 1}`,
  title: i % 3 === 0 ? "김치 담그기" : i % 3 === 1 ? "가을 그림 색칠" : "전통 음식 알아보기",
  subtitle: "PDF 활동지 • 컬러 프린트",
  thumbnail: "/img/cover-fallback.png",
  tags: ["PDF", i % 2 ? "컬러" : "흑백", TOPIC_PRESETS[i % TOPIC_PRESETS.length]],
  category: CATEGORIES[(i % (CATEGORIES.length - 1)) + 1],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  popularScore: 100 - i,
}));

export default function ActivitiesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/activities-menu");
        const data = await res.json();
        const visible = data.filter((d: any) => d.visible).sort((a: any, b: any) => a.order - b.order);
        const names = ["전체", ...visible.map((v: any) => v.name)];
        setCategories(names);
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
    return base;
  }, [category, query, selectedTopics]);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">활동자료</h1>
            <Link href="/dashboard" className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium">대시보드</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1920px] px-3 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar */}
          <aside className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-200 p-3 h-fit sticky top-20">
            <nav className="space-y-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    category === c ? "bg-teal-600 text-white" : "hover:bg-gray-50 text-gray-700 border border-transparent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <section className="lg:col-span-10 space-y-4">
            {/* Search + chips */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="어떤 주제를 찾아볼까요?"
                    className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    aria-label="활동자료 검색"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</div>
                </div>
                <div className="flex flex-wrap gap-2">
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
                        className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                          active ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                        aria-pressed={active}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Featured / New / Popular sections (simple tabs) */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">자료 목록</h2>
                <span className="text-sm text-gray-500">총 {filtered.length}개</span>
              </div>

              <ResourceGrid items={pageItems} />

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded disabled:opacity-50"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {items.map((r) => (
        <article key={r.id} className="group relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all">
          <div className="relative aspect-[3/4] bg-gray-100">
            <Image
              src={r.thumbnail ?? "/img/cover-fallback.png"}
              alt={r.title}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              className="object-cover"
            />
            <div className="absolute top-2 left-2 flex gap-1">
              {r.tags.slice(0, 2).map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-white/90 border border-gray-200 rounded text-[10px] font-semibold text-gray-700">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="p-2">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem]">{r.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.subtitle}</p>
          </div>
          <div className="px-2 pb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">{r.category}</span>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 bg-gray-800 hover:bg-gray-900 text-white rounded text-xs"
                title="활동자료 보기"
              >
                보기
              </button>
              <button
                className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs"
                title="PDF 다운로드"
                onClick={() => {
                  // 데모 단계: 실제 API 연동 전 안내
                  alert('다운로드는 준비 중입니다.');
                }}
              >
                다운로드
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}


