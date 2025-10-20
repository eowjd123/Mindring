// app/life-graph/dashboard/page.tsx
"use client";

import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Brain,
  Calendar,
  Clock,
  Heart,
  Home,
  LogOut,
  PieChart,
  Sparkles,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import React, { useEffect, useMemo, useState } from "react";

interface LifeEvent {
  id: string;
  year: number;
  month?: number;
  day?: number;
  title: string;
  description: string;
  emotion: "VERY_HAPPY" | "HAPPY" | "NEUTRAL" | "SAD" | "VERY_SAD";
}

interface UserInfo {
  name: string;
  birthYear: number;
  location: string;
}

const emotionConfig = {
  VERY_HAPPY: { label: "매우 행복", emoji: "😊", value: 5, color: "#10B981" },
  HAPPY: { label: "행복", emoji: "🙂", value: 4, color: "#3B82F6" },
  NEUTRAL: { label: "보통", emoji: "😐", value: 3, color: "#6B7280" },
  SAD: { label: "슬픔", emoji: "😔", value: 2, color: "#F59E0B" },
  VERY_SAD: { label: "매우 슬픔", emoji: "😢", value: 1, color: "#EF4444" },
} as const;

type EmotionKey = keyof typeof emotionConfig;

type EmotionStat = {
  emotion: EmotionKey;
  label: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
};

