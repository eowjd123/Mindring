"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, RotateCcw, Trophy, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---
interface TimeQuizGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface QuizQuestion {
  id: number;
  question: string;
  answer: string;
  options: string[];
}

interface LevelConfig {
  level: number;
  timeLimit: number; // Seconds per question
  scoreMultiplier: number;
  optionCount: number; // Number of choices
}

// --- Constants ---
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, timeLimit: 20, scoreMultiplier: 1, optionCount: 3 },
  2: { level: 2, timeLimit: 18, scoreMultiplier: 1.2, optionCount: 4 },
  3: { level: 3, timeLimit: 15, scoreMultiplier: 1.5, optionCount: 4 },
  4: { level: 4, timeLimit: 12, scoreMultiplier: 2, optionCount: 5 },
  5: { level: 5, timeLimit: 10, scoreMultiplier: 3, optionCount: 6 },
};

const SEASONS = ["봄", "여름", "가을", "겨울"];
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// --- Logic Helpers ---

const getSeason = (month: number): string => {
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const generateOptions = (answer: string, type: 'year' | 'month' | 'day' | 'weekday' | 'season' | 'ampm', count: number): string[] => {
  const options = new Set<string>();
  options.add(answer);

  while (options.size < count) {
    let wrong: string = "";
    if (type === 'year') {
      const currentYear = parseInt(answer.replace("년", ""));
      wrong = `${currentYear + getRandomInt(-10, 10)}년`;
    } else if (type === 'month') {
      wrong = `${getRandomInt(1, 12)}월`;
    } else if (type === 'day') {
      wrong = `${getRandomInt(1, 31)}일`;
    } else if (type === 'weekday') {
      wrong = WEEKDAYS[getRandomInt(0, 6)];
    } else if (type === 'season') {
      wrong = SEASONS[getRandomInt(0, 3)];
    } else if (type === 'ampm') {
      wrong = answer === "오전" ? "오후" : "오전";
      // If count > 2 for ampm, we can't really add more valid options. 
      // But for this game, AM/PM is usually binary. 
      // We will handle this edge case in generation or just repetition won't happen due to Set, 
      // but loop might stick if we want 3 options for binary.
      // So for AM/PM, force count to 2 max.
      if (options.has("오전") && options.has("오후")) break; 
    }
    
    if (wrong && !options.has(wrong)) {
      options.add(wrong);
    }
  }

  return shuffleArray(Array.from(options));
};

// --- Main Component ---
export function TimeQuizGame({ gameId: _gameId = "time-quiz" }: TimeQuizGameProps) {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const startGame = (selectedLevel: number) => {
    setLevel(selectedLevel);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-11 -> 1-12
    const currentDay = now.getDate();
    const currentWeekday = WEEKDAYS[now.getDay()];
    const currentSeason = getSeason(currentMonth);
    const isAm = now.getHours() < 12;

    const config = LEVEL_CONFIGS[selectedLevel];
    
    // Generate Questions based on current time
    // We want 5 distinct questions
    const pool: QuizQuestion[] = [
      {
        id: 1,
        question: "지금은 몇 년도인가요?",
        answer: `${currentYear}년`,
        options: generateOptions(`${currentYear}년`, 'year', config.optionCount),
      },
      {
        id: 2,
        question: "지금은 몇 월인가요?",
        answer: `${currentMonth}월`,
        options: generateOptions(`${currentMonth}월`, 'month', config.optionCount),
      },
      {
        id: 3,
        question: "오늘은 며칠인가요?",
        answer: `${currentDay}일`,
        options: generateOptions(`${currentDay}일`, 'day', config.optionCount),
      },
      {
        id: 4,
        question: "오늘은 무슨 요일인가요?",
        answer: currentWeekday,
        options: generateOptions(currentWeekday, 'weekday', config.optionCount),
      },
      {
        id: 5,
        question: "지금은 어떤 계절인가요?",
        answer: currentSeason,
        options: generateOptions(currentSeason, 'season', Math.min(4, config.optionCount)), 
      },
      {
        id: 6,
        question: "지금은 오전인가요, 오후인가요?",
        answer: isAm ? "오전" : "오후",
        options: ["오전", "오후"], 
      }
    ];

    // Shuffle pool? No, strict order is good.
    
    setQuestions(pool);
    setCurrentIndex(0);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setSelectedAnswer(null);
    setGameState("playing");
  };

  const handleRestart = () => {
    setGameState("intro");
  };

  const handleAnswer = useCallback((answer: string | null) => {
    if (selectedAnswer !== null) return;

    const currentQ = questions[currentIndex];
    const correct = answer === currentQ.answer;

    setSelectedAnswer(answer || "TIME_UP");

    if (correct) {
      setScore(prev => prev + 10 * LEVEL_CONFIGS[level].scoreMultiplier);
    }

    // Delay next
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setTimeLeft(LEVEL_CONFIGS[level].timeLimit);
      } else {
        setGameState("result");
      }
    }, 1500);
  }, [questions, currentIndex, level, selectedAnswer]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0 && selectedAnswer === null) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAnswer(null); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft, selectedAnswer, handleAnswer]);


  // --- Render ---

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-4xl mx-auto p-4 md:p-6">
        <div className="w-full mb-8 flex justify-start">
          <button
            onClick={() => router.push('/services/cognitive')}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>게임 목록으로 돌아가기</span>
          </button>
        </div>

        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-100">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-10 text-center relative overflow-hidden">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md relative z-10">날짜·시간 맞추기</h1>
            <p className="text-indigo-100 text-lg md:text-xl font-medium relative z-10">오늘의 날짜와 시간을 정확히 알고 있나요?</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <div className="text-center space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <motion.button
                    key={lvl}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(lvl)}
                    className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-indigo-500 text-white shadow-lg hover:bg-indigo-400 transition-all border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1"
                  >
                    <span className="text-2xl font-bold mb-1">{lvl}단계</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
               <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🧭</span>
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-200 pb-1">게임 방법</h3>
              </div>
              <ul className="space-y-4 text-gray-700 font-medium list-disc list-inside">
                <li>오늘 날짜, 요일, 계절, 연도, 오전/오후에 대한 질문이 나옵니다.</li>
                <li>정답이라고 생각되는 보기를 <span className="text-blue-600 font-bold">클릭</span>하세요.</li>
                <li>총 <span className="font-bold">5문제</span>가 출제됩니다.</li>
                <li>빠르고 정확하게 답할수록 높은 점수!</li>
              </ul>
              
              <div className="mt-6 pt-6 border-t border-blue-200 text-sm text-gray-600 bg-blue-100/50 p-4 rounded-xl">
                 <p className="font-bold mb-1 text-blue-800">💡 난이도별 차이:</p>
                 <ul className="list-disc list-inside space-y-1">
                   <li>1단계: 3지선다, 20초</li>
                   <li>3단계: 4지선다, 15초</li>
                   <li>5단계: 6지선다, 10초</li>
                 </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (gameState === "result") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-2xl mx-auto p-6">
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 text-center p-12"
        >
          <div className="mb-8 flex justify-center">
             <Trophy className="w-24 h-24 text-yellow-500 drop-shadow" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">게임 종료!</h2>
          <p className="text-gray-500 mb-10 text-lg">지남력 훈련을 완료했습니다.</p>

          <div className="bg-indigo-50 p-8 rounded-2xl mb-10">
             <p className="text-indigo-600 font-bold uppercase tracking-wider mb-2">최종 점수</p>
             <p className="text-5xl font-black text-indigo-900">{Math.round(score)}점</p>
          </div>

          <div className="flex gap-4 justify-center">
             <button onClick={() => router.push('/services/cognitive')} className="px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button onClick={handleRestart} className="px-10 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> 다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // Playing Screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
         {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <button onClick={handleRestart} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-200">
             <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">그만하기</span>
           </button>
           <h1 className="text-2xl font-bold text-indigo-900">날짜·시간 맞추기</h1>
           <div className="w-24"></div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6 px-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <span className="text-gray-400 font-bold text-sm block">문제</span>
            <span className="text-xl font-bold text-gray-800">{currentIndex + 1} <span className="text-gray-400">/ {questions.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
             <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
             <span className={`text-2xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>{timeLeft}초</span>
          </div>
           <div>
            <span className="text-gray-400 font-bold text-sm block text-center">점수</span>
            <span className="text-xl font-bold text-indigo-600 block text-center">{Math.round(score)}점</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl overflow-hidden border border-indigo-400 mb-8 p-8 text-center text-white relative">
           <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold leading-relaxed">{currentQ.question}</h2>
           </div>
        </div>

        {/* Options */}
        <div className={`grid gap-4 ${currentQ.options.length > 4 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {currentQ.options.map((option, idx) => {
             let statusClass = "bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50";
             if (selectedAnswer) {
               if (option === currentQ.answer) {
                 statusClass = "bg-green-50 border-2 border-green-500 text-green-700";
               } else if (option === selectedAnswer) {
                 statusClass = "bg-red-50 border-2 border-red-500 text-red-700";
               } else {
                 statusClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
               }
             }

             return (
               <motion.button
                 key={idx}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => handleAnswer(option)}
                 disabled={selectedAnswer !== null}
                 className={`
                   p-6 rounded-2xl font-bold text-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[5rem]
                   ${statusClass}
                 `}
               >
                 {option}
                 {selectedAnswer && option === currentQ.answer && <CheckCircle className="w-6 h-6" />}
                 {selectedAnswer && option === selectedAnswer && option !== currentQ.answer && <XCircle className="w-6 h-6" />}
               </motion.button>
             );
          })}
        </div>
      
      </div>
    </div>
  );
}
