// app/page.tsx

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { getSessionUser } from "@/lib/session";

import ServiceCardClient from "./ServiceCardClient";
import RecommendedSection from "@/components/main/RecommendedSection";

export default async function RootPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar (Login/Logout, etc) */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4">
            <div className="flex justify-end items-center py-2 text-[11px] text-gray-500 gap-3">
                {user ? (
                   <>
                     <Link href="/api/auth/logout" className="hover:text-gray-800">로그아웃</Link>
                     <span className="w-[1px] h-2 bg-gray-300"></span>
                     <Link href="/mypage" className="hover:text-gray-800">마이페이지</Link>
                   </>
                ) : (
                    <>
                     <Link href="/login" className="hover:text-gray-800">로그인</Link>
                     <span className="w-[1px] h-2 bg-gray-300"></span>
                     <Link href="/signup" className="hover:text-gray-800">회원가입</Link>
                    </>
                )}
                <span className="w-[1px] h-2 bg-gray-300"></span>
                <div className="flex items-center gap-1">
                    <span>화면크기</span>
                    <button className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center hover:bg-gray-100">+</button>
                    <button className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center hover:bg-gray-100">-</button>
                </div>
            </div>
        </div>
      </div>

      {/* Background Wrapper for Header & Recommended Section */}
      <div className="bg-cover bg-top bg-no-repeat" style={{ backgroundImage: "url('/img/background.png')" }}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-transparent transition-all">
          <div className="mx-auto max-w-7xl px-4">
            {/* Main Navigation Bar */}
            <div className="flex items-center justify-between py-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                    {/* Icon */}
                    <div className="relative w-10 h-10">
                         <Image
                            src="/img/OBJECTS.png"
                            alt="Mindring Icon"
                            fill
                            className="object-contain"
                            priority
                         />
                    </div>
                    {/* Text Group */}
                    <div className="flex flex-col items-start justify-center">
                        <div className="relative w-24 h-6 mb-1">
                             <Image
                                src="/img/maind.png"
                                alt="Mindring Text"
                                fill
                                className="object-contain object-left"
                                priority
                             />
                        </div>
                        <span className="text-[11px] font-bold text-gray-800 tracking-tight leading-none">스마트인지자극 솔루션</span>
                    </div>
                </Link>

                {/* Main Nav Links */}
                <nav className="hidden lg:flex items-center gap-8 font-bold text-gray-800 text-[16px]">
                    <Link href="/puzzle-home" className="hover:text-purple-600 transition-colors">AI기억퍼즐</Link>
                    <Link href="/games" className="hover:text-purple-600 transition-colors">인지게임</Link>
                    <Link href="/services/cognitive" className="hover:text-purple-600 transition-colors">인지콘텐츠</Link>
                    <Link href="/workbook" className="hover:text-purple-600 transition-colors">스마트워크북</Link>
                    <Link href="/education" className="hover:text-purple-600 transition-colors">스마트교육</Link>
                    <Link href="/smart-care" className="hover:text-purple-600 transition-colors">스마트인지관리</Link>
                </nav>

                {/* User Status / CRM */}
                <div className="hidden md:flex items-center gap-4">
                    {user && (
                        <div className="flex items-center gap-2 pl-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white shadow-md">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                                <span className="font-semibold text-gray-900">{user.name}</span> 님 안녕하세요.
                            </div>
                            <Link href="/status" className="flex items-center gap-1 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-full text-sm font-bold text-purple-700 border-2 border-purple-500 shadow-sm transition-all ml-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                                학습현황
                            </Link>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </header>

        {/* Recommended Section (Part of Hero Area) */}
        <div className="mx-auto max-w-7xl px-4 py-12">
          <RecommendedSection />
        </div>
      </div>

      {/* Main Content (Services) */}
      <main className="mx-auto max-w-7xl px-4 pb-12 mt-12">
        <section aria-labelledby="services-heading">
          <h2 id="services-heading" className="sr-only">서비스 목록</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <ServiceCardClient key={service.id} {...service} isAuthenticated={!!user} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      {/* Footer */}
      <footer className="relative text-gray-300 mt-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/img/footer.png')" }}>
        <div className="mx-auto max-w-7xl px-4 pt-48 pb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex flex-col gap-4">
               {/* Logo & Links */}
               <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative h-10 w-24 brightness-0 invert">
                    <Image
                      src="/img/maind.png"
                      alt="Mindring Logo"
                      fill
                      className="object-contain"
                    />
                </div>
                <div className="flex gap-4 text-sm font-medium">
                    <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
                    <Link href="/partnership" className="hover:text-white transition-colors">제휴문의</Link>
                </div>
               </div>
               
               {/* Address Info */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>경기도 고양시 일산동구 중앙로 1036 4층(고양중장년기술창업센터, 1-1층)</p>
                <p>
                  대표자 : 서현숙 | 사업자등록번호 : 255-37-01508 | 통신판매신고번호 : 제2025-고양일산동-0921호
                </p>
                <p className="mt-2">
                  Copyright © 2025. MINDRA INC. All rights reserved.
                </p>
              </div>
            </div>

            {/* Right Side: Social & Family Site */}
            <div className="flex flex-col items-end gap-4">
                <div className="flex items-center gap-3">
                    <SocialButton href="https://blog.example.com" label="블로그" className="bg-white text-[#2C313C] hover:bg-gray-200">
                        <span className="font-bold text-[10px]">b</span>
                    </SocialButton>
                    <SocialButton href="https://instagram.com" label="인스타그램" className="bg-white text-[#2C313C] hover:bg-gray-200 show-icon">
                        <InstagramIcon />
                    </SocialButton>
                    <SocialButton href="https://youtube.com" label="유튜브" className="bg-white text-[#2C313C] hover:bg-gray-200 show-icon">
                        <YoutubeIcon />
                    </SocialButton>
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



function YoutubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57A3 3 0 0 0 24 17.8C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z"/>
    </svg>
  );
}


