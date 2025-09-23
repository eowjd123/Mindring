// app/page.tsx

import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-end mb-2">
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link className="hover:text-gray-900 transition-colors" href="/login">로그인</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/signup">회원가입</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/plan">이용권</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/support">고객센터</Link>
              <button className="bg-teal-400 hover:bg-teal-500 text-white w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10.22 4.11 10.46 4 10.71 4H13.29C13.54 4 13.78 4.11 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z"/>
                </svg>
              </button>
            </nav>
          </div>

          {/* Main Header Row */}
          <div className="flex items-center justify-between gap-8">
            {/* Brand Logo */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 -mt-8">
              <div className="h-12 w-12 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" className="text-teal-400">
                  <g transform="translate(24,24)">
                    <circle cx="0" cy="0" r="3" fill="currentColor" />
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(0)"/>
                    <circle cx="16" cy="0" r="2" fill="currentColor"/>
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(60)"/>
                    <circle cx="8" cy="13.86" r="2" fill="currentColor"/>
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(120)"/>
                    <circle cx="-8" cy="13.86" r="2" fill="currentColor"/>
                  </g>
                </svg>
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">그레이트 시니어</h1>
                <p className="text-sm text-gray-600">네트워크</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="search"
                  aria-label="사이트 검색"
                  placeholder="검색어를 입력하세요"
                  className="w-full rounded-full border-2 border-gray-300 bg-white px-6 py-3 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                <button 
                  type="submit"
                  aria-label="검색 실행" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <SocialButton href="https://blog.example.com" label="블로그" className="bg-gray-600">
                blog
              </SocialButton>
              <SocialButton href="https://instagram.com" label="인스타그램" className="bg-gray-600">
                <InstagramIcon />
              </SocialButton>
              <SocialButton href="/profile" label="내 프로필" className="bg-gray-500">
                <ProfileIcon />
              </SocialButton>
              <SocialButton href="https://youtube.com" label="유튜브" className="bg-red-500">
                <YoutubeIcon />
              </SocialButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <section aria-labelledby="services-heading">
          <h2 id="services-heading" className="sr-only">서비스 목록</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">Great Senior</span>
                <span className="text-lg text-gray-600">network</span>
                <span className="ml-4 text-sm text-gray-500">제휴문의 | 이메일 무단 수집 거부</span>
              </div>
              <div className="text-sm text-gray-600 space-y-2 max-w-2xl">
                <p>
                  <span className="font-medium">마인드라</span> 대표자 서현숙 
                  <span className="ml-4 font-medium">사업자등록번호:</span> 255-37-01508
                </p>
                <p>경기도 고양시 일산동구 중앙로 1036 4층(고양중장년기술창업센터, 1-1층)</p>
                <p><span className="font-medium">통신판매신고번호:</span> 제2025-고양일산동-0921호</p>
                <p className="text-gray-500 pt-2">
                  Copyright 2025. MINDRA INC. All rights reserved.
                </p>
              </div>
            </div>

            <div className="lg:text-right">
              <p className="text-sm text-gray-500 mb-2">FAMILY SITE</p>
              <div className="flex items-center justify-start lg:justify-end">
                <span className="text-lg font-bold text-gray-900">
                  Mind<span className="text-teal-500">ra</span>
                </span>
                <button 
                  aria-label="패밀리 사이트 메뉴 열기"
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Social Media Button Component
function SocialButton({ 
  href, 
  label, 
  className, 
  children 
}: { 
  href: string; 
  label: string; 
  className: string; 
  children: React.ReactNode; 
}) {
  return (
    <Link 
      href={href}
      aria-label={label}
      className={`h-9 w-9 rounded-full text-white text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity ${className}`}
    >
      {children}
    </Link>
  );
}

// Icon Components
function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.2c3.2 0 3.6.01 4.9.07 3.23.15 4.77 1.7 4.92 4.93.06 1.26.07 1.64.07 4.8s-.01 3.54-.07 4.8c-.15 3.23-1.69 4.77-4.92 4.92-1.3.06-1.7.07-4.9.07s-3.6-.01-4.9-.07c-3.23-.15-4.77-1.69-4.92-4.92C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9C2.42 3.87 3.96 2.33 7.2 2.18 8.5 2.12 8.9 2.1 12 2.1zM12 6.4A5.6 5.6 0 1 0 12 17.6 5.6 5.6 0 0 0 12 6.4zm7-1.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3 0-9 1.5-9 4.5V21h18v-2.5C21 15.5 15 14 12 14Z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57A3 3 0 0 0 24 17.8C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z"/>
    </svg>
  );
}

