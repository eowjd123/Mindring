"use client";

import {
  BarChart3,
  Calendar,
  Download,
  Edit2,
  Home,
  LogOut,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface LifeEvent {
  id: string;
  year: number;
  month?: number; // ✅ 추가
  day?: number;   // ✅ 추가
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
  { label: string; value: number; color: string }
> = {
  VERY_HAPPY: { label: "😊", value: 5, color: "#10B981" },
  HAPPY: { label: "🙂", value: 4, color: "#3B82F6" },
  NEUTRAL: { label: "😐", value: 3, color: "#6B7280" },
  SAD: { label: "😔", value: 2, color: "#F59E0B" },
  VERY_SAD: { label: "😢", value: 1, color: "#EF4444" },
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

        const validEvents: LifeEvent[] = data.events.filter((event: LifeEvent) => {
          const basic =
            typeof event.year === "number" &&
            !Number.isNaN(event.year) &&
            event.year > 1900 &&
            event.year < 2100 &&
            !!event.title &&
            (event.emotion as EmotionKey) in emotionConfig;

          // month/day가 있을 때만 추가 검증
          const monthOk =
            event.month === undefined ||
            (Number.isInteger(event.month) && event.month! >= 1 && event.month! <= 12);

          const dayOk =
            event.day === undefined ||
            (Number.isInteger(event.day) &&
              (() => {
                if (!event.month) return true; // 월이 없으면 일 검증 생략
                const daysInMonth = new Date(event.year, event.month, 0).getDate(); // month=1~12 기준
                return event.day! >= 1 && event.day! <= daysInMonth;
              })());

          return basic && monthOk && dayOk;
        });

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

  // 개선된 저장 로직 - 한 번의 클릭으로 저장 완료
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

    // 월/일 유효성(선택 시만)
    if (eventData.month !== undefined) {
      if (!Number.isInteger(eventData.month) || eventData.month < 1 || eventData.month > 12) {
        alert("월은 1~12 사이의 정수여야 합니다.");
        return;
      }
    }
    if (eventData.day !== undefined) {
      if (eventData.month === undefined) {
        alert("일을 입력하려면 월을 먼저 입력하세요.");
        return;
      }
      const daysInMonth = new Date(eventData.year, eventData.month, 0).getDate();
      if (!Number.isInteger(eventData.day) || eventData.day < 1 || eventData.day > daysInMonth) {
        alert(`${eventData.month}월은 1일부터 ${daysInMonth}일까지만 있습니다.`);
        return;
      }
    }

    try {
      let updatedEvents: LifeEvent[];

      if (editingEvent) {
        const updatedEvent: LifeEvent = { ...eventData, id: editingEvent.id };
        updatedEvents = events.map((e) => (e.id === editingEvent.id ? updatedEvent : e));
      } else {
        const newEvent: LifeEvent = { ...eventData, id: Date.now().toString() };
        updatedEvents = [...events, newEvent];
      }

      // 상태 업데이트
      setEvents(updatedEvents);

      // 서버에 저장 (한 번의 호출로 통합)
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
      // 실패 시 이전 상태로 복원
      loadData();
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("이 추억을 삭제하시겠습니까?")) return;

    try {
      const updatedEvents = events.filter((e) => e.id !== eventId);
      setEvents(updatedEvents);

      // 서버에 삭제된 상태 저장
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
      // 실패 시 데이터 다시 로드
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인생그래프를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
              <Image
                src="/img/OBJECTS.png"
                alt="Objects Icon"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                <Image
                  src="/img/maind.png"
                  alt="Digital Note"
                  width={120}
                  height={24}
                  className="object-contain"
                />
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              <Home className="mr-2 h-4 w-4" />
              대시보드
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 h-7 w-7 text-purple-600" />
              인생그래프
            </h2>
            <p className="text-gray-600 mt-1">
              당신의 소중한 추억들을 아름다운 그래프로 만들어보세요
            </p>
          </div>

          <div className="flex space-x-3">
            {/* JSON 가져오기 */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importFromJson}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSaving}
              />
              <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">
                <Upload className="mr-2 h-4 w-4" />
                JSON 가져오기
              </button>
            </div>

            <button
              onClick={() => exportData("json")}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              disabled={isSaving}
            >
              <Download className="mr-2 h-4 w-4" />
              JSON 내보내기
            </button>

            {/* 수동 저장 버튼 */}
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
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>오류:</strong> {error}
            <button
              onClick={loadData}
              className="ml-4 text-red-800 underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - User Info & Events */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  사용자 정보
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="이름을 입력하세요"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="출생지를 입력하세요"
                      maxLength={50}
                    />
                  </div>
                  <button
                    onClick={saveUserInfo}
                    disabled={isSaving}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <User className="mr-2 h-4 w-4" />
                    {userInfo.name || "이름을 설정해주세요"}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    {userInfo.birthYear && !isNaN(userInfo.birthYear)
                      ? `${userInfo.birthYear}년생`
                      : "출생년도를 설정해주세요"}
                  </div>
                  <div className="text-gray-600">
                    📍 {userInfo.location || "출생지를 설정해주세요"}
                  </div>
                </div>
              )}
            </div>

            {/* 감정통계 그래프 이동 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <button
                onClick={() => router.push("/dashboard/life-graph/dashboard")}
                disabled={isSaving}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Plus className="mr-2 h-5 w-5" />
                감정통계 그래프
              </button>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                추억 목록 ({events.length}개)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events
                  .filter((event) => typeof event.year === "number" && !isNaN(event.year))
                  .sort((a, b) => {
                    // 연-월-일 정렬(월/일 없으면 0으로 취급)
                    return (
                      a.year - b.year ||
                      (a.month ?? 0) - (b.month ?? 0) ||
                      (a.day ?? 0) - (b.day ?? 0)
                    );
                  })
                  .reverse()
                  .map((event, index) => (
                    <div key={`event-${event.id}-${index}`} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-lg mr-2">
                              {emotionConfig[event.emotion].label}
                            </span>
                            <span className="font-medium text-gray-900">
                              {event.year}
                              {event.month ? `.${String(event.month).padStart(2, "0")}` : ""}
                              {event.day ? `.${String(event.day).padStart(2, "0")}` : ""}년
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setShowForm(true);
                            }}
                            disabled={isSaving}
                            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={isSaving}
                            className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {events.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>아직 추억이 없습니다.</p>
                    <p className="text-sm">첫 번째 추억을 추가해보세요!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Graph */}
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
              />
            ) : (
              <LifeGraphChart
                userInfo={userInfo}
                events={events}
                onAddEvent={() => setShowForm(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Event Form Component
interface EventFormProps {
  event: LifeEvent | null;
  onSave: (event: Omit<LifeEvent, "id">) => void;
  onCancel: () => void;
  isDisabled?: boolean;
}

function EventForm({
  event,
  onSave,
  onCancel,
  isDisabled = false,
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
    [EmotionKey, { label: string; value: number; color: string }]
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

    // 월/일(선택) 검증
    if (formData.month !== undefined) {
      if (!Number.isInteger(formData.month) || formData.month < 1 || formData.month > 12) {
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
      if (!Number.isInteger(formData.day) || formData.day < 1 || formData.day > daysInMonth) {
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">
        {event ? "추억 수정하기" : "새로운 추억 추가하기"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              년도 *
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              min={1900}
              max={2100}
              required
              disabled={isSubmitting || isDisabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월(선택)
            </label>
            <input
              type="number"
              value={formData.month ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  month: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              min={1}
              max={12}
              disabled={isSubmitting || isDisabled}
              placeholder="1~12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              일(선택)
            </label>
            <input
              type="number"
              value={formData.day ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  day: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              min={1}
              max={31}
              disabled={isSubmitting || isDisabled}
              placeholder="1~31"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            추억 제목 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="예: 대학교 입학, 첫 직장, 결혼 등"
            maxLength={100}
            required
            disabled={isSubmitting || isDisabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            감정
          </label>
          <div className="grid grid-cols-5 gap-3">
            {emotionEntries.map(([key, config]) => (
              <button
                key={`emotion-${key}`}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, emotion: key }))
                }
                disabled={isSubmitting || isDisabled}
                className={`p-3 rounded-lg border-2 text-center transition-all disabled:opacity-50 ${
                  formData.emotion === key
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">{config.label}</div>
                <div className="text-xs text-gray-600">{config.value}점</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상세 설명
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows={4}
            maxLength={500}
            placeholder="이 시기에 대한 자세한 설명을 입력하세요..."
            disabled={isSubmitting || isDisabled}
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || isDisabled}
            className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSubmitting ? "처리 중..." : event ? "수정하기" : "추가하기"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isDisabled}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

// Life Graph Chart Component
interface LifeGraphChartProps {
  userInfo: UserInfo;
  events: LifeEvent[];
  onAddEvent: () => void;
}

function LifeGraphChart({ userInfo, events, onAddEvent }: LifeGraphChartProps) {
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
      event,
      id: `point-${event.id}-${index}`,
    }));
  };

  const graphPoints = generateGraphPoints();
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = 80;

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
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="py-16">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            추억을 추가하면 그래프가 나타납니다
          </h3>
          <p className="text-gray-600 mb-6">
            인생의 소중한 순간들을 기록해보세요
          </p>
          <button
            onClick={onAddEvent}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            첫 번째 추억 추가하기
          </button>
        </div>
      </div>
    );
  }

  const n = graphPoints.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {userInfo.name || "나"}의 인생그래프
        </h2>
        <p className="text-gray-600">
          {userInfo.birthYear && !isNaN(userInfo.birthYear)
            ? `${userInfo.birthYear}년생`
            : "출생년도 미설정"}
          , {userInfo.location || "출생지 미설정"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
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
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 5}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
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
                y={chartHeight - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {point.label}
              </text>
            );
          })}

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
              stroke="#8b5cf6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {graphPoints.map((point, index) => {
            const x = getX(index, n);
            const y = getY(point.value);
            return (
              <g key={`data-point-${point.id}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={point.color}
                  stroke="white"
                  strokeWidth="2"
                  className="drop-shadow-sm cursor-pointer transition-transform hover:scale-105"
                />
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

      <div className="mt-8 text-center">
        <button
          onClick={onAddEvent}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
        >
          <Plus className="inline mr-2 h-5 w-5" />
          새로운 추억 추가하기
        </button>
      </div>
    </div>
  );
}
