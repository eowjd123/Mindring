// app/services/cognitive/dementia/page.tsx
"use client";

import Link from "next/link";
import React from "react";
import { 
  Brain, 
  User, 
  Users,
  ArrowRight,
  ChevronLeft,
  Shield,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DementiaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30"></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
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
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200 mb-4">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">온라인 치매 검사</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              치매 검사를 시작하세요
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              본인 또는 가족의 인지 기능을 평가하여 치매 위험도를 확인할 수 있습니다
            </p>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 본인 치매 검사 */}
          <Link
            href="/services/cognitive/dementia/self"
            className="group relative"
          >
            <div className="
              relative h-full
              bg-white/80 backdrop-blur-xl
              border-2 border-blue-200
              rounded-3xl p-8 sm:p-10
              shadow-lg hover:shadow-2xl
              transition-all duration-500 ease-out
              hover:-translate-y-2 hover:scale-[1.02]
              transform-gpu
              overflow-hidden
            ">
              {/* Gradient Overlay on Hover */}
              <div className="
                absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                opacity-0 group-hover:opacity-5
                transition-opacity duration-500
              "></div>

              {/* Animated Border Gradient */}
              <div className="
                absolute inset-0 rounded-3xl
                bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                opacity-0 group-hover:opacity-20
                transition-opacity duration-500
                -z-10 blur-xl
              "></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="
                    p-5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                    rounded-2xl
                    group-hover:scale-110
                    transition-transform duration-300
                    shadow-lg
                  ">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="
                    p-2 rounded-lg
                    bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                    opacity-0 group-hover:opacity-100
                    group-hover:translate-x-1
                    transition-all duration-300
                  ">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">
                    본인 치매 검사
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4">
                    직접 검사를 진행하여 본인의 인지 기능 상태를 확인합니다
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>약 10-15분 소요</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 가족 치매검사 */}
          <Link
            href="/services/cognitive/dementia/family"
            className="group relative"
          >
            <div className="
              relative h-full
              bg-white/80 backdrop-blur-xl
              border-2 border-indigo-200
              rounded-3xl p-8 sm:p-10
              shadow-lg hover:shadow-2xl
              transition-all duration-500 ease-out
              hover:-translate-y-2 hover:scale-[1.02]
              transform-gpu
              overflow-hidden
            ">
              {/* Gradient Overlay on Hover */}
              <div className="
                absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-600
                opacity-0 group-hover:opacity-5
                transition-opacity duration-500
              "></div>

              {/* Animated Border Gradient */}
              <div className="
                absolute inset-0 rounded-3xl
                bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-600
                opacity-0 group-hover:opacity-20
                transition-opacity duration-500
                -z-10 blur-xl
              "></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="
                    p-5 bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-600
                    rounded-2xl
                    group-hover:scale-110
                    transition-transform duration-300
                    shadow-lg
                  ">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="
                    p-2 rounded-lg
                    bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-600
                    opacity-0 group-hover:opacity-100
                    group-hover:translate-x-1
                    transition-all duration-300
                  ">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-indigo-800 transition-colors">
                    가족 치매검사
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4">
                    가족 구성원의 인지 기능을 대리로 평가하여 치매 위험도를 확인합니다
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>약 10-15분 소요</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">검사 안내</h3>
              <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>이 검사는 의학적 진단을 대체하지 않으며, 참고용으로만 사용하시기 바랍니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>검사 결과는 개인정보 보호 정책에 따라 안전하게 관리됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>검사 중에는 조용한 환경에서 집중할 수 있도록 준비해주세요.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>검사 결과에 대한 상세한 해석은 전문의와 상담하시기 바랍니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

