"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Award } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---

interface SameMatchGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface GridItem {
  id: number;
  content: string | null; // Emoji or null if empty
  isTarget: boolean;
  isVisible: boolean;
  key: number; // To trigger re-animations
}

interface LevelConfig {
  level: number;
  gridSize: number; // 3 means 3x3
  targetCount: number; // How many distinct items pool
  spawnRate: number; // ms between spawns
  despawnRate: number; // ms before item disappears
  timeLimit: number;
}

// --- Constants ---

const TARGET_EMOJIS = ["🍎", "🍌", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝"];
const DISTRACTOR_EMOJIS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🚗", "🚕", "🚙", "🚌", "🚑"];

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, gridSize: 3, targetCount: 1, spawnRate: 2500, despawnRate: 3500, timeLimit: 30 },
  2: { level: 2, gridSize: 3, targetCount: 1, spawnRate: 2000, despawnRate: 3000, timeLimit: 40 },
  3: { level: 3, gridSize: 4, targetCount: 1, spawnRate: 1500, despawnRate: 2500, timeLimit: 50 },
  4: { level: 4, gridSize: 4, targetCount: 1, spawnRate: 1200, despawnRate: 2000, timeLimit: 60 },
  5: { level: 5, gridSize: 5, targetCount: 1, spawnRate: 1000, despawnRate: 1500, timeLimit: 60 },
};

// --- Main Component ---