type TimelinePoint = {
  dateKey: string;
  displayDate: string;
  sortValue: number;
  value: number;
  emotion: string;
  title: string;
  count: number;
};

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    birthYear: new Date().getFullYear() - 30,
    location: "",
  });

  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/life-graph", {
        method: "GET",
        credentials: "include",
      });
      
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.userInfo) setUserInfo(data.userInfo);
        if (data.success && data.events) {
          const validEvents: LifeEvent[] = data.events.filter(
            (event: LifeEvent) =>
              event &&
              typeof event.year === "number" &&
              !isNaN(event.year) &&
              event.year > 1900 &&
              event.year < 2100 &&
              event.title &&
              (event.emotion as EmotionKey) in emotionConfig
          );
          setEvents(validEvents);
        }
      }
    } catch (error) {
      console.error("Failed to load life graph data:", error);
      // fallback sample data
      setUserInfo({ name: "사용자", birthYear: 1990, location: "서울" });
      setEvents([
        {
          id: "1",
          year: 1990,
          title: "태어남",
          description: "새로운 시작",
          emotion: "HAPPY",
        },
        {
          id: "2",
          year: 2008,
          month: 3,
          title: "대학 입학",
          description: "꿈을 향한 첫걸음",
          emotion: "VERY_HAPPY",
        },
        {
          id: "3",
          year: 2012,
          month: 2,
          day: 15,
          title: "졸업",
          description: "새로운 도전",
          emotion: "HAPPY",
        },
        {
          id: "4",
          year: 2013,
          month: 4,
          day: 1,
          title: "첫 직장",
          description: "사회생활 시작",
          emotion: "NEUTRAL",
        },
        {
          id: "5",
          year: 2020,
          month: 10,
          day: 12,
          title: "결혼",
          description: "인생의 동반자",
          emotion: "VERY_HAPPY",
        },
        {
          id: "6",
          year: 2020,
          month: 11,
          title: "신혼여행",
          description: "행복한 시작",
          emotion: "HAPPY",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /** ---------- 통계 계산 ---------- */

  // 감정별 분포
  const emotionStats = useMemo<EmotionStat[]>(() => {
    const total = events.length || 1;
    return (Object.keys(emotionConfig) as EmotionKey[])
      .map((emotion) => {
        const count = events.filter((e) => e.emotion === emotion).length;
        const percentage = Math.round((count / total) * 1000) / 10;
        const cfg = emotionConfig[emotion];
        return {
          emotion,
          label: cfg.label,
          emoji: cfg.emoji,
          count,
          percentage,
          color: cfg.color,
        };
      })
      .filter((s) => s.count > 0);
  }, [events]);

  // 시간순 감정 추이 (월/일 정보 포함)
  const timelineData = useMemo<TimelinePoint[]>(() => {
    if (events.length === 0) return [];

    // 각 이벤트를 시간 키로 그룹화
    const timeGroups = new Map<string, {
      events: LifeEvent[];
      sortValue: number;
      displayDate: string;
    }>();

    events.forEach((event) => {
      // 정렬을 위한 숫자값 생성
      const sortValue = event.year + 
        ((event.month || 6) - 1) / 12 + 
        ((event.day || 15) - 1) / 365;

      // 표시용 키와 라벨 생성
      let dateKey: string;
      let displayDate: string;

      if (event.day && event.month) {
        dateKey = `${event.year}.${String(event.month).padStart(2, '0')}.${String(event.day).padStart(2, '0')}`;
        displayDate = `${event.year}년 ${event.month}월 ${event.day}일`;
      } else if (event.month) {
        dateKey = `${event.year}.${String(event.month).padStart(2, '0')}`;
        displayDate = `${event.year}년 ${event.month}월`;
      } else {
        dateKey = `${event.year}`;
        displayDate = `${event.year}년`;
      }

      if (!timeGroups.has(dateKey)) {
        timeGroups.set(dateKey, {
          events: [],
          sortValue,
          displayDate,
        });
      }
      
      timeGroups.get(dateKey)!.events.push(event);
    });

    // 각 그룹을 TimelinePoint로 변환
    const points: TimelinePoint[] = Array.from(timeGroups.entries()).map(([dateKey, group]) => {
      const avgValue = group.events.reduce((sum, e) => sum + emotionConfig[e.emotion].value, 0) / group.events.length;
      const nearestValue = Math.round(avgValue);
      const emotionMatch = Object.values(emotionConfig).find(c => c.value === nearestValue) || emotionConfig.NEUTRAL;
      
      return {
        dateKey,
        displayDate: group.displayDate,
        sortValue: group.sortValue,
        value: Math.round(avgValue * 10) / 10,
        emotion: emotionMatch.label,
        title: group.events[0].title + (group.events.length > 1 ? ` 외 ${group.events.length - 1}건` : ''),
        count: group.events.length,
      };
    });

    return points.sort((a, b) => a.sortValue - b.sortValue);
  }, [events]);

  // 10년 단위 평균 행복도
  const decadeData = useMemo(() => {
    const acc: Record<number, { decade: string; total: number; count: number }> = {};
    
    events.forEach((e) => {
      if (!e.year || isNaN(e.year)) return;
      const decade = Math.floor(e.year / 10) * 10;
      const v = emotionConfig[e.emotion].value;
      
      if (!acc[decade]) {
        acc[decade] = { decade: `${decade}년대`, total: 0, count: 0 };
      }
      
      acc[decade].total += v;
      acc[decade].count += 1;
    });
    
    return Object.values(acc)
      .map((s) => ({
        ...s,
        average: Math.round((s.total / s.count) * 10) / 10,
      }))
      .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
  }, [events]);

  // 전체 통계
  const totalEvents = events.length;
  const averageHappiness =
    totalEvents > 0
      ? Math.round(
          (events.reduce((sum, e) => sum + emotionConfig[e.emotion].value, 0) /
            totalEvents) *
            10
        ) / 10
      : 0;
  const currentAge =
    userInfo.birthYear && !isNaN(userInfo.birthYear)
      ? new Date().getFullYear() - userInfo.birthYear
      : 0;
  const happinessRate = useMemo(() => {
    const happyCount = events.filter(
      (e) => e.emotion === "HAPPY" || e.emotion === "VERY_HAPPY"
    ).length;
    return totalEvents > 0 ? Math.round((happyCount / totalEvents) * 100) : 0;
  }, [events, totalEvents]);

  // 최근 5개 (정렬 시 원본 배열 불변 보장)
  const recentTrend = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        // 년도 > 월 > 일 순으로 최신 순 정렬
        if (a.year !== b.year) return b.year - a.year;
        const aMonth = a.month || 0;
        const bMonth = b.month || 0;
        if (aMonth !== bMonth) return bMonth - aMonth;
        const aDay = a.day || 0;
        const bDay = b.day || 0;
        return bDay - aDay;
      })
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        year: e.year,
        month: e.month,
        day: e.day,
        displayDate: e.day && e.month 
          ? `${e.year}.${String(e.month).padStart(2, '0')}.${String(e.day).padStart(2, '0')}`
          : e.month 
          ? `${e.year}.${String(e.month).padStart(2, '0')}`
          : `${e.year}`,
        value: emotionConfig[e.emotion].value,
        emotion: emotionConfig[e.emotion].label,
      }));
  }, [events]);

  const handleGoBack = () => {
    window.location.href = "/dashboard/life-graph";
  };

  /** ---------- Typed Tooltip / Label (no any) ---------- */

  type DefaultTooltipPayload<T> = { payload: T };

  interface CustomTooltipProps<T> {
    active?: boolean;
    payload?: Array<DefaultTooltipPayload<T>>;
    label?: string | number;
  }

  // 타임라인 툴팁 (타입 안전)
  const TimelineTooltip: React.FC<CustomTooltipProps<TimelinePoint>> = ({
    active,
    payload,
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-teal-100">
        <p className="font-semibold text-gray-800">{point.displayDate}</p>
        <p className="text-teal-600 font-medium">{point.title}</p>
        <p className="text-sm text-gray-600">
          감정: {point.emotion} ({point.value}/5)
        </p>
        {point.count > 1 && (
          <p className="text-sm text-gray-500">총 {point.count}개 이벤트</p>
        )}
      </div>
    );
  };

  // Pie 라벨: Recharts가 콜백 파라미터 타입을 느슨하게 제공
  const renderPieLabel = (entry: unknown) => {
    const payload = (entry as { payload?: EmotionStat }).payload;
    if (!payload) return "";
    return `${payload.label} ${payload.percentage}%`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600 mx-auto mb-6"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-teal-600" />
          </div>
          <p className="text-gray-700 font-medium">감정 통계를 분석하는 중...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header - Enhanced Design */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-5">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-end mb-3 sm:mb-4">
            <nav className="flex items-center gap-4 sm:gap-6 text-sm text-gray-600">
              <button
                onClick={handleGoBack}
                className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                title="인생그래프로 돌아가기"
                aria-label="인생그래프로 돌아가기"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="hidden sm:inline">인생그래프로</span>
              </button>
              <a 
                className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105" 
                href="/dashboard"
                title="대시보드로 이동"
                aria-label="대시보드로 이동"
              >
                <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              </a>
              <a 
                className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105" 
                href="/dashboard/life-graph"
                title="인생그래프로 이동"
                aria-label="인생그래프로 이동"
              >
                <Heart className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              </a>
              <a 
                className="group p-2 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105" 
                href="/api/auth/logout"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4 group-hover:text-red-600 transition-colors duration-200" />
              </a>
            </nav>
          </div>

          {/* Main Header Row */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                <div className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl shadow-lg">
                  <svg width="32" height="32" viewBox="0 0 48 48" className="text-white">
                    <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.1"/>
                    <path d="M24 8L30 18H40L32 26L36 36L24 30L12 36L16 26L8 18H18L24 8Z" fill="currentColor"/>
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
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-2xl border border-blue-100">
                <div className="p-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">감정 통계 대시보드</h2>
                  <p className="text-sm text-gray-600">
                    {userInfo.name || "사용자"}님의 인생 여정을 데이터로 분석해보세요
                  </p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <div className="flex items-center bg-gradient-to-r from-teal-50 to-teal-100 px-4 py-2.5 rounded-xl border border-teal-200">
                <User className="mr-2 h-4 w-4 text-teal-600" />
                <span className="font-medium text-gray-900">{userInfo.name || "사용자"}</span>
                <span className="ml-2 text-gray-600 text-sm">
                  ({currentAge > 0 ? `${currentAge}세` : "나이 미설정"})
                </span>
              </div>
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2.5 rounded-xl border border-blue-200">
                <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">{userInfo.birthYear || "출생년도 미설정"}년생</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        {events.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-12 text-center hover:shadow-xl transition-all duration-300">
            <div className="relative mb-6">
              <BarChart3 className="mx-auto h-20 w-20 text-gray-300" />
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              분석할 데이터가 없습니다
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              먼저 인생그래프에서 추억을 추가해주세요
            </p>
            <button
              onClick={handleGoBack}
              className="bg-gradient-to-r from-teal-400 to-teal-600 text-white px-8 py-4 rounded-full hover:shadow-lg transition-all duration-200 font-medium hover:scale-105"
            >
              인생그래프로 돌아가기
            </button>
          </div>
        ) : (
          <>
            {/* 핵심 지표 - Enhanced Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <InfoCard
                title="총 추억 개수"
                value={`${totalEvents}개`}
                desc="기록된 인생 이벤트"
                icon={<Calendar className="h-6 w-6" />}
                iconBg="from-teal-400 to-teal-600"
                trend="+12%"
              />
              <InfoCard
                title="평균 행복도"
                value={`${averageHappiness}/5`}
                desc="전체 기간 평균"
                icon={<Heart className="h-6 w-6" />}
                iconBg="from-teal-500 to-teal-700"
                trend="85%"
              />
              <InfoCard
                title="긍정 비율"
                value={`${happinessRate}%`}
                desc="행복한 순간들"
                icon={<TrendingUp className="h-6 w-6" />}
                iconBg="from-teal-400 to-teal-500"
                trend="+8%"
              />
              <InfoCard
                title="현재 나이"
                value={currentAge > 0 ? `${currentAge}세` : "-"}
                desc="계속되는 여정"
                icon={<Clock className="h-6 w-6" />}
                iconBg="from-teal-600 to-teal-800"
                trend="진행중"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 감정 분포 파이차트 - Enhanced */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg mr-3">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  감정별 분포
                </h3>
                {emotionStats.length > 0 ? (
                  <>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={emotionStats}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="count"
                            label={renderPieLabel}
                          >
                            {emotionStats.map((entry) => (
                              <Cell
                                key={`pie-cell-${entry.emotion}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              `${value}개`,
                              "개수",
                            ]}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '12px',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {emotionStats.map((stat) => (
                        <div
                          key={`legend-${stat.emotion}`}
                          className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-xl backdrop-blur-sm"
                        >
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: stat.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {stat.emoji} {stat.label}
                          </span>
                          <span className="text-sm text-gray-500 ml-auto">
                            {stat.count}개 ({stat.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyChart
                    icon={<PieChart className="mx-auto h-16 w-16 mb-4 text-gray-300" />}
                    text="분석할 데이터가 부족합니다"
                  />
                )}
              </div>

              {/* 10년대별 평균 행복도 - Enhanced */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-teal-700 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  10년대별 평균 행복도
                </h3>
                {decadeData.length > 0 ? (
                  <>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={decadeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="decade" tick={{ fill: '#64748b' }} />
                          <YAxis domain={[1, 5]} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            formatter={(value: number) => [
                              `${value}/5`,
                              "평균 행복도",
                            ]}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '12px',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar
                            dataKey="average"
                            fill="url(#tealGradient)"
                            radius={[8, 8, 0, 0]}
                          />
                          <defs>
                            <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#0D9488" stopOpacity={0.7}/>
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-teal-50 rounded-xl">
                      <p className="text-sm text-teal-700 font-medium mb-2">📊 분석 인사이트</p>
                      <p className="text-sm text-teal-600">
                        • 인생의 각 시기별 감정 상태를 한눈에 확인할 수 있습니다
                      </p>
                      <p className="text-sm text-teal-600">
                        • 5점 만점 기준으로 평균값을 계산했습니다
                      </p>
                    </div>
                  </>
                ) : (
                  <EmptyChart
                    icon={<BarChart3 className="mx-auto h-16 w-16 mb-4 text-gray-300" />}
                    text="분석할 데이터가 부족합니다"
                  />
                )}
              </div>
            </div>

            {/* 시간별 감정 추이 - Enhanced */}
            {timelineData.length > 1 && (
              <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  인생 감정 추이 그래프
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="dateKey"
                        tickFormatter={(value: string) => {
                          if (value.includes('.')) {
                            const parts = value.split('.');
                            if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
                            if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
                          }
                          return value;
                        }}
                        interval="preserveStartEnd"
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis domain={[1, 5]} tick={{ fill: '#64748b' }} />
                      <Tooltip content={<TimelineTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#14B8A6"
                        fill="url(#tealAreaGradient)"
                        strokeWidth={3}
                      />
                      <defs>
                        <linearGradient id="tealAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 bg-teal-50 rounded-xl">
                  <p className="text-sm text-teal-700 font-medium mb-2">💡 분석 노트</p>
                  <p className="text-sm text-teal-600">
                    • 월/일 정보가 있는 경우 더 정확한 시간순으로 표시됩니다
                  </p>
                  <p className="text-sm text-teal-600">
                    • 같은 시점에 여러 이벤트가 있을 경우 평균값으로 계산됩니다
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 최근 감정 트렌드 - Enhanced */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  최근 감정 트렌드
                </h3>
                <div className="space-y-4">
                  {recentTrend.length > 0 ? (
                    recentTrend.map((trend, index) => (
                      <div
                        key={`recent-${trend.displayDate}-${index}`}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/80 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100/50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                            {trend.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {trend.displayDate}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-600 block">
                              {trend.emotion}
                            </span>
                            <div className="flex mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={`star-${index}-${i}`}
                                  className={`w-3 h-3 mx-0.5 ${
                                    i < trend.value
                                      ? "fill-teal-500 text-teal-500"
                                      : "fill-gray-200 text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-teal-600">
                            {trend.value}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="mx-auto h-16 w-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">최근 데이터가 없습니다</p>
                      <p className="text-sm mt-2">새로운 추억을 추가해보세요</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI 분석 및 조언 - Enhanced */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg mr-3">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  AI 인사이트 & 조언
                </h3>
                <div className="space-y-4">
                  {happinessRate > 60 && (
                    <div className="p-5 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl border-l-4 border-green-400">
                      <div className="flex items-center mb-2">
                        <Award className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-bold text-green-800">긍정적 패턴</h4>
                      </div>
                      <p className="text-green-700 text-sm leading-relaxed">
                        전체 추억의 {happinessRate}%가 긍정적인 감정을 담고
                        있습니다. 인생을 전반적으로 밝게 바라보는 시각을 가지고
                        계시는군요! 🌟
                      </p>
                    </div>
                  )}

                  <div className="p-5 bg-gradient-to-r from-teal-50 to-teal-50 rounded-xl border-l-4 border-teal-400">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-teal-600 mr-2" />
                      <h4 className="font-bold text-teal-800">성장 포인트</h4>
                    </div>
                    <p className="text-teal-700 text-sm leading-relaxed">
                      평균 행복도가 {averageHappiness}/5점으로
                      {averageHappiness >= 4
                        ? " 매우 높은"
                        : averageHappiness >= 3
                        ? " 균형잡힌"
                        : " 개선의 여지가 있는"}
                      수준입니다. 작은 일상의 행복들도 기록해보시면 더욱 풍성한
                      인생 그래프가 될 것 같아요. 📈
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-teal-50 to-teal-50 rounded-xl border-l-4 border-teal-500">
                    <div className="flex items-center mb-2">
                      <Sparkles className="h-5 w-5 text-teal-600 mr-2" />
                      <h4 className="font-bold text-teal-800">미래 전망</h4>
                    </div>
                    <p className="text-teal-700 text-sm leading-relaxed">
                      지금까지 {totalEvents}개의 소중한 순간들을 기록하셨네요.
                      월/일까지 세세하게 기록된 추억들이 더욱 정확한 분석을 가능하게 합니다.
                      앞으로도 계속해서 의미있는 순간들을 기록하며 더 풍성한
                      인생을 만들어가세요. ✨
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 이벤트 목록 - Enhanced */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mt-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                전체 인생 이벤트
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-bold text-gray-700 bg-gray-50/80 rounded-tl-xl">
                        날짜
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 bg-gray-50/80">
                        이벤트
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 bg-gray-50/80">
                        감정
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 bg-gray-50/80">
                        행복도
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 bg-gray-50/80 rounded-tr-xl">
                        설명
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...events]
                      .sort((a, b) => {
                        if (a.year !== b.year) return b.year - a.year;
                        const aMonth = a.month || 0;
                        const bMonth = b.month || 0;
                        if (aMonth !== bMonth) return bMonth - aMonth;
                        const aDay = a.day || 0;
                        const bDay = b.day || 0;
                        return bDay - aDay;
                      })
                      .map((event, index) => {
                        const displayDate = event.day && event.month 
                          ? `${event.year}년 ${event.month}월 ${event.day}일`
                          : event.month 
                          ? `${event.year}년 ${event.month}월`
                          : `${event.year}년`;

                        return (
                          <tr
                            key={event.id}
                            className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-teal-50/50 transition-all duration-200 ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-50/30 to-orange-50/30' : ''
                            }`}
                          >
                            <td className="py-4 px-6 font-medium text-gray-700">
                              {displayDate}
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-800">
                              {event.title}
                              {index === 0 && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                                  최신
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                                {emotionConfig[event.emotion].emoji}{" "}
                                {emotionConfig[event.emotion].label}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <div className="flex mr-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={`table-star-${event.id}-${i}`}
                                      className={`w-4 h-4 mx-0.5 ${
                                        i < emotionConfig[event.emotion].value
                                          ? "fill-teal-500 text-teal-500"
                                          : "fill-gray-200 text-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-semibold text-teal-600">
                                  {emotionConfig[event.emotion].value}/5
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-600 text-sm max-w-xs">
                              <div className="truncate" title={event.description}>
                                {event.description}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/** ---------------- 작은 컴포넌트들 ---------------- */

function InfoCard({
  title,
  value,
  desc,
  icon,
  iconBg,
  trend,
}: {
  title: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}) {
  return (
    <div className="group bg-white rounded-3xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-teal-600 transition-colors">
            {value}
          </p>
          <p className="text-sm text-gray-500 mt-1">{desc}</p>
          {trend && (
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 text-xs rounded-full font-medium shadow-sm">
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className={`h-16 w-16 bg-gradient-to-r ${iconBg} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="h-80 flex items-center justify-center text-gray-500">
      <div className="text-center">
        {icon}
        <p className="font-medium">{text}</p>
        <p className="text-sm mt-2 text-gray-400">데이터를 추가해보세요</p>
      </div>
    </div>
  );
}