/**
 * ResultDisplay Component
 * 게임/평가 결과 표시
 */

import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

import React from "react";

interface ResultRecommendation {
  title: string;
  description: string;
}

interface ResultDisplayProps {
  title: string;
  message: string;
  description?: string;
  score?: number;
  maxScore?: number;
  level?: "normal" | "mild" | "moderate" | "severe";
  levelColor?: string;
  levelGradient?: string;
  icon?: React.ReactNode;
  recommendations?: ResultRecommendation[];
  additionalInfo?: React.ReactNode;
  onRetry?: () => void;
  onExit?: () => void;
  showScore?: boolean;
}

const levelConfig = {
  normal: {
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-900",
    badgeColor: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-10 w-10 text-green-900" />,
  },
  mild: {
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-900",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: <AlertCircle className="h-10 w-10 text-blue-900" />,
  },
  moderate: {
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-900",
    badgeColor: "bg-yellow-100 text-yellow-700",
    icon: <AlertCircle className="h-10 w-10 text-yellow-900" />,
  },
  severe: {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-900",
    badgeColor: "bg-red-100 text-red-700",
    icon: <AlertCircle className="h-10 w-10 text-red-900" />,
  },
};

export function ResultDisplay({
  title,
  message,
  description,
  score,
  maxScore,
  level = "normal",
  icon,
  recommendations,
  additionalInfo,
  onRetry,
  onExit,
  showScore = true,
}: ResultDisplayProps) {
  const config = levelConfig[level];

  return (
    <div className="space-y-8">
      {/* Result Header */}
      <div className={`rounded-3xl border-2 p-8 sm:p-12 ${config.bgColor} ${config.borderColor}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6">
            {icon || config.icon}
          </div>

          <h2 className={`text-3xl sm:text-4xl font-bold ${config.textColor} mb-3`}>
            {message}
          </h2>

          {description && (
            <p className={`text-lg ${config.textColor} opacity-80`}>
              {description}
            </p>
          )}
        </div>

        {/* Score Section */}
        {showScore && score !== undefined && maxScore !== undefined && (
          <div className="flex items-center justify-center gap-3 p-4 bg-white/50 rounded-xl mb-6">
            <TrendingUp className={`h-5 w-5 ${config.textColor}`} />
            <span className={`text-lg font-semibold ${config.textColor}`}>
              점수: {score} / {maxScore}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className={`text-2xl sm:text-3xl font-bold ${config.textColor} text-center`}>
          {title}
        </h1>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">권장사항</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{rec.title}</p>
                  <p className="text-gray-600 text-sm">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {additionalInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8">
          {additionalInfo}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 sm:flex-row flex-col">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-sm hover:shadow-md font-semibold"
          >
            다시 평가하기
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
