// app/services/cognitive/dementia/family/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  calculateFamilyTestResult, 
  getRiskLevelLabel, 
  getRiskLevelColorClass,
  getRiskLevelGradient 
} from "../utils/resultCalculator";

interface Question {
  id: number;
  text: string;
}

const questions: Question[] = [
  { id: 1, text: "가족의 이름을 기억하는 것이 어려워졌나요?" },
  { id: 2, text: "얼마 전에 한 일을 기억하는 것이 어려워졌나요?" },
  { id: 3, text: "얼마 전에 한 일을 기억하는 것이 어려워졌나요?" },
  { id: 4, text: "약을 복용하거나 약을 먹어야 할 때를 기억하는 것이 어려워졌나요?" },
  { id: 5, text: "물건을 두고 다니거나 어디에 두었는지 찾지 못하는 경우가 늘어났나요?" },
  { id: 6, text: "자신의 집 주소나 전화번호를 기억하는 것이 어려워졌나요?" },
  { id: 7, text: "복잡한 일이나 여러 가지 일(예: 약 먹기, 집안일, 취미활동 등)을 처리하는 것이 어려워졌나요?" },
  { id: 8, text: "신문을 읽거나 텔레비전을 시청한 후 내용을 이해하는 것이 어려워졌나요?" },
  { id: 9, text: "가족이나 친구들과 대화를 나누는 것이 어려워졌나요?" },
  { id: 10, text: "가족이나 친구들의 이름을 정확히 기억하는 것이 어려워졌나요?" },
  { id: 11, text: "가족 구성원(자신, 배우자, 자녀 등)의 이름을 기억하는 것이 어려워졌나요?" },
  { id: 12, text: "가족 구성원의 직업이나 학교, 또는 중요한 사건을 기억하는 것이 어려워졌나요?" },
  { id: 13, text: "자신의 집 주소나 전화번호를 기억하는 것이 어려워졌나요?" },
  { id: 14, text: "전화, 텔레비전, 라디오 등에서 들은 내용을 이해하는 것이 어려워졌나요?" },
  { id: 15, text: "새로운 일이나 새로운 상황에 적응하는 것이 어려워졌나요?" },
];

const educationLevels = [
  "무학",
  "초등학교 졸업",
  "중학교 졸업",
  "고등학교 졸업",
  "전문대학 졸업",
  "대학교 졸업",
  "대학원 졸업 이상"
];

type AnswerValue = "0" | "1" | "2" | "9" | null;

