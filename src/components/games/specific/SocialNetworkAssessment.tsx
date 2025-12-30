/**
 * SocialNetworkAssessment Component
 * 사회 네트워크 평가 게임 전용 컴포넌트
 */

import React, { useState, useEffect } from "react";
import {
  GameLayout,
  IntroScreen,
  UserInfoForm,
  LikertScaleForm,
  ResultDisplay,
  AssessmentProgress,
  type UserInfo,
} from "../index";
import { Users } from "lucide-react";

interface LikertOption {
  value: number;
  label: string;
  description?: string;
}

interface SocialNetworkQuestion {
  id: number;
  question: string;
  description?: string;
  category?: string;
}

interface SocialNetworkResult {
  userInfo: UserInfo;
  answers: { [key: number]: number | null };
  totalScore: number;
  level: "normal" | "mild" | "severe";
  message: string;
}

interface SocialNetworkAssessmentProps {
  questions: SocialNetworkQuestion[];
  likertOptions: LikertOption[];
  onResultSave?: (data: SocialNetworkResult) => Promise<void>;
  onBack?: () => void;
}

type Step = "intro" | "info" | "questions" | "result";

export function SocialNetworkAssessment({
  questions,
  likertOptions,
  onResultSave,
  onBack,
}: SocialNetworkAssessmentProps) {
  const [step, setStep] = useState<Step>("intro");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    age: "",
    gender: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{ [key: number]: number | null }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("social-network-assessment");
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
      localStorage.setItem("social-network-assessment", JSON.stringify(data));
    }
  }, [answers, currentQuestionIndex, userInfo, step]);

  const handleAnswer = (score: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: score });
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
    let totalScore = 0;
    Object.values(answers).forEach((answer) => {
      if (answer !== null) {
        totalScore += answer;
      }
    });

    let level: "normal" | "mild" | "severe";
    let message: string;
    let description: string;
    let recommendations: Array<{ title: string; description: string }> = [];

    if (totalScore >= 60) {
      level = "normal";
      message = "좋은 사회 네트워크";
      description = "사회적 관계와 네트워크가 양호합니다.";
      recommendations = [
        {
          title: "현재 관계 유지",
          description: "좋은 인간관계를 지속하세요.",
        },
      ];
    } else if (totalScore >= 40) {
      level = "mild";
      message = "적당한 사회 네트워크";
      description = "사회적 관계를 더 확장할 수 있습니다.";
      recommendations = [
        {
          title: "사회활동 확대",
          description: "새로운 관계와 모임에 참여해보세요.",
        },
      ];
    } else {
      level = "severe";
      message = "제한적인 사회 네트워크";
      description = "사회적 관계와 상호작용을 늘릴 필요가 있습니다.";
      recommendations = [
        {
          title: "사회활동 권장",
          description: "동호회, 자원봉사, 커뮤니티 참여 등을 추천합니다.",
        },
        {
          title: "가족관계 강화",
          description: "가족과의 상호작용을 늘려보세요.",
        },
      ];
    }

    if (onResultSave) {
      setIsSaving(true);
      try {
        await onResultSave({
          userInfo,
          answers,
          totalScore,
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
      localStorage.removeItem("social-network-assessment");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <GameLayout
      onBack={onBack}
      showBackButton={step !== "intro"}
      gradientFrom="from-slate-50"
      gradientTo="to-amber-50/30"
      gradientVia="via-orange-50/30"
    >
      {step === "intro" && (
        <IntroScreen
          title="사회 네트워크 평가"
          description="당신의 사회적 관계와 네트워크 상태를 평가합니다"
          estimatedTime="5-10분"
          icon={<Users className="h-6 w-6 text-amber-600" />}
          features={[
            {
              title: "관계 평가",
              description: "가족, 친구, 지인과의 관계 정도를 평가합니다",
            },
            {
              title: "사회성 측정",
              description: "사회적 상호작용 및 네트워크 규모를 파악합니다",
            },
            {
              title: "개선 제안",
              description: "당신의 사회 관계 개선을 위한 조언을 제공합니다",
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

          <LikertScaleForm
            question={currentQuestion.question}
            description={currentQuestion.description}
            options={likertOptions}
            currentAnswer={answers[currentQuestion.id] || null}
            onAnswer={handleAnswer}
          />
        </div>
      )}

      {step === "result" && (
        <ResultDisplay
          title="평가 완료"
          message="사회 네트워크 평가가 완료되었습니다"
          level="normal"
          icon={<Users className="h-10 w-10" />}
          onExit={onBack}
          recommendations={[
            {
              title: "정기적 만남",
              description: "친구와 가족과의 정기적인 만남을 유지하세요.",
            },
            {
              title: "새로운 관계",
              description: "새로운 사람들과의 만남과 사회활동에 참여하세요.",
            },
          ]}
        />
      )}
    </GameLayout>
  );
}
