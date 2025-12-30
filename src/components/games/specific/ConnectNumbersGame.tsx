"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, RotateCcw, Timer, Award } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---

interface ConnectNumbersGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface Node {
  id: number;
  value: number;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  isConnected: boolean;
}

interface Line {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

interface LevelConfig {
  level: number;
  maxNumber: number;
  timeLimit: number;
}

// --- Constants ---

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, maxNumber: 10, timeLimit: 60 },
  2: { level: 2, maxNumber: 15, timeLimit: 90 },
  3: { level: 3, maxNumber: 20, timeLimit: 120 },
  4: { level: 4, maxNumber: 25, timeLimit: 150 },
  5: { level: 5, maxNumber: 30, timeLimit: 180 },
};

// --- Helper Functions ---

// Generate random scattered positions avoiding overlap
const generateNodes = (count: number): Node[] => {
  const nodes: Node[] = [];
  const minDistance = 15; // Minimum distance % between nodes to avoid overlap

  for (let i = 1; i <= count; i++) {
    let x, y, valid;
    let attempts = 0;
    
    do {
      valid = true;
      x = 5 + Math.random() * 90; // Padding 5%
      y = 10 + Math.random() * 80; // Padding 10% (more vertical padding for UI)

      for (const node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          valid = false;
          break;
        }
      }
      attempts++;
    } while (!valid && attempts < 100);

    nodes.push({
      id: i,
      value: i,
      x,
      y,
      isConnected: false,
    });
  }
  return nodes;
};

// --- Main Component ---

export function ConnectNumbersGame({ gameId: _gameId = "connect-numbers" }: ConnectNumbersGameProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Gamestate
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [feedback, setFeedback] = useState<string | null>(null);

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

  const startGame = (level: number) => {
    setCurrentLevel(level);
    const config = LEVEL_CONFIGS[level];
    setNodes(generateNodes(config.maxNumber));
    setLines([]);
    setNextNumber(1);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setFeedback(null);
    setGameState("playing");
  };

  const handleRestart = () => {
    setGameState("intro");
  };

  const handleNodeClick = (node: Node) => {
    if (gameState !== "playing") return;

    if (node.value === nextNumber) {
      // Correct Click
      setFeedback(null); // Clear any previous feedback
      setScore((prev) => prev + 10);
      
      // Update Node State
      setNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, isConnected: true } : n))
      );

      // Add Line if not first node
      if (node.value > 1) {
        const prevNode = nodes.find((n) => n.value === node.value - 1);
        if (prevNode) {
          setLines((prev) => [
            ...prev,
            {
              from: { x: prevNode.x, y: prevNode.y },
              to: { x: node.x, y: node.y },
            },
          ]);
        }
      }

      // Check Win
      if (node.value === LEVEL_CONFIGS[currentLevel].maxNumber) {
        setTimeout(() => setGameState("result"), 500);
      } else {
        setNextNumber((prev) => prev + 1);
      }
    } else {
      // Wrong Click
      setFeedback(`다음 숫자는 ${nextNumber}입니다!`);
      // Clear feedback after 2 seconds
      setTimeout(() => setFeedback(null), 2000);
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">숫자 이어주기</h1>
            <p className="text-indigo-100 text-lg">1부터 순서대로 숫자를 연결해보세요!</p>
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
                      1 ~ {LEVEL_CONFIGS[level].maxNumber}
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-xl font-bold text-blue-600">1 2</div>
                  <h4 className="font-bold text-gray-900 mb-2">1. 숫자 찾기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">화면에 흩어진 숫자들을 1부터 순서대로 찾으세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">👆</div>
                  <h4 className="font-bold text-gray-900 mb-2">2. 연결하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">숫자를 클릭하면 선이 연결됩니다. 순서가 틀리면 안 돼요!</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-2xl">⏱️</div>
                  <h4 className="font-bold text-gray-900 mb-2">3. 완성하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">마지막 숫자까지 모두 연결하면 성공입니다.</p>
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
          <p className="text-gray-500 mb-8">모든 숫자를 연결했습니다.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-indigo-50 p-4 rounded-xl">
               <p className="text-indigo-600 text-sm font-semibold mb-1">최종 점수</p>
               <p className="text-3xl font-bold text-indigo-900">{score}점</p>
             </div>
             <div className="bg-purple-50 p-4 rounded-xl">
               <p className="text-purple-600 text-sm font-semibold mb-1">남은 시간</p>
               <p className="text-3xl font-bold text-purple-900">{timeLeft}초</p>
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

  // Playing
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
         {/* Header */}
         <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <button onClick={handleRestart} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium">
             <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">그만하기</span>
           </button>
           <div className="flex items-center gap-8">
             <div className="flex flex-col items-center">
               <span className="text-xs text-gray-400 font-bold uppercase">Level {currentLevel}</span>
               <span className="text-sm font-bold text-gray-900">다음 숫자: <span className="text-indigo-600 text-xl">{nextNumber}</span></span>
             </div>
             <div className={`flex flex-col items-center ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                <span className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><Timer className="w-3 h-3"/> Time</span>
                <span className="text-2xl font-bold font-mono">{timeLeft}초</span>
             </div>
           </div>
           <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
             <Trophy className="w-5 h-5 text-yellow-600" />
             <span className="font-bold text-yellow-800">{score}</span>
           </div>
         </div>

         {/* Game Board */}
         <div 
           ref={containerRef}
           className="relative aspect-[4/3] bg-white rounded-2xl shadow-lg border-2 border-indigo-50 overflow-hidden"
         >
           {/* Feedback Overlay */}
           <AnimatePresence>
             {feedback && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-full font-bold shadow-lg backdrop-blur-sm pointer-events-none"
               >
                 {feedback}
               </motion.div>
             )}
           </AnimatePresence>

           {/* SVG Lines Layer */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
             {lines.map((line, idx) => (
               <motion.line
                 key={idx}
                 initial={{ pathLength: 0, opacity: 0 }}
                 animate={{ pathLength: 1, opacity: 1 }}
                 transition={{ duration: 0.3 }}
                 x1={`${line.from.x}%`}
                 y1={`${line.from.y}%`}
                 x2={`${line.to.x}%`}
                 y2={`${line.to.y}%`}
                 stroke="#4F46E5"
                 strokeWidth="4"
                 strokeLinecap="round"
               />
             ))}
           </svg>

           {/* Nodes */}
           {nodes.map((node) => (
             <motion.button
               key={node.id}
               layout
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => handleNodeClick(node)}
               className={`
                 absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 flex items-center justify-center font-bold text-lg shadow-sm z-10 transition-colors
                 ${node.isConnected 
                   ? "bg-indigo-600 text-white border-indigo-600" 
                   : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                 }
                 ${node.value === nextNumber && !node.isConnected ? "ring-4 ring-indigo-200 ring-opacity-50 animate-pulse" : ""}
               `}
               style={{ left: `${node.x}%`, top: `${node.y}%` }}
             >
               {node.value}
             </motion.button>
           ))}
         </div>
      </div>
    </div>
  );
}
