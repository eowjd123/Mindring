"use client";

import {
  BarChart3,
  Calendar,
  Check,
  Edit2,
  Heart,
  Home,
  LogOut,
  Moon,
  Plus,
  Sparkles,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useModalContext, ModalProviderWithContext } from "../../../components/ui/modal-provider";

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

type EmotionKey = LifeEvent["emotion"];

const emotionConfig: Record<
  EmotionKey,
  { label: string; value: number; color: string; gradient: string }
> = {
  VERY_HAPPY: {
    label: "😊",
    value: 5,
    color: "#10B981",
    gradient: "from-emerald-400 to-teal-500",
  },
  HAPPY: {
    label: "🙂",
    value: 4,
    color: "#3B82F6",
    gradient: "from-blue-400 to-cyan-500",
  },
  NEUTRAL: {
    label: "😐",
    value: 3,
    color: "#6B7280",
    gradient: "from-gray-400 to-slate-500",
  },
  SAD: {
    label: "😔",
    value: 2,
    color: "#F59E0B",
    gradient: "from-amber-400 to-orange-500",
  },
  VERY_SAD: {
    label: "😢",
    value: 1,
    color: "#EF4444",
    gradient: "from-red-400 to-pink-500",
  },
};

function LifeGraphPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useModalContext();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    birthYear: new Date().getFullYear() - 30,
    location: "",
  });

  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/life-graph", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.userInfo && data.events) {
        setUserInfo(data.userInfo);

        const validEvents: LifeEvent[] = data.events.filter(
          (event: LifeEvent) => {
            const basic =
              typeof event.year === "number" &&
              !Number.isNaN(event.year) &&
              event.year > 1900 &&
              event.year < 2100 &&
              !!event.title &&
              (event.emotion as EmotionKey) in emotionConfig;

            const monthOk =
              event.month === undefined ||
              (Number.isInteger(event.month) &&
                event.month! >= 1 &&
                event.month! <= 12);

            const dayOk =
              event.day === undefined ||
              (Number.isInteger(event.day) &&
                (() => {
                  if (!event.month) return true;
                  const daysInMonth = new Date(
                    event.year,
                    event.month,
                    0
                  ).getDate();
                  return event.day! >= 1 && event.day! <= daysInMonth;
                })());

            return basic && monthOk && dayOk;
          }
        );

        setEvents(validEvents);
      } else {
        setError(data.error || "데이터 형식이 올바르지 않습니다.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "데이터 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllData = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/life-graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userInfo,
          events,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setError(null);
        return true;
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "저장 실패";
      setError(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const saveUserInfo = async () => {
    if (!userInfo.name.trim()) {
      showAlert({ type: 'error', title: "입력 오류", message: "이름을 입력해주세요." });
      return;
    }

    if (
      !userInfo.birthYear ||
      isNaN(userInfo.birthYear) ||
      userInfo.birthYear < 1900 ||
      userInfo.birthYear > new Date().getFullYear()
    ) {
      showAlert({ type: 'error', title: "입력 오류", message: "올바른 출생년도를 입력해주세요." });
      return;
    }

    try {
      await saveAllData();
      showAlert({ type: 'success', title: "저장 완료", message: "사용자 정보가 저장되었습니다." });
      setIsEditing(false);
    } catch {
      showAlert({ type: 'error', title: "저장 오류", message: "저장 중 오류가 발생했습니다." });
    }
  };

  const saveEvent = async (eventData: Omit<LifeEvent, "id">) => {
    if (!eventData.title.trim()) {
      showAlert({ type: 'error', title: "입력 오류", message: "제목을 입력해주세요." });
      return;
    }

    if (
      !eventData.year ||
      isNaN(eventData.year) ||
      eventData.year < 1900 ||
      eventData.year > 2100
    ) {
      showAlert({ type: 'error', title: "입력 오류", message: "올바른 년도를 입력해주세요." });
      return;
    }

    if (eventData.month !== undefined) {
      if (
        !Number.isInteger(eventData.month) ||
        eventData.month < 1 ||
        eventData.month > 12
      ) {
        showAlert({ type: 'error', title: "입력 오류", message: "월은 1~12 사이의 정수여야 합니다." });
        return;
      }
    }
    if (eventData.day !== undefined) {
      if (eventData.month === undefined) {
        showAlert({ type: 'error', title: "입력 오류", message: "일을 입력하려면 월을 먼저 입력하세요." });
        return;
      }
      const daysInMonth = new Date(
        eventData.year,
        eventData.month,
        0
      ).getDate();
      if (
        !Number.isInteger(eventData.day) ||
        eventData.day < 1 ||
        eventData.day > daysInMonth
      ) {
        alert(
          `${eventData.month}월은 1일부터 ${daysInMonth}일까지만 있습니다.`
        );
        return;
      }
    }

    try {
      let updatedEvents: LifeEvent[];

      if (editingEvent) {
        const updatedEvent: LifeEvent = { ...eventData, id: editingEvent.id };
        updatedEvents = events.map((e) =>
          e.id === editingEvent.id ? updatedEvent : e
        );
      } else {
        const newEvent: LifeEvent = { ...eventData, id: Date.now().toString() };
        updatedEvents = [...events, newEvent];
      }

      setEvents(updatedEvents);

      const response = await fetch("/api/life-graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userInfo,
          events: updatedEvents,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showAlert({ type: 'success', title: "저장 완료", message: "추억이 저장되었습니다." });
        setShowForm(false);
        setEditingEvent(null);
        setError(null);
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      showAlert({ type: 'error', title: "저장 오류", message: "저장 중 오류가 발생했습니다." });
      loadData();
    }
  };

  const deleteEvent = async (eventId: string) => {
    showConfirm({ title: "추억 삭제", message: "이 추억을 삭제하시겠습니까?", type: 'danger' }, () => {
      performDeleteEvent(eventId);
    });
  };

  const performDeleteEvent = async (eventId: string) => {

    try {
      const updatedEvents = events.filter((e) => e.id !== eventId);
      setEvents(updatedEvents);

      await fetch("/api/life-graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userInfo,
          events: updatedEvents,
        }),
      });

      showAlert({ type: 'success', title: "삭제 완료", message: "추억이 삭제되었습니다." });
    } catch (error) {
      console.error("Failed to delete event:", error);
      showAlert({ type: 'error', title: "삭제 오류", message: "삭제 중 오류가 발생했습니다." });
      loadData();
    }
  };

  const _exportData = async (format: "json") => {
    try {
      const response = await fetch(`/api/life-graph/export?format=${format}`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `life-graph.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export failed:", error);
      showAlert({ type: 'error', title: "내보내기 오류", message: "내보내기 중 오류가 발생했습니다." });
    }
  };

  const _importFromJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.userInfo && data.events) {
        setUserInfo(data.userInfo as UserInfo);
        setEvents(data.events as LifeEvent[]);
        showAlert({ type: 'success', title: "불러오기 완료", message: "JSON 파일을 성공적으로 불러왔습니다." });
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (error) {
      console.error("Import failed:", error);
      showAlert({ type: 'error', title: "파일 오류", message: "JSON 파일 형식이 올바르지 않습니다." });
    }

    event.target.value = "";
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
        }`}
      >
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-purple-600 animate-pulse" />
          </div>
          <p
            className={`text-lg font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            인생그래프를 불러오는 중...
          </p>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            } mt-2`}
          >
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  const _themeClasses = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header - Enhanced Design */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-[1920px] px-2 sm:px-3 py-2">
          {/* Main Header Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">소중한 추억을 한눈에 보는 그래프</h2>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/dashboard/life-graph/dashboard")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-semibold shadow-sm"
                title="감정 통계 보기"
                aria-label="감정 통계 대시보드로 이동"
              >
                <BarChart3 className="h-4 w-4" />
                감정통계
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-semibold shadow-sm"
                title="새로운 추억 추가"
                aria-label="새로운 추억 추가하기"
              >
                <Plus className="h-4 w-4" />
                추억 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-none px-2 sm:px-3 py-1">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl mb-2 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">!</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-medium">오류가 발생했습니다</h3>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-3 text-red-800 underline hover:no-underline text-sm font-medium"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Info - Top */}
        <div className="mb-1">
          {/* User Info Horizontal */}
          <div className="bg-white rounded-xl p-2 shadow-lg border-2 border-gray-200">
            <div className="flex items-center mb-1">
              <h3 className="text-xl font-bold text-gray-900">사용자 정보</h3>
            </div>
            {isEditing ? (
              <div className="space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">이름</label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">출생년도</label>
                    <input
                      type="number"
                      value={userInfo.birthYear || ""}
                      onChange={(e) => setUserInfo({ ...userInfo, birthYear: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all"
                      placeholder="예: 1950"
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">출생지</label>
                    <input
                      type="text"
                      value={userInfo.location}
                      onChange={(e) => setUserInfo({ ...userInfo, location: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all"
                      placeholder="출생지를 입력하세요"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveUserInfo}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-base font-semibold transition-colors disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadData();
                    }}
                    className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl text-base font-semibold transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">이름</p>
                    <p className="font-bold text-lg text-gray-900">{userInfo.name || "이름을 설정해주세요"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">출생년도</p>
                    <p className="font-bold text-lg text-gray-900">{userInfo.birthYear && !isNaN(userInfo.birthYear) ? `${userInfo.birthYear}년생` : "출생년도를 설정해주세요"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-base">📍</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">출생지</p>
                    <p className="font-bold text-lg text-gray-900">{userInfo.location || "출생지를 설정해주세요"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Graph and Events Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Graph - Left (2/3 width) */}
          <div className="lg:col-span-2">
            {showForm ? (
              <EventForm
                event={editingEvent}
                onSave={saveEvent}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
                isDisabled={isSaving}
                _isDarkMode={isDarkMode}
                _showAlert={showAlert}
              />
            ) : (
              <LifeGraphChart
                _userInfo={userInfo}
                events={events}
                onAddEvent={() => setShowForm(true)}
                _isDarkMode={isDarkMode}
              />
            )}
          </div>

          {/* Events List - Right (1/3 width) */}
          <div className="lg:col-span-1">
            {/* Events List */}
            <div className="bg-white rounded-xl p-2 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600 rounded-xl">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">추억 목록</h3>
                    <p className="text-base text-gray-500 mt-1">기록된 인생 이벤트</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-4 py-2 bg-teal-600 text-white text-base rounded-full font-semibold shadow-lg">
                    {events.length}개
                  </span>
                  {events.length > 0 && (
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                {events
                  .filter(
                    (event) =>
                      typeof event.year === "number" && !isNaN(event.year)
                  )
                  .sort((a, b) => {
                    return (
                      a.year - b.year ||
                      (a.month ?? 0) - (b.month ?? 0) ||
                      (a.day ?? 0) - (b.day ?? 0)
                    );
                  })
                  .reverse()
                  .map((event, index) => (
                    <div
                      key={`event-${event.id}-${index}`}
                      className="group/event bg-gray-50 hover:bg-teal-50 border-2 border-gray-200 hover:border-teal-300 rounded-xl p-2 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <div className="relative mr-2">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border-2 border-gray-200">
                                <span className="text-2xl">
                                  {emotionConfig[event.emotion].label}
                                </span>
                              </div>
                              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-white ${
                                emotionConfig[event.emotion].color === '#10B981' ? 'bg-emerald-500' :
                                emotionConfig[event.emotion].color === '#3B82F6' ? 'bg-blue-500' :
                                emotionConfig[event.emotion].color === '#6B7280' ? 'bg-gray-500' :
                                emotionConfig[event.emotion].color === '#F59E0B' ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-gray-800">
                                  {event.year}
                                  {event.month
                                    ? `.${String(event.month).padStart(2, "0")}`
                                    : ""}
                                  {event.day
                                    ? `.${String(event.day).padStart(2, "0")}`
                                    : ""}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2.5 h-2.5 rounded-full ${
                                        i < emotionConfig[event.emotion].value
                                          ? emotionConfig[event.emotion].color === '#10B981' ? 'bg-emerald-500' :
                                            emotionConfig[event.emotion].color === '#3B82F6' ? 'bg-blue-500' :
                                            emotionConfig[event.emotion].color === '#6B7280' ? 'bg-gray-500' :
                                            emotionConfig[event.emotion].color === '#F59E0B' ? 'bg-amber-500' :
                                            'bg-red-500'
                                          : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div
                                className={`h-2 w-full rounded-full ${
                                  emotionConfig[event.emotion].color === '#10B981' ? 'bg-emerald-500' :
                                  emotionConfig[event.emotion].color === '#3B82F6' ? 'bg-blue-500' :
                                  emotionConfig[event.emotion].color === '#6B7280' ? 'bg-gray-500' :
                                  emotionConfig[event.emotion].color === '#F59E0B' ? 'bg-amber-500' :
                                  'bg-red-500'
                                } opacity-60`}
                              ></div>
                            </div>
                          </div>
                          <p className="font-bold text-base text-gray-900 mb-1 group-hover/event:text-teal-700 transition-colors duration-200">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2 opacity-0 group-hover/event:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setShowForm(true);
                            }}
                            disabled={isSaving}
                            className="p-1.5 hover:bg-teal-100 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="추억 수정"
                            aria-label="추억 수정하기"
                          >
                            <Edit2 className="h-4 w-4 text-teal-600" />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={isSaving}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="추억 삭제"
                            aria-label="추억 삭제하기"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {events.length === 0 && (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-200">
                        <Heart className="h-12 w-12 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">아직 추억이 없습니다</h3>
                    <p className="text-lg text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                      인생의 소중한 순간들을 기록하여<br />
                      아름다운 그래프를 만들어보세요
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-2xl shadow-lg transition-colors text-base font-semibold"
                      title="첫 번째 추억 추가하기"
                      aria-label="첫 번째 추억 추가하기"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        추억 추가하기
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#374151" : "#f1f5f9"};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#6b7280" : "#cbd5e1"};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#9ca3af" : "#94a3b8"};
        }
      `}</style>
    </div>
  );
}

// Modern Event Form Component
interface EventFormProps {
  event: LifeEvent | null;
  onSave: (event: Omit<LifeEvent, "id">) => void;
  onCancel: () => void;
  isDisabled?: boolean;
  _isDarkMode?: boolean;
  _showAlert: (options: { type: 'error' | 'success' | 'warning' | 'info'; title: string; message: string; confirmText?: string }) => void;
}

function EventForm({
  event,
  onSave,
  onCancel,
  isDisabled = false,
  _isDarkMode = false,
  _showAlert,
}: EventFormProps) {
  const [formData, setFormData] = useState<Omit<LifeEvent, "id">>({
    year: event?.year ?? new Date().getFullYear(),
    month: event?.month,
    day: event?.day,
    title: event?.title ?? "",
    description: event?.description ?? "",
    emotion: event?.emotion ?? ("NEUTRAL" as const),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emotionEntries = Object.entries(emotionConfig) as Array<
    [
      EmotionKey,
      { label: string; value: number; color: string; gradient: string }
    ]
  >;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isDisabled) return;

    if (!formData.title.trim()) {
      _showAlert({ type: 'error', title: "입력 오류", message: "제목을 입력해주세요." });
      return;
    }

    if (
      !formData.year ||
      isNaN(formData.year) ||
      formData.year < 1900 ||
      formData.year > 2100
    ) {
      _showAlert({ type: 'error', title: "입력 오류", message: "올바른 년도를 입력해주세요." });
      return;
    }

    if (formData.month !== undefined) {
      if (
        !Number.isInteger(formData.month) ||
        formData.month < 1 ||
        formData.month > 12
      ) {
        _showAlert({ type: 'error', title: "입력 오류", message: "월은 1~12 사이의 정수여야 합니다." });
        return;
      }
    }
    if (formData.day !== undefined) {
      if (formData.month === undefined) {
        _showAlert({ type: 'error', title: "입력 오류", message: "일을 입력하려면 월을 먼저 입력하세요." });
        return;
      }
      const daysInMonth = new Date(formData.year, formData.month, 0).getDate();
      if (
        !Number.isInteger(formData.day) ||
        formData.day < 1 ||
        formData.day > daysInMonth
      ) {
        alert(`${formData.month}월은 1일부터 ${daysInMonth}일까지만 있습니다.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center space-x-2 mb-3">
        <div className="relative">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Plus className="h-6 w-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {event ? "추억 수정하기" : "새로운 추억 추가하기"}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            특별한 순간을 기록해보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="group/input">
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              년도 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400"
                min={1900}
                max={2100}
                required
                disabled={isSubmitting || isDisabled}
                placeholder="예: 1990"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Calendar className="h-5 w-5 text-gray-400 group-hover/input:text-teal-500 transition-colors duration-200" />
              </div>
            </div>
          </div>

          <div className="group/input">
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              월 (선택)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.month ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    month:
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400"
                min={1}
                max={12}
                disabled={isSubmitting || isDisabled}
                placeholder="1~12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 text-sm group-hover/input:text-teal-500 transition-colors duration-200">월</span>
              </div>
            </div>
          </div>

          <div className="group/input">
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              일 (선택)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.day ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    day:
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400"
                min={1}
                max={31}
                disabled={isSubmitting || isDisabled}
                placeholder="1~31"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 text-sm group-hover/input:text-teal-500 transition-colors duration-200">일</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="group/input">
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            추억 제목 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 hover:border-gray-400"
              placeholder="예: 대학교 입학, 첫 직장, 결혼 등"
              maxLength={100}
              required
              disabled={isSubmitting || isDisabled}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400 text-sm group-hover/input:text-teal-500 transition-colors duration-200">
                {formData.title.length}/100
              </span>
            </div>
          </div>
        </div>

        {/* Emotion Section */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">감정 선택</label>
          <div className="grid grid-cols-5 gap-2">
            {emotionEntries.map(([key, config]) => (
              <button
                key={`emotion-${key}`}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, emotion: key }))
                }
                disabled={isSubmitting || isDisabled}
                className={`group/emotion p-2 rounded-xl border-2 text-center transition-all duration-200 disabled:opacity-50 ${
                  formData.emotion === key
                    ? `border-teal-500 bg-teal-600 text-white shadow-lg`
                    : `border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100`
                }`}
                title={`${config.label} (${config.value}점)`}
                aria-label={`${config.label} 감정 선택`}
              >
                <div className="text-3xl mb-2 group-hover/emotion:scale-110 transition-transform duration-200">
                  {config.label}
                </div>
                <div
                  className={`text-xs font-medium ${
                    formData.emotion === key
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {config.value}점
                </div>
                {formData.emotion === key && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div className="group/input">
          <label className="block text-sm font-semibold mb-1 text-gray-700">상세 설명</label>
          <div className="relative">
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-all duration-200 resize-none hover:border-gray-400"
              rows={3}
              maxLength={500}
              placeholder="이 시기에 대한 자세한 설명을 입력하세요..."
              disabled={isSubmitting || isDisabled}
            />
            <div className="absolute bottom-3 right-3">
              <span className="text-gray-400 text-sm group-hover/input:text-teal-500 transition-colors duration-200">
                {formData.description.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isDisabled}
            className="group/save flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg font-medium flex items-center justify-center text-sm"
            title={event ? "추억 수정하기" : "새로운 추억 추가하기"}
            aria-label={event ? "추억 수정하기" : "새로운 추억 추가하기"}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                처리 중...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5 group-hover/save:scale-110 transition-transform duration-200" />
                {event ? "수정하기" : "추가하기"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isDisabled}
            className="group/cancel flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium flex items-center justify-center text-sm"
            title="작성 취소"
            aria-label="추억 작성 취소"
          >
            <X className="mr-2 h-5 w-5 group-hover/cancel:rotate-90 transition-transform duration-200" />
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

// Modern Life Graph Chart Component
interface LifeGraphChartProps {
  _userInfo: UserInfo;
  events: LifeEvent[];
  onAddEvent: () => void;
  _isDarkMode?: boolean;
}

function LifeGraphChart({
  _userInfo,
  events,
  onAddEvent,
  _isDarkMode = false,
}: LifeGraphChartProps) {
  const generateGraphPoints = () => {
    if (events.length === 0) return [];

    const validEvents = events.filter(
      (event) =>
        typeof event.year === "number" &&
        !isNaN(event.year) &&
        event.year > 1900 &&
        event.year < 2100
    );

    if (validEvents.length === 0) return [];

    const sortedEvents = [...validEvents].sort((a, b) => {
      return (
        a.year - b.year ||
        (a.month ?? 0) - (b.month ?? 0) ||
        (a.day ?? 0) - (b.day ?? 0)
      );
    });

    return sortedEvents.map((event, index) => ({
      year: event.year,
      label:
        event.year.toString() +
        (event.month ? `.${String(event.month).padStart(2, "0")}` : ""),
      value: emotionConfig[event.emotion].value,
      color: emotionConfig[event.emotion].color,
      gradient: emotionConfig[event.emotion].gradient,
      event,
      id: `point-${event.id}-${index}`,
    }));
  };

  const graphPoints = generateGraphPoints();
  const chartWidth = 1600;
  const chartHeight = 500;
  const padding = 100;

  const getX = (idx: number, n: number) => {
    if (n <= 1) return chartWidth / 2;
    const span = chartWidth - 2 * padding;
    return padding + (idx * span) / (n - 1);
  };

  const getY = (value: number) => {
    const span = chartHeight - 2 * padding;
    return chartHeight - padding - ((value - 1) * span) / 4;
  };

  if (graphPoints.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
        <div className="py-16">
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg border-2 border-gray-200">
              <BarChart3 className="h-14 w-14 text-gray-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-gray-900">
            추억을 추가하면 그래프가 나타납니다
          </h3>
          <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            인생의 소중한 순간들을 기록하여<br />
            아름다운 그래프로 만들어보세요
          </p>
            <button
              onClick={onAddEvent}
              className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-2xl shadow-lg font-semibold flex items-center mx-auto transition-colors text-base"
              title="첫 번째 추억 추가하기"
              aria-label="첫 번째 추억 추가하기"
            >
              <Plus className="mr-2 h-5 w-5" />
              첫 번째 추억 추가하기
            </button>
        </div>
      </div>
    );
  }

  const n = graphPoints.length;

  return (
    <div className="bg-white rounded-xl p-2 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all duration-300 group">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">인생 그래프</h3>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="px-2 py-1 bg-blue-600 text-white text-sm rounded-full font-semibold shadow-lg">
            {graphPoints.length}개
          </span>
          {graphPoints.length > 0 && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto mb-2">
        <div className="min-w-full flex justify-center">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="drop-shadow-lg"
          >
            {/* Background Gradient */}
            <defs>
              <linearGradient
                id="chartGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="#f0fdfa"
                  stopOpacity="0.8"
                />
                <stop
                  offset="50%"
                  stopColor="#f8fafc"
                  stopOpacity="0.6"
                />
                <stop
                  offset="100%"
                  stopColor="#e2e8f0"
                  stopOpacity="0.3"
                />
              </linearGradient>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="50%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#0F766E" />
              </linearGradient>
            </defs>

            {/* Background */}
            <rect
              width={chartWidth}
              height={chartHeight}
              fill="url(#chartGradient)"
              rx="20"
            />

            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((value) => {
              const y = getY(value);
              return (
                <g key={`grid-line-${value}`}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeDasharray="8,4"
                    opacity="0.4"
                  />
                  <text
                    x={padding - 15}
                    y={y + 6}
                    textAnchor="end"
                    className="text-sm font-medium fill-gray-500"
                  >
                    {value === 1
                      ? "매우슬픔"
                      : value === 2
                      ? "슬픔"
                      : value === 3
                      ? "보통"
                      : value === 4
                      ? "행복"
                      : "매우행복"}
                  </text>
                </g>
              );
            })}

            {/* Year/Month axis */}
            {graphPoints.map((point, index) => {
              const x = getX(index, n);
              return (
                <text
                  key={`year-label-${point.id}`}
                  x={x}
                  y={chartHeight - padding + 30}
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-600"
                >
                  {point.label}
                </text>
              );
            })}

            {/* Area under curve */}
            {n > 1 && (
              <path
                d={`M ${getX(0, n)},${chartHeight - padding} L ${graphPoints
                  .map((point, index) => {
                    const x = getX(index, n);
                    const y = getY(point.value);
                    return `${x},${y}`;
                  })
                  .join(" L ")} L ${getX(n - 1, n)},${chartHeight - padding} Z`}
                fill="url(#lineGradient)"
                fillOpacity="0.1"
              />
            )}

            {/* Graph line */}
            {n > 1 && (
              <path
                d={`M ${graphPoints
                  .map((point, index) => {
                    const x = getX(index, n);
                    const y = getY(point.value);
                    return `${x},${y}`;
                  })
                  .join(" L ")}`}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 4px 8px rgba(20, 184, 166, 0.3))"
              />
            )}

            {/* Data points */}
            {graphPoints.map((point, index) => {
              const x = getX(index, n);
              const y = getY(point.value);
              return (
                <g key={`data-point-${point.id}`}>
                  {/* Glow effect */}
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill={point.color}
                    fillOpacity="0.2"
                    className="animate-pulse"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill={point.color}
                    fillOpacity="0.4"
                    className="animate-pulse"
                  />
                  {/* Main point */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={point.color}
                    stroke="white"
                    strokeWidth="3"
                    className="cursor-pointer transition-all duration-300 hover:scale-125 drop-shadow-lg"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                  />
                  {/* Tooltip */}
                  <title>
                    {`${point.event.year}${
                      point.event.month
                        ? "." + String(point.event.month).padStart(2, "0")
                        : ""
                    }${
                      point.event.day
                        ? "." + String(point.event.day).padStart(2, "0")
                        : ""
                    } : ${point.event.title}`}
                  </title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        {[
          {
            label: "총 추억",
            value: events.length,
            icon: Heart,
            color: "from-teal-400 to-teal-600",
            bgColor: "from-teal-50 to-teal-100",
          },
          {
            label: "평균 감정",
            value: (
              events.reduce(
                (sum, e) => sum + emotionConfig[e.emotion].value,
                0
              ) / events.length || 0
            ).toFixed(1),
            icon: Star,
            color: "from-blue-400 to-blue-600",
            bgColor: "from-blue-50 to-blue-100",
          },
          {
            label: "최고점",
            value: Math.max(
              ...events.map((e) => emotionConfig[e.emotion].value),
              0
            ),
            icon: TrendingUp,
            color: "from-purple-400 to-purple-600",
            bgColor: "from-purple-50 to-purple-100",
          },
          {
            label: "기간",
            value:
              events.length > 1
                ? `${
                    Math.max(...events.map((e) => e.year)) -
                    Math.min(...events.map((e) => e.year))
                  }년`
                : "1년",
            icon: Calendar,
            color: "from-pink-400 to-pink-600",
            bgColor: "from-pink-50 to-pink-100",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`group/stat bg-gradient-to-br ${stat.bgColor} rounded-xl p-2 text-center hover:shadow-lg transition-all duration-200 border border-white/50`}
          >
            <div
              className={`w-8 h-8 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-1 shadow-lg`}
            >
              <stat.icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-base font-bold text-gray-900 mb-0.5">{stat.value}</div>
            <div className="text-xs text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Add Event Button removed by request */}

    </div>
  );
}

// Export the main component with modals
export default function LifeGraphPageWithModals() {
  return (
    <ModalProviderWithContext>
      <LifeGraphPage />
    </ModalProviderWithContext>
  );
}
