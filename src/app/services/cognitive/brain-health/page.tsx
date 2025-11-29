// app/services/cognitive/brain-health/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Activity,
  Moon,
  Book,
  Users,
  Smile,
  Stethoscope,
  XCircle,
  Shield,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/lib/save-assessment";

interface ChecklistItem {
  id: number;
  category: string;
  question: string;
  description: string;
  options: {
    value: "always" | "often" | "sometimes" | "rarely" | "never";
    label: string;
    score: number;
  }[];
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    category: "식단",
    question: "균형 잡힌 식단을 유지하고 있나요?",
    description: "과일, 채소, 통곡물, 건강한 지방, 단백질을 포함한 다양한 영양소를 섭취하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 2,
    category: "운동",
    question: "규칙적인 운동을 하고 있나요?",
    description: "주 3~5회, 30분 이상의 유산소 운동이나 근력 운동을 하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 3,
    category: "수면",
    question: "충분한 수면을 취하고 있나요?",
    description: "하루 7~9시간의 양질의 수면을 취하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 4,
    category: "정신적 활동",
    question: "정신적 자극 활동에 참여하고 있나요?",
    description: "독서, 퍼즐, 악기 연주, 새로운 기술 학습 등 뇌를 자극하는 활동을 하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 5,
    category: "사회적 교류",
    question: "사회적 교류를 유지하고 있나요?",
    description: "가족, 친구들과의 정기적인 만남과 대화를 통해 사회적 관계를 유지하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 6,
    category: "스트레스 관리",
    question: "스트레스를 효과적으로 관리하고 있나요?",
    description: "명상, 요가, 심호흡, 취미 활동 등을 통해 스트레스를 관리하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 7,
    category: "건강 검진",
    question: "정기적인 건강 검진을 받고 있나요?",
    description: "혈압, 혈당, 콜레스테롤 등 뇌 건강에 영향을 미치는 지표를 정기적으로 확인하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 8,
    category: "금연 및 절주",
    question: "흡연을 피하고 음주를 적당히 하고 있나요?",
    description: "흡연을 하지 않고, 알코올 섭취를 적당한 수준으로 제한하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 9,
    category: "뇌 손상 예방",
    question: "뇌 손상을 예방하는 습관을 가지고 있나요?",
    description: "안전벨트 착용, 보호 장비 사용 등 사고로 인한 뇌 손상을 예방하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 10,
    category: "긍정적 태도",
    question: "긍정적인 태도와 마음가짐을 유지하고 있나요?",
    description: "긍정적인 사고방식과 감사하는 마음을 통해 정신 건강을 증진시키는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
];

const categoryIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  "식단": Heart,
  "운동": Activity,
  "수면": Moon,
  "정신적 활동": Book,
  "사회적 교류": Users,
  "스트레스 관리": Smile,
  "건강 검진": Stethoscope,
  "금연 및 절주": XCircle,
  "뇌 손상 예방": Shield,
  "긍정적 태도": Sparkles,
};

