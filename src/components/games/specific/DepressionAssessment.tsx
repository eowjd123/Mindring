/**
 * DepressionAssessment Component
 * 우울증 평가 게임 전용 컴포넌트
 */

import React, { useState, useEffect } from "react";
import {
  GameLayout,
  IntroScreen,
  UserInfoForm,
  QuestionForm,
  ResultDisplay,
  AssessmentProgress,
  type UserInfo,
} from "../index";
import { Heart } from "lucide-react";

interface DepressionQuestion {
  id: number;
  question: string;
  description?: string;
  positiveAnswer: "yes" | "no";
}

interface DepressionResult {
  userInfo: UserInfo;
  answers: { [key: number]: AnswerType };
  score: number;
  level: "normal" | "mild" | "moderate" | "severe";
  message: string;
}

interface DepressionAssessmentProps {
  questions: DepressionQuestion[];
  onResultSave?: (data: DepressionResult) => Promise<void>;
  onBack?: () => void;
}

type Step = "intro" | "info" | "questions" | "result";
type AnswerType = "yes" | "no" | null;

export function DepressionAssessment({
  questions,
  onResultSave,
  onBack,
}: DepressionAssessmentProps) {
  const [step, setStep] = useState<Step>("intro");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    age: "",
    gender: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{ [key: number]: AnswerType }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("depression-assessment");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setAnswers(data.answers || {});
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          if (data.userInfo) {
            setUserInfo(data.userInfo);
          }
        } catch (error) {
          console.error("Failed to restore data:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && step !== "intro" && step !== "result") {
      const data = {
        answers,
        currentQuestionIndex,
        userInfo,
      };
      localStorage.setItem("depression-assessment", JSON.stringify(data));
    }
  }, [answers, currentQuestionIndex, userInfo, step]);

  const handleAnswer = (answer: "yes" | "no") => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id] !== null) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        calculateResult();
      }
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResult = async () => {
    let score = 0;
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer === q.positiveAnswer) {
        score += 1;
      }
    });

    let level: "normal" | "mild" | "moderate" | "severe";
    let message: string;
    let description: string;
    let recommendations: Array<{ title: string; description: string }> = [];

    if (score <= 5) {
      level = "normal";
      message = "정상 범위입니다";
      description = "현재 우울 증상이 거의 없거나 매우 경미한 상태입니다.";
      recommendations = [
        {
          title: "일상 활동 유지",
          description: "규칙적인 생활 패턴을 유지하세요.",
        },
      ];
    } else if (score <= 10) {
      level = "mild";
      message = "경미한 우울증";
      description = "약간의 우울 증상이 있습니다. 관리가 필요할 수 있습니다.";
      recommendations = [
        {
          title: "운동 및 사회활동",
          description: "규칙적 운동과 대인관계 유지를 권장합니다.",
        },
        {
          title: "전문가 상담",
          description: "필요시 심리 상담사와의 상담을 고려하세요.",
        },
      ];
    } else if (score <= 13) {
      level = "moderate";
      message = "중등도 우울증";
      description = "우울 증상이 상당히 있습니다. 전문가의 도움이 권장됩니다.";
      recommendations = [
        {
          title: "의사 진료",
          description: "정신건강의학과 또는 심리치료 전문가의 진료를 권장합니다.",
        },
        {
          title: "생활습관 개선",
          description: "규칙적인 수면, 운동, 식사를 유지하세요.",
        },
      ];
    } else {
      level = "severe";
      message = "심한 우울증";
      description = "심각한 우울 증상이 있습니다. 즉시 전문가의 도움이 필요합니다.";
      recommendations = [
        {
          title: "즉시 전문가 상담",
          description: "정신건강의학과 의사와 상담하시기 바랍니다.",
        },
        {
          title: "위기상담",
          description: "필요시 생명의전화(1393)에 연락하세요.",
        },
      ];
    }

    if (onResultSave) {
      setIsSaving(true);
      try {
        await onResultSave({
          userInfo,
          answers,
          score,
          level,
          message,
        });
      } catch (error) {
        console.error("Failed to save result:", error);
      } finally {
        setIsSaving(false);
      }
    }

    setStep("result");
    if (typeof window !== "undefined") {
      localStorage.removeItem("depression-assessment");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <GameLayout
      onBack={onBack}
      showBackButton={step !== "intro"}
      gradientFrom="from-slate-50"
      gradientTo="to-pink-50/30"
      gradientVia="via-rose-50/30"
    >
      {step === "intro" && (
        <IntroScreen
          title="우울증 평가"
          description="당신의 우울 증상 수준을 평가합니다"
          estimatedTime="5-10분"
          icon={<Heart className="h-6 w-6 text-pink-600" />}
          features={[
            {
              title: "우울 증상 검사",
              description: "일상의 기분과 감정 상태를 평가합니다",
            },
            {
              title: "정량화된 진단",
              description: "15개 항목의 평가를 통해 우울 수준을 측정합니다",
            },
            {
              title: "맞춤형 조언",
              description: "당신의 상태에 맞는 대처 방법을 제시합니다",
            },
          ]}
          onStart={() => setStep("info")}
        />
      )}

      {step === "info" && (
        <UserInfoForm
          userInfo={userInfo}
          onUserInfoChange={setUserInfo}
          onNext={() => setStep("questions")}
          isFormValid={true}
        />
      )}

      {step === "questions" && currentQuestion && (
        <div className="space-y-8">
          <AssessmentProgress
            currentStep={currentQuestionIndex + 1}
            totalSteps={questions.length}
            onPrevious={handlePrev}
            onNext={handleNext}
            canGoPrevious={currentQuestionIndex > 0}
            canGoNext={answers[currentQuestion.id] !== null}
          />

          <QuestionForm
            question={currentQuestion.question}
            description={currentQuestion.description}
            currentAnswer={answers[currentQuestion.id] || null}
            onAnswer={handleAnswer}
          />
        </div>
      )}

      {step === "result" && (
        <ResultDisplay
          title="평가 완료"
          message="우울증 평가가 완료되었습니다"
          level="normal"
          icon={<Heart className="h-10 w-10" />}
          onExit={onBack}
          recommendations={[
            {
              title: "규칙적인 운동",
              description: "주 3-4회 30분 이상의 운동을 권장합니다.",
            },
            {
              title: "사회활동",
              description: "대인관계 유지와 사회활동 참여를 권장합니다.",
            },
          ]}
        />
      )}
    </GameLayout>
  );
}
