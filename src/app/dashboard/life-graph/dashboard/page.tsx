// app/life-graph/dashboard/page.tsx
"use client";

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
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Calendar,
  Clock,
  Heart,
  PieChart,
  TrendingUp,
  User,
} from "lucide-react";
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
  dateKey: string; // "2023" | "2023.03" | "2023.03.15"
  displayDate: string; // "2023년" | "2023년 3월" | "2023년 3월 15일"
  sortValue: number; // 정렬용 숫자값
  value: number; // 1~5 평균
  emotion: string; // 라벨 텍스트
  title: string; // 대표 타이틀
  count: number; // 해당 시점의 이벤트 개수
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
    label,
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{point.displayDate}</p>
        <p className="text-blue-600">{point.title}</p>
        <p>
          감정: {point.emotion} ({point.value}/5)
        </p>
        {point.count > 1 && (
          <p className="text-sm text-gray-600">총 {point.count}개 이벤트</p>
        )}
      </div>
    );
  };

  // Pie 라벨: Recharts가 콜백 파라미터 타입을 느슨하게 제공
  const renderPieLabel = (p: unknown) => {
    const payload = (p as { payload?: EmotionStat }).payload;
    if (!payload) return "";
    return `${payload.label} ${payload.percentage}%`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">감정 통계를 분석하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="mr-3 h-7 w-7 text-purple-600" />
                  감정 통계 대시보드
                </h1>
                <p className="text-gray-600 mt-1">
                  {userInfo.name || "사용자"}님의 인생 여정을 데이터로 분석해보세요
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                {userInfo.name || "사용자"} (
                {currentAge > 0 ? `${currentAge}세` : "나이 미설정"})
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {userInfo.birthYear || "출생년도 미설정"}년생
              </div>
              <div>📍 {userInfo.location || "위치 미설정"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <BarChart3 className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              분석할 데이터가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              먼저 인생그래프에서 추억을 추가해주세요
            </p>
            <button
              onClick={handleGoBack}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              인생그래프로 돌아가기
            </button>
          </div>
        ) : (
          <>
            {/* 핵심 지표 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <InfoCard
                title="총 추억 개수"
                value={`${totalEvents}개`}
                desc="기록된 인생 이벤트"
                icon={<Calendar className="h-6 w-6 text-blue-600" />}
                iconBg="bg-blue-100"
              />
              <InfoCard
                title="평균 행복도"
                value={`${averageHappiness}/5`}
                desc="전체 기간 평균"
                icon={<Heart className="h-6 w-6 text-green-600" />}
                iconBg="bg-green-100"
              />
              <InfoCard
                title="긍정 비율"
                value={`${happinessRate}%`}
                desc="행복한 순간들"
                icon={<TrendingUp className="h-6 w-6 text-yellow-600" />}
                iconBg="bg-yellow-100"
              />
              <InfoCard
                title="현재 나이"
                value={currentAge > 0 ? `${currentAge}세` : "-"}
                desc="계속되는 여정"
                icon={<Clock className="h-6 w-6 text-purple-600" />}
                iconBg="bg-purple-100"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 감정 분포 파이차트 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="mr-2 h-5 w-5 text-purple-600" />
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
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {emotionStats.map((stat) => (
                        <div
                          key={`legend-${stat.emotion}`}
                          className="flex items-center space-x-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stat.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {stat.emoji} {stat.label}: {stat.count}개 (
                            {stat.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyChart
                    icon={<PieChart className="mx-auto h-12 w-12 mb-4" />}
                    text="분석할 데이터가 부족합니다"
                  />
                )}
              </div>

              {/* 10년대별 평균 행복도 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                  10년대별 평균 행복도
                </h3>
                {decadeData.length > 0 ? (
                  <>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={decadeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="decade" />
                          <YAxis domain={[1, 5]} />
                          <Tooltip
                            formatter={(value: number) => [
                              `${value}/5`,
                              "평균 행복도",
                            ]}
                          />
                          <Bar
                            dataKey="average"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        • 인생의 각 시기별 감정 상태를 한눈에 확인할 수 있습니다
                      </p>
                      <p>• 5점 만점 기준으로 평균값을 계산했습니다</p>
                    </div>
                  </>
                ) : (
                  <EmptyChart
                    icon={<BarChart3 className="mx-auto h-12 w-12 mb-4" />}
                    text="분석할 데이터가 부족합니다"
                  />
                )}
              </div>
            </div>

            {/* 시간별 감정 추이 */}
            {timelineData.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                  인생 감정 추이 그래프
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dateKey"
                        tickFormatter={(value: string) => {
                          // 표시할 라벨을 간단히 변환
                          if (value.includes('.')) {
                            const parts = value.split('.');
                            if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
                            if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
                          }
                          return value;
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis domain={[1, 5]} />
                      <Tooltip content={<TimelineTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>• 월/일 정보가 있는 경우 더 정확한 시간순으로 표시됩니다</p>
                  <p>• 같은 시점에 여러 이벤트가 있을 경우 평균값으로 계산됩니다</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 최근 감정 트렌드 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-orange-600" />
                  최근 감정 트렌드
                </h3>
                <div className="space-y-4">
                  {recentTrend.length > 0 ? (
                    recentTrend.map((trend, index) => (
                      <div
                        key={`recent-${trend.displayDate}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {trend.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trend.displayDate}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {trend.emotion}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={`dot-${index}-${i}`}
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  i < trend.value
                                    ? "bg-purple-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="mx-auto h-12 w-12 mb-4" />
                      <p>최근 데이터가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI 분석 및 조언 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-indigo-600" />
                  AI 인사이트 & 조언
                </h3>
                <div className="space-y-4">
                  {happinessRate > 60 && (
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-800">
                        긍정적 패턴
                      </h4>
                      <p className="text-green-700 text-sm mt-1">
                        전체 추억의 {happinessRate}%가 긍정적인 감정을 담고
                        있습니다. 인생을 전반적으로 밝게 바라보는 시각을 가지고
                        계시는군요!
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800">성장 포인트</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      평균 행복도가 {averageHappiness}/5점으로
                      {averageHappiness >= 4
                        ? " 매우 높은"
                        : averageHappiness >= 3
                        ? " 균형잡힌"
                        : " 개선의 여지가 있는"}
                      수준입니다. 작은 일상의 행복들도 기록해보시면 더욱 풍성한
                      인생 그래프가 될 것 같아요.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <h4 className="font-semibold text-purple-800">미래 전망</h4>
                    <p className="text-purple-700 text-sm mt-1">
                      지금까지 {totalEvents}개의 소중한 순간들을 기록하셨네요.
                      월/일까지 세세하게 기록된 추억들이 더욱 정확한 분석을 가능하게 합니다.
                      앞으로도 계속해서 의미있는 순간들을 기록하며 더 풍성한
                      인생을 만들어가세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 이벤트 목록 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                전체 인생 이벤트
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        날짜
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        이벤트
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        감정
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        행복도
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">
                        설명
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...events]
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
                      .map((event) => {
                        const displayDate = event.day && event.month 
                          ? `${event.year}년 ${event.month}월 ${event.day}일`
                          : event.month 
                          ? `${event.year}년 ${event.month}월`
                          : `${event.year}년`;

                        return (
                          <tr
                            key={event.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 font-medium">
                              {displayDate}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {event.title}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center">
                                {emotionConfig[event.emotion].emoji}{" "}
                                {emotionConfig[event.emotion].label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="flex mr-2">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={`row-dot-${event.id}-${i}`}
                                      className={`w-3 h-3 rounded-full mr-1 ${
                                        i < emotionConfig[event.emotion].value
                                          ? "bg-purple-500"
                                          : "bg-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {emotionConfig[event.emotion].value}/5
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">
                              {event.description}
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
      </div>
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
}: {
  title: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{desc}</p>
        </div>
        <div
          className={`h-12 w-12 ${iconBg} rounded-lg flex items-center justify-center`}
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
        <p>{text}</p>
      </div>
    </div>
  );
}