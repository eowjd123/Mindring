// app/api/life-graph/export/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { createCanvas } from 'canvas';

interface LifeEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  emotion: 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'VERY_SAD';
}

interface UserInfo {
  name: string;
  birthYear: number;
  location: string;
}

const emotionConfig = {
  VERY_HAPPY: { label: '매우 행복', value: 5, color: '#10B981' },
  HAPPY: { label: '행복', value: 4, color: '#3B82F6' },
  NEUTRAL: { label: '보통', value: 3, color: '#6B7280' },
  SAD: { label: '슬픔', value: 2, color: '#F59E0B' },
  VERY_SAD: { label: '매우 슬픔', value: 1, color: '#EF4444' }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'png';
  
  try {
    // 실제로는 데이터베이스에서 사용자 데이터를 가져와야 함
    // 여기서는 샘플 데이터 사용
    const userInfo: UserInfo = {
      name: '김철수',
      birthYear: 1985,
      location: '서울'
    };

    const events: LifeEvent[] = [
      { id: '1', year: 1985, title: '태어남', description: '새로운 시작', emotion: 'HAPPY' },
      { id: '2', year: 1991, title: '초등학교 입학', description: '학교생활 시작', emotion: 'HAPPY' },
      { id: '3', year: 2003, title: '대학교 입학', description: '꿈의 대학', emotion: 'VERY_HAPPY' },
      { id: '4', year: 2007, title: '졸업', description: '새로운 도전', emotion: 'HAPPY' },
      { id: '5', year: 2008, title: '첫 직장', description: '사회인 시작', emotion: 'NEUTRAL' },
      { id: '6', year: 2015, title: '결혼', description: '인생의 동반자', emotion: 'VERY_HAPPY' },
      { id: '7', year: 2020, title: '코로나19', description: '어려운 시기', emotion: 'SAD' },
      { id: '8', year: 2024, title: '현재', description: '감사한 일상', emotion: 'HAPPY' }
    ];

    switch (format) {
      case 'png':
        return await generatePNG(userInfo, events);
      case 'json':
        return generateJSON(userInfo, events);
      case 'dashboard':
        // 대시보드는 클라이언트에서 처리
        return NextResponse.json({ redirect: '/dashboard/life-graph/dashboard' });
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

async function generatePNG(userInfo: UserInfo, events: LifeEvent[]) {
  const width = 1200;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 제목
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${userInfo.name || '사용자'}의 인생그래프`, width / 2, 50);

  // 부제목
  ctx.font = '16px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`${userInfo.birthYear}년생, ${userInfo.location}`, width / 2, 80);

  if (events.length === 0) {
    ctx.font = '18px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('아직 추억이 없습니다', width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    const uint8Array = new Uint8Array(buffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="life-graph.png"',
      },
    });
  }

  // 그래프 영역 설정
  const graphTop = 120;
  const graphHeight = height - 200;
  const graphLeft = 100;
  const graphWidth = width - 200;

  // 축 그리기
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;

  // Y축
  ctx.beginPath();
  ctx.moveTo(graphLeft, graphTop);
  ctx.lineTo(graphLeft, graphTop + graphHeight);
  ctx.stroke();

  // X축
  ctx.beginPath();
  ctx.moveTo(graphLeft, graphTop + graphHeight);
  ctx.lineTo(graphLeft + graphWidth, graphTop + graphHeight);
  ctx.stroke();

  // Y축 라벨
  const emotionLabels = ['매우슬픔', '슬픔', '보통', '행복', '매우행복'];
  ctx.font = '12px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'right';
  
  for (let i = 0; i < 5; i++) {
    const y = graphTop + graphHeight - (i * graphHeight / 4);
    ctx.fillText(emotionLabels[i], graphLeft - 10, y + 4);
    
    // 격자선
    if (i > 0) {
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(graphLeft, y);
      ctx.lineTo(graphLeft + graphWidth, y);
      ctx.stroke();
    }
  }

  // 데이터 포인트 계산
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);
  const minYear = Math.min(...sortedEvents.map(e => e.year));
  const maxYear = Math.max(...sortedEvents.map(e => e.year));
  const yearRange = maxYear - minYear || 1;
  

  // 그래프 선 그리기
  if (sortedEvents.length > 1) {
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    sortedEvents.forEach((event, index) => {
      const x = graphLeft + ((event.year - minYear) / yearRange) * graphWidth;
      const value = emotionConfig[event.emotion].value;
      const y = graphTop + graphHeight - ((value - 1) / 4) * graphHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  // 데이터 포인트 그리기
  sortedEvents.forEach(event => {
    const x = graphLeft + ((event.year - minYear) / yearRange) * graphWidth;
    const value = emotionConfig[event.emotion].value;
    const y = graphTop + graphHeight - ((value - 1) / 4) * graphHeight;
    
    // 포인트 원
    ctx.fillStyle = emotionConfig[event.emotion].color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // 포인트 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 년도 라벨
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(event.year.toString(), x, graphTop + graphHeight + 20);
  });

  // 범례
  const legendY = height - 120;
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  
  let legendX = graphLeft;
  Object.entries(emotionConfig).forEach(([key, config]) => {
    const hasEvent = events.some(e => e.emotion === key);
    if (hasEvent) {
      // 색상 박스
      ctx.fillStyle = config.color;
      ctx.fillRect(legendX, legendY, 15, 15);
      
      // 라벨
      ctx.fillStyle = '#374151';
      ctx.fillText(config.label, legendX + 20, legendY + 12);
      
      legendX += config.label.length * 8 + 40;
    }
  });

  // 통계 정보
  const avgHappiness = events.reduce((sum, e) => sum + emotionConfig[e.emotion].value, 0) / events.length;
  const statsY = height - 80;
  
  ctx.font = '14px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'left';
  ctx.fillText(`총 ${events.length}개 추억`, graphLeft, statsY);
  ctx.fillText(`평균 행복도: ${avgHappiness.toFixed(1)}/5`, graphLeft + 120, statsY);
  
  const currentAge = new Date().getFullYear() - userInfo.birthYear;
  ctx.fillText(`현재 ${currentAge}세`, graphLeft + 280, statsY);

  // 생성 날짜
  ctx.font = '12px Arial';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'right';
  ctx.fillText(`생성일: ${new Date().toLocaleDateString()}`, width - 50, height - 20);

  const buffer = canvas.toBuffer('image/png');
  const uint8Array = new Uint8Array(buffer);
  
  return new NextResponse(uint8Array, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="life-graph.png"',
    },
  });
}

function generateJSON(userInfo: UserInfo, events: LifeEvent[]) {
  const exportData = {
    userInfo,
    events,
    exportDate: new Date().toISOString(),
    statistics: {
      totalEvents: events.length,
      averageHappiness: events.length > 0 
        ? events.reduce((sum, e) => sum + emotionConfig[e.emotion].value, 0) / events.length 
        : 0,
      emotionDistribution: Object.keys(emotionConfig).reduce((acc, emotion) => {
        acc[emotion] = events.filter(e => e.emotion === emotion).length;
        return acc;
      }, {} as Record<string, number>)
    }
  };

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': 'attachment; filename="life-graph-data.json"',
    },
  });
}