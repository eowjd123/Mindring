// app/services/social/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사회공헌 사업</h1>
          <p className="text-gray-600">봉사・나눔 실천</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Image
                src="/img/icon_8.png"
                alt="사회공헌 사업"
                width={120}
                height={120}
                className="mx-auto"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              사회공헌 사업 서비스
            </h2>
            <p className="text-gray-600 mb-6">
              봉사와 나눔을 실천하는 사회공헌 활동에 참여해보세요.
            </p>
            <div className="text-sm text-gray-500">
              서비스 준비 중입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

