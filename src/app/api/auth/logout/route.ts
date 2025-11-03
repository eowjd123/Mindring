// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { revokeSession } from '@/lib/session';

// POST 요청 처리 (기존)
export async function POST() {
  try {
    await revokeSession();
    
    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

// GET 요청 처리 (링크 클릭용) - 기존 세션 시스템 사용
export async function GET(request: NextRequest) {
  try {
    // 기존 revokeSession 함수는 쿠키 제거도 함께 처리
    await revokeSession();
    
    // 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Logout error:', error);
    // 에러가 발생해도 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', request.url));
  }
}