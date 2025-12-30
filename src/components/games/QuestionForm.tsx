/**
 * QuestionForm Component
 * Yes/No 답변 형식의 질문 표시
 */

import { CheckCircle2, XCircle } from "lucide-react";

import React from "react";

interface QuestionFormProps {
  question: string;
  description?: string;
  currentAnswer: "yes" | "no" | null;
  onAnswer: (answer: "yes" | "no") => void;
  showDescription?: boolean;
}

export function QuestionForm({
  question,
  description,
  currentAnswer,
  onAnswer,
  showDescription = true,
}: QuestionFormProps) {
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

      {/* Answer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Yes Button */}
        <button
          onClick={() => onAnswer("yes")}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
            currentAnswer === "yes"
              ? "border-green-500 bg-green-50 shadow-lg"
              : "border-gray-300 bg-white hover:border-green-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2
              className={`h-6 w-6 ${
                currentAnswer === "yes" ? "text-green-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-lg font-semibold ${
                currentAnswer === "yes" ? "text-green-700" : "text-gray-700"
              }`}
            >
              예
            </span>
          </div>
          {currentAnswer === "yes" && (
            <div className="absolute inset-0 rounded-2xl bg-green-100 opacity-0 animate-pulse"></div>
          )}
        </button>

        {/* No Button */}
        <button
          onClick={() => onAnswer("no")}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
            currentAnswer === "no"
              ? "border-red-500 bg-red-50 shadow-lg"
              : "border-gray-300 bg-white hover:border-red-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <XCircle
              className={`h-6 w-6 ${
                currentAnswer === "no" ? "text-red-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-lg font-semibold ${
                currentAnswer === "no" ? "text-red-700" : "text-gray-700"
              }`}
            >
              아니오
            </span>
          </div>
          {currentAnswer === "no" && (
            <div className="absolute inset-0 rounded-2xl bg-red-100 opacity-0 animate-pulse"></div>
          )}
        </button>
      </div>
    </div>
  );
}
