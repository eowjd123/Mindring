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
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioFile?: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 디지털자서전 도우미입니다. 😊\n\n다음과 같은 도움을 드릴 수 있어요:\n\n• 글쓰기 도우미\n• 문장을 매끄럽게 다듬어 주고 문법, 오탈자 고쳐 줌\n• 음성 파일 업로드하면 텍스트로 전사해 줌\n\n어떤 도움이 필요하신가요?',
      timestamp: new Date()
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText || `[음성 파일: ${selectedFile?.name}]`,
      timestamp: new Date(),
      audioFile: selectedFile?.name
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedFile(null);
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', inputText);
      if (selectedFile) {
        formData.append('audioFile', selectedFile);
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an audio file
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
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
        id: '1',
        role: 'assistant',
        content: '안녕하세요! 디지털자서전 도우미입니다. 😊\n\n다음과 같은 도움을 드릴 수 있어요:\n\n• 글쓰기 도우미\n• 문장을 매끄럽게 다듬어 주고 문법, 오탈자 고쳐 줌\n• 음성 파일 업로드하면 텍스트로 전사해 줌\n\n어떤 도움이 필요하신가요?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Container */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-blue-500 p-2">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">디지털자서전 도우미</h1>
              <p className="text-sm text-gray-500">ChatGPT 기반 글쓰기 도우미</p>
            </div>
          </div>
          <button
            onClick={clearConversation}
            className="flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            대화 초기화
          </button>
        </div>

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
                <div className={`flex-shrink-0 rounded-full p-2 ${
                  message.role === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-green-500'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>
                
                <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border shadow-sm'
                }`}>
                  {message.audioFile && (
                    <div className="mb-2 flex items-center text-sm opacity-75">
                      <FileAudio className="mr-1 h-4 w-4" />
                      {message.audioFile}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`mt-2 text-xs opacity-75 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 rounded-full bg-green-500 p-2">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="max-w-2xl rounded-2xl border bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 delay-100"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 delay-200"></div>
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
          <div className="mx-6 mb-4 rounded-lg bg-red-50 p-4">
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
          <div className="mx-6 mb-4 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileAudio className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">{selectedFile.name}</span>
              </div>
              <button
                onClick={removeSelectedFile}
                className="text-blue-500 hover:text-blue-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-white px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  maxLength={2000}
                />
                <div className="mt-1 text-xs text-gray-500">
                  {inputText.length}/2000
                </div>
              </div>
              
              {/* File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-gray-100 p-3 hover:bg-gray-200"
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
                className={`rounded-full p-3 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title={isRecording ? "녹음 중지" : "음성 녹음"}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 text-white" />
                ) : (
                  <Mic className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && !selectedFile) || isLoading}
                className="rounded-full bg-blue-500 p-3 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
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