"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Award, Lightbulb, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---

interface ProverbGameProps {
  gameId?: string;
}

type GameState = "intro" | "playing" | "result";

interface ProverbProblem {
  id: number;
  question: string; // The proverb with a blank _____
  answer: string;   // The correct word
  options: string[]; // 4 options including answer
  hint: string;     // Interpretation or hint
}

interface LevelConfig {
  level: number;
  timeLimit: number;
  scoreMultiplier: number;
}

// --- Constants ---

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { level: 1, timeLimit: 20, scoreMultiplier: 1 },
  2: { level: 2, timeLimit: 15, scoreMultiplier: 1.2 },
  3: { level: 3, timeLimit: 10, scoreMultiplier: 1.5 },
  4: { level: 4, timeLimit: 7, scoreMultiplier: 2 },
  5: { level: 5, timeLimit: 5, scoreMultiplier: 3 },
};

const PROVERBS_DATA: ProverbProblem[] = [
  { id: 1, question: "세 살 ___ 여든까지 간다", answer: "버릇", options: ["버릇", "기억", "공부", "사랑"], hint: "어릴 때 몸에 밴 습관은 늙어서도 고치기 어렵다는 뜻입니다." },
  { id: 2, question: "가는 말이 고와야 ___ 말이 곱다", answer: "오는", options: ["오는", "가는", "듣는", "하는"], hint: "자기가 남에게 말과 행동을 좋게 해야 남도 자기에게 좋게 한다는 뜻입니다." },
  { id: 3, question: "___도 위 아래가 있다", answer: "찬물", options: ["찬물", "더운물", "강물", "빗물"], hint: "무슨 일에나 순서가 있다는 뜻입니다." },
  { id: 4, question: "티끌 모아 ___", answer: "태산", options: ["태산", "동산", "강산", "화산"], hint: "아무리 작은 것이라도 모이고 모이면 나중에 큰 덩어리가 됨을 이르는 말입니다." },
  { id: 5, question: "___ 잃고 외양간 고친다", answer: "소", options: ["소", "말", "양", "돼지"], hint: "이미 일을 그르친 뒤에 뉘우쳐도 소용이 없다는 뜻입니다." },
  { id: 6, question: "말 한마디로 ___ 빚을 갚는다", answer: "천냥", options: ["천냥", "만냥", "백냥", "억냥"], hint: "말만 잘하면 어려운 일이나 불가능해 보이는 일도 해결할 수 있다는 뜻입니다." },
  { id: 7, question: "등잔 ___ 어둡다", answer: "밑이", options: ["밑이", "위가", "옆이", "뒤가"], hint: "가까이 있는 사물을 오히려 잘 모른다는 뜻입니다." },
  { id: 8, question: "누워서 ___ 먹기", answer: "떡", options: ["떡", "밥", "죽", "물"], hint: "하기가 매우 쉬운 것을 이르는 말입니다." },
  { id: 9, question: "발 없는 ___이 천 리 간다", answer: "말", options: ["말", "소", "새", "쥐"], hint: "말은 순식간에 멀리 퍼지므로, 말을 삼가야 한다는 뜻입니다." },
  { id: 10, question: "___이 떡 먹기", answer: "누워서", options: ["누워서", "앉아서", "서서", "뛰어서"], hint: "매우 쉬운 일이라는 뜻입니다." },
  { id: 11, question: "고래 싸움에 ___ 등 터진다", answer: "새우", options: ["새우", "꽃게", "오징어", "문어"], hint: "강한 자끼리 싸우는 틈에 끼여 약한 자가 아무 까닭 없이 피해를 입음을 비유적으로 이르는 말입니다." },
  { id: 12, question: "금강산도 ___", answer: "식후경", options: ["식후경", "식전경", "구경", "등산"], hint: "아무리 재미있는 일이라도 배가 불러야 흥이 난다는 뜻입니다." },
  { id: 13, question: "빈 수레가 ___", answer: "요란하다", options: ["요란하다", "조용하다", "무겁다", "가볍다"], hint: "실속이 없는 사람이 겉으로 더 떠들어 댐을 비유적으로 이르는 말입니다." },
  { id: 14, question: "지렁이도 밟으면 ___", answer: "꿈틀한다", options: ["꿈틀한다", "소리친다", "도망간다", "가만히있다"], hint: "아무리 약하고 천한 사람이라도 함부로 업신여기면 반항한다는 뜻입니다." },
  { id: 15, question: "___도 나무에서 떨어진다", answer: "원숭이", options: ["원숭이", "다람쥐", "고양이", "새"], hint: "아무리 익숙하고 잘하는 사람이라도 실수할 때가 있다는 말입니다." },
  { id: 16, question: "꿩 대신 ___", answer: "닭", options: ["닭", "오리", "비둘기", "까치"], hint: "자기가 쓰려던 것이 없으면 그와 비슷한 것으로 대신 쓴다는 뜻입니다." },
  { id: 17, question: "___도 두들겨 보고 건너라", answer: "돌다리", options: ["돌다리", "나무다리", "징검다리", "구름다리"], hint: "잘 아는 일이라도 세심하게 주의를 기울여야 한다는 뜻입니다." },
  { id: 18, question: "마른 하늘에 ___", answer: "날벼락", options: ["날벼락", "소나기", "눈보라", "무지개"], hint: "뜻밖에 당하는 불행한 일을 비유적으로 이르는 말입니다." },
  { id: 19, question: "___ 도둑이 소 도둑 된다", answer: "바늘", options: ["바늘", "연필", "지우개", "호미"], hint: "작은 나쁜 짓도 버릇이 되면 나중에 큰 죄를 저지르게 된다는 뜻입니다." },
  { id: 20, question: "배보다 ___이 더 크다", answer: "배꼽", options: ["배꼽", "얼굴", "주먹", "발"], hint: "기본적인 것보다 곁딸린 것이 더 많거나 큼을 비유적으로 이르는 말입니다." },
  { id: 21, question: "___장도 맞들면 낫다", answer: "백지", options: ["백지", "신문", "편지", "휴지"], hint: "아무리 쉬운 일이라도 협력하면 훨씬 쉽다는 뜻입니다." },
  { id: 22, question: "___는 익을수록 고개를 숙인다", answer: "벼", options: ["벼", "보리", "밀", "옥수수"], hint: "교양 있고 수양을 쌓은 사람일수록 겸손하다는 뜻입니다." },
  { id: 23, question: "___이 많으면 배가 산으로 간다", answer: "사공", options: ["사공", "선장", "가족", "친구"], hint: "간섭하는 사람이 많으면 일이 제대로 되기 어렵다는 뜻입니다." },
  { id: 24, question: "싼 게 ___", answer: "비지떡", options: ["비지떡", "꿀떡", "찹쌀떡", "빈대떡"], hint: "값이 싼 물건은 품질도 그만큼 나쁘다는 뜻입니다." },
  { id: 25, question: "아니 땐 ___에 연기 날까", answer: "굴뚝", options: ["굴뚝", "아궁이", "난로", "화로"], hint: "원인이 없으면 결과가 있을 수 없다는 뜻입니다." },
  { id: 26, question: "약방에 ___", answer: "감초", options: ["감초", "인삼", "녹용", "대추"], hint: "어떤 일에나 빠짐없이 끼어드는 사람이나 물건을 비유적으로 이르는 말입니다." },
  { id: 27, question: "작은 ___가 맵다", answer: "고추", options: ["고추", "마늘", "파", "양파"], hint: "몸집이 작은 사람이 큰 사람보다 재주가 뛰어나고 야무짐을 비유적으로 이르는 말입니다." },
  { id: 28, question: "___ 구멍에도 볕 들 날 있다", answer: "쥐", options: ["쥐", "개", "소", "토끼"], hint: "몹시 고생을 하는 사람도 좋은 운수가 터질 날이 있다는 희망적인 말입니다." },
  { id: 29, question: "천 리 길도 ___부터", answer: "한 걸음", options: ["한 걸음", "두 걸음", "달리기", "준비"], hint: "아무리 큰일이라도 그 시작은 작은 것부터 비롯된다는 뜻입니다." },
  { id: 30, question: "칼로 ___ 베기", answer: "물", options: ["물", "무", "두부", "오이"], hint: "싸움을 해도 금방 화해하게 된다는 뜻으로, 부부 싸움을 이를 때 쓰는 말입니다." },
  { id: 31, question: "___ 심은 데 콩 나고 팥 심은 데 팥 난다", answer: "콩", options: ["콩", "쌀", "보리", "수수"], hint: "모든 일은 원인에 따라 결과가 생긴다는 뜻입니다." },
  { id: 32, question: "하늘의 ___ 따기", answer: "별", options: ["별", "달", "해", "구름"], hint: "이루기가 매우 어려운 것을 비유적으로 이르는 말입니다." },
  { id: 33, question: "___도 제 말 하면 온다", answer: "호랑이", options: ["호랑이", "사자", "곰", "늑대"], hint: "깊은 산에 있는 호랑이조차 저에 대하여 이야기하면 찾아온다는 뜻으로, 남을 흉보지 말라는 경계의 뜻입니다." },
  { id: 34, question: "개구리 ___ 적 생각 못한다", answer: "올챙이", options: ["올챙이", "알", "청개구리", "두꺼비"], hint: "형편이 나아진 뒤에 지난날의 미천하던 때를 생각지 않고 잘난 듯이 버릇없이 구는 것을 비꼬는 말입니다." },
  { id: 35, question: "공든 ___이 무너지랴", answer: "탑", options: ["탑", "성", "집", "담"], hint: "공들여 한 일은 헛되이 돌아가지 않는다는 뜻입니다." },
];

