// src/app/page.tsx - 테스트용 단순 페이지
import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Digital Note</h1>
        <div className="space-y-4">
          <Link 
            href="/login"
            className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            로그인 페이지로 이동
          </Link>
          <Link 
            href="/signup"
            className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            회원가입 페이지로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}