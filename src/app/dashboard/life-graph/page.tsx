"use client";

import {
  BarChart3,
  Calendar,
  Download,
  Edit2,
  Heart,
  Home,
  LogOut,
  Moon,
  Plus,
  Save,
  Sparkles,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

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

export default function LifeGraphPage() {
  const router = useRouter();
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
      alert("이름을 입력해주세요.");
      return;
    }

    if (
      !userInfo.birthYear ||
      isNaN(userInfo.birthYear) ||
      userInfo.birthYear < 1900 ||
      userInfo.birthYear > new Date().getFullYear()
    ) {
      alert("올바른 출생년도를 입력해주세요.");
      return;
    }

    try {
      await saveAllData();
      alert("사용자 정보가 저장되었습니다.");
      setIsEditing(false);
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const saveEvent = async (eventData: Omit<LifeEvent, "id">) => {
    if (!eventData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (
      !eventData.year ||
      isNaN(eventData.year) ||
      eventData.year < 1900 ||
      eventData.year > 2100
    ) {
      alert("올바른 년도를 입력해주세요.");
      return;
    }

    if (eventData.month !== undefined) {
      if (
        !Number.isInteger(eventData.month) ||
        eventData.month < 1 ||
        eventData.month > 12
      ) {
        alert("월은 1~12 사이의 정수여야 합니다.");
        return;
      }
    }
    if (eventData.day !== undefined) {
      if (eventData.month === undefined) {
        alert("일을 입력하려면 월을 먼저 입력하세요.");
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
        alert("추억이 저장되었습니다.");
        setShowForm(false);
        setEditingEvent(null);
        setError(null);
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("저장 중 오류가 발생했습니다.");
      loadData();
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("이 추억을 삭제하시겠습니까?")) return;

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

      alert("추억이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("삭제 중 오류가 발생했습니다.");
      loadData();
    }
  };

  const exportData = async (format: "json") => {
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
      alert("내보내기 중 오류가 발생했습니다.");
    }
  };

  const importFromJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.userInfo && data.events) {
        setUserInfo(data.userInfo as UserInfo);
        setEvents(data.events as LifeEvent[]);
        alert("JSON 파일을 성공적으로 불러왔습니다.");
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("JSON 파일 형식이 올바르지 않습니다.");
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

  const themeClasses = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900";

  return (
    <div className={`min-h-screen ${themeClasses} transition-all duration-500`}>
      {/* Modern Header with Glassmorphism */}
      <div
        className={`sticky top-0 z-50 backdrop-blur-lg ${
          isDarkMode
            ? "bg-gray-900/80 border-gray-700"
            : "bg-white/80 border-white/20"
        } border-b shadow-lg transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Life Graph
                </h1>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  당신의 인생 여정을 아름답게
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-xl ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } transition-all duration-200 hover:scale-105`}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* ✅ 감정통계 그래프 버튼 (헤더에 새로 추가) */}
              <button
                onClick={() => router.push("/dashboard/life-graph/dashboard")}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                감정통계 그래프
                <Star className="ml-2 h-4 w-4" />
              </button>

              {/* <button
    onClick={() => router.push("/dashboard")}
    className={`flex items-center px-4 py-2 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-xl transition-all duration-200 hover:scale-105`}
  >
    <Home className="mr-2 h-4 w-4" />
    대시보드
  </button> */}

              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 py-4">
        {/* Hero Section */}
        {/* <div className="text-center mb-12">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full mb-6">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            인생그래프 분석
                        </span>
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                            당신의 소중한 추억들을
                        </span>
                        <br />
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            아름다운 그래프로
                        </span>
                    </h2>
                    
                    <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
                        인생의 특별한 순간들을 시각화하여 의미있는 패턴과 성장을 발견해보세요
                    </p>
                </div> */}

        {/* Action Bar */}
        {/* <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'} backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-white/20'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={importFromJson}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isSaving}
                                />
                                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50">
                                    <Upload className="mr-2 h-4 w-4" />
                                    JSON 가져오기
                                </button>
                            </div>

                            <button
                                onClick={() => exportData("json")}
                                className={`flex items-center px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg`}
                                disabled={isSaving}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                JSON 내보내기
                            </button>
                        </div>

                        <button
                            onClick={async () => {
                                try {
                                    await saveAllData();
                                    alert("인생그래프가 저장되었습니다.");
                                } catch {
                                    alert("저장 중 오류가 발생했습니다.");
                                }
                            }}
                            disabled={isSaving}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50"
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    저장 중...
                                </>
                            ) : (
                                "저장하기"
                            )}
                        </button>
                    </div>
                </div> */}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl mb-8 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-300 text-sm">
                    !
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-medium">오류가 발생했습니다</h3>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-3 text-red-800 dark:text-red-200 underline hover:no-underline text-sm font-medium"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Modern Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <div
              className={`${
                isDarkMode ? "bg-gray-800/50" : "bg-white/60"
              } backdrop-blur-lg rounded-2xl p-6 shadow-xl border ${
                isDarkMode ? "border-gray-700" : "border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">사용자 정보</h3>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } rounded-lg transition-colors duration-200 disabled:opacity-50`}
                  disabled={isSaving}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-200"
                      } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
                      placeholder="이름을 입력하세요"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      출생년도 *
                    </label>
                    <input
                      type="number"
                      value={userInfo.birthYear}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          birthYear: parseInt(e.target.value) || 0,
                        }))
                      }
                      className={`w-full px-4 py-3 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-200"
                      } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      출생지
                    </label>
                    <input
                      type="text"
                      value={userInfo.location}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-200"
                      } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
                      placeholder="출생지를 입력하세요"
                      maxLength={50}
                    />
                  </div>
                  <button
                    onClick={saveUserInfo}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-lg font-medium"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`flex items-center p-3 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                    } rounded-xl`}
                  >
                    <User className="mr-3 h-5 w-5 text-purple-500" />
                    <span className="font-medium">
                      {userInfo.name || "이름을 설정해주세요"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center p-3 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                    } rounded-xl`}
                  >
                    <Calendar className="mr-3 h-5 w-5 text-blue-500" />
                    <span>
                      {userInfo.birthYear && !isNaN(userInfo.birthYear)
                        ? `${userInfo.birthYear}년생`
                        : "출생년도를 설정해주세요"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center p-3 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                    } rounded-xl`}
                  >
                    <span className="mr-3 text-lg">📍</span>
                    <span>{userInfo.location || "출생지를 설정해주세요"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Dashboard Button */}
            {/* <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'} backdrop-blur-lg rounded-2xl p-6 shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-white/20'}`}>
                            <button
                                onClick={() => router.push("/dashboard/life-graph/dashboard")}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-lg font-medium"
                            >
                                <BarChart3 className="mr-3 h-5 w-5" />
                                <span>감정통계 그래프</span>
                                <Star className="ml-2 h-4 w-4" />
                            </button>
                        </div> */}

            {/* Events List */}
            <div
              className={`${
                isDarkMode ? "bg-gray-800/50" : "bg-white/60"
              } backdrop-blur-lg rounded-2xl p-6 shadow-xl border ${
                isDarkMode ? "border-gray-700" : "border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">추억 목록</h3>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full font-medium">
                  {events.length}개
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
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
                      className={`${
                        isDarkMode
                          ? "bg-gray-700/50 hover:bg-gray-600/50"
                          : "bg-gray-50 hover:bg-gray-100"
                      } border ${
                        isDarkMode ? "border-gray-600" : "border-gray-200"
                      } rounded-xl p-4 transition-all duration-200 hover:shadow-md group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-3">
                              {emotionConfig[event.emotion].label}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">
                                {event.year}
                                {event.month
                                  ? `.${String(event.month).padStart(2, "0")}`
                                  : ""}
                                {event.day
                                  ? `.${String(event.day).padStart(2, "0")}`
                                  : ""}
                              </span>
                              <div
                                className={`h-1 w-16 bg-gradient-to-r ${
                                  emotionConfig[event.emotion].gradient
                                } rounded-full`}
                              ></div>
                            </div>
                          </div>
                          <p className="font-medium text-sm mb-1">
                            {event.title}
                          </p>
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            } line-clamp-2`}
                          >
                            {event.description}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setShowForm(true);
                            }}
                            disabled={isSaving}
                            className={`p-2 ${
                              isDarkMode
                                ? "hover:bg-gray-600"
                                : "hover:bg-gray-200"
                            } rounded-lg transition-colors duration-200 disabled:opacity-50`}
                          >
                            <Edit2 className="h-4 w-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={isSaving}
                            className={`p-2 ${
                              isDarkMode
                                ? "hover:bg-gray-600"
                                : "hover:bg-gray-200"
                            } rounded-lg transition-colors duration-200 disabled:opacity-50`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {events.length === 0 && (
                  <div className="text-center py-12">
                    <div
                      className={`w-16 h-16 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      } rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <Heart
                        className={`h-8 w-8 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <h3 className="font-medium mb-2">아직 추억이 없습니다</h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      } mb-4`}
                    >
                      첫 번째 추억을 추가해보세요!
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium"
                    >
                      추억 추가하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {showForm ? (
              <EventForm
                event={editingEvent}
                onSave={saveEvent}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
                isDisabled={isSaving}
                isDarkMode={isDarkMode}
              />
            ) : (
              <LifeGraphChart
                userInfo={userInfo}
                events={events}
                onAddEvent={() => setShowForm(true)}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>
      </div>

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
  isDarkMode?: boolean;
}

function EventForm({
  event,
  onSave,
  onCancel,
  isDisabled = false,
  isDarkMode = false,
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
      alert("제목을 입력해주세요.");
      return;
    }

    if (
      !formData.year ||
      isNaN(formData.year) ||
      formData.year < 1900 ||
      formData.year > 2100
    ) {
      alert("올바른 년도를 입력해주세요.");
      return;
    }

    if (formData.month !== undefined) {
      if (
        !Number.isInteger(formData.month) ||
        formData.month < 1 ||
        formData.month > 12
      ) {
        alert("월은 1~12 사이의 정수여야 합니다.");
        return;
      }
    }
    if (formData.day !== undefined) {
      if (formData.month === undefined) {
        alert("일을 입력하려면 월을 먼저 입력하세요.");
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
    <div
      className={`${
        isDarkMode ? "bg-gray-800/50" : "bg-white/60"
      } backdrop-blur-lg rounded-2xl p-8 shadow-xl border ${
        isDarkMode ? "border-gray-700" : "border-white/20"
      }`}
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <Plus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {event ? "추억 수정하기" : "새로운 추억 추가하기"}
          </h2>
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            특별한 순간을 기록해보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Date Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-3">
              년도 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  year: parseInt(e.target.value) || 0,
                }))
              }
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200"
              } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
              min={1900}
              max={2100}
              required
              disabled={isSubmitting || isDisabled}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">
              월 (선택)
            </label>
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
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200"
              } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
              min={1}
              max={12}
              disabled={isSubmitting || isDisabled}
              placeholder="1~12"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">
              일 (선택)
            </label>
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
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200"
              } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
              min={1}
              max={31}
              disabled={isSubmitting || isDisabled}
              placeholder="1~31"
            />
          </div>
        </div>

        {/* Title Section */}
        <div>
          <label className="block text-sm font-semibold mb-3">
            추억 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className={`w-full px-4 py-3 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-200"
            } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
            placeholder="예: 대학교 입학, 첫 직장, 결혼 등"
            maxLength={100}
            required
            disabled={isSubmitting || isDisabled}
          />
        </div>

        {/* Emotion Section */}
        <div>
          <label className="block text-sm font-semibold mb-4">감정</label>
          <div className="grid grid-cols-5 gap-4">
            {emotionEntries.map(([key, config]) => (
              <button
                key={`emotion-${key}`}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, emotion: key }))
                }
                disabled={isSubmitting || isDisabled}
                className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 disabled:opacity-50 hover:scale-105 ${
                  formData.emotion === key
                    ? `border-purple-500 bg-gradient-to-br ${config.gradient} text-white shadow-lg`
                    : `${
                        isDarkMode
                          ? "border-gray-600 hover:border-gray-500 bg-gray-700/50"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50"
                      }`
                }`}
              >
                <div className="text-3xl mb-2">{config.label}</div>
                <div
                  className={`text-xs font-medium ${
                    formData.emotion === key
                      ? "text-white"
                      : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {config.value}점
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label className="block text-sm font-semibold mb-3">상세 설명</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className={`w-full px-4 py-3 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-200"
            } border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none`}
            rows={4}
            maxLength={500}
            placeholder="이 시기에 대한 자세한 설명을 입력하세요..."
            disabled={isSubmitting || isDisabled}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isDisabled}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-lg font-medium flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                처리 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                {event ? "수정하기" : "추가하기"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isDisabled}
            className={`flex-1 ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-300 hover:bg-gray-400"
            } ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            } py-4 px-6 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 font-medium`}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

// Modern Life Graph Chart Component
interface LifeGraphChartProps {
  userInfo: UserInfo;
  events: LifeEvent[];
  onAddEvent: () => void;
  isDarkMode?: boolean;
}

function LifeGraphChart({
  userInfo,
  events,
  onAddEvent,
  isDarkMode = false,
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
  const chartWidth = 900;
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
      <div
        className={`${
          isDarkMode ? "bg-gray-800/50" : "bg-white/60"
        } backdrop-blur-lg rounded-2xl p-12 text-center shadow-xl border ${
          isDarkMode ? "border-gray-700" : "border-white/20"
        }`}
      >
        <div className="py-16">
          <div
            className={`w-24 h-24 ${
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
            } rounded-3xl flex items-center justify-center mx-auto mb-6`}
          >
            <BarChart3
              className={`h-12 w-12 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            추억을 추가하면 그래프가 나타납니다
          </h3>
          <p
            className={`${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            } text-lg mb-8 max-w-md mx-auto`}
          >
            인생의 소중한 순간들을 기록하여 아름다운 그래프로 만들어보세요
          </p>
          <button
            onClick={onAddEvent}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg font-medium flex items-center mx-auto"
          >
            <Plus className="mr-2 h-5 w-5" />첫 번째 추억 추가하기
          </button>
        </div>
      </div>
    );
  }

  const n = graphPoints.length;

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800/50" : "bg-white/60"
      } backdrop-blur-lg rounded-2xl p-5 shadow-xl border ${
        isDarkMode ? "border-gray-700" : "border-white/20"
      }`}
    >
      {/* Header */}
      {/* <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full mb-4">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        Life Journey
                    </span>
                </div>
                
                <h2 className="text-3xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {userInfo.name || "나"}님의 인생그래프
                    </span>
                </h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {userInfo.birthYear && !isNaN(userInfo.birthYear)
                        ? `${userInfo.birthYear}년생`
                        : "출생년도 미설정"}
                    {userInfo.location && ` • ${userInfo.location}`}
                </p>
            </div> */}

      {/* Chart */}
      <div className="overflow-x-auto mb-8">
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
                  stopColor={isDarkMode ? "#374151" : "#f8fafc"}
                  stopOpacity="0.8"
                />
                <stop
                  offset="100%"
                  stopColor={isDarkMode ? "#1f2937" : "#e2e8f0"}
                  stopOpacity="0.2"
                />
              </linearGradient>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#3b82f6" />
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
                    stroke={isDarkMode ? "#374151" : "#e2e8f0"}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                  <text
                    x={padding - 15}
                    y={y + 6}
                    textAnchor="end"
                    className={`text-sm font-medium ${
                      isDarkMode ? "fill-gray-400" : "fill-gray-500"
                    }`}
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
                  className={`text-sm font-medium ${
                    isDarkMode ? "fill-gray-400" : "fill-gray-600"
                  }`}
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
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3))"
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
                    r="12"
                    fill={point.color}
                    fillOpacity="0.3"
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
                    className="cursor-pointer transition-all duration-200 hover:r-10 drop-shadow-lg"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "총 추억",
            value: events.length,
            icon: Heart,
            color: "from-red-500 to-pink-500",
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
            color: "from-yellow-500 to-orange-500",
          },
          {
            label: "최고점",
            value: Math.max(
              ...events.map((e) => emotionConfig[e.emotion].value),
              0
            ),
            icon: TrendingUp,
            color: "from-green-500 to-emerald-500",
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
            color: "from-blue-500 to-cyan-500",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`${
              isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
            } rounded-xl p-4 text-center`}
          >
            <div
              className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
            >
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Add Event Button */}
      <div className="text-center">
        <button
          onClick={onAddEvent}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg font-medium flex items-center mx-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          새로운 추억 추가하기
        </button>
      </div>
    </div>
  );
}