const TOTAL_QUESTIONS = 10;

// --- Main Component ---

export function ProverbGame({ gameId: _gameId = "proverb-match" }: ProverbGameProps) {
  const router = useRouter();

  // State
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [problems, setProblems] = useState<ProverbProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0 && selectedAnswer === null) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // handleTimeUp logic inline to avoid dependency cycle
            handleAnswer(null); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft, selectedAnswer]); // Removed handleAnswer dependency since it's stable or we can move logic

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startProblem = (level: number, _index: number) => {
    const config = LEVEL_CONFIGS[level];
    setTimeLeft(config.timeLimit);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const startGame = (level: number) => {
    setCurrentLevel(level);

    // Shuffle problems and options
    const shuffledData = [...PROVERBS_DATA].sort(() => Math.random() - 0.5);
    const gameProblems = shuffledData.slice(0, TOTAL_QUESTIONS).map((problem) => ({
      ...problem,
      options: [...problem.options].sort(() => Math.random() - 0.5),
    }));

    setProblems(gameProblems);
    setCurrentProblemIndex(0);
    setScore(0);
    setGameState("playing");
    
    startProblem(level, 0);
  };

  const handleAnswer = (answer: string | null) => {
    if (selectedAnswer !== null) return; // Prevent double click

    const PROBLEM = problems[currentProblemIndex];
    if (!PROBLEM) return;
    
    const correct = answer === PROBLEM.answer;

    setSelectedAnswer(answer || "TIME_UP");
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 10 * LEVEL_CONFIGS[currentLevel].scoreMultiplier);
    }

    // Move to next problem after short delay
    setTimeout(() => {
      if (currentProblemIndex < TOTAL_QUESTIONS - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        startProblem(currentLevel, currentProblemIndex + 1);
      } else {
        setGameState("result");
      }
    }, 1500);
  };

  const handleRestart = () => {
    setGameState("intro");
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">속담 맞추기</h1>
            <p className="text-indigo-100 text-lg">빈칸에 알맞은 단어를 넣어 속담을 완성하세요!</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">난이도를 선택하세요</h2>
              <p className="text-gray-500">난이도가 높을수록 제한 시간이 짧아집니다!</p>
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
                      {LEVEL_CONFIGS[level].timeLimit}초
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
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-xl font-bold text-blue-600">📜</div>
                  <h4 className="font-bold text-gray-900 mb-2">1. 속담 읽기</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">빈칸이 있는 속담이 화면에 나타납니다.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">⚡</div>
                  <h4 className="font-bold text-gray-900 mb-2">2. 정답 선택</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">제한 시간 안에 알맞은 단어를 선택하세요.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-2xl">💡</div>
                  <h4 className="font-bold text-gray-900 mb-2">3. 힌트 확인</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">어려울 때는 힌트를 참고하세요.</p>
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
          <p className="text-gray-500 mb-8">모든 문제를 풀었습니다.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-indigo-50 p-4 rounded-xl">
               <p className="text-indigo-600 text-sm font-semibold mb-1">최종 점수</p>
               <p className="text-3xl font-bold text-indigo-900">{Math.round(score)}점</p>
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

  const currentProblem = problems[currentProblemIndex] || { question: "", options: [], hint: "" };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <button onClick={handleRestart} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium">
             <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">그만하기</span>
           </button>
           <h1 className="text-2xl font-bold text-gray-900">속담 맞추기</h1>
           <div className="w-20"></div>
        </div>

        {/* Status Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between mb-6">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase">문제</span>
            <p className="font-bold text-gray-900 text-xl"><span className="text-indigo-600">{currentProblemIndex + 1}</span> / {TOTAL_QUESTIONS}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase">점수</span>
            <p className="font-bold text-indigo-600 text-xl">{Math.round(score)}</p>
          </div>
           <div className={`flex flex-col items-end ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
            <span className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Time</span>
            <p className="font-mono font-bold text-2xl">{timeLeft}초</p>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden mb-6">
          <div className="bg-amber-100 p-8 md:p-12 text-center border-b border-amber-200">
            <h2 className="text-2xl md:text-4xl font-bold text-amber-900 leading-relaxed word-keep-all">
              {currentProblem.question && currentProblem.question.split("___").map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block border-b-4 border-dashed border-amber-800 min-w-[3ch] mx-2 text-transparent select-none bg-white/50 rounded px-2">
                       {/* Placeholder */} ???
                    </span>
                  )}
                </React.Fragment>
              ))}
            </h2>
          </div>
          
          <div className="p-6 bg-amber-50/50">
             <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-100">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm md:text-base font-medium">{currentProblem.hint}</p>
             </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentProblem.options && currentProblem.options.map((option, idx) => {
            let stateClass = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-300";
            if (selectedAnswer) {
              if (option === currentProblem.answer) {
                 stateClass = "bg-green-100 border-green-500 text-green-800 shadow-md ring-1 ring-green-500";
              } else if (option === selectedAnswer) {
                 stateClass = "bg-red-100 border-red-300 text-red-800 opacity-80";
              } else {
                 stateClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
              }
            }

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                className={`
                  p-6 rounded-xl border-2 text-xl font-bold transition-all flex items-center justify-between
                  ${stateClass}
                `}
              >
                <span>{option}</span>
                {selectedAnswer && option === currentProblem.answer && (
                   <CheckCircle className="w-6 h-6 text-green-600" />
                )}
                 {selectedAnswer && option === selectedAnswer && option !== currentProblem.answer && (
                   <XCircle className="w-6 h-6 text-red-500" />
                )}
              </motion.button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
