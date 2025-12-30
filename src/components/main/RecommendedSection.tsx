"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type GameStatus = "not-started" | "learning" | "completed";

// Recommended Game Data (Matching the Screenshot)
const RECOMMENDED_GAMES = [
  {
    id: "attention-3", // Word Search (낱말 연결 게임 replacement if needed, or specific ID)
    title: "낱말 연결 게임",
    categoryLabel: "주의력",
    color: "from-orange-100 to-orange-200", 
    iconColor: "bg-orange-300",
    description: "관련된 낱말을 찾아 연결해보세요",
     // Placeholder logic for specific graphics
    graphicType: "L-shape"
  },
  {
    id: "language-1", // Proverb (속담 완성하기)
    title: "속담 완성하기",
    categoryLabel: "언어능력",
    color: "from-pink-100 to-pink-200",
    iconColor: "bg-pink-300",
    description: "빈칸에 들어갈 알맞은 말을 골라보세요",
    graphicType: "Bubble"
  },
  {
    id: "attention-1", // Find Difference (다른 그림 찾기)
    title: "다른 그림 찾기",
    categoryLabel: "시공간능력",
    color: "from-indigo-100 to-indigo-200",
    iconColor: "bg-indigo-300",
    description: "두 그림 중 다른 부분을 찾아보세요",
    graphicType: "Square"
  }
];

export default function RecommendedSection() {
  const router = useRouter();
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});

  useEffect(() => {
    const savedStatus = localStorage.getItem("mindring_game_status");
    if (savedStatus) {
      setGameStatuses(JSON.parse(savedStatus));
    }
  }, []);

  const handleGameStart = (gameId: string) => {
    const gameRoutes: Record<string, string> = {
      'attention-3': '/services/cognitive/word-search', // Assuming ID map
      'language-1': '/services/cognitive/proverb',
      'attention-1': '/services/cognitive/find-difference',
    };
    
    // Fallback or specific mapping
    const route = gameRoutes[gameId] || `/services/cognitive`; 

    const newStatus = { ...gameStatuses, [gameId]: "learning" as GameStatus };
    setGameStatuses(newStatus);
    localStorage.setItem("mindring_game_status", JSON.stringify(newStatus));
    router.push(route);
  };

  const getStatusButton = (gameId: string) => {
    const status = gameStatuses[gameId] || "not-started";
    
    switch (status) {
      case "not-started":
        return (
          <button 
            onClick={() => handleGameStart(gameId)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg"
          >
            학습하기
          </button>
        );
      case "learning":
        return (
          <button 
            onClick={() => handleGameStart(gameId)}
             className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            학습중
          </button>
        );
      case "completed":
        return (
          <button 
             onClick={() => handleGameStart(gameId)}
             className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-400 text-xs font-bold cursor-default"
          >
            완료
          </button>
        );
    }
  };

  const getGraphic = (type: string) => {
      switch(type) {
          case "L-shape":
              return (
                <div className="absolute bottom-4 left-4 w-16 h-16 opacity-50">
                    <div className="w-10 h-12 bg-orange-300 rounded-tl-lg absolute top-0 left-0"></div>
                    <div className="w-12 h-10 border-4 border-orange-200 rounded-bl-lg absolute bottom-0 left-0"></div>
                </div>
              );
          case "Bubble":
               return (
                <div className="absolute bottom-4 left-4 w-16 h-16 opacity-50">
                     <div className="w-12 h-10 bg-pink-300 rounded-2xl absolute top-0 left-2"></div>
                     <div className="w-4 h-4 bg-pink-300 rounded-full absolute bottom-2 left-0"></div>
                </div>
               );
          case "Square":
              return (
                 <div className="absolute bottom-4 left-4 w-16 h-16 opacity-50">
                    <div className="w-12 h-12 bg-indigo-300 rounded-lg absolute top-2 left-2"></div>
                </div>
              );
          default: return null;
      }
  }

  return (
    <section 
      className="w-full py-12 px-4 mb-16"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">오늘의 추천 인지 콘텐츠</h2>
            <div className="flex gap-2">
                 <button className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-600 font-bold text-sm transition-colors">
                    &lt;
                 </button>
                 <button className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-600 font-bold text-sm transition-colors">
                    &gt;
                 </button>
                 <button 
                    onClick={() => router.push('/services/cognitive')}
                    className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors ml-2"
                >
                    더보기 &gt;
                 </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RECOMMENDED_GAMES.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ y: -5 }}
              className={`rounded-3xl p-6 shadow-sm h-64 relative overflow-hidden group transition-all bg-cover bg-center bg-no-repeat`}
              style={{ backgroundImage: "url('/img/today.png')" }}
            >
               {/* Label */}
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-gray-500 mb-4 bg-white">
                   {game.categoryLabel}
               </div>

               {/* Title */}
               <h3 className="text-xl font-bold text-gray-900 mb-2">{game.title}</h3>

               {/* Graphic (Abstract) */}
                {getGraphic(game.graphicType)}

                {/* Status Button */}
               <div className="absolute bottom-6 right-6">
                   {getStatusButton(game.id)}
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
