"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Award, Check, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---

interface WordSearchGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface Theme {
  id: string;
  name: string;
  words: string[];
  icon: string;
}

interface LevelConfig {
  level: number;
  gridSize: number;
  wordCount: number;
  timeLimit: number;
}

interface Cell {
  row: number;
  col: number;
  char: string;
  isFound: boolean; // Part of a found word
  isSelected: boolean; // Currently selected
}

// --- Constants ---

const THEMES: Theme[] = [
  { id: "nations", name: "나라", words: ["한국", "미국", "영국", "일본", "중국", "독일", "호주", "인도", "태국", "베트남"], icon: "🌏" },
  { id: "animals", name: "동물", words: ["사자", "호랑이", "토끼", "강아지", "고양이", "코끼리", "기린", "원숭이", "판다", "펭귄"], icon: "🦁" },
  { id: "fruits", name: "과일", words: ["사과", "포도", "수박", "딸기", "바나나", "오렌지", "복숭아", "키위", "참외", "자두"], icon: "🍇" },
  { id: "objects", name: "물건", words: ["시계", "가방", "모자", "안경", "의자", "책상", "연필", "노트", "지우개", "우산"], icon: "🎒" },
  { id: "colors", name: "색깔", words: ["빨강", "파랑", "노랑", "초록", "보라", "주황", "분홍", "하늘", "연두", "검정"], icon: "🎨" },
];

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, gridSize: 4, wordCount: 2, timeLimit: 60 },
  2: { level: 2, gridSize: 5, wordCount: 3, timeLimit: 90 },
  3: { level: 3, gridSize: 6, wordCount: 4, timeLimit: 120 },
  4: { level: 4, gridSize: 7, wordCount: 5, timeLimit: 150 },
  5: { level: 5, gridSize: 8, wordCount: 6, timeLimit: 180 },
};

const HANGUL_CHARS = "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐기니디리미비시이지치키티피히";

// --- Helper Functions ---

const getRandomChar = () => HANGUL_CHARS[Math.floor(Math.random() * HANGUL_CHARS.length)];

// --- Main Component ---

