"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Timer, Trophy, RotateCcw, Award } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---

interface FindDifferenceGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";
type ItemType = "emoji" | "number" | "hangul";

interface GameItem {
  id: string;
  content: string;
  isTarget: boolean; // True if this is the "Odd One Out"
}

interface LevelConfig {
  level: number;
  gridSize: number; // 2 -> 2x2, 3 -> 3x3
  timeLimit: number; // seconds
}

// --- Constants & Data ---

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, gridSize: 2, timeLimit: 60 },
  2: { level: 2, gridSize: 3, timeLimit: 60 },
  3: { level: 3, gridSize: 4, timeLimit: 45 },
  4: { level: 4, gridSize: 5, timeLimit: 45 },
  5: { level: 5, gridSize: 6, timeLimit: 30 },
};

const GRID_COLS_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

// Data sets for generation
const EMOJI_PAIRS = [
  ["😀", "😃"], ["😄", "😆"], ["🦁", "🐯"], ["🍎", "🍅"], ["🍊", "🍑"],
  ["🍪", "🍘"], ["🚗", "🚕"], ["❤️", "🧡"], ["🕐", "🕑"], ["🌚", "🌑"],
  ["🐶", "🐕"], ["🐱", "🐈"], ["🐭", "🐹"], ["🐰", "🐇"], ["🦊", "🐺"],
  ["🐻", "🐼"], ["🐨", "🐻‍❄️"], ["🐯", "🦁"], ["🐮", "🐄"], ["🐷", "🐖"],
];

const NUMBER_PAIRS = [
  ["6", "9"], ["1", "7"], ["2", "5"], ["3", "8"], ["0", "8"],
  ["5", "S"], ["1", "I"], ["0", "O"], ["8", "B"], ["2", "Z"],
];

const HANGUL_PAIRS = [
  ["가", "거"], ["나", "너"], ["다", "더"], ["라", "러"], ["마", "머"],
  ["바", "버"], ["사", "서"], ["아", "어"], ["자", "저"], ["차", "처"],
  ["하", "허"], ["고", "구"], ["노", "누"], ["도", "두"], ["로", "루"],
];


// --- Helper Functions ---

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateLevelData = (level: number): { items: GameItem[], type: ItemType } => {
  const config = LEVEL_CONFIGS[level];
  const totalItems = config.gridSize * config.gridSize;
  const targetIndex = Math.floor(Math.random() * totalItems);
  
  // Randomly choose type
  const typeRoll = Math.random();
  let selectedPair: string[];
  let type: ItemType;

  if (typeRoll < 0.33) {
    type = "emoji";
    selectedPair = getRandomItem(EMOJI_PAIRS);
  } else if (typeRoll < 0.66) {
    type = "number";
    selectedPair = getRandomItem(NUMBER_PAIRS);
  } else {
    type = "hangul";
    selectedPair = getRandomItem(HANGUL_PAIRS);
  }

  // Randomize which is target and which is base
  const isSwap = Math.random() > 0.5;
  const baseContent = isSwap ? selectedPair[0] : selectedPair[1];
  const targetContent = isSwap ? selectedPair[1] : selectedPair[0];

  const items: GameItem[] = Array.from({ length: totalItems }).map((_, index) => ({
    id: `item-${index}`,
    content: index === targetIndex ? targetContent : baseContent,
    isTarget: index === targetIndex,
  }));

  return { items, type };
};


// --- Main Component ---

