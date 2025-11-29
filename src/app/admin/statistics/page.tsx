"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";

interface Statistics {
  totalUsers: number;
  totalAssessments: number;
  assessmentsByType: Record<string, number>;
  assessmentsByDate: Array<{ date: string; count: number }>;
  riskLevelDistribution: Record<string, number>;
}

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await fetch("/api/admin/statistics");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">통계 분석</h1>
          <p className="mt-2 text-gray-600">시스템 사용 통계를 확인하세요</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          로딩 중...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">통계 분석</h1>
          <p className="mt-2 text-gray-600">시스템 사용 통계를 확인하세요</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          통계 데이터를 불러올 수 없습니다
        </div>
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">통계 분석</h1>
        <p className="mt-2 text-gray-600">시스템 사용 통계를 확인하세요</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 사용자</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 검사 결과</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalAssessments.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 검사 유형별 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">검사 유형별 통계</h2>
        <div className="space-y-4">
          {Object.entries(stats.assessmentsByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {assessmentTypeLabels[type] || type}
              </span>
              <div className="flex items-center gap-4">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${(count / stats.totalAssessments) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-16 text-right">
                  {count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 위험도 분포 */}
      {Object.keys(stats.riskLevelDistribution).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">위험도 분포</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.riskLevelDistribution).map(([level, count]) => (
              <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">{level}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 검사 추이 */}
      {stats.assessmentsByDate.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">최근 검사 추이 (7일)</h2>
          <div className="space-y-2">
            {stats.assessmentsByDate.map((item) => (
              <div key={item.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.date}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...stats.assessmentsByDate.map((d) => d.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-16 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

