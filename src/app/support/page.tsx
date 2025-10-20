'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Phone,
  Search,
  HelpCircle,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '회원가입은 어떻게 하나요?',
    answer: '홈페이지 우측 상단의 "회원가입" 버튼을 클릭하시거나, 로그인 페이지에서 "아직 계정이 없으신가요? 회원가입하기" 링크를 클릭하시면 됩니다. 이메일과 비밀번호를 입력하시거나 소셜 로그인(카카오, 네이버, 구글)을 이용하실 수 있습니다.',
    category: '회원가입/로그인'
  },
  {
    id: '2',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 페이지에서 "비밀번호 찾기" 링크를 클릭하시면 이메일로 비밀번호 재설정 링크를 보내드립니다. 이메일을 확인하시고 링크를 클릭하여 새로운 비밀번호를 설정해주세요.',
    category: '회원가입/로그인'
  },
  {
    id: '3',
    question: '인생그래프는 어떻게 사용하나요?',
    answer: '대시보드에서 "인생그래프" 메뉴를 클릭하시면 됩니다. 먼저 사용자 정보(이름, 출생년도)를 입력하신 후, "새로운 추억 추가하기" 버튼을 클릭하여 인생의 중요한 순간들을 기록하실 수 있습니다. 각 추억에는 날짜, 제목, 내용, 감정을 입력하실 수 있습니다.',
    category: '기능 사용법'
  },
  {
    id: '4',
    question: 'AI 도우미는 어떤 기능을 제공하나요?',
    answer: 'AI 도우미는 ChatGPT 기반으로 다음과 같은 기능을 제공합니다:\n• 글쓰기 도우미: 문장을 매끄럽게 다듬어주고 문법, 오탈자를 수정해줍니다\n• 음성 파일 전사: 음성 파일을 업로드하면 텍스트로 변환해줍니다\n• 아이디어 제안: 글쓰기에 도움이 되는 아이디어를 제안해줍니다',
    category: '기능 사용법'
  },
  {
    id: '5',
    question: '작품을 내보내는 방법이 있나요?',
    answer: '네, 여러 방법으로 작품을 내보낼 수 있습니다:\n• PDF 형식으로 내보내기\n• 이미지 형식으로 내보내기\n• Word 문서로 내보내기\n• JSON 형식으로 데이터 백업\n각 작품의 상세 페이지에서 "내보내기" 버튼을 클릭하시면 원하는 형식을 선택할 수 있습니다.',
    category: '기능 사용법'
  },
  {
    id: '6',
    question: '데이터는 안전하게 보관되나요?',
    answer: '네, 사용자의 개인정보와 데이터는 최고 수준의 보안으로 보호됩니다. 모든 데이터는 암호화되어 저장되며, 정기적인 보안 점검을 통해 안전성을 확보하고 있습니다. 또한 개인정보보호법에 따라 사용자의 동의 없이는 제3자와 정보를 공유하지 않습니다.',
    category: '보안/개인정보'
  },
  {
    id: '7',
    question: '서비스 이용료는 어떻게 되나요?',
    answer: '현재 기본 기능은 무료로 이용하실 수 있습니다. 향후 프리미엄 기능이 추가될 예정이며, 그때 별도의 이용료가 발생할 수 있습니다. 이용료 관련 공지는 사전에 충분히 안내해드릴 예정입니다.',
    category: '요금/결제'
  },
  {
    id: '8',
    question: '모바일에서도 사용할 수 있나요?',
    answer: '네, 반응형 웹으로 제작되어 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 환경으로 이용하실 수 있습니다. 모바일 브라우저에서도 모든 기능을 원활하게 사용하실 수 있습니다.',
    category: '기술 지원'
  }
];

const categories = ['전체', '회원가입/로그인', '기능 사용법', '보안/개인정보', '요금/결제', '기술 지원'];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '일반문의'
  });

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 실제 문의 전송 로직 구현
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      category: '일반문의'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-end mb-2">
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link className="hover:text-gray-900 transition-colors" href="/">홈으로</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/login">로그인</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/signup">회원가입</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/plan">이용권</Link>
            </nav>
          </div>
          <div className="flex items-center justify-between gap-8">
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
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-3">
                <HelpCircle className="h-6 w-6 text-teal-500" />
                고객센터
              </h2>
              <p className="text-gray-600 mt-1">궁금한 점이 있으시면 언제든 문의해주세요</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Quick Help Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">실시간 채팅</h3>
            <p className="text-gray-600 text-sm mb-4">빠른 답변이 필요하시면 실시간 채팅을 이용해주세요</p>
            <button className="w-full bg-gradient-to-r from-teal-400 to-teal-600 text-white py-2 px-4 rounded-full hover:from-teal-500 hover:to-teal-700 transition-all duration-200 text-sm font-medium">
              채팅 시작하기
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">이메일 문의</h3>
            <p className="text-gray-600 text-sm mb-4">상세한 문의사항은 이메일로 보내주세요</p>
            <a href="mailto:support@mindra.co.kr" className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white py-2 px-4 rounded-full hover:from-blue-500 hover:to-blue-700 transition-all duration-200 text-sm font-medium block text-center">
              이메일 보내기
            </a>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">전화 문의</h3>
            <p className="text-gray-600 text-sm mb-4">평일 09:00-18:00 (주말, 공휴일 휴무)</p>
            <a href="tel:02-1234-5678" className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-2 px-4 rounded-full hover:from-green-500 hover:to-green-700 transition-all duration-200 text-sm font-medium block text-center">
              02-1234-5678
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">자주 묻는 질문</h2>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="궁금한 내용을 검색해보세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-full focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-full focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{item.question}</h3>
                  </div>
                  {expandedItems.includes(item.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedItems.includes(item.id) && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <div className="pt-4 text-gray-700 whitespace-pre-line">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">문의하기</h2>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 유형
                </label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors bg-white"
                >
                  <option value="일반문의">일반문의</option>
                  <option value="기능문의">기능문의</option>
                  <option value="버그신고">버그신고</option>
                  <option value="개선제안">개선제안</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                  placeholder="문의 제목을 입력해주세요"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문의 내용 *
              </label>
              <textarea
                required
                rows={6}
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors resize-none"
                placeholder="문의하실 내용을 자세히 적어주세요. 빠른 답변을 위해 구체적으로 작성해주시면 도움이 됩니다."
              />
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">문의 접수 안내</p>
                <p>• 일반 문의: 1-2일 내 답변</p>
                <p>• 긴급 문의: 당일 답변 (평일 09:00-18:00)</p>
                <p>• 답변은 입력하신 이메일로 발송됩니다</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-400 to-teal-600 text-white py-4 px-6 rounded-full hover:from-teal-500 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-lg"
            >
              문의 접수하기
            </button>
          </form>
        </div>
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
                <p><span className="font-medium">마인드라</span> 대표자 서현숙 <span className="ml-4 font-medium">사업자등록번호:</span> 255-37-01508</p>
                <p>경기도 고양시 일산동구 중앙로 1036 4층(고양중장년기술창업센터, 1-1층)</p>
                <p><span className="font-medium">통신판매신고번호:</span> 제2025-고양일산동-0921호</p>
                <p className="text-gray-500 pt-2">Copyright 2025. MINDRA INC. All rights reserved.</p>
              </div>
            </div>
            <div className="lg:text-right">
              <p className="text-sm text-gray-500 mb-2">FAMILY SITE</p>
              <div className="flex items-center justify-start lg:justify-end">
                <span className="text-lg font-bold text-gray-900">Mind<span className="text-teal-500">ra</span></span>
                <button aria-label="패밀리 사이트 메뉴 열기" className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
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
