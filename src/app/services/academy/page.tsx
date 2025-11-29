// app/services/academy/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search, ExternalLink, User, Clock, DollarSign, Star } from "lucide-react";

type Course = {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  thumbnail?: string;
  category: string;
  instructor?: string;
  courseUrl?: string;
  price: number | null;
  duration?: string;
  tags: string[];
  level?: string;
  popularScore: number;
};

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"new" | "popular" | "price">("new");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, coursesRes] = await Promise.all([
        fetch("/api/admin/academy-menu"),
        fetch("/api/admin/academy-courses?visible=true"),
      ]);
      
      // 카테고리 메뉴 처리
      if (menuRes.ok) {
        const menuData = await menuRes.json() as Array<{ visible: boolean; order: number; name: string }>;
        const visible = menuData.filter((d) => d.visible).sort((a, b) => a.order - b.order);
        // "전체" 중복 제거 후 맨 앞에 추가
        const categoryNames = visible.map((v) => v.name).filter((name) => name !== "전체");
        const names = ["전체", ...categoryNames];
        // 중복 제거 (Set 사용)
        const uniqueNames = Array.from(new Set(names));
        setCategories(uniqueNames);
      }
      
      // 강좌 데이터 처리
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        const coursesList = data.courses || [];
        
        const convertedCourses: Course[] = coursesList.map((c: any) => ({
          id: c.id || c.courseId,
          title: c.title || "",
          description: c.description,
          subtitle: c.subtitle,
          thumbnail: c.thumbnail,
          category: c.category || "",
          instructor: c.instructor,
          courseUrl: c.courseUrl,
          price: c.price,
          duration: c.duration,
          tags: Array.isArray(c.tags) ? c.tags : [],
          level: c.level,
          popularScore: c.popularScore || 0,
        }));
        
        setCourses(convertedCourses);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let filtered = courses;
    
    // 카테고리 필터
    if (category !== "전체") {
      filtered = filtered.filter(c => c.category === category);
    }
    
    // 난이도 필터
    if (selectedLevel !== "all") {
      filtered = filtered.filter(c => c.level === selectedLevel);
    }
    
    // 검색 필터
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.instructor?.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "popular") return b.popularScore - a.popularScore;
      if (sortBy === "price") {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceA - priceB;
      }
      // new: 최신순 (createdAt 기준이지만 현재는 popularScore로 대체)
      return b.popularScore - a.popularScore;
    });
    
    return sorted;
  }, [courses, category, selectedLevel, query, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">허브 아카데미</h1>
                <p className="text-sm text-gray-600 mt-0.5">자격증 취득・자기계발 강좌</p>
              </div>
            </div>
            <Link 
              href="/" 
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-base font-medium transition-colors whitespace-nowrap"
            >
              홈으로
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
                  onClick={() => setCategory(c)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    category === c 
                      ? "bg-yellow-500 text-white shadow-sm" 
                      : "hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3">난이도</h2>
              <nav className="space-y-2">
                {["all", "초급", "중급", "고급"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                      selectedLevel === level 
                        ? "bg-yellow-500 text-white shadow-sm" 
                        : "hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    {level === "all" ? "전체" : level}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <section className="lg:col-span-9 xl:col-span-10 space-y-4">
            {/* Search + Sort */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="어떤 강좌를 찾아볼까요?"
                    className="w-full rounded-lg border-2 border-gray-300 bg-white pl-10 pr-4 py-2.5 text-base outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    aria-label="강좌 검색"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="sort" className="text-base text-gray-700 whitespace-nowrap font-medium">정렬</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "new" | "popular" | "price")}
                    className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-base focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 font-medium"
                    aria-label="정렬 기준 선택"
                  >
                    <option value="new">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="price">가격순</option>
                  </select>
                  <span className="ml-2 text-base text-gray-600 font-medium">총 {filtered.length}개</span>
                </div>
              </div>
            </div>

            {/* Course list */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
                    <GraduationCap className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">로딩 중...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">조건에 맞는 강좌가 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">다른 검색어나 카테고리를 시도해보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((course) => (
                    <article
                      key={course.id}
                      className="group relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg hover:border-yellow-300 transition-all"
                    >
                      <div className="relative aspect-video bg-gray-100">
                        <Image
                          src={course.thumbnail || "/img/cover-fallback.png"}
                          alt={course.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {course.level && (
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded shadow-sm">
                              {course.level}
                            </span>
                          </div>
                        )}
                        {course.tags.length > 0 && (
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {course.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={`${course.id}-tag-${idx}`}
                                className="px-2 py-0.5 bg-white/95 border border-gray-200 rounded text-xs font-semibold text-gray-700 shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem] mb-2">
                          {course.title}
                        </h3>
                        {course.subtitle && (
                          <p className="text-sm text-gray-600 line-clamp-1 mb-2">{course.subtitle}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                          <span className="font-medium">{course.category}</span>
                          {course.popularScore > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{course.popularScore}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          {course.instructor && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{course.instructor}</span>
                            </div>
                          )}
                          {course.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{course.duration}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-gray-900">
                            {course.price === null || course.price === 0 ? (
                              <span className="text-green-600">무료</span>
                            ) : (
                              <span>{course.price.toLocaleString()}원</span>
                            )}
                          </div>
                        </div>
                        {course.courseUrl ? (
                          <a
                            href={course.courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <span>강좌 보기</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="w-full px-4 py-2.5 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                          >
                            준비 중
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
