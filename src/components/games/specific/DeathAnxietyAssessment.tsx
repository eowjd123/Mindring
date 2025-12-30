/**
 * DeathAnxietyAssessment Component
 * 죽음 불안 평가 게임 전용 컴포넌트
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
import { Shield } from "lucide-react";

interface DeathAnxietyQuestion {
  id: number;
  question: string;
  description?: string;
}

interface AssessmentResult {
  userInfo: UserInfo;
  answers: { [key: number]: AnswerType };
  score: number;
  level: "normal" | "mild" | "severe";
  message: string;
}

interface DeathAnxietyAssessmentProps {
  questions: DeathAnxietyQuestion[];
  onResultSave?: (data: AssessmentResult) => Promise<void>;
  onBack?: () => void;
}

type Step = "intro" | "info" | "questions" | "result";
type AnswerType = "yes" | "no" | null;

export function DeathAnxietyAssessment({
  questions,
  onResultSave,
  onBack,
}: DeathAnxietyAssessmentProps) {
  const [step, setStep] = useState<Step>("intro");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    age: "",
    gender: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{ [key: number]: AnswerType }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // localStorage에서 데이터 복원
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("death-anxiety-assessment");
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

  // 진행 상황 저장
  useEffect(() => {
    if (typeof window !== "undefined" && step !== "intro" && step !== "result") {
      const data = {
        answers,
        currentQuestionIndex,
        userInfo,
      };
      localStorage.setItem("death-anxiety-assessment", JSON.stringify(data));
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
      if (answer === "yes") {
        score += 1;
      }
    });

    let level: "normal" | "mild" | "severe";
    let message: string;
    let description: string;
    let recommendations: Array<{ title: string; description: string }> = [];

    if (score <= 5) {
      level = "normal";
      message = "정상 범위입니다";
      description = "죽음 불안 수준이 낮습니다.";
      recommendations = [
        {
          title: "일상적 활동 유지",
          description: "현재의 건강한 심리 상태를 유지하세요.",
        },
      ];
    } else if (score <= 10) {
      level = "mild";
      message = "경미한 불안 수준";
      description = "약간의 죽음 불안이 있으나 일상생활에 큰 영향을 주지 않습니다.";
      recommendations = [
        {
          title: "명상 또는 이완 운동",
          description: "정신 건강 전문가와 상담을 권장합니다.",
        },
      ];
    } else {
      level = "severe";
      message = "높은 불안 수준";
      description = "죽음에 대한 불안이 높습니다. 전문가의 도움을 권장합니다.";
      recommendations = [
        {
          title: "전문가 상담 필요",
          description: "심리 치료사 또는 정신건강 전문가와 상담하세요.",
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
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <GameLayout
      onBack={onBack}
      showBackButton={step !== "intro"}
      gradientFrom="from-slate-50"
      gradientTo="to-purple-50/30"
      gradientVia="via-indigo-50/30"
    >
      {step === "intro" && (
        <IntroScreen
          title="죽음 불안 평가"
          description="당신의 죽음에 대한 불안 수준을 평가합니다"
          estimatedTime="10-15분"
          icon={<Shield className="h-6 w-6 text-indigo-600" />}
          features={[
            {
              title: "정서적 불안도 평가",
              description: "죽음에 대한 심리적 불안을 정량화합니다",
            },
            {
              title: "개인 맞춤형 분석",
              description: "당신의 불안 수준에 맞는 조언을 제공합니다",
            },
            {
              title: "전문가 권장사항",
              description: "필요시 심리 상담 전문가 연계를 안내합니다",
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
          message="당신의 죽음 불안 수준이 평가되었습니다"
          level="normal"
          icon={<Shield className="h-10 w-10" />}
          onExit={onBack}
          recommendations={[
            {
              title: "정기적 운동",
              description: "신체 활동은 심리 건강을 개선합니다",
            },
          ]}
        />
      )}
    </GameLayout>
  );
}
