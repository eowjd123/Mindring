"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  Brain,
  BookOpen,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface UserDetail {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  assessmentCount: number;
  workCount: number;
}

interface Assessment {
  assessmentId: string;
  assessmentType: string;
  testDate: string;
  totalScore: number | null;
  riskLevel: string | null;
  interpretation: string | null;
}

const assessmentTypeLabels: Record<string, string> = {
  dementia_self: "본인 치매 검사",
  dementia_family: "가족 치매 검사",
  brain_health: "뇌 건강 체크리스트",
  depression: "노인 우울 척도",
  life_satisfaction: "생활만족도 척도",
  social_network: "사회적 관계망과 지지척도",
  death_anxiety: "죽음불안 척도",
};

const riskLevelColors: Record<string, string> = {
  normal: "bg-green-100 text-green-800",
  borderline: "bg-yellow-100 text-yellow-800",
  risk: "bg-orange-100 text-orange-800",
  high_risk: "bg-red-100 text-red-800",
  very_low: "bg-blue-100 text-blue-800",
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  very_high: "bg-purple-100 text-purple-800",
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAssessments(data.assessments || []);
      } else {
        setMessage({ type: "error", text: "사용자 정보를 불러올 수 없습니다." });
      }
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
      setMessage({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });

      if (res.ok) {
        setUser({ ...user, isAdmin: !user.isAdmin });
        setMessage({
          type: "success",
          text: `관리자 권한이 ${!user.isAdmin ? "부여" : "해제"}되었습니다.`,
        });
      } else {
        setMessage({ type: "error", text: "권한 변경에 실패했습니다." });
      }
    } catch (error) {
      console.error("Failed to toggle admin:", error);
      setMessage({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">사용자 상세</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          로딩 중...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">사용자 상세</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          사용자를 찾을 수 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용자 상세</h1>
            <p className="mt-2 text-gray-600">사용자 정보 및 활동 내역을 확인하세요</p>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 사용자 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {/* 아바타 */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User"}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-indigo-600" />
              </div>
            )}
          </div>

          {/* 사용자 정보 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.name || "이름 없음"}
              </h2>
              {user.isAdmin && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  관리자
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.email || "이메일 없음"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">가입일</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">검사 횟수</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.assessmentCount}회
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">작품 수</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.workCount}개
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">사용자 ID</p>
              <p className="text-sm font-mono text-gray-700">{user.userId}</p>
            </div>
          </div>
        </div>

        {/* 관리자 권한 토글 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">관리자 권한</h3>
              <p className="text-sm text-gray-500 mt-1">
                관리자 권한을 부여하거나 해제할 수 있습니다
              </p>
            </div>
            <button
              onClick={handleToggleAdmin}
              disabled={updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                user.isAdmin
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {user.isAdmin ? (
                <>
                  <Shield className="h-4 w-4" />
                  관리자 권한 해제
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  관리자 권한 부여
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 검사 결과 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">인지 검사 결과</h2>
              <p className="text-sm text-gray-500 mt-1">
                총 {assessments.length}개의 검사 결과
              </p>
            </div>
          </div>
        </div>

        {assessments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            검사 결과가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    검사 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    검사일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결과
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment.assessmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessmentTypeLabels[assessment.assessmentType] ||
                          assessment.assessmentType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(assessment.testDate).toLocaleDateString("ko-KR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.totalScore !== null
                        ? assessment.totalScore.toFixed(1)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assessment.riskLevel && (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            riskLevelColors[assessment.riskLevel] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {assessment.interpretation || assessment.riskLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/assessments/${assessment.assessmentId}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Brain className="h-4 w-4 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

