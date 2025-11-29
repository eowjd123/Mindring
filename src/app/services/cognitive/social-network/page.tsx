// app/services/cognitive/social-network/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Phone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { lsnsQuestions, likertScaleOptions } from "./data/questions";
import { 
  calculateLSNSResult,
  getLevelColorClass,
  getLevelGradient
} from "./utils/resultCalculator";
import { saveAssessment } from "@/lib/save-assessment";

const STORAGE_KEY = "lsns-assessment";

interface StoredData {
  answers: { [key: number]: number | null };
  currentQuestionIndex: number;
  userInfo?: {
    age?: string;
    gender?: string;
    date?: string;
  };
}

export default function SocialNetworkPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "info" | "questions" | "result">("intro");
  const [userInfo, setUserInfo] = useState({
    age: "",
    gender: "" as "male" | "female" | "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{ [key: number]: number | null }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // localStorage에서 데이터 복원
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data: StoredData = JSON.parse(stored);
          setAnswers(data.answers || {});
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          if (data.userInfo) {
            setUserInfo({
              age: data.userInfo.age || "",
              gender: (data.userInfo.gender as "male" | "female" | "") || "",
              date: data.userInfo.date || new Date().toISOString().split("T")[0],
            });
          }
        } catch (error) {
          console.error("Failed to restore data:", error);
        }
      }
    }
  }, []);

  // 진행 상황 저장
  useEffect(() => {
    if (typeof window !== "undefined" && step !== "intro" && step !== "result") {
      const data: StoredData = {
        answers,
        currentQuestionIndex,
        userInfo,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [answers, currentQuestionIndex, userInfo, step]);

  const handleAnswer = (score: number) => {
    const questionId = lsnsQuestions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: score });
  };

  const handleNext = () => {
    if (answers[lsnsQuestions[currentQuestionIndex].id] !== null) {
      if (currentQuestionIndex < lsnsQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setStep("result");
        // localStorage 정리
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / lsnsQuestions.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a !== null).length;

  // 검사 결과 저장 함수
  const saveAssessmentResult = async (result: ReturnType<typeof calculateLSNSResult>) => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await saveAssessment({
        assessmentType: "social_network",
        age: userInfo.age ? parseInt(userInfo.age) : null,
        gender: userInfo.gender || null,
        testDate: userInfo.date || new Date().toISOString(),
        answers: answers,
        totalScore: result.totalScore,
        percentage: Math.round((result.totalScore / result.maxScore) * 100),
        riskLevel: result.level,
        interpretation: result.levelLabel,
        message: result.message,
        description: result.description,
        recommendations: result.recommendations,
        categoryScores: result.categoryScores,
      });

      if (!response.success) {
        throw new Error(response.error || "검사 결과 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save assessment:", error);
      setSaveError("검사 결과 저장에 실패했습니다. 결과는 화면에서 확인하실 수 있습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 결과 단계로 이동할 때 자동 저장
  useEffect(() => {
    if (step === "result") {
      const result = calculateLSNSResult(answers);
      saveAssessmentResult(result);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-cyan-200/20 to-teal-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg px-2 py-1"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">뒤로가기</span>
            </button>
            <button
              onClick={() => router.push("/services/smart-cognitive")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-sm font-medium"
              aria-label="스마트 인지관리로 돌아가기"
            >
              <span>스마트 인지관리</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full border border-teal-200 mb-4">
              <Users className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">사회적 관계망 척도</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              LSNS-6 사회적 관계망 평가
            </h1>
            <p className="text-lg text-gray-600">
              Lubben Social Network Scale-6
            </p>
          </div>
        </div>

        {/* Intro Step */}
        {step === "intro" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full mb-4">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                검사 안내
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                총 6개의 질문으로 구성된 검사를 통해<br />
                사회적 관계망과 지지 체계를 평가합니다.
              </p>
            </div>

            <div className="bg-teal-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                검사 정보
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">척도명:</span>
                  <span>LSNS-6 (Lubben Social Network Scale-6)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">총 문항수:</span>
                  <span>6문항</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">소요 시간:</span>
                  <span>약 5-10분</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">응답 방법:</span>
                  <span>0~5점 척도 (0명 ~ 9명 이상)</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                평가 기준
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">0-12점:</span>
                  <span className="text-red-700 font-semibold">낮은 수준 (사회적 고립 위험)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">13-20점:</span>
                  <span className="text-yellow-700 font-semibold">보통 수준</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">21-30점:</span>
                  <span className="text-green-700 font-semibold">높은 수준</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
              aria-label="검사 시작하기"
            >
              검사 시작하기
            </button>
          </div>
        )}

        {/* Info Step */}
        {step === "info" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              기본 정보 입력
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연령
                </label>
                <input
                  type="number"
                  value={userInfo.age}
                  onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                  placeholder="나이를 입력하세요"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-lg"
                  aria-label="나이 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성별
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "male" })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all text-lg font-medium focus:outline-none focus:ring-4 focus:ring-teal-300 ${
                      userInfo.gender === "male"
                        ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-teal-300"
                    }`}
                    aria-label="남성 선택"
                  >
                    남
                  </button>
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "female" })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all text-lg font-medium focus:outline-none focus:ring-4 focus:ring-teal-300 ${
                      userInfo.gender === "female"
                        ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-teal-300"
                    }`}
                    aria-label="여성 선택"
                  >
                    여
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  실시일
                </label>
                <input
                  type="date"
                  value={userInfo.date}
                  onChange={(e) => setUserInfo({ ...userInfo, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-lg"
                  aria-label="검사 실시일 선택"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep("intro")}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all focus:outline-none focus:ring-4 focus:ring-gray-300 text-lg"
                aria-label="이전 단계로"
              >
                이전
              </button>
              <button
                onClick={() => setStep("questions")}
                disabled={!userInfo.age || !userInfo.gender}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
                aria-label="다음 단계로"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {/* Questions Step */}
        {step === "questions" && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base sm:text-lg font-medium text-gray-700">
                  진행률: {currentQuestionIndex + 1} / {lsnsQuestions.length}
                </span>
                <span className="text-base sm:text-lg font-medium text-teal-600">
                  {answeredCount}개 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={currentQuestionIndex + 1}
                  aria-valuemin={1}
                  aria-valuemax={lsnsQuestions.length}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full">
                    <span className="text-xl font-bold text-white">{currentQuestionIndex + 1}</span>
                  </div>
                  <div className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
                    {lsnsQuestions[currentQuestionIndex].category}
                  </div>
                </div>
                <h2 
                  className="text-2xl sm:text-3xl lg:text-[26px] font-bold text-gray-900 mb-6 leading-relaxed"
                  style={{ fontSize: "26px" }}
                >
                  {lsnsQuestions[currentQuestionIndex].question}
                </h2>
                <p className="text-base sm:text-lg text-gray-500 mb-8">
                  해당 문항에 대해 가장 가까운 답변을 선택해주세요.
                </p>
              </div>

              {/* Answer Options - Large Buttons */}
              <div className="space-y-3 mb-8">
                {likertScaleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full h-[56px] px-6 rounded-2xl border-4 transition-all text-lg sm:text-xl font-bold focus:outline-none focus:ring-4 focus:ring-teal-300 flex items-center justify-center ${
                      answers[lsnsQuestions[currentQuestionIndex].id] === option.value
                        ? "border-teal-500 bg-teal-50 text-teal-700 shadow-lg scale-105"
                        : "border-gray-300 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                    aria-label={`${option.label} 선택 (${option.description})`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl font-bold">{option.label}</span>
                      <span className="text-sm text-gray-500">({option.description})</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-gray-300 text-lg"
                  aria-label="이전 질문"
                >
                  <ChevronLeft className="h-5 w-5" />
                  이전
                </button>
                <button
                  onClick={handleNext}
                  disabled={answers[lsnsQuestions[currentQuestionIndex].id] === null}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
                  aria-label={currentQuestionIndex === lsnsQuestions.length - 1 ? "결과 보기" : "다음 질문"}
                >
                  {currentQuestionIndex === lsnsQuestions.length - 1 ? "결과 보기" : "다음"}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && (() => {
          const result = calculateLSNSResult(answers);
          const colorClasses = {
            green: "from-green-500 to-emerald-600",
            yellow: "from-yellow-500 to-amber-600",
            red: "from-red-600 to-rose-700",
          };
          const bgClasses = {
            green: "bg-green-50 border-green-200",
            yellow: "bg-yellow-50 border-yellow-200",
            red: "bg-red-50 border-red-200",
          };

          return (
            <div className="space-y-6">
              {/* Result Header */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50 text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${colorClasses[result.color]} rounded-full mb-4`}>
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  검사 결과
                </h2>
                <div className={`inline-block px-4 py-2 rounded-full border-2 ${bgClasses[result.color]} mb-4`}>
                  <span className="font-semibold text-lg">{result.levelLabel}</span>
                </div>
                <p className="text-lg text-gray-700 mb-6">{result.description}</p>

                {/* Score Display */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-4xl font-bold text-gray-900 mb-1">{result.totalScore}</div>
                      <div className="text-sm text-gray-600">총 점수</div>
                      <div className="text-xs text-gray-500">(최대 {result.maxScore}점)</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {result.level === "low" ? "낮음" : result.level === "medium" ? "보통" : "높음"}
                      </div>
                      <div className="text-sm text-gray-600">관계망 수준</div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {result.categoryScores && (
                  <div className="bg-teal-50 rounded-2xl p-6 mb-6 text-left">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-teal-600" />
                      영역별 점수
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">가족 관계</span>
                          <span className="text-lg font-bold text-gray-900">{result.categoryScores.family}점</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all"
                            style={{ width: `${(result.categoryScores.family / 15) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">친구 관계</span>
                          <span className="text-lg font-bold text-gray-900">{result.categoryScores.friends}점</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all"
                            style={{ width: `${(result.categoryScores.friends / 15) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Level Explanation */}
                <div className={`${bgClasses[result.color]} rounded-2xl p-6 mb-6 text-left`}>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    점수 해석
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-semibold">0-12점 (낮은 수준):</span>
                      <span>사회적 관계망이 낮아 사회적 고립의 위험이 있을 수 있습니다.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 font-semibold">13-20점 (보통 수준):</span>
                      <span>사회적 관계망이 보통 수준입니다. 관계를 더 넓혀보시기 바랍니다.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-semibold">21-30점 (높은 수준):</span>
                      <span>사회적 관계망이 높아 풍부한 사회적 지지를 받고 있습니다.</span>
                    </div>
                  </div>
                </div>

                {/* Empathetic Message */}
                <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-blue-600" />
                    격려의 말씀
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    {result.level === "low" ? (
                      <>
                        <p className="leading-relaxed">
                          사회적 관계는 우리 삶에 매우 중요한 부분입니다. 지금은 관계망이 작을 수 있지만, 
                          작은 시작으로도 의미 있는 변화를 만들어갈 수 있습니다.
                        </p>
                        <p className="leading-relaxed">
                          이웃과의 인사, 지역 모임 참여, 취미 활동 등 작은 노력부터 시작해보세요. 
                          당신은 혼자가 아닙니다.
                        </p>
                      </>
                    ) : result.level === "medium" ? (
                      <>
                        <p className="leading-relaxed">
                          현재 사회적 관계망이 보통 수준입니다. 기존의 관계를 소중히 하면서 
                          새로운 사람들과의 만남도 시도해보시기 바랍니다.
                        </p>
                        <p className="leading-relaxed">
                          다양한 활동에 참여하시면 더 풍부한 사회적 지지를 받을 수 있습니다.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="leading-relaxed">
                          훌륭합니다! 풍부한 사회적 관계망을 가지고 계시네요. 
                          이는 건강한 노후 생활에 매우 긍정적인 요소입니다.
                        </p>
                        <p className="leading-relaxed">
                          현재의 관계를 소중히 하시고, 새로운 사람들과의 만남도 계속 시도해보세요. 
                          당신의 따뜻한 마음이 더 많은 사람들에게 전해질 것입니다.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-teal-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    권장 사항
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-teal-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Save Status */}
                {isSaving && (
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      검사 결과를 저장하는 중...
                    </p>
                  </div>
                )}
                {saveError && (
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <p className="text-sm text-red-700">{saveError}</p>
                  </div>
                )}
                {!isSaving && !saveError && (
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      검사 결과가 저장되었습니다.
                    </p>
                  </div>
                )}

                {/* Counseling Button */}
                {result.level === "low" && (
                  <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                      <Phone className="h-5 w-5 text-indigo-600" />
                      전문 상담 안내
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      사회적 고립 위험이 있는 경우, 전문 상담을 통해 도움을 받으실 수 있습니다.
                    </p>
                    <button
                      onClick={() => {
                        // 상담 연결 로직 (placeholder)
                        alert("상담 연결 기능은 준비 중입니다.");
                      }}
                      className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center gap-2 text-lg"
                      aria-label="전문 상담 연결"
                    >
                      <Phone className="h-5 w-5" />
                      전문 상담 연결하기
                    </button>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    ⚠️ 이 검사는 참고용이며, 의학적 진단을 대체하지 않습니다. 
                    정확한 진단은 전문의의 상담을 통해 받으시기 바랍니다.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setStep("intro");
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    setUserInfo({ age: "", gender: "", date: new Date().toISOString().split("T")[0] });
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all focus:outline-none focus:ring-4 focus:ring-gray-300 text-lg"
                  aria-label="다시 검사하기"
                >
                  다시 검사하기
                </button>
                <button
                  onClick={() => router.push("/services/smart-cognitive")}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
                  aria-label="스마트 인지관리로 돌아가기"
                >
                  스마트 인지관리로 돌아가기
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

