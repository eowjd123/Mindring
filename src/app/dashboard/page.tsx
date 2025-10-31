// app/dashboard/page.tsx
'use client';

import {
  ArrowRight,
  Book,
  Brain,
  Briefcase,
  Clock,
  Heart,
  PlusCircle,
  Sparkles,
  Star,
  TrendingUp,
  User
} from 'lucide-react';

import Link from "next/link";
import React from 'react';

const menuItems = [
  {
    id: 'ai',
    title: 'AI 도우미',
    description: 'ChatGPT 기반 글쓰기 챗봇',
    subtitle: '문장 교정, 아이디어 제안, 음성 전사',
    icon: Brain,
    gradient: 'from-teal-400 to-teal-600',
    bgGradient: 'from-teal-50 to-teal-50',
    href: '/dashboard/ai',
    badge: '새로움'
  },
  {
    id: 'life-graph',
    title: '인생그래프',
    description: '소중한 순간들을 시각화',
    subtitle: '감정과 기억을 아름다운 그래프로',
    icon: TrendingUp,
    gradient: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-50',
    href: '/dashboard/life-graph',
    badge: '인기'
  },
  {
    id: 'create-work',
    title: '작품 만들기',
    description: '나만의 디지털 북 제작',
    subtitle: '사진과 텍스트로 멋진 작품을',
    icon: PlusCircle,
    gradient: 'from-green-400 to-green-600',
    bgGradient: 'from-green-50 to-green-50',
    href: '/dashboard/create-work',
    badge: null
  },
  {
    id: 'workspace',
    title: '작업실',
    description: '진행중인 프로젝트 관리',
    subtitle: '작업 상태를 한눈에 확인',
    icon: Briefcase,
    gradient: 'from-orange-400 to-red-500',
    bgGradient: 'from-orange-50 to-red-50',
    href: '/dashboard/workspace',
    badge: null
  },
  {
    id: 'completed-books',
    title: '만든 북 보기',
    description: '완성된 작품 감상하기',
    subtitle: '다운로드, 공유, 자동재생',
    icon: Book,
    gradient: 'from-purple-400 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-50',
    href: '/dashboard/books',
    badge: null
  }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-end mb-2">
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link className="hover:text-gray-900 transition-colors" href="/">홈으로</Link>
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
          <div className="flex items-center justify-center">
            {/* Search Bar */}
            <div className="w-full max-w-xl">
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-1/3 w-48 h-48 sm:w-72 sm:h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <h1 className="mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-teal-900 to-blue-900 bg-clip-text text-3xl sm:text-4xl lg:text-6xl font-bold text-transparent">
              Digital Note
            </h1>
            
            <p className="mb-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              기록과 기억 그리고... 당신의 소중한 추억들을 만들어보세요
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>AI 기반 글쓰기</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 text-red-500 mr-1" />
                <span>감정 시각화</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-teal-500 mr-1" />
                <span>실시간 저장</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-24">
        {/* Menu Grid - 메인 페이지 스타일 적용 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                className="group relative"
              >
                <div className="block rounded-3xl p-8 h-64 text-center transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-teal-100 bg-white border border-gray-200">
                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.badge === '새로움' 
                          ? 'bg-teal-100 text-teal-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  )}
                  
                  <div className="h-full flex flex-col justify-center">
                    <div className="mb-6">
                      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${item.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-xl mb-3 text-gray-900">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm leading-relaxed text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {item.subtitle}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-center text-teal-600 group-hover:text-teal-700 transition-colors">
                      <span className="text-sm font-medium mr-1">시작하기</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-8 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur opacity-75"></div>
            <div className="relative bg-white rounded-full px-6 py-3 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-teal-500" />
                <span className="text-gray-800 font-medium text-base">빛나는 삶을 위한 디지털 기록</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>AI 기술과 감정 시각화로 더 풍부한 기록 경험을 만나보세요</p>
          </div>
        </div>
      </div>

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