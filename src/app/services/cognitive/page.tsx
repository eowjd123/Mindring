"use client";

import { ArrowLeft, ArrowRight, ChevronRight, Home, Pause, Search } from "lucide-react";
import React, { useEffect, useState } from "react";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// 게임 카테고리 타입
type GameCategory = "all" | "memory" | "attention" | "language" | "visuospatial" | "orientation";
type GameStatus = "not-started" | "learning" | "completed";

// 게임 데이터 타입
interface Game {
  id: string;
  title: string;
  category: GameCategory;
  categoryLabel: string;
  imageUrl?: string;
  graphicImageUrl?: string; // 카드 내부 그래픽 이미지
  description?: string;
  status?: GameStatus;
  color: string;
}

// 카테고리별 색상 정의
const CATEGORY_COLORS = {
  memory: "from-blue-400 to-blue-600",
  attention: "from-orange-400 to-orange-600",
  language: "from-purple-400 to-purple-600",
  visuospatial: "from-indigo-400 via-purple-500 to-pink-500",
  orientation: "from-green-400 to-green-600",
};

// 게임 카테고리 데이터 타입
interface GameCategoryData {
  id: GameCategory;
  name: string;
  games: Game[];
}

// 게임 카테고리 정의
const GAME_CATEGORIES: Record<GameCategory, GameCategoryData> = {
  all: {
    id: "all" as GameCategory,
    name: "전체",
    games: [] as Game[],
  },
  memory: {
    id: "memory" as GameCategory,
    name: "기억력 게임",
    games: [
      { 
        id: "memory-1", 
        title: "회상카드 맞추기", 
        description: "뒤집힌 카드를 기억하고 같은 짝을 찾는 전형적인 메모리 게임입니다.",
        category: "memory" as GameCategory,
        categoryLabel: "게임",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.memory,
      },
      {
        id: "color-sequence",
        title: "색상 순서 기억하기",
        description: "컴퓨터가 보여준 색상의 순서를 기억해 동일한 순서로 버튼을 누르는 게임입니다.",
        category: "memory" as GameCategory,
        categoryLabel: "게임",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.memory,
      },
    ],
  },
  attention: {
    id: "attention" as GameCategory,
    name: "주의력 게임",
    games: [
      { 
        id: "attention-1", 
        title: "다른 그림 찾기", 
        category: "attention" as GameCategory,
        categoryLabel: "주의력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.attention,
      },
      { 
        id: "attention-2", 
        title: "같은 그림 터치하기", 
        category: "attention" as GameCategory,
        categoryLabel: "주의력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.attention,
      },
      { 
        id: "attention-3", 
        title: "단어 찾기 퍼즐", 
        category: "attention" as GameCategory,
        categoryLabel: "주의력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.attention,
      },
      { 
        id: "attention-4", 
        title: "낱말 연결 게임", 
        category: "attention" as GameCategory,
        categoryLabel: "주의력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.attention,
      },
      { 
        id: "attention-5", 
        title: "숫자 이어주기", 
        category: "attention" as GameCategory,
        categoryLabel: "주의력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.attention,
      },
    ],
  },
  language: {
    id: "language" as GameCategory,
    name: "언어능력 게임",
    games: [
      { 
        id: "language-1", 
        title: "속담 완성하기", 
        category: "language" as GameCategory,
        categoryLabel: "언어능력",
        status: "learning" as GameStatus,
        color: CATEGORY_COLORS.language,
      },
      { 
        id: "language-2", 
        title: "끝말잇기", 
        category: "language" as GameCategory,
        categoryLabel: "언어능력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.language,
      },
      { 
        id: "language-4", 
        title: "이야기 완성하기", 
        category: "language" as GameCategory,
        categoryLabel: "언어능력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.language,
      },
      { 
        id: "language-5", 
        title: "단어연상퀴즈", 
        category: "language" as GameCategory,
        categoryLabel: "언어능력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.language,
      },
    ],
  },
  visuospatial: {
    id: "visuospatial" as GameCategory,
    name: "시공간능력 게임",
    games: [
      { 
        id: "visuospatial-3", 
        title: "색상 구분 테스트", 
        category: "visuospatial" as GameCategory,
        categoryLabel: "시공간능력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.visuospatial,
      },
      { 
        id: "visuospatial-5", 
        title: "조각 맞추기", 
        category: "visuospatial" as GameCategory,
        categoryLabel: "시공간능력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.visuospatial,
      },
    ],
  },
  orientation: {
    id: "orientation" as GameCategory,
    name: "지남력 게임",
    games: [
      { 
        id: "orientation-1", 
        title: "인물 맞추기", 
        category: "orientation" as GameCategory,
        categoryLabel: "지남력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.orientation,
      },
      { 
        id: "orientation-2", 
        title: "날짜·시간 맞추기", 
        category: "orientation" as GameCategory,
        categoryLabel: "지남력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.orientation,
      },
      { 
        id: "orientation-5", 
        title: "감정 표현 게임", 
        category: "orientation" as GameCategory,
        categoryLabel: "지남력",
        status: "not-started" as GameStatus,
        color: CATEGORY_COLORS.orientation,
      },
    ],
  },
};

