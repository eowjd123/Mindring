"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, RotateCcw, Lightbulb, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---
interface WordChainGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface LevelConfig {
  level: number;
  timeLimit: number; // Seconds per turn
  scoreMultiplier: number;
}

// --- Constants ---
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, timeLimit: 20, scoreMultiplier: 1 },
  2: { level: 2, timeLimit: 15, scoreMultiplier: 1.2 },
  3: { level: 3, timeLimit: 12, scoreMultiplier: 1.5 },
  4: { level: 4, timeLimit: 10, scoreMultiplier: 2 },
  5: { level: 5, timeLimit: 7, scoreMultiplier: 3 },
};

// Simple internal dictionary for the computer
// In a real app, this would be much larger or an API
const COMPUTER_WORDS = [
  "가방", "가수", "가족", "가지", "가을", "가게", "가격", "가구", "가로", "가면",
  "나비", "나무", "나라", "나이", "나들이", "나팔", "나침반", "나로호", "나르시시즘",
  "다리", "다람쥐", "다리미", "다이아몬드", "다시마", "다방", "다툼", "다이어트",
  "라면", "라디오", "라일락", "라이터", "라면땅", "라조기", "라텍스",
  "마음", "마을", "마늘", "마스크", "마이크", "마차", "마법", "마당", "마지막",
  "바다", "바나나", "바구니", "바이올린", "바지", "바람", "바위", "바늘", "바둑",
  "사랑", "사람", "사과", "사자", "사탕", "사진", "사장", "사막", "사다리", "사업",
  "아기", "아빠", "아침", "아이스크림", "아파트", "아버지", "아저씨", "아줌마", "아이",
  "자전거", "자동차", "자두", "자연", "자석", "자라", "자존심", "자유", "자리",
  "차표", "차도", "차고", "차이", "차장", "차남", "차녀",
  "카메라", "카레", "카드", "카네이션", "카페", "카카오", "카누", "카만히",
  "타조", "타이어", "타자기", "타월", "타인", "타락", "타협",
  "파도", "파리", "파란색", "파전", "파티", "파이", "파라솔", "파도타기",
  "하마", "하늘", "하프", "하모니카", "하루", "학교", "학생", "학원", "학부모",
  "거미", "거울", "거실", "거북이", "거위", "거장", "거래", "거절",
  "고양이", "고구마", "고추", "고래", "고기", "고무", "고독", "고민", "고속도로",
  "노래", "노루", "노인", "노트", "노랑", "노동", "노력", "노을", "노리개",
  "도토리", "도장", "도시", "도둑", "도서관", "도마", "도자기", "도전", "도움",
  "로봇", "로켓", "로마", "로맨스", "로또", "로비", "로션",
  "모자", "모기", "모래", "모니터", "모델", "모서리", "모습", "모임",
  "보석", "보라색", "보물", "보리", "보수", "보호", "보람", "보통",
  "소풍", "소나무", "소금", "소설", "소방차", "소리", "소문", "소중",
  "오리", "오이", "오징어", "오렌지", "오빠", "오해", "오후", "오전", "오늘",
  "조개", "조카", "조각", "조끼", "조건", "조심", "조절", "조화",
  "초콜릿", "초록색", "초가집", "초대", "초보", "초점", "초원",
  "코끼리", "코스모스", "코트", "코알라", "코미디", "코너", "코일",
  "토마토", "토끼", "토요일", "토론", "토지", "토스트",
  "포도", "포크", "포스터", "포장", "포기", "포함", "포옹",
  "호랑이", "호박", "호수", "호두", "호텔", "호기심", "호흡",
  "구두", "구름", "구슬", "구조", "구멍", "구경", "구석",
  "누나", "누룽지", "누각", "누명", "누수",
  "두부", "두루미", "두더지", "두통", "두뇌", "두려움",
  "루비", "루머", "루이", "루트",
  "무지개", "무릎", "무대", "무게", "무기", "무시", "무료",
  "부채", "부모", "부엌", "부자", "부탁", "부담", "부분",
  "수박", "수건", "수영", "수저", "수학", "수업", "수술", "수준",
  "우유", "우산", "우표", "우주", "우정", "우울", "우리",
  "주사", "주머니", "주전자", "주말", "주인", "주차", "주변",
  "추석", "추억", "추천", "추위", "추가", "추락",
  "쿠키", "쿠폰", "쿠션",
  "투구", "투표", "투자", "투명", "투쟁",
  "푸른", "푸들", "푸념",
  "후추", "후토스", "후회", "후배", "후식",
  "기차", "기린", "기타", "기분", "기억", "기술", "기회", "기준",
  "비행기", "비누", "비옷", "비밀", "비용", "비교", "비판",
  "시계", "시소", "시장", "시골", "시작", "시험", "시간", "시선",
  "이불", "이마", "이유", "이름", "이웃", "이익", "이제",
  "지구", "지도", "지우개", "지갑", "지금", "지식", "지하",
  "치마", "치즈", "치과", "치약", "치료", "치킨",
  "키위", "키스", "키다리",
  "티셔츠", "티켓", "티슈", "티끌",
  "피아노", "피자", "피리", "피부", "피해", "피로",
  "히터", "히트", "히말라야",
  "개나리", "개구리", "개미", "개인", "개선", "개발",
  "내일", "내용", "내복", "내부",
  "대나무", "대추", "대문", "대화", "대통령", "대학", "대신",
  "매미", "매실", "매력", "매일", "매점",
  "배추", "배구", "배달", "배경", "배우",
  "새우", "새벽", "새해", "새싹", "새장",
  "애기", "애국가", "애정", "애교",
  "재미", "재주", "재산", "재료", "재능",
  "채소", "채널", "채점", "채찍",
  "태양", "태권도", "태극기", "태풍", "태도",
  "패션", "패배", "패기",
  "해바라기", "해변", "해결", "해외", "해답"
];

