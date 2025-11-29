// app/services/lifebook/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function LifebookPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">라이프북</h1>
          <p className="text-gray-600">AI 자서전 만들기</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Image
                src="/img/icon_2.png"
                alt="라이프북"
                width={120}
                height={120}
                className="mx-auto"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              라이프북 서비스
            </h2>
            <p className="text-gray-600 mb-6">
              AI 기반 자서전을 만들어보세요. 소중한 추억을 기록하고 아름다운 책으로 만들어드립니다.
            </p>
            <Link
              href="/dashboard/create-work"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

