// app/services/cognitive/depression/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/lib/save-assessment";

interface Question {
  id: number;
  question: string;
  positiveAnswer: "yes" | "no"; // 우울 증상에 해당하는 답변
}

const questions: Question[] = [
  { id: 1, question: "대체로 생활에 만족하십니까?", positiveAnswer: "no" },
  { id: 2, question: "최근에 활동이나 취미에 대한 관심이 줄어들었습니까?", positiveAnswer: "yes" },
  { id: 3, question: "생활이 비어있다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 4, question: "자주 지루하다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 5, question: "대체로 기분이 좋으십니까?", positiveAnswer: "no" },
  { id: 6, question: "나쁜 일이 일어날 것 같아 두려우십니까?", positiveAnswer: "yes" },
  { id: 7, question: "대체로 행복하다고 느끼십니까?", positiveAnswer: "no" },
  { id: 8, question: "자주 무력감을 느끼십니까?", positiveAnswer: "yes" },
  { id: 9, question: "밖에 나가는 것보다 집에 있는 것을 선호하십니까?", positiveAnswer: "yes" },
  { id: 10, question: "기억력이 다른 사람들보다 나쁘다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 11, question: "살아있다는 것이 좋다고 느끼십니까?", positiveAnswer: "no" },
  { id: 12, question: "현재 자신의 생활이 가치 없다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 13, question: "현재 자신의 생활에 활력이 넘친다고 느끼십니까?", positiveAnswer: "no" },
  { id: 14, question: "현재 자신의 상황이 희망이 없다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 15, question: "대체로 다른 사람들이 자신보다 더 잘 살고 있다고 느끼십니까?", positiveAnswer: "yes" },
];

export default function DepressionTestPage() {
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

  const handleAnswer = (answer: "yes" | "no") => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id]) {
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
    let score = 0;
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer === q.positiveAnswer) {
        score += 1;
      }
    });

    let level: "normal" | "mild" | "severe";
    let message: string;
    let description: string;
    let color: string;
    let icon: React.ComponentType<{ className?: string }>;
    let recommendations: string[];

    if (score <= 5) {
      level = "normal";
      message = "정상 범위입니다";
      description = "현재 우울 증상이 거의 없거나 매우 경미한 상태입니다.";
      color = "green";
      icon = Smile;
      recommendations = [
        "현재 상태를 유지하기 위해 규칙적인 생활 패턴을 지속하세요.",
        "가족이나 친구들과의 교류를 유지하세요.",
        "건강한 식단과 충분한 수면을 취하세요.",
        "정기적으로 운동이나 취미 활동을 즐기세요.",
      ];
    } else if (score <= 9) {
      level = "mild";
      message = "가벼운 우울증이 의심됩니다";
      description = "경미한 우울 증상이 나타나고 있습니다. 주의 깊은 관찰과 관리가 필요합니다.";
      color = "yellow";
      icon = Meh;
      recommendations = [
        "가족이나 친구들과 대화를 나누고 감정을 공유하세요.",
        "규칙적인 운동과 충분한 수면을 취하세요.",
        "일상생활에서 즐거움을 느낄 수 있는 활동을 찾아보세요.",
        "증상이 지속되거나 악화되면 전문의 상담을 받으시기 바랍니다.",
        "스트레스를 관리하고 긍정적인 사고를 유지하세요.",
      ];
    } else {
      level = "severe";
      message = "심한 우울증이 의심됩니다";
      description = "우울 증상이 상당히 심각한 수준입니다. 전문적인 도움이 필요합니다.";
      color = "red";
      icon = Frown;
      recommendations = [
        "가능한 빨리 정신건강 전문의나 상담 전문가와 상담하시기 바랍니다.",
        "가족이나 신뢰할 수 있는 사람에게 도움을 요청하세요.",
        "자해나 자살 충동이 있다면 즉시 정신건강의학과나 응급실을 방문하세요.",
        "규칙적인 생활 패턴을 유지하고 충분한 휴식을 취하세요.",
        "혼자 모든 것을 감당하려 하지 말고 주변의 도움을 받으세요.",
        "치료를 받는 동안 가족의 지지와 이해가 중요합니다.",
      ];
    }

    return {
      score,
      maxScore: 15,
      percentage: Math.round((score / 15) * 100),
      level,
      message,
      description,
      color,
      icon,
      recommendations,
    };
  };

  // 결과 단계로 이동할 때 자동 저장
  useEffect(() => {
    if (step === "result") {
      const result = calculateResult();
      setIsSaving(true);
      setSaveError(null);

      saveAssessment({
        assessmentType: "depression",
        age: userInfo.age ? parseInt(userInfo.age) : null,
        gender: userInfo.gender || null,
        testDate: userInfo.date || new Date().toISOString(),
        answers: answers,
        totalScore: result.score,
        percentage: result.percentage,
        riskLevel: result.level,
        interpretation: result.message,
        message: result.message,
        description: result.description,
        recommendations: result.recommendations,
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-rose-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-lg px-2 py-1"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full border border-pink-200 mb-4">
              <Heart className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-semibold text-pink-700">노인 우울 척도 (GDS-SF)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              노인 우울 척도
            </h1>
            <p className="text-lg text-gray-600">
              Geriatric Depression Scale - Short Form
            </p>
          </div>
        </div>

        {/* Intro Step */}
        {step === "intro" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full mb-4">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                노인 우울 척도 안내
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                총 15개의 질문으로 구성된 검사를 통해<br />
                우울 증상을 평가합니다.
              </p>
            </div>

            <div className="bg-pink-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-pink-600" />
                검사 정보
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold w-24">척도명:</span>
                  <span>Geriatric Depression Scale-Short Form (GDS-SF)</span>
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
                  <span className="font-semibold w-24">평가 방법:</span>
                  <span>예/아니오 형식</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                결과 해석 기준
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">0~5점:</span>
                  <span className="text-green-600 font-semibold">정상</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">6~9점:</span>
                  <span className="text-yellow-600 font-semibold">가벼운 우울증</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-20">10~15점:</span>
                  <span className="text-red-600 font-semibold">심한 우울증</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-4 mb-6 border border-yellow-200">
              <p className="text-xs text-gray-700 leading-relaxed">
                <strong>출처:</strong> Yesavage 외(1983), Y.Jang, B.J.Small & W.E.Haley(2001). 
                Cross-cultural comparability of the Geriatric Depression Scale: comparison between older Koreans and older Americans. 
                Aging & Mental Health 5(1), 31-37.
              </p>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
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
                        ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-pink-300"
                    }`}
                  >
                    남
                  </button>
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "female" })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      userInfo.gender === "female"
                        ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-pink-300"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                <span className="text-sm font-medium text-pink-600">
                  {answeredCount}개 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-pink-600 to-rose-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-pink-600 mb-1">
                      질문 {currentQuestionIndex + 1}
                    </div>
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full">
                      <span className="text-lg font-bold text-white">{currentQuestionIndex + 1}</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  {questions[currentQuestionIndex].question}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  현재의 상태에 해당하는 답에 선택해주세요.
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                <button
                  onClick={() => handleAnswer("yes")}
                  className={`w-full px-6 py-4 rounded-xl border-2 transition-all text-left ${
                    answers[questions[currentQuestionIndex].id] === "yes"
                      ? "border-pink-500 bg-pink-50 text-pink-700 shadow-lg"
                      : "border-gray-300 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg mb-1">예</div>
                    </div>
                    {answers[questions[currentQuestionIndex].id] === "yes" && (
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-pink-600" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleAnswer("no")}
                  className={`w-full px-6 py-4 rounded-xl border-2 transition-all text-left ${
                    answers[questions[currentQuestionIndex].id] === "no"
                      ? "border-pink-500 bg-pink-50 text-pink-700 shadow-lg"
                      : "border-gray-300 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg mb-1">아니오</div>
                    </div>
                    {answers[questions[currentQuestionIndex].id] === "no" && (
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-pink-600" />
                    )}
                  </div>
                </button>
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
                  disabled={!answers[questions[currentQuestionIndex].id]}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
          const IconComponent = result.icon;
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
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${colorClasses[result.color as keyof typeof colorClasses]} rounded-full mb-4`}>
                  <IconComponent className="h-10 w-10 text-white" />
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
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.score}</div>
                      <div className="text-sm text-gray-600">총 점수</div>
                      <div className="text-xs text-gray-500">(최대 {result.maxScore}점)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.percentage}%</div>
                      <div className="text-sm text-gray-600">우울 지수</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {result.level === "normal" ? "정상" : result.level === "mild" ? "가벼운 우울증" : "심한 우울증"}
                      </div>
                      <div className="text-sm text-gray-600">평가 결과</div>
                    </div>
                  </div>
                </div>

                {/* Score Range Info */}
                <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    점수 해석 기준
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold w-20">0~5점:</span>
                      <span className="text-green-600 font-semibold">정상</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold w-20">6~9점:</span>
                      <span className="text-yellow-600 font-semibold">가벼운 우울증</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold w-20">10~15점:</span>
                      <span className="text-red-600 font-semibold">심한 우울증</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-pink-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-pink-600" />
                    권장 사항
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-pink-600 mt-1">•</span>
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
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
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