/* ---------------------------
   Service Icon Components
   --------------------------- */
const ServiceIcons = {
  puzzle: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/1.png"
          alt="AI 기억퍼즐 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  game: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/2.png"
          alt="인지 게임 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  bulb: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/3.png"
          alt="인지 콘텐츠 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  smartCognitive: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/4.png"
          alt="스마트 인지관리 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  book: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/5.png"
          alt="스마트 워크북 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  cap: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/6.png"
          alt="스마트 교육 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
  heart: (
    <div className="w-24 h-24 flex items-center justify-center mx-auto">
      <div className="relative w-24 h-24">
        <Image
          src="/img/7.png"
          alt="사회공헌 아이콘"
          fill
          sizes="96px"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  ),
};

// Service Variants
// Service Variants (Pastel Colors for new design)
const SERVICE_VARIANTS = {
  cyan: { bg: "bg-cyan-50", icon: ServiceIcons.puzzle },
  blue: { bg: "bg-blue-50", icon: ServiceIcons.game },
  yellow: { bg: "bg-yellow-50", icon: ServiceIcons.bulb }, // Cognitive Content
  pink: { bg: "bg-pink-50", icon: ServiceIcons.smartCognitive }, // Smart Cognitive
  gray: { bg: "bg-gray-50", icon: ServiceIcons.book }, // Workbook
  orange: { bg: "bg-orange-50", icon: ServiceIcons.cap }, // Education
  purple: { bg: "bg-purple-50", icon: ServiceIcons.heart }, // Social
} as const;

// Types
type ServiceVariant = typeof SERVICE_VARIANTS[keyof typeof SERVICE_VARIANTS];

interface ServiceType {
  id: string;
  title?: string;
  subtitle?: string;
  href: string;
  variant: ServiceVariant;
  selected?: boolean;
  className?: string; // Layout class (col-span)
  imageSrc?: string; // Full card image
}

// Services Data
const SERVICES: ServiceType[] = [
  {
    id: "puzzle",
    href: "/puzzle-home",
    variant: SERVICE_VARIANTS.cyan,
    imageSrc: "/img/1.png",
  },
  {
    id: "cognitive",
    href: "/services/cognitive",
    variant: SERVICE_VARIANTS.yellow,
    imageSrc: "/img/3.png",
  },
  {
    id: "smart-cognitive",
    href: "/services/smart-cognitive",
    variant: SERVICE_VARIANTS.pink,
    imageSrc: "/img/4.png",
  },
  {
    id: "workbook",
    href: "/services/lifebook",
    variant: SERVICE_VARIANTS.gray,
    imageSrc: "/img/5.png",
  },
  {
    id: "education",
    href: "/services/academy",
    variant: SERVICE_VARIANTS.orange,
    imageSrc: "/img/6.png",
  },
  {
    id: "social",
    href: "/services/social",
    variant: SERVICE_VARIANTS.purple,
    imageSrc: "/img/7.png",
    className: "sm:col-span-2 lg:col-span-2",
  },
];
