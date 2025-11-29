// app/services/smart-cognitive/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { 
  Brain, 
  ClipboardCheck, 
  Heart, 
  Users, 
  Smile, 
  Shield,
  ArrowRight,
  Home,
  ChevronRight
} from "lucide-react";

interface AssessmentCard {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}

const assessments: AssessmentCard[] = [
  {
    id: "dementia",
    title: "온라인 치매 검사",
    description: "인지 기능을 종합적으로 평가합니다",
    href: "/services/cognitive/dementia",
    icon: Brain,
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    iconBg: "bg-blue-500/10",
  },
  {
    id: "brain-health",
    title: "뇌 건강 체크리스트",
    description: "뇌 건강 상태를 점검합니다",
    href: "/services/cognitive/brain-health",
    icon: ClipboardCheck,
    gradient: "from-purple-500 via-purple-600 to-pink-600",
    iconBg: "bg-purple-500/10",
  },
  {
    id: "depression",
    title: "노인 우울 척도",
    description: "정서적 안정 상태를 확인합니다",
    href: "/services/cognitive/depression",
    icon: Heart,
    gradient: "from-pink-500 via-rose-600 to-red-600",
    iconBg: "bg-pink-500/10",
  },
  {
    id: "social-network",
    title: "사회적 관계망과 지지척도",
    description: "사회적 관계와 지지 체계를 평가합니다",
    href: "/services/cognitive/social-network",
    icon: Users,
    gradient: "from-teal-500 via-cyan-600 to-blue-600",
    iconBg: "bg-teal-500/10",
  },
  {
    id: "life-satisfaction",
    title: "생활만족도 척도",
    description: "일상생활 만족도를 측정합니다",
    href: "/services/cognitive/life-satisfaction",
    icon: Smile,
    gradient: "from-orange-500 via-amber-600 to-yellow-600",
    iconBg: "bg-orange-500/10",
  },
  {
    id: "death-anxiety",
    title: "죽음불안 척도",
    description: "죽음에 대한 불안 수준을 평가합니다",
    href: "/services/cognitive/death-anxiety",
    icon: Shield,
    gradient: "from-indigo-500 via-purple-600 to-violet-600",
    iconBg: "bg-indigo-500/10",
  },
];

export default function SmartCognitivePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-end">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-sm font-medium"
              aria-label="홈으로 돌아가기"
            >
              <Home className="h-4 w-4" />
              <span>홈으로</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full border border-indigo-200 mb-4">
            <Brain className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">스마트 인지관리</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            나의 뇌와 마음,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              지금은 어떤 상태일까요?
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            과학적 근거에 기반한 온라인 검사 도구를 통해 인지 건강부터 정서적 안정, 
            사회적 관계와 생활 만족도까지 전반적인 뇌 건강 지표를 스스로 확인할 수 있습니다.
          </p>
        </div>

        {/* Assessments Grid */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            검사 도구
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, index) => {
              const IconComponent = assessment.icon;
              return (
                <Link
                  key={assessment.id}
                  href={assessment.href}
                  className="group relative bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Icon */}
                  <div className={`mb-4 p-4 bg-gradient-to-br ${assessment.gradient} rounded-xl w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {assessment.title}
                  </h3>
                  {assessment.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {assessment.description}
                    </p>
                  )}

                  {/* Arrow Icon */}
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${assessment.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg border border-gray-200/50">
            <div className="p-2 bg-green-100 rounded-full">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-700 font-medium">
              모든 검사는 과학적 근거에 기반하여 개발되었으며, 개인정보 보호를 위해 안전하게 관리됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
