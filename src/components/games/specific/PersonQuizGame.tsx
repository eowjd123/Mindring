"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, RotateCcw, Trophy, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- Types ---
interface PersonQuizGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface QuizQuestion {
  id: number;
  type: "person" | "object";
  question: string;
  answer: string;
  options: string[]; // 4 options
  imageUrl: string;
}

interface LevelConfig {
  level: number;
  timeLimit: number; // Seconds per question
  scoreMultiplier: number;
}

// --- Constants ---
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, timeLimit: 20, scoreMultiplier: 1 },
  2: { level: 2, timeLimit: 15, scoreMultiplier: 1.2 },
  3: { level: 3, timeLimit: 12, scoreMultiplier: 1.5 },
  4: { level: 4, timeLimit: 10, scoreMultiplier: 2 },
  5: { level: 5, timeLimit: 5, scoreMultiplier: 3 },
};

// Sample Data with Placeholders
// In a real app, these would be real image URLs
const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 1,
    type: "person",
    question: "이 위인은 누구일까요?",
    answer: "세종대왕",
    options: ["세종대왕", "이순신", "정조", "영조"],
    imageUrl: "https://placehold.co/600x400/orange/white?text=Sejong+the+Great", // Placeholder
  },
  {
    id: 2,
    type: "object",
    question: "이 음식은 무엇일까요?",
    answer: "비빔밥",
    options: ["비빔밥", "김치찌개", "된장찌개", "불고기"],
    imageUrl: "https://placehold.co/600x400/red/white?text=Bibimbap", // Placeholder
  },
  {
    id: 3,
    type: "person",
    question: "이 위인은 누구일까요?",
    answer: "이순신",
    options: ["강감찬", "이순신", "권율", "을지문덕"],
    imageUrl: "https://placehold.co/600x400/blue/white?text=Yi+Sun-sin", // Placeholder
  },
  {
    id: 4,
    type: "object",
    question: "이것은 무엇일까요?",
    answer: "한복",
    options: ["기모노", "한복", "양복", "치파오"],
    imageUrl: "https://placehold.co/600x400/pink/white?text=Hanbok", // Placeholder
  },
  {
    id: 5,
    type: "object",
    question: "이것은 무엇일까요?",
    answer: "경복궁",
    options: ["창덕궁", "경복궁", "덕수궁", "창경궁"],
    imageUrl: "https://placehold.co/600x400/green/white?text=Gyeongbokgung", // Placeholder
  },
    {
    id: 6,
    type: "person",
    question: "이 위인은 누구일까요?",
    answer: "신사임당",
    options: ["유관순", "신사임당", "허난설헌", "선덕여왕"],
    imageUrl: "https://placehold.co/600x400/yellow/black?text=Shin+Saimdang", // Placeholder
  },
  {
    id: 7,
    type: "object",
    question: "이 악기는 무엇일까요?",
    answer: "가야금",
    options: ["거문고", "해금", "가야금", "아쟁"],
    imageUrl: "https://placehold.co/600x400/brown/white?text=Gayageum", // Placeholder
  },
  {
    id: 8,
    type: "object",
    question: "이 꽃은 무엇일까요?",
    answer: "무궁화",
    options: ["진달래", "개나리", "무궁화", "벚꽃"],
    imageUrl: "https://placehold.co/600x400/purple/white?text=Mugunghwa", // Placeholder
  },
    {
    id: 9,
    type: "person",
    question: "이 위인은 누구일까요?",
    answer: "김구",
    options: ["안중근", "윤봉길", "이봉창", "김구"],
    imageUrl: "https://placehold.co/600x400/gray/white?text=Kim+Gu", // Placeholder
  },
  {
    id: 10,
    type: "object",
    question: "이 탈은 무엇일까요?",
    answer: "하회탈",
    options: ["각시탈", "하회탈", "봉산탈", "사자탈"],
    imageUrl: "https://placehold.co/600x400/black/white?text=Hahoe+Tal", // Placeholder
  },
];

const TOTAL_QUESTIONS = 10;