export function FindDifferenceGame({ gameId: _gameId = "find-difference" }: FindDifferenceGameProps) {
  const router = useRouter();
  
  // State
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [round, setRound] = useState(1); // Track rounds within a level if needed, or just refresh
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentItems, setCurrentItems] = useState<GameItem[]>([]);
  const [currentType, setCurrentType] = useState<ItemType>("emoji");
  const [isWrong, setIsWrong] = useState(false); // Visual feedback

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("result");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  // Initial Data Load
  const startLevel = useCallback((level: number) => {
    setCurrentLevel(level);
    setTimeLeft(LEVEL_CONFIGS[level].timeLimit);
    setScore(0);
    setRound(1);
    
    // Generate First Round Data
    const { items, type } = generateLevelData(level);
    setCurrentItems(items);
    setCurrentType(type);
    
    setGameState("playing");
  }, []);

  const handleLevelSelect = (level: number) => {
    startLevel(level);
  };

  const handleItemClick = (item: GameItem) => {
    if (gameState !== "playing") return;

    if (item.isTarget) {
      // Correct!
      // Provide sound/visual feedback if configured
      
      setScore(prev => prev + 10);
      setRound(prev => prev + 1);

      // Generate Next Round Data
      // Slight delay for visual confirmation could be added here
      const { items, type } = generateLevelData(currentLevel);
      setCurrentItems(items);
      setCurrentType(type);
    } else {
      // Wrong!
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500);
      setTimeLeft(prev => Math.max(0, prev - 3)); // Penalty
    }
  };

  const handleRestart = () => {
    setGameState("intro");
  };

  // --- Renders ---

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-4xl mx-auto p-6">
        <div className="w-full mb-6 flex justify-start">
          <button
            onClick={() => router.push('/services/cognitive')}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>게임 목록으로 돌아가기</span>
          </button>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">다른 그림 찾기</h1>
            <p className="text-indigo-100 text-lg">나머지와 다른 하나의 그림을 찾아보세요!</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {/* Difficulty Selection */}
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.button
                    key={level}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleLevelSelect(level)}
                    className="flex flex-col items-center justify-center w-24 h-24 rounded-xl bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                  >
                    <span className="text-2xl font-bold mb-1">{level}단계</span>
                    <span className="text-xs text-slate-300 opacity-80">
                      {LEVEL_CONFIGS[level].gridSize} x {LEVEL_CONFIGS[level].gridSize}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                 <span className="text-2xl">📖</span>
                 <h3 className="text-xl font-bold text-gray-800">게임 방법</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-2xl">👀</div>
                  <h4 className="font-bold text-gray-900 mb-2">1. 관찰하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">화면에 있는 여러 그림들을 자세히 살펴보세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">🤔</div>
                  <h4 className="font-bold text-gray-900 mb-2">2. 찾아내기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">모양이나 글자가 <span className="text-indigo-600 font-bold">하나만 다른 것</span>을 찾으세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-2xl">👆</div>
                  <h4 className="font-bold text-gray-900 mb-2">3. 선택하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">다른 그림을 클릭하면 다음 라운드로 넘어갑니다.</p>
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
       <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-2xl mx-auto p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-center p-10"
        >
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Award className="w-24 h-24 text-yellow-500" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-dashed border-yellow-200 rounded-full"
              />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">게임 종료!</h2>
          <p className="text-gray-500 mb-8">모든 시간이 지났습니다.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-indigo-50 p-4 rounded-xl">
               <p className="text-indigo-600 text-sm font-semibold mb-1">최종 점수</p>
               <p className="text-3xl font-bold text-indigo-900">{score}점</p>
             </div>
             <div className="bg-purple-50 p-4 rounded-xl">
               <p className="text-purple-600 text-sm font-semibold mb-1">달성 라운드</p>
               <p className="text-3xl font-bold text-purple-900">{round}R</p>
             </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/services/cognitive')}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              목록으로
            </button>
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game Playing Screen
  const gridSize = LEVEL_CONFIGS[currentLevel].gridSize;
  const gridColsClass = GRID_COLS_CLASS[gridSize] || "grid-cols-2";
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <button 
             onClick={handleRestart}
             className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
           >
             <ArrowLeft className="w-5 h-5" />
             <span className="hidden sm:inline">그만하기</span>
           </button>

           <div className="flex items-center gap-8">
             <div className="flex flex-col items-center">
               <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Level</span>
               <span className="text-xl font-bold text-gray-900">{currentLevel} <span className="text-sm text-gray-400 font-normal">({round}R)</span></span>
             </div>
             
             <div className="w-px h-8 bg-gray-200"></div>

             <div className={`flex flex-col items-center ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Time
                </span>
                <span className="text-2xl font-bold font-mono">{timeLeft}초</span>
             </div>
           </div>

           <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
             <Trophy className="w-5 h-5 text-yellow-600" />
             <span className="font-bold text-yellow-800">{score}</span>
           </div>
        </div>

        {/* Game Grid Box */}
        <motion.div 
           className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 ${isWrong ? 'border-red-400 shake-animation' : 'border-indigo-100'}`}
           animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
           transition={{ duration: 0.4 }}
        >
          {/* Grid */}
          <div 
            className={`grid gap-3 md:gap-4 w-full aspect-square max-h-[600px] mx-auto ${gridColsClass}`}
          >
            <AnimatePresence mode="popLayout">
              {currentItems.map((item) => (
                <motion.button
                  key={item.id} // Ensure keys are unique across rounds if possible, or accept re-mount
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleItemClick(item)}
                  className={`
                    relative flex items-center justify-center rounded-xl md:rounded-2xl shadow-sm border border-gray-100
                    hover:shadow-md transition-all
                    ${currentType === "hangul" || currentType === "number" ? 'bg-indigo-50 text-indigo-900' : 'bg-white'}
                  `}
                >
                  <span 
                    className={`
                      leading-none select-none
                      ${currentType === "emoji" ? (gridSize >= 5 ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl') : ''}
                      ${(currentType === "hangul" || currentType === "number") ? (gridSize >= 5 ? 'text-3xl md:text-5xl font-bold' : 'text-4xl md:text-6xl font-black') : ''}
                    `}
                  >
                    {item.content}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
        
        <p className="text-center text-gray-400 mt-6 text-sm">
           하나만 다른 그림을 빠르게 찾아보세요!
        </p>
      </div>
    </div>
  );
}
