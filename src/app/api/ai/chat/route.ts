// // app/api/ai/chat/route.ts

// import { NextRequest, NextResponse } from 'next/server';

// import OpenAI from 'openai';
// import { getSessionUser } from '@/lib/session';

// // ✅ Next 라우트 핸들러가 서버에서만 돌도록 명시
// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// const SYSTEM_PROMPT = `당신은 "디지털자서전 도우미"입니다. 사용자가 자서전이나 회고록을 작성하는 것을 도와주는 전문 AI 어시스턴트입니다.

// 주요 역할:
// 1. 글쓰기 도우미 - 문장을 매끄럽게 다듬고 문법, 오탈자를 교정
// 2. 스토리텔링 지원 - 인생의 중요한 순간들을 효과적으로 표현하도록 도움
// 3. 구조화 지원 - 자서전의 구성과 흐름을 체계적으로 정리
// 4. 음성 전사 - 업로드된 음성을 텍스트로 변환

// 응답 스타일:
// - 친근하고 따뜻한 톤 사용
// - 구체적이고 실용적인 조언 제공
// - 사용자의 개인적인 경험을 존중하며 격려
// - 한국어로 자연스럽게 대화

// 항상 사용자의 소중한 기억과 경험을 존중하며, 그들의 이야기가 의미 있게 전달될 수 있도록 도움을 제공하세요.`;

// // ✅ 환경변수 가드(앞뒤 공백 제거 + 형식 확인)
// const apiKey = process.env.OPENAI_API_KEY?.trim();
// if (!apiKey || !apiKey.startsWith('sk-')) {
//   throw new Error('OPENAI_API_KEY is missing or invalid format.');
// }

// const openai = new OpenAI({ apiKey });

// function jsonError(message: string, status = 500) {
//   return NextResponse.json({ error: message }, { status });
// }

// export async function POST(request: NextRequest) {
//   try {
//     // 인증 확인
//     const user = await getSessionUser();
//     if (!user) {
//       return jsonError('Authentication required', 401);
//     }

//     const formData = await request.formData();
//     const message = (formData.get('message') ?? '') as string;
//     const audioFile = formData.get('audioFile') as File | null;

//     // 입력 검증
//     if (!message.trim() && !audioFile) {
//       return jsonError('Message or audio file is required', 400);
//     }

//     let userContent = message.trim();
//     let transcriptionText: string | null = null;

//     // ⚙️ 음성 파일이 있으면 Whisper 전사
//     if (audioFile) {
//       try {
//         // OpenAI SDK v4는 Web File/Blob도 지원
//         const transcription = await openai.audio.transcriptions.create({
//           file: audioFile,
//           model: 'whisper-1',
//           language: 'ko',
//           response_format: 'text',
//         });

//         if (transcription && typeof transcription === 'string') {
//           transcriptionText = transcription;
//           userContent = [`[음성 전사 내용]`, transcription, message].filter(Boolean).join('\n\n').trim();
//         } else {
//           userContent = `${message}\n\n[음성 파일을 전사하지 못했습니다]`.trim();
//         }
//       } catch (err) {
//         console.error('Audio transcription error:', err);
//         userContent = `${message}\n\n[음성 파일 처리 중 오류가 발생했습니다]`.trim();
//       }
//     }

//     // Chat Completion
//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         { role: 'system', content: SYSTEM_PROMPT },
//         { role: 'user', content: userContent || '사용자 입력이 비어 있습니다.' },
//       ],
//       temperature: 0.7,
//       max_tokens: 1500,
//     });

//     const responseText =
//       completion.choices?.[0]?.message?.content ??
//       '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';

//     return NextResponse.json({
//       response: responseText,
//       transcription: transcriptionText,
//     });
//   } catch (error: unknown) {
//     // 상세 에러 로깅
//     console.error('AI Chat API Error:', error);

//     // OpenAI API 401 등 공통 처리
//     const status =
//       typeof error === 'object' && error && 'status' in error && typeof (error as { status: number }).status === 'number'
//         ? (error as { status: number }).status
//         : 500;

//     const message =
//       typeof error === 'object' && error && 'message' in error && typeof (error as { message: string }).message === 'string'
//         ? (error as { message: string }).message
//         : 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';

//     return jsonError(message, status === 0 ? 500 : status);
//   }
// }

// export async function GET() {
//   try {
//     const user = await getSessionUser();
//     if (!user) {
//       return jsonError('Authentication required', 401);
//     }

//     const hasApiKey = Boolean(apiKey);
//     return NextResponse.json({
//       status: 'ready',
//       hasApiKey,
//       features: {
//         textChat: hasApiKey,
//         audioTranscription: hasApiKey,
//         voiceRecording: true, // 브라우저 기능
//       },
//     });
//   } catch (error) {
//     console.error('AI Chat Status Error:', error);
//     return jsonError('Failed to check AI service status', 500);
//   }
// }


// app/api/ai/chat/route.ts

// app/api/ai/chat/route.ts

import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json<T>(status: number, body: T) {
  return NextResponse.json(body, { status });
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return json(401, { error: 'Authentication required' });

    return json(501, {
      error: 'AI chat API is temporarily disabled',
      detail: '이 엔드포인트는 현재 비활성화되어 있습니다.',
    });
  } catch {
    return json(500, { error: 'Unexpected error' });
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return json(401, { error: 'Authentication required' });

    return json(200, {
      status: 'disabled',
      hasApiKey: false,
      features: {
        textChat: false,
        audioTranscription: false,
        voiceRecording: true,
      },
    });
  } catch {
    return json(500, { error: 'Failed to check status' });
  }
}