export default function BrainHealthChecklistPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "checklist" | "result">("intro");
  const [answers, setAnswers] = useState<{ [key: number]: "always" | "often" | "sometimes" | "rarely" | "never" | null }>({});
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAnswer = (answer: "always" | "often" | "sometimes" | "rarely" | "never") => {
    const itemId = checklistItems[currentItemIndex].id;
    setAnswers({ ...answers, [itemId]: answer });
  };

  const handleNext = () => {
    if (answers[checklistItems[currentItemIndex].id]) {
      if (currentItemIndex < checklistItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      } else {
        setStep("result");
      }
    }
  };

  const handlePrev = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const progress = ((currentItemIndex + 1) / checklistItems.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a !== null).length;

  // 결과 계산
  const calculateResult = () => {
    const totalScore = checklistItems.reduce((sum, item) => {
      const answer = answers[item.id];
      if (!answer) return sum;
      const option = item.options.find(opt => opt.value === answer);
      return sum + (option?.score || 0);
    }, 0);

    const maxScore = checklistItems.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const averageScore = totalScore / checklistItems.length;

    let level: "excellent" | "good" | "fair" | "poor";
    let message: string;
    let color: string;
    let recommendations: string[];

    if (averageScore >= 4.5) {
      level = "excellent";
      message = "뇌 건강 상태가 매우 양호합니다!";
      color = "green";
      recommendations = [
        "현재 생활습관을 지속적으로 유지하세요.",
        "다양한 정신적 활동을 통해 뇌를 더욱 자극하세요.",
        "정기적인 건강 검진을 통해 현재 상태를 모니터링하세요.",
      ];
    } else if (averageScore >= 3.5) {
      level = "good";
      message = "뇌 건강 상태가 양호합니다.";
      color = "blue";
      recommendations = [
        "일부 영역에서 개선의 여지가 있습니다.",
        "점수가 낮은 항목에 집중하여 개선하세요.",
        "규칙적인 운동과 건강한 식단을 더욱 강화하세요.",
      ];
    } else if (averageScore >= 2.5) {
      level = "fair";
      message = "뇌 건강을 위해 개선이 필요합니다.";
      color = "yellow";
      recommendations = [
        "점수가 낮은 항목들을 우선적으로 개선하세요.",
        "규칙적인 운동과 건강한 식단을 시작하세요.",
        "충분한 수면과 스트레스 관리를 위해 노력하세요.",
        "정기적인 건강 검진을 받으시기 바랍니다.",
      ];
    } else {
      level = "poor";
      message = "뇌 건강을 위해 즉시 개선이 필요합니다.";
      color = "red";
      recommendations = [
        "의료진과 상담하여 건강 상태를 점검하세요.",
        "규칙적인 운동과 건강한 식단을 즉시 시작하세요.",
        "충분한 수면을 확보하고 스트레스를 관리하세요.",
        "정기적인 건강 검진을 받으시기 바랍니다.",
        "금연 및 절주를 실천하세요.",
      ];
    }

    // 카테고리별 점수 계산
    const categoryScores: { [key: string]: { total: number; count: number } } = {};
    checklistItems.forEach(item => {
      const answer = answers[item.id];
      if (answer) {
        const option = item.options.find(opt => opt.value === answer);
        if (!categoryScores[item.category]) {
          categoryScores[item.category] = { total: 0, count: 0 };
        }
        categoryScores[item.category].total += option?.score || 0;
        categoryScores[item.category].count += 1;
      }
    });

    const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      average: data.count > 0 ? data.total / data.count : 0,
    }));

    return {
      totalScore,
      maxScore,
      percentage,
      averageScore: Math.round(averageScore * 10) / 10,
      level,
      message,
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
        assessmentType: "brain_health",
        testDate: new Date().toISOString(),
        answers: answers,
        totalScore: result.totalScore,
        averageScore: result.averageScore,
        percentage: result.percentage,
        riskLevel: result.level,
        interpretation: result.message,
        message: result.message,
        description: result.message,
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-pink-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg px-2 py-1"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border border-purple-200 mb-4">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">뇌 건강 체크리스트</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              뇌 건강 체크리스트
            </h1>
            <p className="text-lg text-gray-600">
              일상생활 습관을 점검하여 뇌 건강 상태를 확인하세요
            </p>
          </div>
        </div>

        {/* Intro Step */}
        {step === "intro" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                뇌 건강 체크리스트 안내
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                총 10개의 항목으로 구성된 체크리스트를 통해<br />
                뇌 건강을 유지하기 위한 생활습관을 점검합니다.
              </p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                체크리스트 항목
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from(new Set(checklistItems.map(item => item.category))).map(category => {
                  const IconComponent = categoryIcons[category];
                  return (
                    <div key={category} className="flex items-center gap-2 text-sm text-gray-700">
                      {IconComponent && <IconComponent className="h-4 w-4 text-purple-600" />}
                      <span>{category}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                평가 방법
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                각 항목에 대해 다음 5단계로 평가합니다:
              </p>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">항상 (5점):</span>
                  <span>매일 또는 거의 매일 실천</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">자주 (4점):</span>
                  <span>주 3~4회 실천</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">가끔 (3점):</span>
                  <span>주 1~2회 실천</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">거의 안함 (2점):</span>
                  <span>월 1~2회 실천</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">전혀 안함 (1점):</span>
                  <span>거의 실천하지 않음</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("checklist")}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              체크리스트 시작하기
            </button>
          </div>
        )}

        {/* Checklist Step */}
        {step === "checklist" && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  진행률: {currentItemIndex + 1} / {checklistItems.length}
                </span>
                <span className="text-sm font-medium text-purple-600">
                  {answeredCount}개 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const IconComponent = categoryIcons[checklistItems[currentItemIndex].category];
                    return IconComponent ? (
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    ) : null;
                  })()}
                  <div>
                    <div className="text-sm font-semibold text-purple-600 mb-1">
                      {checklistItems[currentItemIndex].category}
                    </div>
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full">
                      <span className="text-lg font-bold text-white">{currentItemIndex + 1}</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  {checklistItems[currentItemIndex].question}
                </h2>
                <p className="text-base text-gray-600 leading-relaxed">
                  {checklistItems[currentItemIndex].description}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                {checklistItems[currentItemIndex].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full px-6 py-4 rounded-xl border-2 transition-all text-left ${
                      answers[checklistItems[currentItemIndex].id] === option.value
                        ? option.score >= 4
                          ? "border-green-500 bg-green-50 text-green-700 shadow-lg"
                          : option.score >= 3
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-lg"
                          : "border-red-500 bg-red-50 text-red-700 shadow-lg"
                        : "border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg mb-1">{option.label}</div>
                        <div className="text-sm opacity-80">({option.score}점)</div>
                      </div>
                      {answers[checklistItems[currentItemIndex].id] === option.value && (
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
                  disabled={currentItemIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                  이전
                </button>
                <button
                  onClick={handleNext}
                  disabled={!answers[checklistItems[currentItemIndex].id]}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {currentItemIndex === checklistItems.length - 1 ? "결과 보기" : "다음"}
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
            red: "from-red-600 to-rose-700",
          };
          const bgClasses = {
            green: "bg-green-50 border-green-200",
            blue: "bg-blue-50 border-blue-200",
            yellow: "bg-yellow-50 border-yellow-200",
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
                  체크리스트 결과
                </h2>
                <div className={`inline-block px-4 py-2 rounded-full border-2 ${bgClasses[result.color as keyof typeof bgClasses]} mb-4`}>
                  <span className="font-semibold">{result.message}</span>
                </div>

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
                      <div className="text-sm text-gray-600">뇌 건강 지수</div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-purple-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    카테고리별 점수
                  </h3>
                  <div className="space-y-3">
                    {result.categoryAverages.map((cat) => {
                      const IconComponent = categoryIcons[cat.category];
                      const catPercentage = Math.round((cat.average / 5) * 100);
                      return (
                        <div key={cat.category} className="bg-white rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {IconComponent && <IconComponent className="h-5 w-5 text-purple-600" />}
                              <span className="font-semibold text-gray-900">{cat.category}</span>
                            </div>
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
                    ⚠️ 이 체크리스트는 참고용이며, 의학적 진단을 대체하지 않습니다. 
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
                    setCurrentItemIndex(0);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  다시 검사하기
                </button>
                <button
                  onClick={() => router.push("/services/cognitive")}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  인지 클래스로 돌아가기
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

