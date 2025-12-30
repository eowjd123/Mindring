/**
 * LikertScaleForm Component
 * Likert Scale (5점 척도) 답변 형식
 */

import React from "react";

interface LikertOption {
  value: number;
  label: string;
  description?: string;
}

interface LikertScaleFormProps {
  question: string;
  description?: string;
  options: LikertOption[];
  currentAnswer: number | null;
  onAnswer: (score: number) => void;
  showDescription?: boolean;
}

export function LikertScaleForm({
  question,
  description,
  options,
  currentAnswer,
  onAnswer,
  showDescription = true,
}: LikertScaleFormProps) {
  return (
    <div className="space-y-8">
      {/* Question */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {question}
        </h2>
        {description && showDescription && (
          <p className="text-gray-600 text-base leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Likert Scale Options */}
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onAnswer(option.value)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              currentAnswer === option.value
                ? "border-blue-600 bg-blue-50 shadow-lg"
                : "border-gray-300 bg-white hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    currentAnswer === option.value
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-400"
                  }`}
                >
                  {currentAnswer === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span
                  className={`font-semibold ${
                    currentAnswer === option.value
                      ? "text-blue-900"
                      : "text-gray-800"
                  }`}
                >
                  {option.label}
                </span>
              </div>
              {option.description && (
                <span className="text-sm text-gray-500">
                  {option.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
