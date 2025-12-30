/**
 * GameCard Component
 * 게임을 선택하는 카드 표시
 */

import { ArrowRight, CheckCircle2 } from "lucide-react";

import Link from "next/link";
import React from "react";

export type GameStatus = "not-started" | "in-progress" | "completed";

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  status?: GameStatus;
  icon?: React.ReactNode;
  gradient?: string;
  badge?: string;
  estimatedTime?: string;
}

const statusConfig = {
  "not-started": {
    label: "미시작",
    color: "bg-gray-100 text-gray-700",
  },
  "in-progress": {
    label: "진행중",
    color: "bg-yellow-100 text-yellow-700",
  },
  completed: {
    label: "완료",
    color: "bg-green-100 text-green-700",
  },
};

export function GameCard({
  id,
  title,
  description,
  href,
  onClick,
  status = "not-started",
  icon,
  gradient = "from-blue-500 to-indigo-600",
  badge,
  estimatedTime,
}: GameCardProps) {
  const config = statusConfig[status];

  const cardContent = (
    <div className="group relative h-full">
      <div className={`
        relative h-full
        bg-white/80 backdrop-blur-xl
        border-2 border-gray-200
        rounded-3xl p-8 sm:p-10
        shadow-lg hover:shadow-2xl
        transition-all duration-500 ease-out
        hover:-translate-y-2 hover:scale-[1.02]
        transform-gpu
        overflow-hidden
      `}>
        {/* Gradient Overlay on Hover */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${gradient}
          opacity-0 group-hover:opacity-5
          transition-opacity duration-500
        `}></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header with Icon and Status */}
          <div className="mb-6 flex items-start justify-between">
            <div className={`
              p-5 bg-gradient-to-br ${gradient}
              rounded-2xl
              group-hover:scale-110
              transition-transform duration-300
              shadow-lg
            `}>
              {icon ? (
                <div className="w-8 h-8 text-white">
                  {icon}
                </div>
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
              )}
            </div>
            
            {status === "completed" && (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            )}
          </div>

          {/* Title & Description */}
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {description}
            </p>
          </div>

          {/* Badge and Time */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {badge && (
              <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {badge}
              </span>
            )}
            {estimatedTime && (
              <span className="text-xs text-gray-500">
                ⏱ {estimatedTime}
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* Arrow Icon */}
          <div className={`
            inline-flex items-center gap-2 text-sm font-medium text-blue-600
            group-hover:gap-3
            transition-all duration-300
          `}>
            <span>시작하기</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        {cardContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="w-full text-left">
      {cardContent}
    </button>
  );
}