export function WordSearchGame({ gameId: _gameId = "word-search" }: WordSearchGameProps) {
  const router = useRouter();

  // State
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  
  const [selectedStart, setSelectedStart] = useState<{ row: number; col: number } | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{ row: number; col: number }[]>([]);
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hintUsed, setHintUsed] = useState(0);

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

  // Game Logic
  const generateLevel = (level: number, theme: Theme) => {
    const config = LEVEL_CONFIGS[level];
    const gridSize = config.gridSize;
    
    // Select words
    const shuffledWords = [...theme.words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledWords.slice(0, config.wordCount);
    
    // Create empty grid
    let newGrid: Cell[][] = Array(gridSize).fill(null).map((_, row) => 
      Array(gridSize).fill(null).map((_, col) => ({ row, col, char: '', isFound: false, isSelected: false }))
    );

    // Place words
    const directions = [
      { dr: 0, dc: 1 }, // Horizontal
      { dr: 1, dc: 0 }, // Vertical
      // { dr: 1, dc: 1 }, // Diagonal (maybe for harder levels only?)
    ];

    const filledCells = new Set<string>();

    for (const word of selectedWords) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);

        // Check bounds
        let endRow = row + dir.dr * (word.length - 1);
        let endCol = col + dir.dc * (word.length - 1);

        if (endRow >= 0 && endRow < gridSize && endCol >= 0 && endCol < gridSize) {
          // Check collision
          let collision = false;
          for (let i = 0; i < word.length; i++) {
            const r = row + dir.dr * i;
            const c = col + dir.dc * i;
            if (newGrid[r][c].char !== '' && newGrid[r][c].char !== word[i]) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            // Place
            for (let i = 0; i < word.length; i++) {
              const r = row + dir.dr * i;
              const c = col + dir.dc * i;
              newGrid[r][c].char = word[i];
              filledCells.add(`${r},${c}`);
            }
            placed = true;
          }
        }
      }
    }

    // Fill empty cells
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c].char === '') {
          newGrid[r][c].char = getRandomChar();
        }
      }
    }

    setGrid(newGrid);
    setTargetWords(selectedWords);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setHintUsed(0);
    setSelectedStart(null);
    setCurrentSelection([]);
  };

  const startGame = (level: number) => {
    setCurrentLevel(level);
    // Pick random theme if not set, or rotate themes? For simplicity, pick random or last used.
    // Let's pick a random theme for variety each time unless we add a theme selector.
    // Ideally, user should choose theme, but for now random is good for "Simple diverse".
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setCurrentTheme(randomTheme);
    
    generateLevel(level, randomTheme);
    setGameState("playing");
  };

  const handleRestart = () => {
    setGameState("intro");
  };

  // Interaction
  const handleCellClick = (row: number, col: number) => {
    if (gameState !== "playing") return;

    if (!selectedStart) {
      // Start selection
      setSelectedStart({ row, col });
      setCurrentSelection([{ row, col }]);
    } else {
      // End selection
      // Check validation immediately
      validateSelection(selectedStart, { row, col });
      setSelectedStart(null);
      setCurrentSelection([]);
    }
  };

  // Simplified: Only support straight lines for now, user clicks start then end.
  // We can also support Hover to show line?
  const handleCellHover = (row: number, col: number) => {
    if (gameState === "playing" && selectedStart) {
      // Calculate line from start to current
      // Only allow vertical or horizontal for ease?
      const dr = row - selectedStart.row;
      const dc = col - selectedStart.col;

      let line: { row: number; col: number }[] = [];

      if (dr === 0) {
        // Horizontal
        const step = dc > 0 ? 1 : -1;
        for (let c = selectedStart.col; c !== col + step; c += step) {
          line.push({ row: selectedStart.row, col: c });
        }
      } else if (dc === 0) {
        // Vertical
        const step = dr > 0 ? 1 : -1;
        for (let r = selectedStart.row; r !== row + step; r += step) {
          line.push({ row: r, col: selectedStart.col });
        }
      } else {
        // Diagonal? For now, ignore invalid hovers or show just start
        line = [{ row: selectedStart.row, col: selectedStart.col }];
      }
      setCurrentSelection(line);
    }
  };

  const validateSelection = (start: { row: number, col: number }, end: { row: number, col: number }) => {
    // Construct word from selection
    // Re-calculate line just to be safe
    let word = "";
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    
    // Normalize step
    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;

    // Must be straight line
    if (stepR !== 0 && stepC !== 0 && Math.abs(dr) !== Math.abs(dc)) return; // Not straight or diagonal
    // If we only support H/V for lower levels:
    if (stepR !== 0 && stepC !== 0) return; // Strict H/V only for now to match difficulty 1-2

    const len = Math.max(Math.abs(dr), Math.abs(dc));
    const path: { row: number, col: number }[] = [];

    for (let i = 0; i <= len; i++) {
      const r = start.row + stepR * i;
      const c = start.col + stepC * i;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid.length) return;
      word += grid[r][c].char;
      path.push({ row: r, col: c });
    }

    // Check match
    if (targetWords.includes(word) && !foundWords.includes(word)) {
      // Found!
      setFoundWords(prev => [...prev, word]);
      setScore(prev => prev + 10);
      
      // Mark grid
      const newGrid = [...grid];
      path.forEach(p => {
        newGrid[p.row][p.col].isFound = true;
      });
      setGrid(newGrid);

      // Check win
      if (foundWords.length + 1 === targetWords.length) {
        setTimeout(() => setGameState("result"), 1000);
      }
    } else {
        // Wrong
        // Could show feedback
    }
  };

  const useHint = () => {
    if (hintUsed >= 3) return;
    
    // Find a word not yet found
    const remaining = targetWords.filter(w => !foundWords.includes(w));
    if (remaining.length === 0) return;
    
    // Punishment for hint
    setHintUsed(prev => prev + 1);
    setScore(prev => Math.max(0, prev - 5));
  };

  // --- Render ---

  // Intro
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">단어 찾기 퍼즐</h1>
            <p className="text-indigo-100 text-lg">글자판 속에 숨겨진 단어를 찾아보세요!</p>
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
                      {LEVEL_CONFIGS[level].gridSize}x{LEVEL_CONFIGS[level].gridSize} / {LEVEL_CONFIGS[level].wordCount}단어
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-xl font-bold text-blue-600">🔍</div>
                  <h4 className="font-bold text-gray-900 mb-2">1. 단어 찾기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">왼쪽 목록에 있는 단어를 글자판에서 찾으세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">👆</div>
                  <h4 className="font-bold text-gray-900 mb-2">2. 선택하기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">단어의 첫 글자와 끝 글자를 차례로 누르세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-2xl">💡</div>
                  <h4 className="font-bold text-gray-900 mb-2">3. 힌트 사용</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">어려울 땐 힌트 버튼을 눌러보세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result
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
          <p className="text-gray-500 mb-8">모든 단어를 찾았습니다.</p>
          
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

  const gridSize = LEVEL_CONFIGS[currentLevel].gridSize;
  const gridTemplate = `repeat(${gridSize}, minmax(0, 1fr))`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <button onClick={handleRestart} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium">
             <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">그만하기</span>
           </button>
           <h1 className="text-2xl font-bold text-gray-900">단어 찾기 퍼즐</h1>
           <div className="flex gap-2">
             <button disabled={hintUsed >= 3} onClick={useHint} className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-200 disabled:opacity-50">
               <Lightbulb className="w-4 h-4" /> 힌트 ({3 - hintUsed}/3)
             </button>
           </div>
        </div>

        {/* Info Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentTheme.icon}</span>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">테마</p>
              <p className="font-bold text-gray-900">{currentTheme.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 px-4 py-2 rounded-lg">
               <p className="text-xs text-indigo-400 font-bold uppercase">찾은 단어</p>
               <p className="font-bold text-indigo-900">{foundWords.length} / {targetWords.length}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
             <div className="text-right">
               <p className="text-xs text-gray-400 font-bold uppercase">Time</p>
               <p className="font-mono font-bold text-xl">{timeLeft}초</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Target List */}
          <div className="w-full md:w-48 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">찾을 단어</h3>
            <div className="flex flex-col gap-3">
              {targetWords.map((word) => (
                <div 
                  key={word} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                    ${foundWords.includes(word) ? "bg-green-50 text-green-700 line-through opacity-60" : "bg-gray-50 text-gray-700"}
                  `}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${foundWords.includes(word) ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                    {foundWords.includes(word) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div 
            className="flex-1 aspect-square bg-white p-2 md:p-6 rounded-xl shadow-lg border border-indigo-50"
          >
            <div className="grid gap-2 w-full h-full" style={{ gridTemplateColumns: gridTemplate, gridTemplateRows: gridTemplate }}>
              {grid.map((row, r) => (
                row.map((cell, c) => {
                  const isSelected = selectedStart?.row === r && selectedStart?.col === c;
                  const isInPath = currentSelection.some(p => p.row === r && p.col === c);
                  
                  return (
                    <motion.button
                      key={`${r}-${c}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={() => handleCellHover(r, c)}
                      onClick={() => handleCellClick(r, c)}
                      className={`
                        relative rounded-lg flex items-center justify-center text-xl md:text-3xl font-bold transition-colors select-none
                        ${cell.isFound 
                          ? "bg-green-500 text-white shadow-inner" 
                          : isSelected || isInPath
                            ? "bg-indigo-500 text-white shadow-lg z-10 scale-105"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {cell.char}
                      {/* Connection Lines (Optional visual polish could go here) */}
                    </motion.button>
                  );
                })
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
