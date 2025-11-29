"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Brain,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalAssessments: number;
  totalGames: number;
  recentAssessments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAssessments: 0,
    totalGames: 0,
    recentAssessments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "전체 사용자",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      href: "/admin/users",
    },
    {
      title: "인지 검사 결과",
      value: stats.totalAssessments,
      icon: FileText,
      color: "bg-purple-500",
      href: "/admin/assessments",
    },
    {
      title: "인지 게임",
      value: stats.totalGames,
      icon: Brain,
      color: "bg-green-500",
      href: "/admin/cognitive",
    },
    {
      title: "최근 검사 (7일)",
      value: stats.recentAssessments,
      icon: Activity,
      color: "bg-orange-500",
      href: "/admin/assessments",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">시스템 전체 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                  <span>자세히 보기</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 빠른 작업 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/cognitive"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <Brain className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-gray-900">인지 게임 추가</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <Users className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-gray-900">사용자 검색</span>
          </Link>
          <Link
            href="/admin/assessments"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <FileText className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-gray-900">검사 결과 확인</span>
          </Link>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">최근 활동</h2>
          <Link
            href="/admin/assessments"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            모두 보기
          </Link>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">최근 검사 결과가 없습니다</p>
              <p className="text-xs text-gray-500 mt-1">검사 결과가 생성되면 여기에 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

