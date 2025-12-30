/**
 * AssessmentProgress Component
 * 게임 진행 상황과 진행률을 표시
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

import React from "react";

interface AssessmentProgressProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  showStepInfo?: boolean;
}

export function AssessmentProgress({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
  showStepInfo = true,
}: AssessmentProgressProps) {
  const progress = (currentStep / totalSteps) * 100;
  const answeredCount = currentStep;

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-2">
        {showStepInfo && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {answeredCount} / {totalSteps}
            </span>
            <span className="text-xs text-gray-500">
              ({Math.round(progress)}%)
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar Visual */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>이전</span>
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
        >
          <span>다음</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
