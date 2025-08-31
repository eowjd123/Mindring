// app/api/ai/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';

import OpenAI from 'openai';
import { getSessionUser } from '@/lib/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `당신은 "디지털자서전 도우미"입니다. 사용자가 자서전이나 회고록을 작성하는 것을 도와주는 전문 AI 어시스턴트입니다.

주요 역할:
1. 글쓰기 도우미 - 문장을 매끄럽게 다듬고 문법, 오탈자를 교정
2. 스토리텔링 지원 - 인생의 중요한 순간들을 효과적으로 표현하도록 도움
3. 구조화 지원 - 자서전의 구성과 흐름을 체계적으로 정리
4. 음성 전사 - 업로드된 음성을 텍스트로 변환

응답 스타일:
- 친근하고 따뜻한 톤 사용
- 구체적이고 실용적인 조언 제공
- 사용자의 개인적인 경험을 존중하며 격려
- 한국어로 자연스럽게 대화

항상 사용자의 소중한 기억과 경험을 존중하며, 그들의 이야기가 의미 있게 전달될 수 있도록 도움을 제공하세요.`;

export async function POST(request: NextRequest) {
  try {
    // 기존 세션 시스템으로 인증 확인
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const audioFile = formData.get('audioFile') as File | null;

    let userContent = message || '';

    // 음성 파일이 있는 경우 전사 처리
    if (audioFile) {
      try {
        console.log('Processing audio file:', audioFile.name, audioFile.type);
        
        // OpenAI Whisper API를 사용한 음성 전사
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'ko', // 한국어 지정
          response_format: 'text',
        });

        if (transcription) {
          userContent = `[음성 전사 내용]\n${transcription}\n\n${message}`.trim();
        } else {
          userContent += '\n[음성 파일을 전사하지 못했습니다]';
        }
      } catch (error) {
        console.error('Audio transcription error:', error);
        userContent += '\n[음성 파일 처리 중 오류가 발생했습니다]';
      }
    }

    if (!userContent.trim()) {
      return NextResponse.json(
        { error: 'Message or audio file is required' },
        { status: 400 }
      );
    }

    // ChatGPT API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 또는 'gpt-3.5-turbo'
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 
      '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';

    return NextResponse.json({
      response,
      transcription: audioFile ? userContent : null,
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    // OpenAI API 에러 처리
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API 오류: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// GET 요청으로 챗봇 상태 확인
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // OpenAI API 키 확인
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    return NextResponse.json({
      status: 'ready',
      hasApiKey,
      features: {
        textChat: hasApiKey,
        audioTranscription: hasApiKey,
        voiceRecording: true, // 브라우저 기능
      },
    });
  } catch (error) {
    console.error('AI Chat Status Error:', error);
    return NextResponse.json(
      { error: 'Failed to check AI service status' },
      { status: 500 }
    );
  }
}