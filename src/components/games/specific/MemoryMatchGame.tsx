"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

interface MemoryMatchGameProps {
  gameId?: string;
}

interface Card {
  id: string; // Emoji content
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string; // Unique ID for key
}

// Level Configuration
const LEVEL_CONFIG = {
  1: { pairs: 2, cols: 2, timeLimit: 60 }, // 4 cards (2x2)
  2: { pairs: 4, cols: 4, timeLimit: 50 }, // 8 cards (4x2)
  3: { pairs: 6, cols: 4, timeLimit: 40 }, // 12 cards (4x3)
  4: { pairs: 8, cols: 4, timeLimit: 30 }, // 16 cards (4x4)
  5: { pairs: 10, cols: 5, timeLimit: 20 }, // 20 cards (5x4)
};

const DEFAULT_EMOJIS = ["🍎", "🍊", "🍋", "🍌", "🍇", "🍓", "🍉", "🍒", "🍑", "🍍", "🥝", "🥥"];

const shuffle = <T,>(arr: T[]): T[] => {
  return [...arr].sort(() => Math.random() - 0.5);
};

export function MemoryMatchGame({ gameId = "memory-match" }: MemoryMatchGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [time, setTime] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedPairs, setCompletedPairs] = useState(0);
  
  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = (selectedLevel: number) => {
    // @ts-expect-error - Level is strictly 1-5 but types might be loose
    setLevel(selectedLevel);
    
    // @ts-expect-error - Indexing with generic number
    const config = LEVEL_CONFIG[selectedLevel];
    const gameEmojis = shuffle(DEFAULT_EMOJIS).slice(0, config.pairs);
    
    const initialCards: Card[] = [];
    gameEmojis.forEach((emoji) => {
      initialCards.push({ id: emoji, isFlipped: false, isMatched: false, uniqueId: `${emoji}-1` });
      initialCards.push({ id: emoji, isFlipped: false, isMatched: false, uniqueId: `${emoji}-2` });
    });

    setCards(shuffle(initialCards));
    setTime(0);
    setFlippedCards([]);
    setCompletedPairs(0);
    setIsProcessing(false);
    setGameState("playing");
  };

  const handleCardClick = (clickedCard: Card) => {
    if (
      isProcessing || 
      clickedCard.isMatched || 
      clickedCard.isFlipped || 
      gameState !== "playing"
    ) return;

    // Flip the card
    const newCards = cards.map(c => 
      c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    
    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      
      const [first, second] = newFlipped;
      
      if (first.id === second.id) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first.id ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
          setCompletedPairs(prev => {
            const newVal = prev + 1;
            // Check win condition

            if (newVal === LEVEL_CONFIG[level].pairs) {
              setTimeout(() => setGameState("result"), 500);
            }
            return newVal;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId)
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const StopGame = () => {
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
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-md">회상카드 맞추기</h1>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            
            {/* Level Selection */}
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <motion.button
                    key={lvl}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(lvl)}
                    className="flex flex-col items-center justify-center w-24 h-14 rounded-lg bg-slate-700 text-white shadow-md hover:bg-slate-600 transition-all font-bold text-xl"
                  >
                    <span>{lvl}단계</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Game Method */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
               <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📖</span>
                <h3 className="text-xl font-bold text-gray-800">게임 방법</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                   <div className="text-4xl mb-4">👆</div>
                   <h4 className="font-bold text-lg mb-2">1. 카드 뒤집기</h4>
                   <p className="text-gray-500 text-sm">뒤집혀 있는 카드를 클릭해서<br/>그림을 확인하세요.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                   <div className="text-4xl mb-4">🧠</div>
                   <h4 className="font-bold text-lg mb-2">2. 기억하기</h4>
                   <p className="text-gray-500 text-sm">그림의 위치를 잘<br/>기억해두세요.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                   <div className="text-4xl mb-4">✨</div>
                   <h4 className="font-bold text-lg mb-2">3. 짝 맞추기</h4>
                   <p className="text-gray-500 text-sm">같은 그림의 카드를 연속으로<br/>찾으면 성공입니다!</p>
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
          <h2 className="text-4xl font-bold text-gray-900 mb-2">성공!</h2>
          <p className="text-gray-500 mb-10 text-lg">모든 카드의 짝을 맞췄습니다.</p>

          <div className="bg-indigo-50 p-8 rounded-2xl mb-10">
             <div className="flex justify-center gap-12">
               <div>
                 <p className="text-indigo-600 font-bold uppercase tracking-wider mb-2">난이도</p>
                 <p className="text-3xl font-black text-indigo-900">{level}단계</p>
               </div>
               <div>
                  <p className="text-indigo-600 font-bold uppercase tracking-wider mb-2">소요 시간</p>
                  <p className="text-3xl font-black text-indigo-900">{time}초</p>
               </div>
             </div>
          </div>

          <div className="flex gap-4 justify-center">
             <button onClick={() => router.push('/services/cognitive')} className="px-8 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button onClick={() => setGameState("intro")} className="px-10 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> 다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing Screen


  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl">
         {/* Header */}
         <div className="w-full mb-8 flex justify-start">
          <button
            onClick={() => router.push('/services/cognitive')}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>게임 목록으로 돌아가기</span>
          </button>
        </div>

        <div className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-center mb-8 shadow-md">
            <h1 className="text-2xl font-bold text-white">회상카드 맞추기</h1>
        </div>

        <div className="flex items-center justify-between mb-8 px-4">
           <span className="font-bold text-xl text-gray-800">Level {level}</span>
           <span className={`font-bold text-xl ${time > 60 ? 'text-red-500' : 'text-red-500'}`}>{time}초</span>
           <button onClick={StopGame} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
             그만하기
           </button>
        </div>

        <div className={`grid ${level === 1 ? 'grid-cols-2 max-w-md mx-auto' : level === 5 ? 'grid-cols-5' : 'grid-cols-4'} gap-3 p-4 bg-white`}>
           {cards.map((card) => (
             <motion.button
               key={card.uniqueId}
               onClick={() => handleCardClick(card)}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="aspect-[3/4] perspective-1000 relative"
               disabled={card.isMatched}
             >
                <div 
                  className={`w-full h-full transition-all duration-500 transform-style-3d relative rounded-xl shadow-md ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}
                  style={{ transformStyle: 'preserve-3d', transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  {/* Front (Back of card in UI terms - the ?) */}
                  <div 
                    className="absolute w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                     <span className="text-white text-4xl font-bold opacity-30">?</span>
                  </div>

                  {/* Back (Front of card in UI terms - the Emoji) */}
                  <div 
                    className="absolute w-full h-full backface-hidden rounded-xl bg-white border-2 border-indigo-200 flex items-center justify-center rotate-y-180"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                     <span className="text-5xl">{card.isMatched || card.isFlipped ? card.id : ''}</span>
                  </div>
                </div>
             </motion.button>
           ))}
        </div>

      </div>
    </div>
  );
}
