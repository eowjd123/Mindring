/**
 * IntroScreen Component
 * 게임 시작 화면
 */

import { CheckCircle2 } from "lucide-react";
import React from "react";

interface IntroItem {
  title: string;
  description: string;
}

interface IntroScreenProps {
  title: string;
  description: string;
  features?: IntroItem[];
  estimatedTime?: string;
  onStart: () => void;
  icon?: React.ReactNode;
}

export function IntroScreen({
  title,
  description,
  features,
  estimatedTime,
  onStart,
  icon,
}: IntroScreenProps) {
  return (
    <div className="space-y-8">
      {/* Title Section */}
      <div className="text-center">
        {icon && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
            {icon}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {description}
        </p>
        {estimatedTime && (
          <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-700">
              예상 소요 시간: {estimatedTime}
            </p>
          </div>
        )}
      </div>

      {/* Features List */}
      {features && features.length > 0 && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-blue-200 p-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">이 평가에서 확인할 수 있습니다</h2>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">{feature.title}</p>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold text-lg"
      >
        평가 시작하기
      </button>
    </div>
  );
}