// --- Main Component ---
export function PersonQuizGame({ gameId: _gameId = "person-quiz" }: PersonQuizGameProps) {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);


  const handleAnswer = React.useCallback((answer: string | null) => {
    if (selectedAnswer !== null) return;

    const currentQ = questions[currentIndex];
    const correct = answer === currentQ.answer;

    setSelectedAnswer(answer || "TIME_UP");
    setSelectedAnswer(answer || "TIME_UP");
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 10 * LEVEL_CONFIGS[level].scoreMultiplier);
    }

    // Delay next question
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setTimeLeft(LEVEL_CONFIGS[level].timeLimit);
      } else {
        setGameState("result");
      }
    }, 1500);
  }, [questions, currentIndex, level, selectedAnswer]);

  // Create a ref to access the latest handleAnswer without dependency cycles in useEffect
  const handleAnswerRef = React.useRef(handleAnswer);
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0 && selectedAnswer === null) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAnswerRef.current(null); // Time up -> Wrong
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft, selectedAnswer]);
  const startGame = (selectedLevel: number) => {
    setLevel(selectedLevel);
    
    // Shuffle questions
    const shuffled = [...QUIZ_DATA].sort(() => Math.random() - 0.5);
    // Shuffle options for each question
    const preparedQuestions = shuffled.slice(0, TOTAL_QUESTIONS).map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));

    setQuestions(preparedQuestions);
    setCurrentIndex(0);
    setScore(0);
    
    // Set time limits
    const config = LEVEL_CONFIGS[selectedLevel];
    setTimeLeft(config.timeLimit);
    
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameState("playing");
  };

  const handleRestart = () => {
    setGameState("intro");
  };



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
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">인물 맞추기</h1>
            <p className="text-indigo-100 text-lg md:text-xl font-medium">사진을 보고 누구인지, 무엇인지 맞춰보세요!</p>
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
                    className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-purple-600 text-white shadow-lg hover:bg-purple-500 transition-all border-b-4 border-purple-800 active:border-b-0 active:translate-y-1"
                  >
                    <span className="text-2xl font-bold mb-1">{lvl}단계</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-8 border border-purple-100">
               <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📖</span>
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-purple-200 pb-1">게임 방법</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="bg-white p-2 rounded-lg text-2xl shadow-sm">🖼️</div>
                   <p className="text-gray-700 font-medium">사진이 제시됩니다.</p>
                </div>
                 <div className="flex items-center gap-4">
                   <div className="bg-white p-2 rounded-lg text-2xl shadow-sm">🧐</div>
                   <p className="text-gray-700 font-medium">사진 속 인물이나 사물이 무엇인지 맞추세요.</p>
                </div>
                 <div className="flex items-center gap-4">
                   <div className="bg-white p-2 rounded-lg text-2xl shadow-sm">⏱️</div>
                   <p className="text-gray-700 font-medium">빠르게 맞출수록 높은 점수!</p>
                </div>
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
          <p className="text-gray-500 mb-10 text-lg">모든 문제를 풀었습니다.</p>

          <div className="bg-indigo-50 p-8 rounded-2xl mb-10">
             <p className="text-indigo-600 font-bold uppercase tracking-wider mb-2">최종 점수</p>
             <p className="text-5xl font-black text-indigo-900">{Math.round(score)}점</p>
          </div>

          <div className="flex gap-4 justify-center">
             <button onClick={() => router.push('/services/cognitive')} className="px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button onClick={handleRestart} className="px-10 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg flex items-center gap-2">
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
           <h1 className="text-2xl font-bold text-indigo-900">인물 맞추기</h1>
           <div className="w-24"></div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div>
            <span className="text-gray-400 font-bold text-sm block">문제</span>
            <span className="text-xl font-bold text-gray-800">{currentIndex + 1} <span className="text-gray-400">/ {TOTAL_QUESTIONS}</span></span>
          </div>
           <div>
            <span className="text-gray-400 font-bold text-sm block text-center">점수</span>
            <span className="text-xl font-bold text-indigo-600 block text-center">{Math.round(score)}</span>
          </div>
           <div className="text-right">
            <span className="text-gray-400 font-bold text-sm block flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> 시간</span>
            <span className={`text-xl font-bold font-mono ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>{timeLeft}초</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 p-1">
          <div className="aspect-video bg-gray-100 relative rounded-2xl overflow-hidden">
             {/* Use placeholder image for now - in real app, remove 'unoptimized' if using internal images */}
             <Image 
               src={currentQ.imageUrl} 
               alt="Quiz Image"
               fill
               className="object-cover"
               unoptimized 
             />
          </div>
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">{currentQ.question}</h2>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((option, idx) => {
             let statusClass = "bg-white border-2 border-purple-100 text-gray-600 hover:border-purple-300 hover:bg-purple-50";
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
                   p-5 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-2
                   ${statusClass}
                 `}
               >
                 {option}
                 {selectedAnswer && option === currentQ.answer && <CheckCircle className="w-5 h-5" />}
                 {selectedAnswer && option === selectedAnswer && option !== currentQ.answer && <XCircle className="w-5 h-5" />}
               </motion.button>
             );
          })}
        </div>
        <div className="mt-8 text-center text-gray-400 text-xs">
          <button onClick={() => handleAnswer(null)} className="hover:text-gray-600 transition-colors">
            그만하기
          </button>
        </div>

      </div>
    </div>
  );
}
