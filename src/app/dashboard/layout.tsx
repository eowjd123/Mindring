// app/dashboard/layout.tsx

import {
  Book,
  Brain,
  Briefcase,
  Home,
  LogOut,
  PlusCircle,
  TrendingUp,
  User,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { requireAuth } from "@/lib/session";

export const metadata = {
  title: "Digital Note - 빛나는 삶",
  description: "당신의 소중한 추억을 디지털 북으로 만들어보세요",
};

const navigationItems = [
  {
    name: "대시보드",
    href: "/dashboard",
    icon: Home,
    description: "메인 홈",
  },
  {
    name: "AI 도우미",
    href: "/dashboard/ai",
    icon: Brain,
    description: "ChatGPT 기반 글쓰기 챗봇",
  },
  {
    name: "인생그래프",
    href: "/dashboard/life-graph",
    icon: TrendingUp,
    description: "인생의 소중한 순간들을 시각화",
  },
  {
    name: "작품 만들기",
    href: "/dashboard/create-work",
    icon: PlusCircle,
    description: "새로운 디지털 북 제작",
  },
  {
    name: "작업실",
    href: "/dashboard/workspace",
    icon: Briefcase,
    description: "작업중인 프로젝트 관리",
  },
  {
    name: "만든 북 보기",
    href: "/dashboard/books",
    icon: Book,
    description: "완성된 작품 보기 및 공유",
  },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar - Senior-friendly */}
      <header className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          {/* Main Navbar - Single Row */}
          <div className="flex items-center justify-between gap-3 py-4 overflow-x-auto">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-b to-pink-500 rounded-lg flex items-center justify-center relative">
                <Image
                  src="/img/OBJECTS.png"
                  alt="Objects Icon"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="h-6 relative">
                <Image
                  src="/img/maind.png"
                  alt="Digital Note"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 120px, 150px"
                />
              </div>
            </Link>

            {/* Navigation Menu - Single Row */}
            <nav className="flex items-center gap-2 lg:gap-3 flex-1 justify-center overflow-x-auto">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2.5 text-base font-medium text-gray-700 bg-white rounded-lg border-2 border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg whitespace-nowrap">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-medium text-gray-900">{user.name || "사용자"}</span>
              </div>
              <a
                href="/api/auth/logout"
                className="flex items-center gap-2 px-4 py-2.5 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>로그아웃</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="w-full max-w-none px-2 sm:px-3 py-4">{children}</main>
    </div>
  );
}