export default function FamilyDementiaTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "questions" | "result">("info");
  const [familyInfo, setFamilyInfo] = useState({
    birthYear: "",
    gender: "",
    education: "",
    relationship: ""
  });
  const [answers, setAnswers] = useState<{ [key: number]: AnswerValue }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyInfo.birthYear && familyInfo.gender && familyInfo.education && familyInfo.relationship) {
      setStep("questions");
    }
  };

  const handleAnswer = (answer: AnswerValue) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id]) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // 모든 질문 완료
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

  // 생년 목록 생성 (1914~2024)
  const birthYears = Array.from({ length: 2024 - 1914 + 1 }, (_, i) => 1914 + i).reverse();

  // 검사 결과 저장 함수
  const saveAssessmentResult = async (result: ReturnType<typeof calculateFamilyTestResult>) => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);

    try {
      const currentYear = new Date().getFullYear();
      const age = familyInfo.birthYear ? currentYear - parseInt(familyInfo.birthYear) : null;

      const response = await fetch("/api/cognitive-assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          assessmentType: "dementia_family",
          age: age,
          gender: familyInfo.gender || null,
          testDate: new Date().toISOString(),
          answers: answers,
          totalScore: result.score,
          averageScore: result.score,
          percentage: result.percentage,
          riskLevel: result.riskLevel,
          interpretation: getRiskLevelLabel(result.riskLevel),
          message: result.message,
          description: result.message,
          recommendations: result.recommendations,
          metadata: {
            birthYear: familyInfo.birthYear,
            education: familyInfo.education,
            relationship: familyInfo.relationship,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("검사 결과 저장에 실패했습니다.");
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
      const result = calculateFamilyTestResult(answers);
      saveAssessmentResult(result);
    }
  }, [step]);

  const relationshipOptions = [
    "배우자",
    "자녀",
    "부모",
    "형제/자매",
    "기타 가족",
    "친구/지인"
  ];

  const answerOptions = [
    { value: "0" as AnswerValue, label: "전혀 나빠지지 않음", description: "10년 전과 비교해 전혀 나빠지지 않음" },
    { value: "1" as AnswerValue, label: "조금 나빠짐", description: "10년 전보다 조금 나빠짐" },
    { value: "2" as AnswerValue, label: "많이 나빠짐", description: "10년 전보다 많이 나빠짐" },
    { value: "9" as AnswerValue, label: "해당 없음", description: "해당 상황이 없거나 확인 불가" },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-purple-200/20 to-violet-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full border border-indigo-200 mb-4">
              <Brain className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">가족 치매검사</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              가족 치매검사
            </h1>
            <p className="text-lg text-gray-600">
              가족 구성원의 인지 기능을 평가하기 위해 아래 정보를 입력해주세요
            </p>
          </div>
        </div>

        {/* Info Step */}
        {step === "info" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-blue-900 mb-1">검사 안내</p>
                  <p>이 검사는 가족 구성원의 10년 전 상태와 현재 상태를 비교하여 인지 기능의 변화를 평가합니다.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              {/* 관계 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                  검사 대상자와의 관계
                </label>
                <select
                  value={familyInfo.relationship}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, relationship: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  required
                >
                  <option value="">관계를 선택하세요</option>
                  {relationshipOptions.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {/* 생년월일 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  검사 대상자 생년월일
                </label>
                <select
                  value={familyInfo.birthYear}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, birthYear: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  required
                >
                  <option value="">생년을 선택하세요</option>
                  {birthYears.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>

              {/* 성별 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                  검사 대상자 성별
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFamilyInfo({ ...familyInfo, gender: "male" })}
                    className={`px-6 py-4 rounded-xl border-2 transition-all ${
                      familyInfo.gender === "male"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => setFamilyInfo({ ...familyInfo, gender: "female" })}
                    className={`px-6 py-4 rounded-xl border-2 transition-all ${
                      familyInfo.gender === "female"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    여성
                  </button>
                </div>
              </div>

              {/* 교육수준 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                  검사 대상자 교육수준
                </label>
                <select
                  value={familyInfo.education}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, education: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  required
                >
                  <option value="">교육수준을 선택하세요</option>
                  {educationLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                검사 시작하기
              </button>
            </form>
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
                <span className="text-sm font-medium text-indigo-600">
                  {answeredCount}개 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-indigo-900 mb-1">평가 기준</p>
                  <p>10년 전 상태와 현재 상태를 비교하여 답변해주세요.</p>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
                  <span className="text-2xl font-bold text-white">{currentQuestionIndex + 1}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {questions[currentQuestionIndex].text}
                </h2>
                <p className="text-sm text-gray-500">10년 전과 비교하여 현재 상태를 평가해주세요</p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                {answerOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full px-6 py-4 rounded-xl border-2 transition-all text-left ${
                      answers[questions[currentQuestionIndex].id] === option.value
                        ? option.value === "0"
                          ? "border-green-500 bg-green-50 text-green-700 shadow-lg"
                          : option.value === "1"
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-lg"
                          : option.value === "2"
                          ? "border-red-500 bg-red-50 text-red-700 shadow-lg"
                          : "border-gray-500 bg-gray-50 text-gray-700 shadow-lg"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg mb-1">{option.label}</div>
                        <div className="text-sm opacity-80">{option.description}</div>
                      </div>
                      {answers[questions[currentQuestionIndex].id] === option.value && (
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
                  disabled={!answers[questions[currentQuestionIndex].id]}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
          const result = calculateFamilyTestResult(answers);
          return (
            <div className="space-y-6">
              {/* Result Header */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/50 text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${getRiskLevelGradient(result.riskLevel)} rounded-full mb-4`}>
                  <span className="text-3xl">{result.icon}</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  검사 결과
                </h2>
                <div className={`inline-block px-4 py-2 rounded-full border-2 ${getRiskLevelColorClass(result.riskLevel)} mb-4`}>
                  <span className="font-semibold">{getRiskLevelLabel(result.riskLevel)}</span>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  {result.message}
                </p>

                {/* Score Display */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.score}</div>
                      <div className="text-sm text-gray-600">평균 점수</div>
                      <div className="text-xs text-gray-500 mt-1">(0~2점 기준)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.percentage}%</div>
                      <div className="text-sm text-gray-600">위험도 비율</div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Criteria */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-gray-600" />
                    평가 기준 안내
                  </h3>
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">가족 치매 검사 평가 방법:</p>
                      <p className="mb-2">10년 전 상태와 현재 상태를 비교하여 평가합니다. 각 질문에 대해:</p>
                      <div className="space-y-1 ml-4 mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 font-semibold w-20">0점:</span>
                          <span>10년 전과 비교해 전혀 나빠지지 않음</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 font-semibold w-20">1점:</span>
                          <span>10년 전보다 조금 나빠짐</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 font-semibold w-20">2점:</span>
                          <span>10년 전보다 많이 나빠짐</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 font-semibold w-20">9점:</span>
                          <span>해당 상황이 없거나 확인 불가 (계산에서 제외)</span>
                        </div>
                      </div>
                      <p className="mb-2">유효한 답변의 평균 점수를 계산하여 평가합니다.</p>
                      <div className="space-y-2 ml-4">
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-semibold">정상 (0~0.5점):</span>
                          <span>10년 전과 비교하여 인지 기능이 크게 변화하지 않음</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 font-semibold">경계 (0.5~1.0점):</span>
                          <span>10년 전과 비교하여 인지 기능에 일부 변화가 있음</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-semibold">위험 (1.0~1.5점):</span>
                          <span>10년 전과 비교하여 인지 기능 저하가 의심됨. 전문의 상담 권장</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-semibold">고위험 (1.5점 이상):</span>
                          <span>10년 전과 비교하여 인지 기능 저하가 우려됨. 즉시 전문의 상담 필요</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-600">
                        * 평균 점수는 유효한 답변(0, 1, 2점)만 계산하며, 9점(해당 없음)은 제외됩니다.
                        <br />
                        * 위험도 비율은 평균 점수를 2점 기준으로 백분율로 변환한 값입니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-indigo-50 rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    권장 사항
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-600 mt-1">•</span>
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
                    setStep("info");
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  다시 검사하기
                </button>
                <button
                  onClick={() => router.push("/services/cognitive")}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
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


