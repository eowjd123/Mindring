/**
 * GameLayout Component
 * 모든 인지 게임에 사용되는 기본 레이아웃
 * 헤더, 배경, 콘텐츠 영역 제공
 */

import { ArrowRight, ChevronLeft } from "lucide-react";

import React from "react";

interface GameLayoutProps {
  onBack?: () => void;
  onNavigate?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerBadge?: {
    icon?: React.ReactNode;
    text: string;
  };
  headerActionText?: string;
  showBackButton?: boolean;
  showActionButton?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
}

export function GameLayout({
  onBack,
  onNavigate,
  title,
  description,
  children,
  headerBadge,
  headerActionText,
  showBackButton = true,
  showActionButton = false,
  gradientFrom = "from-slate-50",
  gradientTo = "to-indigo-50/30",
  gradientVia = "via-blue-50/30",
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`}></div>
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        {(title || showBackButton || showActionButton) && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-6">
              {showBackButton && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                  aria-label="뒤로가기"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">뒤로가기</span>
                </button>
              )}

              {showActionButton && (
                <div className="flex-1" />
              )}

              {showActionButton && (
                <button
                  onClick={onNavigate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-sm font-medium"
                  aria-label={headerActionText}
                >
                  <span>{headerActionText}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {title && (
              <div className="text-center">
                {headerBadge && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200 mb-4">
                    {headerBadge.icon}
                    <span className="text-sm font-semibold text-blue-700">{headerBadge.text}</span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                  {title}
                </h1>
                {description && (
                  <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
