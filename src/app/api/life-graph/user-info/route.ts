// app/api/life-graph/user-info/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const { name, birthYear, location } = await request.json();

    // 사용자 이름 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: { name }
    });

    // birthYear와 location은 별도 테이블에 저장하거나 
    // 세션 스토리지에만 저장할 수 있음 (현재는 응답에서만 사용)

    return NextResponse.json({
      message: 'User info updated successfully',
      userInfo: { name, birthYear, location }
    });

  } catch (error) {
    console.error('Update User Info Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user info' },
      { status: 500 }
    );
  }
}