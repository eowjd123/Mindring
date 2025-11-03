// app/dashboard/ai/page.tsx
'use client';

import {
  AlertCircle,
  Bot,
  FileAudio,
  Mic,
  MicOff,
  Paperclip,
  RefreshCw,
  Send,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string
  audioFile?: string;
}

export default function AIChatPage() {
  // 초기 메시지는 클라이언트 마운트 시 주입(Hydration-safe)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const makeId = () =>
    (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

  const nowISO = () => new Date().toISOString();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content:
          '안녕하세요! 디지털자서전 도우미입니다. 😊\n\n다음과 같은 도움을 드릴 수 있어요:\n\n• 글쓰기 도우미\n• 문장을 매끄럽게 다듬어 주고 문법, 오탈자 고쳐 줌\n• 음성 파일 업로드하면 텍스트로 전사해 줌\n\n어떤 도움이 필요하신가요?',
        timestamp: nowISO(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content: inputText || (selectedFile ? `[음성 파일: ${selectedFile.name}]` : ''),
      timestamp: nowISO(),
      audioFile: selectedFile?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', userMessage.content);
      if (selectedFile) formData.append('audioFile', selectedFile);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // 서버에서 상세 메시지를 보내면 먼저 활용
        const maybeJson = await response.json().catch(() => null as unknown);
        const serverMsg =
          (maybeJson && typeof maybeJson === 'object' && 'error' in maybeJson
            ? (maybeJson as { error: string }).error
            : '') || `HTTP error! status: ${response.status}`;
        throw new Error(serverMsg);
      }

      const data: { response: string; transcription?: string | null } =
        await response.json();

      const assistantMessage: Message = {
        id: makeId(),
        role: 'assistant',
        content: data.response,
        timestamp: nowISO(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);

      const errMsg =
        err instanceof Error
          ? err.message
          : '메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.';

      setError(errMsg);

      const errorMessage: Message = {
        id: makeId(),
        role: 'assistant',
        content:
          errMsg.includes('Authentication required') || errMsg.includes('401')
            ? '로그인이 필요합니다. 다시 로그인해 주세요.'
            : errMsg,
        timestamp: nowISO(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('음성 파일만 업로드 가능합니다.');
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setSelectedFile(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('음성 녹음을 시작할 수 없습니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content:
          '안녕하세요! 디지털자서전 도우미입니다. 😊\n\n다음과 같은 도움을 드릴 수 있어요:\n\n• 글쓰기 도우미\n• 문장을 매끄럽게 다듬어 주고 문법, 오탈자 고쳐 줌\n• 음성 파일 업로드하면 텍스트로 전사해 줌\n\n어떤 도움이 필요하신가요?',
        timestamp: nowISO(),
      },
    ]);
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header - Main page style */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-3">
                <Bot className="h-6 w-6 text-teal-500" />
                AI 도우미
              </h2>
              <p className="text-gray-600 mt-1">ChatGPT 기반 글쓰기 도우미</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={clearConversation}
                className="flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                대화 초기화
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col h-[calc(100vh-120px)]">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 rounded-full p-2 ${
                    message.role === 'user' ? 'bg-teal-500' : 'bg-teal-400'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>

                <div
                  className={`max-w-2xl rounded-3xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-teal-500 text-white'
                      : 'bg-white border border-gray-200 shadow-lg'
                  }`}
                >
                  {message.audioFile && (
                    <div className="mb-2 flex items-center text-sm opacity-75">
                      <FileAudio className="mr-1 h-4 w-4" />
                      {message.audioFile}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`mt-2 text-xs opacity-75 ${
                      message.role === 'user' ? 'text-teal-100' : 'text-gray-500'
                    }`}
                  >
                    <time suppressHydrationWarning>
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 rounded-full bg-teal-400 p-2">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="max-w-2xl rounded-3xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-teal-400"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-teal-400 delay-100"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-teal-400 delay-200"></div>
                    <span className="text-sm text-gray-500">답변을 생성하고 있습니다...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 rounded-3xl bg-red-50 p-4 border border-red-200 shadow-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected File */}
        {selectedFile && (
          <div className="mx-6 mb-4 rounded-3xl bg-teal-50 p-4 border border-teal-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileAudio className="mr-2 h-5 w-5 text-teal-500" />
                <span className="text-sm text-teal-700">{selectedFile.name}</span>
              </div>
              <button onClick={removeSelectedFile} className="text-teal-500 hover:text-teal-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  className="w-full resize-none rounded-2xl border-2 border-gray-300 px-4 py-3 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                  rows={3}
                  maxLength={2000}
                />
                <div className="mt-1 text-xs text-gray-500">{inputText.length}/2000</div>
              </div>

              {/* File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-gray-100 p-3 hover:bg-gray-200 transition-colors"
                title="음성 파일 업로드"
              >
                <Paperclip className="h-5 w-5 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Voice Recording */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`rounded-full p-3 transition-colors ${
                  isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title={isRecording ? '녹음 중지' : '음성 녹음'}
              >
                {isRecording ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-gray-600" />}
              </button>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && !selectedFile) || isLoading}
                className="rounded-full bg-teal-600 hover:bg-teal-700 p-3 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 transition-all duration-200"
                title="전송"
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
