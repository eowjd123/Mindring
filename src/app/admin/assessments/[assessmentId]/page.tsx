"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  Brain,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

interface AssessmentDetail {
  assessmentId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  assessmentType: string;
  testDate: string;
  age: number | null;
  gender: string | null;
  education: string | null;
  relationship: string | null;
  answers: any;
  totalScore: number | null;
  averageScore: number | null;
  percentage: number | null;
  riskLevel: string | null;
  interpretation: string | null;
  message: string | null;
  description: string | null;
  recommendations: string[] | null;
  categoryScores: any;
  metadata: any;
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

const riskLevelConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  normal: {
    label: "정상",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle,
  },
  borderline: {
    label: "경계선",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: AlertCircle,
  },
  risk: {
    label: "위험",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: AlertCircle,
  },
  high_risk: {
    label: "고위험",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  very_low: {
    label: "매우 낮음",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Info,
  },
  low: {
    label: "낮음",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle,
  },
  moderate: {
    label: "보통",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: AlertCircle,
  },
  high: {
    label: "높음",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: AlertCircle,
  },
  very_high: {
    label: "매우 높음",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: Info,
  },
};

export default function AdminAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessmentDetail();
  }, [assessmentId]);

  const fetchAssessmentDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/assessments/${assessmentId}`);
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
      }
    } catch (error) {
      console.error("Failed to fetch assessment detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAnswers = (answers: any): string => {
    if (typeof answers === "string") {
      try {
        answers = JSON.parse(answers);
      } catch {
        return answers;
      }
    }
    return JSON.stringify(answers, null, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/assessments"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">검사 결과 상세</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          로딩 중...
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/assessments"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">검사 결과 상세</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          검사 결과를 찾을 수 없습니다
        </div>
      </div>
    );
  }

  const riskConfig = assessment.riskLevel
    ? riskLevelConfig[assessment.riskLevel] || {
        label: assessment.riskLevel,
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        icon: Info,
      }
    : null;

  const RiskIcon = riskConfig?.icon || Info;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/assessments"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">검사 결과 상세</h1>
            <p className="mt-2 text-gray-600">검사 결과의 상세 정보를 확인하세요</p>
          </div>
        </div>
      </div>

      {/* 검사 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">검사 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">검사 유형</p>
              <p className="text-sm font-medium text-gray-900">
                {assessmentTypeLabels[assessment.assessmentType] ||
                  assessment.assessmentType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">검사일</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(assessment.testDate).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">사용자</p>
              <Link
                href={`/admin/users/${assessment.userId}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                {assessment.userName || assessment.userEmail || "이름 없음"}
              </Link>
            </div>
          </div>

          {assessment.age && (
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">연령</p>
                <p className="text-sm font-medium text-gray-900">
                  {assessment.age}세
                </p>
              </div>
            </div>
          )}

          {assessment.gender && (
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">성별</p>
                <p className="text-sm font-medium text-gray-900">
                  {assessment.gender === "male" ? "남성" : "여성"}
                </p>
              </div>
            </div>
          )}

          {assessment.education && (
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">교육 수준</p>
                <p className="text-sm font-medium text-gray-900">
                  {assessment.education}
                </p>
              </div>
            </div>
          )}

          {assessment.relationship && (
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">관계</p>
                <p className="text-sm font-medium text-gray-900">
                  {assessment.relationship}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 검사 결과 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">검사 결과</h2>

        {/* 점수 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {assessment.totalScore !== null && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <p className="text-sm font-medium text-indigo-900">총점</p>
              </div>
              <p className="text-2xl font-bold text-indigo-700">
                {assessment.totalScore.toFixed(1)}
              </p>
            </div>
          )}

          {assessment.averageScore !== null && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">평균 점수</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {assessment.averageScore.toFixed(2)}
              </p>
            </div>
          )}

          {assessment.percentage !== null && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-900">백분율</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {assessment.percentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* 위험도 및 해석 */}
        {riskConfig && (
          <div className={`${riskConfig.bgColor} rounded-lg p-4 mb-6`}>
            <div className="flex items-center gap-3 mb-2">
              <RiskIcon className={`h-6 w-6 ${riskConfig.color}`} />
              <h3 className={`text-lg font-bold ${riskConfig.color}`}>
                {riskConfig.label}
              </h3>
            </div>
            {assessment.interpretation && (
              <p className={`text-sm ${riskConfig.color} mb-2`}>
                {assessment.interpretation}
              </p>
            )}
            {assessment.message && (
              <p className={`text-sm ${riskConfig.color}`}>{assessment.message}</p>
            )}
          </div>
        )}

        {/* 설명 */}
        {assessment.description && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">상세 설명</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {assessment.description}
            </p>
          </div>
        )}

        {/* 권장 사항 */}
        {assessment.recommendations && assessment.recommendations.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-green-900 mb-3">권장 사항</h3>
            <ul className="space-y-2">
              {assessment.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-green-800">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 카테고리별 점수 */}
        {assessment.categoryScores &&
          typeof assessment.categoryScores === "object" &&
          Object.keys(assessment.categoryScores).length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                카테고리별 점수
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(assessment.categoryScores).map(([category, score]) => (
                  <div
                    key={category}
                    className="bg-white rounded-lg p-3 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {category}
                    </span>
                    <span className="text-sm font-bold text-blue-700">
                      {typeof score === "number" ? score.toFixed(2) : String(score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* 검사 답변 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">검사 답변</h2>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
            {formatAnswers(assessment.answers)}
          </pre>
        </div>
      </div>

      {/* 메타데이터 */}
      {assessment.metadata &&
        typeof assessment.metadata === "object" &&
        Object.keys(assessment.metadata).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">추가 정보</h2>
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                {JSON.stringify(assessment.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
    </div>
  );
}