// 모든 게임 목록
const ALL_GAMES: Game[] = [
  ...GAME_CATEGORIES.memory.games,
  ...GAME_CATEGORIES.attention.games,
  ...GAME_CATEGORIES.language.games,
  ...GAME_CATEGORIES.visuospatial.games,
  ...GAME_CATEGORIES.orientation.games,
];

// 추천 게임 (샘플 데이터)
const RECOMMENDED_GAMES: Game[] = [
  GAME_CATEGORIES.attention.games[3], // 낱말 연결 게임
  GAME_CATEGORIES.language.games[0], // 속담 완성하기
  GAME_CATEGORIES.attention.games[0], // 다른 그림 찾기
  GAME_CATEGORIES.orientation.games[0], // 인물 맞추기
];

export default function CognitivePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});

  useEffect(() => {
    const savedStatus = localStorage.getItem("mindring_game_status");
    if (savedStatus) {
      setGameStatuses(JSON.parse(savedStatus));
    }
  }, []);

  // 필터링된 게임 목록
  const filteredGames = React.useMemo(() => {
    let games = selectedCategory === "all" ? ALL_GAMES : GAME_CATEGORIES[selectedCategory].games;

    if (searchQuery.trim()) {
      games = games.filter((game) =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return games;
  }, [selectedCategory, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };



  // 게임 라우트 매핑
  const handleGameStart = (gameId: string) => {
    const gameRoutes: Record<string, string> = {
      'memory-1': '/services/cognitive/memory-match',
      'color-sequence': '/services/cognitive/color-sequence',
      'attention-1': '/services/cognitive/find-difference',
      'attention-2': '/services/cognitive/same-match',
      'attention-3': '/services/cognitive/word-search',
      'attention-5': '/services/cognitive/connect-numbers',
      'orientation-1': '/services/cognitive/person-quiz',
      'orientation-2': '/services/cognitive/time-quiz',
      'language-1': '/services/cognitive/proverb',
      'language-2': '/services/cognitive/word-chain',
      // 다른 게임들도 여기에 추가 가능
    };
    
    const route = gameRoutes[gameId];
    if (route) {
      // Update status to learning
      const newStatus = { ...gameStatuses, [gameId]: "learning" as GameStatus };
      setGameStatuses(newStatus);
      localStorage.setItem("mindring_game_status", JSON.stringify(newStatus));
      router.push(route);
    } else {
      console.warn(`No route found for game: ${gameId}`);
    }
  };

  const getStatusButton = (gameId: string) => {
    const status = gameStatuses[gameId] || "not-started";
    
    switch (status) {
      case "not-started":
        return (
          <button 
            onClick={() => handleGameStart(gameId)}
            className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center shadow-lg"
          >
            학습하기
          </button>
        );
      case "learning":
        return (
          <button 
            onClick={() => handleGameStart(gameId)}
            className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center shadow-lg border-2 border-orange-400"
          >
            학습중
          </button>
        );
      case "completed":
        return (
          <button 
             onClick={() => handleGameStart(gameId)}
             className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center shadow-lg border-2 border-orange-400"
          >
            완료
          </button>
        );
    }
  };

  const getCategoryGraphic = (game: Game) => {
    // 이미지 파일이 있으면 이미지 사용
    if (game.graphicImageUrl) {
      return (
        <div className="relative w-32 h-32">
          <Image
            src={game.graphicImageUrl}
            alt={game.title}
            fill
            className="object-contain"
            sizes="128px"
          />
        </div>
      );
    }

    // 특정 게임별 커스텀 그래픽
    switch (game.id) {
      case "memory-1":
        // 메모리 카드 그래픽
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-2 top-4 w-8 h-10 bg-blue-200/60 rounded border-2 border-blue-400"></div>
            <div className="absolute left-6 top-6 w-8 h-10 bg-blue-300/60 rounded border-2 border-blue-500"></div>
            <div className="absolute left-10 top-4 w-8 h-10 bg-blue-400/60 rounded border-2 border-blue-600"></div>
            <div className="absolute left-14 top-6 w-8 h-10 bg-blue-200/60 rounded border-2 border-blue-400"></div>
            <div className="text-white text-3xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">🃏</div>
          </div>
        );
      case "color-sequence":
        // 색상 순서 게임 그래픽 (4개 컬러 버튼)
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-2 top-2 w-6 h-6 bg-red-400 rounded-full border-2 border-red-600"></div>
            <div className="absolute right-2 top-2 w-6 h-6 bg-green-400 rounded-full border-2 border-green-600"></div>
            <div className="absolute left-2 bottom-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
            <div className="absolute right-2 bottom-2 w-6 h-6 bg-blue-400 rounded-full border-2 border-blue-600"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-2xl">↻</div>
          </div>
        );
      default:
        break;
    }

    // 카테고리별 그래픽
    switch (game.category) {
      case "attention":
        // L자 모양 그래픽 (낱말 연결 게임)
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-0 top-0 w-16 h-20 bg-orange-300/40 rounded-tl-lg"></div>
            <div className="absolute left-0 top-16 w-20 h-16 border-4 border-orange-200 rounded-bl-lg"></div>
          </div>
        );
      case "language":
        // 말풍선 그래픽 (속담 완성하기)
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-4 top-8 w-24 h-20 bg-purple-200/30 rounded-2xl border-2 border-purple-300/50"></div>
            <div className="absolute left-8 top-12 w-16 h-12 bg-white/20 rounded-xl"></div>
            <div className="absolute left-0 bottom-0 w-8 h-8 bg-purple-200/30 rounded-full"></div>
          </div>
        );
      case "visuospatial":
        // 폴더/그림 아이콘
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-4 top-4 w-24 h-20 bg-indigo-200/30 rounded-lg"></div>
            <div className="absolute left-8 top-8 w-16 h-12 bg-white/20 rounded"></div>
            <div className="absolute left-12 top-12 w-8 h-8 bg-purple-200/30 rounded-full"></div>
          </div>
        );
      case "orientation":
        // 얼굴 아이콘
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-green-200/30 rounded-full"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 rounded-full"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 bg-green-300/50 rounded-full"></div>
            <div className="absolute left-1/2 top-1/2 translate-x-2 -translate-y-2 w-2 h-2 bg-green-300/50 rounded-full"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-2 w-8 h-4 border-2 border-green-300/50 rounded-full border-t-transparent"></div>
          </div>
        );
      default:
        // 기본 게임 아이콘
        return (
          <div className="relative w-32 h-32">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 rounded-lg"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60 text-4xl">🎮</div>
          </div>
        );
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % RECOMMENDED_GAMES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + RECOMMENDED_GAMES.length) % RECOMMENDED_GAMES.length);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">인지콘텐츠</h1>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 text-sm font-medium"
            aria-label="홈으로 돌아가기"
          >
            <Home className="h-4 w-4" />
            <span>홈으로</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 오늘의 추천 인지 콘텐츠 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">오늘의 추천 인지 콘텐츠</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="이전"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label={isPaused ? "재생" : "일시정지"}
                >
                  <Pause className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="다음"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium">
              더보기
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 추천 게임 카드 캐러셀 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RECOMMENDED_GAMES.map((game, index) => (
              <div
                key={game.id}
                className={`relative bg-gradient-to-br ${game.color} rounded-2xl p-6 min-h-[320px] flex flex-col shadow-lg hover:shadow-xl transition-shadow overflow-hidden ${
                  index === currentSlide ? "ring-4 ring-indigo-300" : ""
                }`}
              >
                {/* 카테고리 라벨 */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-white/30 backdrop-blur-sm">
                    {game.categoryLabel}
                  </span>
                </div>
                
                {/* 게임 제목 - 중앙 정렬 */}
                <div className="flex-1 flex items-center justify-center mb-4">
                  <h3 className="text-2xl font-bold text-white text-center leading-tight">{game.title}</h3>
                </div>
                
                {/* 그래픽 영역 - 하단 좌측 */}
                <div className="absolute bottom-16 left-6">
                  {getCategoryGraphic(game)}
                </div>
                
                {/* 상태 버튼 - 우측 하단 */}
                {getStatusButton(game.id)}
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.values(GAME_CATEGORIES).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2.5 rounded-lg transition-all font-medium text-sm ${
                  selectedCategory === category.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <label htmlFor="search-title" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              제목
            </label>
            <input
              id="search-title"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="게임 제목을 입력하세요"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              검색
            </button>
          </form>
        </div>

        {/* 게임 카드 그리드 */}
        <div>
          {filteredGames.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredGames.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.1)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 cursor-pointer"
                >
                  {/* 게임 이미지 플레이스홀더 */}
                  <div className={`w-full aspect-video bg-gradient-to-br ${game.color} flex items-center justify-center transition-transform hover:scale-105`}>
                    <div className="p-4">
                      {getCategoryGraphic(game)}
                    </div>
                  </div>
                  {/* 게임 정보 */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">{game.categoryLabel}</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2">
                      {game.title}
                    </h3>
                    {game.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{game.description}</p>
                    )}
                    <motion.button
                      onClick={() => handleGameStart(game.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm ${
                        (gameStatuses[game.id] === "learning") 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {gameStatuses[game.id] === "learning" ? "학습중" : "시작하기"}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