// Service Card Component
function ServiceCard({ 
  title, 
  subtitle, 
  variant, 
  selected,
  href 
}: ServiceType) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className={`
          block rounded-3xl p-8 h-64 text-center transition-all duration-300 shadow-sm
          hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-teal-100
          ${selected ? "bg-white border-4 border-red-500" : variant.bg}
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

/* ---------------------------
   Service Icon Components
   --------------------------- */
const ServiceIcons = {
  // ✅ 기억퍼즐: public/img/icon_1.png 이미지를 사용
  puzzle: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_1.png"  // ← public/img/icon_1.png
          alt="기억퍼즐 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  book: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_2.png"  // ← public/img/icon_1.png
          alt="라이프북 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  bulb: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_3.png"  // ← public/img/icon_1.png
          alt="인지클래스 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  palette: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_4.png"  // ← public/img/icon_1.png
          alt="마음색칠 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  document: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_5.png"  // ← public/img/icon_1.png
          alt="활동자료 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  cap: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_6.png"  // ← public/img/icon_1.png
          alt="허브 아카데미 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  clipboard: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_7.png"  // ← public/img/icon_1.png
          alt="시니어 종합검사 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  heart: (
    <div className="w-16 h-16 flex items-center justify-center mx-auto">
      <div className="relative w-16 h-16">
        <Image
          src="/img/icon_8.png"  // ← public/img/icon_1.png
          alt="사회공헌 아이콘"
          fill
          sizes="64px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
};

// Service Variants
const SERVICE_VARIANTS = {
  teal: { bg: "bg-gradient-to-br from-teal-400 to-teal-600", icon: ServiceIcons.puzzle },
  blue: { bg: "bg-gradient-to-br from-blue-400 to-blue-600", icon: ServiceIcons.book },
  purple: { bg: "bg-gradient-to-br from-purple-400 to-purple-600", icon: ServiceIcons.bulb },
  gray: { bg: "bg-gradient-to-br from-gray-500 to-gray-700", icon: ServiceIcons.palette },
  orange: { bg: "bg-gradient-to-br from-orange-400 to-red-500", icon: ServiceIcons.document },
  yellow: { bg: "bg-gradient-to-br from-yellow-400 to-orange-500", icon: ServiceIcons.cap },
  sky: { bg: "bg-gradient-to-br from-sky-400 to-blue-500", icon: ServiceIcons.clipboard },
  whiteRed: { bg: "bg-white border-4 border-red-500", icon: ServiceIcons.heart },
} as const;

// Types
type ServiceVariant = typeof SERVICE_VARIANTS[keyof typeof SERVICE_VARIANTS];

interface ServiceType {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  variant: ServiceVariant;
  selected?: boolean;
}

// Services Data
const SERVICES: ServiceType[] = [
  {
    id: "puzzle",
    title: "기억퍼즐",
    subtitle: "디지털 퍼즐 활동",
    href: "/services/puzzle",
    variant: SERVICE_VARIANTS.teal,
  },
  {
    id: "lifebook",
    title: "라이프북",
    subtitle: "AI 자서전 만들기",
    href: "/login",
    variant: SERVICE_VARIANTS.blue,
  },
  {
    id: "cognitive",
    title: "인지클래스",
    subtitle: "인지 건강 콘텐츠 체험",
    href: "/services/cognitive",
    variant: SERVICE_VARIANTS.purple,
  },
  {
    id: "coloring",
    title: "마음색칠",
    subtitle: "인지 훈련 컬러링 체험",
    href: "/services/coloring",
    variant: SERVICE_VARIANTS.gray,
  },
  {
    id: "activities",
    title: "활동자료",
    subtitle: "활동지・학습지 모음",
    href: "/services/activities",
    variant: SERVICE_VARIANTS.orange,
  },
  {
    id: "academy",
    title: "허브 아카데미",
    subtitle: "자격증 취득・자기계발 강좌",
    href: "/services/academy",
    variant: SERVICE_VARIANTS.yellow,
  },
  {
    id: "assessment",
    title: "시니어 종합검사",
    subtitle: "인지・정서・사회 기능 평가차트",
    href: "/services/assessment",
    variant: SERVICE_VARIANTS.sky,
  },
  {
    id: "social",
    title: "사회공헌 사업",
    subtitle: "봉사・나눔 실천",
    href: "/services/social",
    variant: SERVICE_VARIANTS.whiteRed,
    selected: true,
  },
];
