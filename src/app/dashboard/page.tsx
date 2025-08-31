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

import React from 'react';

const menuItems = [
  {
    id: 'ai',
    title: 'AI 도우미',
    description: 'ChatGPT 기반 글쓰기 챗봇',
    subtitle: '문장 교정, 아이디어 제안, 음성 전사',
    icon: Brain,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    href: '/dashboard/ai',
    badge: '새로움'
  },
  {
    id: 'life-graph',
    title: '인생그래프',
    description: '소중한 순간들을 시각화',
    subtitle: '감정과 기억을 아름다운 그래프로',
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    href: '/dashboard/life-graph',
    badge: '인기'
  },
  {
    id: 'create-work',
    title: '작품 만들기',
    description: '나만의 디지털 북 제작',
    subtitle: '사진과 텍스트로 멋진 작품을',
    icon: PlusCircle,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    href: '/dashboard/create-work',
    badge: null
  },
  {
    id: 'workspace',
    title: '작업실',
    description: '진행중인 프로젝트 관리',
    subtitle: '작업 상태를 한눈에 확인',
    icon: Briefcase,
    gradient: 'from-orange-500 to-red-500',
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
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50',
    href: '/dashboard/books',
    badge: null
  }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <div className="mb-8 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 blur-lg opacity-75"></div>
                {/* <div className="relative rounded-full bg-gradient-to-r from-orange-400 to-pink-500 p-4">
                  <Sparkles className="h-10 w-10 text-white" />
                </div> */}
              </div>
            </div>
            
            {/* <h1 className="mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-6xl font-bold text-transparent">
              Digital Note
            </h1>
             */}
            <p className="mb-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              기록과 기억 그리고... 당신의 소중한 추억들을 만들어보세요
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>AI 기반 글쓰기</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 text-red-500 mr-1" />
                <span>감정 시각화</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                <span>실시간 저장</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 pb-24">
        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                className="group relative transform transition-all duration-500 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.bgGradient} rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl ring-1 ring-gray-200/50 transition-all duration-500 group-hover:shadow-2xl group-hover:ring-gray-300/50 border border-white/50">
                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        item.badge === '새로움' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${item.gradient} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-lg font-medium text-gray-700">
                      {item.description}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="mt-6 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span className="text-sm font-medium mr-2">시작하기</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                  
                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-24 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full blur opacity-75"></div>
            <div className="relative bg-white rounded-full px-8 py-4 shadow-lg border border-gray-200/50">
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-orange-500" />
                <span className="text-gray-800 font-medium text-lg">빛나는 삶을 위한 디지털 기록</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>AI 기술과 감정 시각화로 더 풍부한 기록 경험을 만나보세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}