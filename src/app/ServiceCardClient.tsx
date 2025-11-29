"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface ServiceCardClientProps {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  variant: {
    bg: string;
    icon: React.ReactNode;
  };
  selected?: boolean;
  isAuthenticated: boolean;
}

export default function ServiceCardClient({
  title,
  subtitle,
  variant,
  selected,
  href,
  isAuthenticated,
}: ServiceCardClientProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 이미 로그인한 경우 바로 이동
    if (isAuthenticated) {
      return; // Link의 기본 동작 허용
    }

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    e.preventDefault();
    setIsChecking(true);

    // 로그인 페이지로 이동 (returnUrl 포함)
    const returnUrl = encodeURIComponent(href);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  return (
    <div className="group relative">
      <Link
        href={href}
        onClick={handleClick}
        className={`
          block rounded-3xl p-8 h-64 text-center transition-all duration-300 shadow-sm
          hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-teal-100
          ${selected ? "bg-white border-4 border-red-500" : variant.bg}
          ${!isAuthenticated ? "cursor-pointer" : ""}
          ${isChecking ? "opacity-75" : ""}
        `}
      >
        {/* Status Indicator */}
        <div className={`
          absolute top-4 left-4 w-6 h-6 border-2 rounded-full flex items-center justify-center
          ${selected ? "border-red-500 text-red-500" : "border-white text-white"}
        `}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z" />
          </svg>
        </div>

        {/* 로그인 필요 알림 (로그인하지 않은 경우) */}
        {!isAuthenticated && (
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-full font-semibold">
              로그인 필요
            </div>
          </div>
        )}

        <div className="h-full flex flex-col justify-center">
          <div className="mb-6">
            {variant.icon}
          </div>
          
          <h3 className={`font-bold text-xl mb-3 ${selected ? "text-red-600" : "text-white"}`}>
            {title}
          </h3>
          
          <p className={`text-sm leading-relaxed ${selected ? "text-red-500" : "text-white/90"}`}>
            {subtitle}
          </p>
        </div>
      </Link>
    </div>
  );
}