export function SameMatchGame({ gameId: _gameId = "same-match" }: SameMatchGameProps) {
  const router = useRouter();
  
  // Game State
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [targetEmoji, setTargetEmoji] = useState("");
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Refs for intervals to clear them properly
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Level
  const startGame = (level: number) => {
    setCurrentLevel(level);
    const config = LEVEL_CONFIGS[level];
    
    // Pick random target
    const randomTarget = TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)];
    setTargetEmoji(randomTarget);
    
    // Init Grid
    const size = config.gridSize * config.gridSize;
    const initialGrid = Array.from({ length: size }, (_, i) => ({
      id: i,
      content: null,
      isTarget: false,
      isVisible: false,
      key: 0,
    }));
    setGridItems(initialGrid);

    setScore(0);
    setTimeLeft(config.timeLimit);
    setFeedback(null);
    setGameState("playing");
  };

  // Game Loop (Timer)
  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      gameLoopRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("result");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, timeLeft]);

  // Spawning Logic
  useEffect(() => {
    if (gameState !== "playing") return;

    const config = LEVEL_CONFIGS[currentLevel];

    const spawnItem = () => {
      setGridItems((prev) => {
        // Find empty slots
        const emptySlots = prev.filter(item => !item.isVisible);
        if (emptySlots.length === 0) return prev;

        // Pick random slot
        const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        
        // Decide if target or distractor (40% chance of target)
        const isTarget = Math.random() < 0.4;
        const content = isTarget 
          ? targetEmoji 
          : DISTRACTOR_EMOJIS[Math.floor(Math.random() * DISTRACTOR_EMOJIS.length)];

        // Update grid
        return prev.map(item => 
          item.id === randomSlot.id 
            ? { ...item, content, isTarget, isVisible: true, key: item.key + 1 } 
            : item
        );
      });

      // Schedule despawn for this specific spawn event (simplified: we accept that multiple updates might overlap, 
      // but for this simple game, managing individual timeouts per item is better done by the item itself or a centralized manager.
      // For React simplicity, we'll let the item component handle its own timeout or just clear it here after delay?
      // Actually, updating state in timeout is tricky with closures. 
      // Let's rely on a global effect that cleans up "old" items? 
      // Better: The spawn function returns a cleanup via setTimeout.
    };

    spawnIntervalRef.current = setInterval(spawnItem, config.spawnRate);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [gameState, currentLevel, targetEmoji]);

  // Handle auto-hiding items
  const handleDespawn = (id: number) => {
    setGridItems(prev => prev.map(i => i.id === id ? { ...i, isVisible: false, content: null } : i));
  };

  const handleRestart = () => {
    setGameState("intro");
  };

  const handleItemClick = (index: number, isTarget: boolean, content: string | null) => {
    if (gameState !== "playing" || !content) return;

    if (isTarget) {
      // Success
      setScore(prev => prev + 10);
      setGridItems(prev => prev.map(item => item.id === index ? { ...item, isVisible: false, content: null } : item));
    } else {
      // Fail
      setFeedback("조심하세요! 목표 그림이 아닙니다.");
      setTimeout(() => setFeedback(null), 1000);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

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
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">같은 그림 터치하기</h1>
            <p className="text-indigo-100 text-lg">화면에 나타나는 그림 중 목표 그림만 빠르게 터치하세요!</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.button
                    key={level}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(level)}
                    className="flex flex-col items-center justify-center w-24 h-24 rounded-xl bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                  >
                    <span className="text-2xl font-bold mb-1">{level}단계</span>
                    <span className="text-xs text-slate-300 opacity-80">
                      {LEVEL_CONFIGS[level].gridSize}x{LEVEL_CONFIGS[level].gridSize}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📖</span>
                <h3 className="text-xl font-bold text-gray-800">게임 방법</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4 text-2xl">🎯</div>
                  <h4 className="font-bold text-gray-900 mb-2">1. 목표 확인</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">상단에 표시된 목표 과일을 확인하세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-2xl">👆</div>
                  <h4 className="font-bold text-gray-900 mb-2">2. 터치하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">화면에 목표 과일이 나타나면 빠르게 터치하세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">⚠️</div>
                  <h4 className="font-bold text-gray-900 mb-2">3. 주의하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">다른 과일을 누르면 점수가 깎입니다!</p>
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
               <p className="text-purple-600 text-sm font-semibold mb-1">난이도</p>
               <p className="text-3xl font-bold text-purple-900">{currentLevel}단계</p>
             </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push('/services/cognitive')} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button onClick={handleRestart} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> 다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing Screen
  const config = LEVEL_CONFIGS[currentLevel];
  const gridClass = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[config.gridSize];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <button onClick={handleRestart} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium">
             <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">그만하기</span>
           </button>
           <h1 className="text-2xl font-bold text-gray-900">같은 그림 터치하기</h1>
           <div className="w-20"></div> {/* Spacer */}
        </div>
        
        {/* Target Display */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
          <div className="text-center">
            <p className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wide">목표</p>
            <div className="flex items-center gap-4">
               <span className="text-6xl animate-bounce">{targetEmoji}</span>
               <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900">만 터치하세요!</h2>
                  <p className="text-indigo-500 font-medium">다른 그림은 안돼요</p>
               </div>
            </div>
          </div>
          
          <div className="flex w-full mt-6 pt-6 border-t border-gray-100 justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Time</p>
              <p className={`text-2xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500' : 'text-gray-900'}`}>{timeLeft}s</p>
            </div>
            
            {/* Feedback Message */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap"
                >
                  {feedback}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Score</p>
              <p className="text-2xl font-bold text-indigo-600">{score}</p>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className={`grid ${gridClass} gap-3 md:gap-4 w-full aspect-square bg-gray-200 p-4 rounded-2xl shadow-inner`}>
          {gridItems.map((item) => (
            <div key={item.id} className="relative w-full h-full bg-gray-300/50 rounded-2xl">
              <GridItemComp 
                item={item} 
                config={config} 
                onClick={() => handleItemClick(item.id, item.isTarget, item.content)}
                onDespawn={() => handleDespawn(item.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-component for Grid Item to handle its own lifecycle
const GridItemComp = ({ 
  item, 
  config, 
  onClick, 
  onDespawn 
}: { 
  item: GridItem, 
  config: LevelConfig, 
  onClick: () => void, 
  onDespawn: () => void 
}) => {
  useEffect(() => {
    if (item.isVisible) {
      const timer = setTimeout(() => {
        onDespawn();
      }, config.despawnRate);
      return () => clearTimeout(timer);
    }
  }, [item.isVisible, item.key, config.despawnRate, onDespawn]);

  if (!item.isVisible || !item.content) return <div className="w-full h-full" />;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="w-full h-full bg-white rounded-2xl shadow-md border-2 border-indigo-100 flex items-center justify-center text-4xl md:text-5xl hover:bg-indigo-50 transition-colors"
    >
      {item.content}
    </motion.button>
  );
};
