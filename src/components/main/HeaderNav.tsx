"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderNavProps {
  isAuthenticated: boolean;
}

export default function HeaderNav({ isAuthenticated }: HeaderNavProps) {
  const router = useRouter();

  const handleRestrictedClick = (e: React.MouseEvent<HTMLAnchorElement>, isPreparing?: boolean) => {
    if (isPreparing) {
      e.preventDefault();
      alert("준비중인 서비스입니다.");
      return;
    }
    if (!isAuthenticated) {
      e.preventDefault();
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
    }
  };

  const navItems = [
    { label: "AI기억퍼즐", href: "/puzzle-home" },
    { label: "AI자서전", href: "/services/lifebook" },
    { label: "인지콘텐츠", href: "/services/cognitive" },
    { label: "스마트워크북", href: "#", preparing: true },
    { label: "스마트교육", href: "/services/academy" },
    { label: "스마트인지관리", href: "/services/smart-cognitive" },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-8 font-bold text-gray-800 text-[16px]" suppressHydrationWarning>
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={(e) => handleRestrictedClick(e, item.preparing)}
          className="hover:text-purple-600 transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
