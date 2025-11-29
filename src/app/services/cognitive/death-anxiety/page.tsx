// app/services/cognitive/death-anxiety/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Phone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { deathAnxietyQuestions } from "./data/questions";
import { 
  calculateDeathAnxietyResult,
  getLevelColorClass,
  getLevelGradient
} from "./utils/resultCalculator";
import { saveAssessment } from "@/lib/save-assessment";

const STORAGE_KEY = "death-anxiety-assessment";

interface StoredData {
  answers: { [key: number]: "yes" | "no" | null };
  currentQuestionIndex: number;
  userInfo?: {
    age?: string;
    gender?: string;
    date?: string;
  };
}

export default function DeathAnxietyPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "info" | "questions" | "result">("intro");
  const [userInfo, setUserInfo] = useState({
    age: "",
    gender: "" as "male" | "female" | "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{ [key: number]: "yes" | "no" | null }>({});
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

  const handleAnswer = (answer: "yes" | "no") => {
    const questionId = deathAnxietyQuestions[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[deathAnxietyQuestions[currentQuestionIndex].id] !== null) {
      if (currentQuestionIndex < deathAnxietyQuestions.length - 1) {
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

  const progress = ((currentQuestionIndex + 1) / deathAnxietyQuestions.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a !== null).length;

  // 검사 결과 저장 함수
  const saveAssessmentResult = async (result: ReturnType<typeof calculateDeathAnxietyResult>) => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await saveAssessment({
        assessmentType: "death_anxiety",
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
      const result = calculateDeathAnxietyResult(answers);
      saveAssessmentResult(result);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/20 to-violet-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-violet-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-2 py-1"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-full border border-indigo-200 mb-4">
              <Shield className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">죽음불안 척도</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              Templer 죽음불안척도
            </h1>
            <p className="text-lg text-gray-600">
              Death Anxiety Scale (DAS)
            </p>
          </div>
        </div>

        {/* Intro Step */}
        {step === "intro" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full mb-4">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                검사 안내
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                총 15개의 질문으로 구성된 검사를 통해<br />
                죽음에 대한 불안 수준을 평가합니다.
              </p>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                검사 정보
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">척도명:</span>
                  <span>Templer 죽음불안척도 (Death Anxiety Scale, DAS)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">총 문항수:</span>
                  <span>15문항</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">소요 시간:</span>
                  <span>약 5-10분</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">응답 방법:</span>
                  <span>예(1점) / 아니오(0점)</span>
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
                  <span className="font-semibold w-20">0-4점:</span>
                  <span className="text-green-700 font-semibold">낮은 수준 (Low)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">5-9점:</span>
                  <span className="text-yellow-700 font-semibold">보통 수준 (Medium)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">10-15점:</span>
                  <span className="text-red-700 font-semibold">높은 수준 (High)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 text-lg"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg"
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
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all text-lg font-medium focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                      userInfo.gender === "male"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                    aria-label="남성 선택"
                  >
                    남
                  </button>
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "female" })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all text-lg font-medium focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                      userInfo.gender === "female"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg"
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-lg"
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
                  진행률: {currentQuestionIndex + 1} / {deathAnxietyQuestions.length}
                </span>
                <span className="text-base sm:text-lg font-medium text-indigo-600">
                  {answeredCount}개 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={currentQuestionIndex + 1}
                  aria-valuemin={1}
                  aria-valuemax={deathAnxietyQuestions.length}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full">
                    <span className="text-xl font-bold text-white">{currentQuestionIndex + 1}</span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-relaxed">
                  {deathAnxietyQuestions[currentQuestionIndex].question}
                </h2>
                <p className="text-base sm:text-lg text-gray-500 mb-8">
                  해당 문항에 대해 가장 가까운 답변을 선택해주세요.
                </p>
              </div>

              {/* Answer Options - Large Buttons */}
              <div className="space-y-4 mb-8">
                <button
                  onClick={() => handleAnswer("yes")}
                  className={`w-full px-8 py-6 rounded-2xl border-4 transition-all text-xl sm:text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                    answers[deathAnxietyQuestions[currentQuestionIndex].id] === "yes"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg scale-105"
                      : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                  aria-label="예, 해당됩니다"
                >
                  예 (1점)
                </button>
                <button
                  onClick={() => handleAnswer("no")}
                  className={`w-full px-8 py-6 rounded-2xl border-4 transition-all text-xl sm:text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                    answers[deathAnxietyQuestions[currentQuestionIndex].id] === "no"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg scale-105"
                      : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                  aria-label="아니오, 해당되지 않습니다"
                >
                  아니오 (0점)
                </button>
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
                  disabled={answers[deathAnxietyQuestions[currentQuestionIndex].id] === null}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-lg"
                  aria-label={currentQuestionIndex === deathAnxietyQuestions.length - 1 ? "결과 보기" : "다음 질문"}
                >
                  {currentQuestionIndex === deathAnxietyQuestions.length - 1 ? "결과 보기" : "다음"}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && (() => {
          const result = calculateDeathAnxietyResult(answers);
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
                      <div className="text-sm text-gray-600">불안 수준</div>
                    </div>
                  </div>
                </div>

                {/* Level Explanation */}
                <div className={`${bgClasses[result.color]} rounded-2xl p-6 mb-6 text-left`}>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    점수 해석
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-semibold">0-4점 (낮은 수준):</span>
                      <span>죽음에 대한 불안이 낮은 수준입니다.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 font-semibold">5-9점 (보통 수준):</span>
                      <span>죽음에 대한 불안이 보통 수준입니다.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-semibold">10-15점 (높은 수준):</span>
                      <span>죽음에 대한 불안이 높은 수준입니다.</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    권장 사항
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-600 mt-1">•</span>
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
                <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-indigo-600" />
                    전문 상담 안내
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    검사 결과가 높은 수준으로 나타난 경우, 전문 상담을 통해 도움을 받으실 수 있습니다.
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-lg"
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

