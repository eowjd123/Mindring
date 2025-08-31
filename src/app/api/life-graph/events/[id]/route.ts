// app/api/life-graph/events/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const eventId = params.id;

    // 포인트 소유권 확인 및 삭제
    const deletedPoint = await prisma.lifeGraphPoint.deleteMany({
      where: {
        pointId: eventId,
        graph: {
          userId // 본인 소유 포인트만 삭제 가능
        }
      }
    });

    if (deletedPoint.count === 0) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete Life Graph Event Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete life graph event' },
      { status: 500 }
    );
  }
}