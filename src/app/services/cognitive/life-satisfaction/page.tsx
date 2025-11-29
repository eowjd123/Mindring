// app/services/cognitive/life-satisfaction/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Smile, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Star,
  Heart,
  Home,
  Users,
  DollarSign,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/lib/save-assessment";

interface Question {
  id: number;
  category: string;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
}

const questions: Question[] = [
  { 
    id: 1, 
    category: "전반적 만족도",
    question: "전반적으로 현재 생활에 얼마나 만족하십니까?",
    icon: Star
  },
  { 
    id: 2, 
    category: "가족 관계",
    question: "가족과의 관계에 얼마나 만족하십니까?",
    icon: Heart
  },
  { 
    id: 3, 
    category: "주거 환경",
    question: "현재 거주 환경에 얼마나 만족하십니까?",
    icon: Home
  },
  { 
    id: 4, 
    category: "사회적 관계",
    question: "친구나 이웃과의 관계에 얼마나 만족하십니까?",
    icon: Users
  },
  { 
    id: 5, 
    category: "경제 상태",
    question: "현재 경제 상태에 얼마나 만족하십니까?",
    icon: DollarSign
  },
  { 
    id: 6, 
    category: "건강 상태",
    question: "현재 건강 상태에 얼마나 만족하십니까?",
    icon: Activity
  },
  { 
    id: 7, 
    category: "여가 활동",
    question: "여가 시간 활용에 얼마나 만족하십니까?",
    icon: Star
  },
  { 
    id: 8, 
    category: "자아 존중감",
    question: "자신에 대한 평가에 얼마나 만족하십니까?",
    icon: Heart
  },
  { 
    id: 9, 
    category: "미래 전망",
    question: "앞으로의 생활 전망에 얼마나 만족하십니까?",
    icon: Star
  },
  { 
    id: 10, 
    category: "일상생활",
    question: "일상생활 수행 능력에 얼마나 만족하십니까?",
    icon: Activity
  },
];

const satisfactionLevels = [
  { value: 1, label: "매우 불만족", score: 1 },
  { value: 2, label: "불만족", score: 2 },
  { value: 3, label: "보통", score: 3 },
  { value: 4, label: "만족", score: 4 },
  { value: 5, label: "매우 만족", score: 5 },
];

