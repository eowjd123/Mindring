"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, Download, Eye, Calendar } from "lucide-react";
import Link from "next/link";

interface Assessment {
  assessmentId: string;
  userId: string;
  userName: string | null;
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

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchAssessments();
  }, [currentPage, selectedType, searchQuery]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(selectedType !== "all" && { type: selectedType }),
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/admin/assessments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAssessments();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">인지 검사 결과 관리</h1>
        <p className="mt-2 text-gray-600">전체 검사 결과를 확인하고 관리하세요</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검사 유형 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            {Object.entries(assessmentTypeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === key
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="사용자 이름 또는 ID로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              검색
            </button>
          </form>
        </div>
      </div>

      {/* 검사 결과 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">검사 결과가 없습니다</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      검사 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
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
                          {assessmentTypeLabels[assessment.assessmentType] || assessment.assessmentType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assessment.userName || "이름 없음"}
                        </div>
                        <div className="text-xs text-gray-500">{assessment.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(assessment.testDate).toLocaleDateString("ko-KR")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assessment.totalScore !== null ? assessment.totalScore.toFixed(1) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assessment.riskLevel && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              riskLevelColors[assessment.riskLevel] || "bg-gray-100 text-gray-800"
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
                          <Eye className="h-4 w-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  페이지 {currentPage} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