const INITIAL_WORDS = [
  "사과", "바나나", "자동차", "비행기", "컴퓨터", "학교", "여름", "겨울", "사랑", "우산"
];

// Helper to check if korean char matches last char
// For MVP we just assume standard matching.
// Handling 'do-eum-beop-chik' (Li/Ni -> I/Yi) is complex without a library,
// so we will implement basic strict matching for now.
const getLastChar = (word: string) => word.charAt(word.length - 1);
const getFirstChar = (word: string) => word.charAt(0);

// --- Main Component ---
export function WordChainGame({ gameId: _gameId = "word-chain" }: WordChainGameProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [currentWord, setCurrentWord] = useState("");
  const [history, setHistory] = useState<string[]>([]); // Words already used this round
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [inputWord, setInputWord] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "info" | "error" | "success" } | null>(null);
  const [turn, setTurn] = useState<"user" | "computer">("user");

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  // Focus input on turn change
  useEffect(() => {
    if (turn === "user" && gameState === "playing") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [turn, gameState]);

  const handleTimeUp = () => {
    setGameState("result");
  };

  const startGame = (selectedLevel: number) => {
    setLevel(selectedLevel);
    const config = LEVEL_CONFIGS[selectedLevel];
    
    // Pick random start word
    const startWord = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
    
    setCurrentWord(startWord);
    setHistory([startWord]);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setGameState("playing");
    setTurn("user");
    setTurn("user");
    setHintsLeft(3);
    setInputWord("");
    setMessage(null);
  };

  const handleRestart = () => {
    setGameState("intro");
  };

  const handleUseHint = () => {
    if (hintsLeft <= 0 || turn !== "user") return;

    const targetChar = getLastChar(currentWord);
    const candidates = COMPUTER_WORDS.filter(w =>
      getFirstChar(w) === targetChar && !history.includes(w)
    );

    if (candidates.length > 0) {
      const hint = candidates[Math.floor(Math.random() * candidates.length)];
      setMessage({ text: `힌트: ${hint}`, type: "info" });
      setHintsLeft(prev => prev - 1);
    } else {
      setMessage({ text: "사용 가능한 힌트 단어가 없습니다.", type: "error" });
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const validateInput = (word: string) => {
    // 1. Length check
    if (word.length < 2) {
      return { valid: false, message: "두 글자 이상 입력해주세요." };
    }

    // 2. Chain check
    // Logic: last char of currentWord must match first char of input
    const targetChar = getLastChar(currentWord);
    if (getFirstChar(word) !== targetChar) {
       // Simple Do-eum rule check (Very basic)
       // ㄹ -> ㄴ, ㄴ -> ㅇ for some cases.
       // Implementing full rules is hard, so we stick to strict match + manual Do-eum map if needed.
       // For now, let's keep strict to avoid complexity errors.
      return { valid: false, message: `'${targetChar}'(으)로 시작하는 단어를 입력하세요.` };
    }

    // 3. History check
    if (history.includes(word)) {
      return { valid: false, message: "이미 사용한 단어입니다." };
    }

    // 4. Korean check (Basic)
    if (!/^[가-힣]+$/.test(word)) {
      return { valid: false, message: "한글만 입력해주세요." };
    }

    return { valid: true };
  };

  const submitWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (turn !== "user" || gameState !== "playing") return;

    const trimmedInput = inputWord.trim();
    const validation = validateInput(trimmedInput);

    if (!validation.valid) {
      setMessage({ text: validation.message || "오류", type: "error" });
      // Clear error after 2 seconds
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    // Success
    const newHistory = [...history, trimmedInput];
    setHistory(newHistory);
    // Add Score
    const points = trimmedInput.length * 10 * LEVEL_CONFIGS[level].scoreMultiplier;
    setScore((prev) => prev + Math.round(points));
    
    setCurrentWord(trimmedInput);
    setInputWord("");
    setMessage(null);
    setTurn("computer");
    
    // Reset timer for computer turn? Or shared timer?
    // Usually User has time limit per turn. Computer acts instantly or with delay.
    // We'll pause timer or just reset it for next user turn.
    // Let's reset timer for the next turn loop, but first let computer play.
  };

  // Computer's turn
  useEffect(() => {
    if (turn === "computer" && gameState === "playing") {
      // Simulate thinking time
      const thinkingTime = Math.random() * 1000 + 500; // 0.5 ~ 1.5s
      
      const timeout = setTimeout(() => {
        // Find word
        const targetChar = getLastChar(currentWord);
        const candidates = COMPUTER_WORDS.filter(w => 
          getFirstChar(w) === targetChar && !history.includes(w)
        );

        if (candidates.length > 0) {
          // Success
          const nextWord = candidates[Math.floor(Math.random() * candidates.length)];
          setHistory(prev => [...prev, nextWord]);
          setCurrentWord(nextWord);
          setTurn("user");
          // Reset timer for user
          setTimeLeft(LEVEL_CONFIGS[level].timeLimit);
        } else {
          // Computer loses / User bonus?
          // For endless mode, maybe we create a new random word?
          // Or User wins the round?
          // Let's restart with a new word but give extra score.
          setMessage({ text: "컴퓨터가 단어를 못 찾았습니다! (+500점)", type: "success" });
          setScore(prev => prev + 500);
          
          // New random word
          const nextStartWord = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
          setCurrentWord(nextStartWord);
           // If new random word is already in history, we might have issue, but unlikely for MVP scale.
           // Just in case, simplistic approach.
          setTurn("user");
          setTimeLeft(LEVEL_CONFIGS[level].timeLimit);
          
          setTimeout(() => setMessage(null), 3000);
        }
      }, thinkingTime);

      return () => clearTimeout(timeout);
    }
  }, [turn, gameState, currentWord, history, level]);


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

        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md relative z-10">끝말잇기</h1>
            <p className="text-indigo-100 text-lg md:text-xl font-medium relative z-10">단어를 이어가며 어휘력과 순발력을 키워보세요!</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <div className="text-center space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">난이도를 선택하세요</h2>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <motion.button
                    key={lvl}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(lvl)}
                    className={`
                      flex flex-col items-center justify-center w-28 h-28 rounded-2xl shadow-lg 
                      transition-all border-b-4 active:border-b-0 active:translate-y-1
                      ${lvl === 1 ? 'bg-orange-500 border-orange-700 hover:bg-orange-400' : ''}
                      ${lvl === 2 ? 'bg-amber-500 border-amber-700 hover:bg-amber-400' : ''}
                      ${lvl === 3 ? 'bg-green-500 border-green-700 hover:bg-green-400' : ''}
                      ${lvl === 4 ? 'bg-blue-500 border-blue-700 hover:bg-blue-400' : ''}
                      ${lvl === 5 ? 'bg-purple-500 border-purple-700 hover:bg-purple-400' : ''}
                      text-white
                    `}
                  >
                    <span className="text-3xl font-bold mb-1">{lvl}단계</span>
                    <span className="text-xs font-medium opacity-90 bg-black/20 px-2 py-1 rounded-full">
                      {LEVEL_CONFIGS[lvl].timeLimit}초
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <span className="text-3xl">📖</span>
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-orange-200 pb-1">게임 방법</h3>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600 font-bold min-w-[3rem] text-center">abc</div>
                  <p className="text-gray-700 leading-relaxed font-medium pt-1">컴퓨터가 제시한 단어의 <span className="text-orange-600 font-bold">마지막 글자</span>로 시작하는 단어를 입력하세요.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-red-500 font-bold min-w-[3rem] text-center"><Clock className="w-6 h-6 mx-auto"/></div>
                  <p className="text-gray-700 leading-relaxed font-medium pt-1">제한 시간 내에 단어를 입력해야 합니다!</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-yellow-500 font-bold min-w-[3rem] text-center"><Lightbulb className="w-6 h-6 mx-auto"/></div>
                  <p className="text-gray-700 leading-relaxed font-medium pt-1">난이도가 높을수록 시간이 짧으므로 집중력이 필요합니다.</p>
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
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-100 rounded-full scale-150 animate-pulse opacity-50"></div>
              <Trophy className="w-28 h-28 text-yellow-500 relative z-10 drop-shadow-md" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">게임 종료!</h2>
          <p className="text-gray-500 mb-10 text-lg">아쉽게도 시간이 다 되었습니다.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
             <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
               <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider mb-2">최종 점수</p>
               <p className="text-4xl font-black text-indigo-900">{score.toLocaleString()}<span className="text-lg font-medium text-indigo-400 ml-1">점</span></p>
             </div>
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
               <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">이어간 단어</p>
               <p className="text-4xl font-black text-gray-700">{Math.floor((history.length - 1) / 2)}<span className="text-lg font-medium text-gray-400 ml-1">개</span></p>
             </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push('/services/cognitive')} className="px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-lg">
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button onClick={handleRestart} className="px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 text-lg transform hover:-translate-y-1">
              <RotateCcw className="w-5 h-5" /> 다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing Screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <button onClick={handleRestart} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
             <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">그만하기</span>
           </button>
           <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-gray-200">
             <span className="font-bold text-indigo-600">{level}단계</span>
           </div>
           <div className="w-24"></div> 
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
             <div className="flex flex-col">
               <span className="text-xs text-gray-400 font-bold uppercase mb-1">이어간 단어 수</span>
               <span className="text-2xl font-black text-gray-800">{Math.floor((history.length - 1) / 2)}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xs text-gray-400 font-bold uppercase mb-1">점수</span>
               <span className="text-2xl font-black text-indigo-600">{score.toLocaleString()}</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 남은 시간</span>
               <span className={`text-2xl font-black font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>{timeLeft}초</span>
             </div>
          </div>
          
          {/* Game Board */}
          <div className="p-8 md:p-12 text-center bg-gradient-to-b from-orange-400 to-orange-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
            
            <motion.div
              key={currentWord}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative z-10"
            >
              <p className="text-orange-100 font-medium mb-4 text-lg">현재 단어</p>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 drop-shadow-lg tracking-tight">{currentWord}</h1>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full border border-white/30">
                <p className="text-lg font-medium">
                  &quot;<span className="text-yellow-300 font-bold text-2xl mx-1">{getLastChar(currentWord)}</span>&quot;(으)로 시작하는 단어를 입력하세요
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative mb-8">
           <form onSubmit={submitWord} className="relative z-10">
             <div className="flex gap-3">
               <input
                 ref={inputRef}
                 type="text"
                 value={inputWord}
                 onChange={(e) => setInputWord(e.target.value)}
                 disabled={turn !== "user"}
                 placeholder={turn === "user" ? "단어를 입력하세요..." : "컴퓨터가 생각 중입니다..."}
                 className="flex-1 h-16 px-6 rounded-2xl border-2 border-gray-200 shadow-sm text-xl font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                 autoFocus
                 autoComplete="off"
               />
               <button
                 type="submit"
                 disabled={turn !== "user" || !inputWord.trim()}
                 className="h-16 px-8 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-orange-600 hover:shadow-xl active:scale-95 transition-all disabled:bg-gray-300 disabled:shadow-none disabled:active:scale-100"
               >
                 제출
               </button>
             </div>
           </form>

           <div className="flex justify-center mt-4">
             <button 
               onClick={handleUseHint}
               disabled={hintsLeft <= 0 || turn !== "user"}
               className="flex items-center gap-2 px-5 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Lightbulb className="w-5 h-5" />
               힌트 보기 ({hintsLeft}/3)
             </button>
           </div>

            {/* Error/Success Message Toast */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`
                    absolute top-full left-0 right-0 mt-4 p-4 rounded-xl text-center font-bold shadow-lg border
                    ${message.type === "error" ? "bg-red-50 text-red-600 border-red-100" : ""}
                    ${message.type === "success" ? "bg-green-50 text-green-600 border-green-100" : ""}
                    ${message.type === "info" ? "bg-blue-50 text-blue-600 border-blue-100" : ""}
                  `}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-bold text-sm mb-4">사용된 단어 ({history.length}개)</h3>
          <div className="flex flex-wrap gap-2">
            {[...history].reverse().map((word, idx) => (
              <span key={idx} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${idx === 0 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600'}`}>
                {word}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