export default function LifeSatisfactionPage() {
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

  const handleAnswer = (score: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: score });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id] !== null) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setStep("result");
      }
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a !== null).length;

  // 결과 계산
  const calculateResult = () => {
    const scores = Object.values(answers).filter((a): a is number => a !== null);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;
    const maxScore = questions.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    let level: "very_low" | "low" | "moderate" | "high" | "very_high";
    let message: string;
    let description: string;
    let color: string;
    let recommendations: string[];

    if (averageScore >= 4.5) {
      level = "very_high";
      message = "매우 높은 생활만족도";
      description = "현재 생활에 대해 매우 만족하고 긍정적인 상태입니다.";
      color = "green";
      recommendations = [
        "현재 생활 패턴을 지속적으로 유지하세요.",
        "긍정적인 마음가짐을 계속 유지하세요.",
        "가족과 친구들과의 관계를 더욱 돈독히 하세요.",
        "건강한 생활습관을 유지하세요.",
      ];
    } else if (averageScore >= 3.5) {
      level = "high";
      message = "높은 생활만족도";
      description = "현재 생활에 대해 대체로 만족하는 상태입니다.";
      color = "blue";
      recommendations = [
        "만족도가 낮은 영역에 집중하여 개선하세요.",
        "긍정적인 경험을 더 많이 만들어보세요.",
        "사회적 관계를 더욱 활발히 유지하세요.",
        "건강 관리와 여가 활동을 즐기세요.",
      ];
    } else if (averageScore >= 2.5) {
      level = "moderate";
      message = "보통 수준의 생활만족도";
      description = "현재 생활에 대해 보통 수준의 만족도를 보이고 있습니다.";
      color = "yellow";
      recommendations = [
        "만족도가 낮은 영역을 파악하고 개선 방안을 모색하세요.",
        "새로운 취미나 활동을 시작해보세요.",
        "가족이나 친구들과의 대화를 늘리세요.",
        "건강한 식단과 규칙적인 운동을 시작하세요.",
        "전문가의 상담을 고려해보세요.",
      ];
    } else if (averageScore >= 1.5) {
      level = "low";
      message = "낮은 생활만족도";
      description = "현재 생활에 대해 불만족스러운 상태입니다.";
      color = "orange";
      recommendations = [
        "불만족스러운 영역을 구체적으로 파악하세요.",
        "가족이나 신뢰할 수 있는 사람과 대화를 나누세요.",
        "작은 목표를 세우고 하나씩 달성해보세요.",
        "전문 상담사나 정신건강 전문의의 도움을 받으세요.",
        "새로운 활동이나 취미를 찾아보세요.",
      ];
    } else {
      level = "very_low";
      message = "매우 낮은 생활만족도";
      description = "현재 생활에 대해 매우 불만족스러운 상태입니다.";
      color = "red";
      recommendations = [
        "가능한 빨리 전문 상담사나 정신건강 전문의와 상담하세요.",
        "가족이나 신뢰할 수 있는 사람에게 도움을 요청하세요.",
        "작은 변화부터 시작하여 긍정적인 경험을 만들어보세요.",
        "일상생활에서 즐거움을 느낄 수 있는 활동을 찾아보세요.",
        "규칙적인 생활 패턴을 유지하고 충분한 휴식을 취하세요.",
        "혼자 모든 것을 감당하려 하지 말고 주변의 도움을 받으세요.",
      ];
    }

    // 카테고리별 점수 계산
    const categoryScores: { [key: string]: { total: number; count: number } } = {};
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer !== null) {
        if (!categoryScores[q.category]) {
          categoryScores[q.category] = { total: 0, count: 0 };
        }
        categoryScores[q.category].total += answer;
        categoryScores[q.category].count += 1;
      }
    });

    const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      average: data.count > 0 ? data.total / data.count : 0,
    }));

    return {
      totalScore,
      maxScore,
      averageScore: Math.round(averageScore * 10) / 10,
      percentage,
      level,
      message,
      description,
      color,
      recommendations,
      categoryAverages,
    };
  };

  // 결과 단계로 이동할 때 자동 저장
  useEffect(() => {
    if (step === "result") {
      const result = calculateResult();
      setIsSaving(true);
      setSaveError(null);

      saveAssessment({
        assessmentType: "life_satisfaction",
        age: userInfo.age ? parseInt(userInfo.age) : null,
        gender: userInfo.gender || null,
        testDate: userInfo.date || new Date().toISOString(),
        answers: answers,
        totalScore: result.totalScore,
        averageScore: result.averageScore,
        percentage: result.percentage,
        riskLevel: result.level,
        interpretation: result.message,
        message: result.message,
        description: result.description,
        recommendations: result.recommendations,
        categoryScores: result.categoryAverages,
      }).then(({ success, error }) => {
        setIsSaving(false);
        if (!success) {
          setSaveError(error || "검사 결과 저장에 실패했습니다.");
        }
      });
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-amber-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg px-2 py-1"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full border border-orange-200 mb-4">
              <Smile className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">생활만족도 척도</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              노인 생활만족도 척도
            </h1>
            <p className="text-lg text-gray-600">
              Life Satisfaction Scale
            </p>
          </div>
        </div>

        {/* Intro Step */}
        {step === "intro" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full mb-4">
                <Smile className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                생활만족도 척도 안내
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                총 10개의 질문으로 구성된 검사를 통해<br />
                생활 전반에 대한 만족도를 평가합니다.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                검사 정보
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">척도명:</span>
                  <span>생활만족도 척도 (Life Satisfaction Scale)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">총 문항수:</span>
                  <span>10문항</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">소요 시간:</span>
                  <span>약 5-10분</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">평가 방법:</span>
                  <span>5점 척도 (매우 불만족 ~ 매우 만족)</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                평가 영역
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                {Array.from(new Set(questions.map(q => q.category))).map(category => (
                  <div key={category} className="flex items-center gap-2">
                    <span className="text-orange-600">•</span>
                    <span>{category}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                평가 기준
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">5점:</span>
                  <span>매우 만족</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">4점:</span>
                  <span>만족</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">3점:</span>
                  <span>보통</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">2점:</span>
                  <span>불만족</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">1점:</span>
                  <span>매우 불만족</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성별
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "male" })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      userInfo.gender === "male"
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-orange-300"
                    }`}
                  >
                    남
                  </button>
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "female" })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      userInfo.gender === "female"
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-orange-300"
                    }`}
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep("intro")}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                이전
              </button>
              <button
                onClick={() => setStep("questions")}
                disabled={!userInfo.age || !userInfo.gender}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                <span className="text-sm font-medium text-gray-700">
                  진행률: {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-sm font-medium text-orange-600">
                  {answeredCount}개 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-600 to-amber-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const IconComponent = questions[currentQuestionIndex].icon;
                    return (
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-sm font-semibold text-orange-600 mb-1">
                      {questions[currentQuestionIndex].category}
                    </div>
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full">
                      <span className="text-lg font-bold text-white">{currentQuestionIndex + 1}</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  {questions[currentQuestionIndex].question}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  현재 상태에 가장 가까운 답변을 선택해주세요.
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                {satisfactionLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleAnswer(level.value)}
                    className={`w-full px-6 py-4 rounded-xl border-2 transition-all text-left ${
                      answers[questions[currentQuestionIndex].id] === level.value
                        ? level.value >= 4
                          ? "border-green-500 bg-green-50 text-green-700 shadow-lg"
                          : level.value === 3
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-lg"
                          : "border-red-500 bg-red-50 text-red-700 shadow-lg"
                        : "border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg mb-1">{level.label}</div>
                        <div className="text-sm opacity-80">({level.score}점)</div>
                      </div>
                      {answers[questions[currentQuestionIndex].id] === level.value && (
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                  이전
                </button>
                <button
                  onClick={handleNext}
                  disabled={answers[questions[currentQuestionIndex].id] === null}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {currentQuestionIndex === questions.length - 1 ? "결과 보기" : "다음"}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && (() => {
          const result = calculateResult();
          const colorClasses = {
            green: "from-green-500 to-emerald-600",
            blue: "from-blue-500 to-blue-600",
            yellow: "from-yellow-500 to-amber-600",
            orange: "from-orange-500 to-orange-600",
            red: "from-red-600 to-rose-700",
          };
          const bgClasses = {
            green: "bg-green-50 border-green-200",
            blue: "bg-blue-50 border-blue-200",
            yellow: "bg-yellow-50 border-yellow-200",
            orange: "bg-orange-50 border-orange-200",
            red: "bg-red-50 border-red-200",
          };

          return (
            <div className="space-y-6">
              {/* Result Header */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50 text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${colorClasses[result.color as keyof typeof colorClasses]} rounded-full mb-4`}>
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  검사 결과
                </h2>
                <div className={`inline-block px-4 py-2 rounded-full border-2 ${bgClasses[result.color as keyof typeof bgClasses]} mb-4`}>
                  <span className="font-semibold">{result.message}</span>
                </div>
                <p className="text-gray-700 mb-6">{result.description}</p>

                {/* Score Display */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.totalScore}</div>
                      <div className="text-sm text-gray-600">총 점수</div>
                      <div className="text-xs text-gray-500">(최대 {result.maxScore}점)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.averageScore}</div>
                      <div className="text-sm text-gray-600">평균 점수</div>
                      <div className="text-xs text-gray-500">(5점 만점)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.percentage}%</div>
                      <div className="text-sm text-gray-600">만족도 지수</div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-orange-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-orange-600" />
                    영역별 만족도
                  </h3>
                  <div className="space-y-3">
                    {result.categoryAverages.map((cat) => {
                      const catPercentage = Math.round((cat.average / 5) * 100);
                      return (
                        <div key={cat.category} className="bg-white rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{cat.category}</span>
                            <span className="text-lg font-bold text-gray-900">{cat.average.toFixed(1)}점</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                catPercentage >= 80
                                  ? "bg-green-500"
                                  : catPercentage >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${catPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
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
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  다시 검사하기
                </button>
                <button
                  onClick={() => router.push("/services/smart-cognitive")}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg"
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



