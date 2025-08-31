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
  // 기존 requireAuth 함수 사용 (미인증 시 자동으로 /login으로 redirect)
  const user = await requireAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-b to-pink-500 rounded-lg flex items-center justify-center">
              <img
                src="/img/OBJECTS.png"
                alt="Objects Icon"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                <img
                  src="/img/maind.png"
                  alt="Digital Note"
                  className="h-6 object-contain"
                />
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || "사용자"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <a
            href="/api/auth/logout"
            className="flex items-center space-x-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium">로그아웃</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  );
}
