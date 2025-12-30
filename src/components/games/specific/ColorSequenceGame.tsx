"use client";

import React, { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

type ColorKey = "red" | "green" | "blue" | "yellow";
type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

const COLOR_ORDER: ColorKey[] = ["red", "green", "blue", "yellow"];

const COLOR_MAP: Record<ColorKey, { bg: string; active: string }> = {
  red: { bg: "bg-red-500", active: "bg-red-300" },
  green: { bg: "bg-green-500", active: "bg-green-300" },
  blue: { bg: "bg-blue-500", active: "bg-blue-300" },
  yellow: { bg: "bg-yellow-400", active: "bg-yellow-200" },
};

// 난이도별 초기 시퀀스 길이
const SEQUENCE_LENGTH_BY_LEVEL: Record<DifficultyLevel, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
};

const DIFFICULTY_COLORS = {
  1: "from-blue-400 to-blue-600",
  2: "from-purple-400 to-purple-600",
  3: "from-pink-400 to-pink-600",
  4: "from-orange-400 to-orange-600",
  5: "from-red-400 to-red-600",
};

interface Props {
  gameId?: string;
}

function randomColor(): ColorKey {
  const i = Math.floor(Math.random() * COLOR_ORDER.length);
  return COLOR_ORDER[i];
}

export function ColorSequenceGame({ gameId = "color-sequence" }: Props) {
  // 게임 상태
  const [gameState, setGameState] = useState<'selection' | 'playing' | 'result'>('selection');
  const [level, setLevel] = useState<DifficultyLevel>(1);
  const [sequence, setSequence] = useState<ColorKey[]>([]);
  const [userSeq, setUserSeq] = useState<ColorKey[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState<ColorKey | null>(null);
  const [round, setRound] = useState(0);
  const [time, setTime] = useState(0);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string>("");
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // 게임 타이머
  useEffect(() => {
    if (gameState === 'playing' && sequence.length > 0) {
      const interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, sequence]);

  const initialLengthForLevel = (lv: DifficultyLevel) => SEQUENCE_LENGTH_BY_LEVEL[lv];

  const playSequence = async (seq: ColorKey[]) => {
    setIsPlaying(true);
    setMessage("시퀀스를 기억하세요...");
    // 시퀀스 시작 전 준비 시간
    await new Promise((r) => (timerRef.current = window.setTimeout(r, 500)));
    
    for (let i = 0; i < seq.length; i++) {
      setActiveColor(seq[i]);
      await new Promise((r) => (timerRef.current = window.setTimeout(r, 600)));
      setActiveColor(null);
      await new Promise((r) => (timerRef.current = window.setTimeout(r, 250)));
    }
    setIsPlaying(false);
    setMessage("색상 버튼을 누르세요!");
  };

  const startGame = async () => {
    const len = initialLengthForLevel(level);
    const initial = Array.from({ length: len }).map(() => randomColor());
    setSequence(initial);
    setUserSeq([]);
    setRound(1);
    setTime(0);
    setSuccess(false);
    setMessage("");
    setGameState('playing');
    startTimeRef.current = Date.now();
    await playSequence(initial);
  };

  const nextRound = async () => {
    const next = [...sequence, randomColor()];
    setSequence(next);
    setUserSeq([]);
    setRound((r) => r + 1);
    setMessage("다음 라운드...");
    
    // 라운드 전환 시간
    await new Promise((r) => (timerRef.current = window.setTimeout(r, 1500)));
    
    await playSequence(next);
  };

  const handleButton = async (c: ColorKey) => {
    if (isPlaying) return;
    
    // 현재 sequence와 비교하기 위해 인덱스 계산
    const idx = userSeq.length;
    
    // 먼저 검증
    if (idx >= sequence.length || sequence[idx] !== c) {
      // 틀렸음 - 게임 종료
      setMessage("❌ 틀렸습니다!");
      setIsPlaying(true);
      
      console.log("Wrong input!", {
        expectedColor: idx < sequence.length ? sequence[idx] : "undefined",
        clickedColor: c,
        userSeqLength: userSeq.length,
        sequenceLength: sequence.length,
      });
      
      // API에 실패 점수 저장
      try {
        await fetch(`/api/games/${gameId}/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: false, round, level, time }),
        });
      } catch (err) {
        console.error("Failed to save score", err);
      }
      
      setTimeout(() => {
        setSuccess(false);
        setGameState('result');
      }, 1000);
      return;
    }
    
    // 맞음 - userSeq에 추가
    const nextUser = [...userSeq, c];
    setUserSeq(nextUser);
    
    // 입력이 맞음 - 진행 중
    setMessage(`✅ 맞습니다! (${nextUser.length}/${sequence.length})`);
    
    if (nextUser.length === sequence.length) {
      // 라운드 클리어
      setMessage("🎉 라운드 성공!");
      setIsPlaying(true);
      setSuccess(true);
      
      // 계속 진행 가능한지 확인 (최대 라운드 설정 가능)
      const maxRounds = 10; // 최대 10 라운드까지만 진행
      
      if (round >= maxRounds) {
        // 최대 라운드 도달 - 게임 종료
        try {
          await fetch(`/api/games/${gameId}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, round, level, time }),
          });
        } catch (err) {
          console.error("Failed to save score", err);
        }
        
        setTimeout(() => {
          setGameState('result');
        }, 1500);
      } else {
        // 다음 라운드로 진행
        setTimeout(() => {
          nextRound();
        }, 1500);
      }
    }
  };

  // 선택 화면
  if (gameState === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-gray-900">색상 순서 기억하기</h1>
            <p className="text-lg text-gray-600">컴퓨터가 보여주는 색상 순서를 기억하세요!</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">난이도 선택</h2>
              <div className="grid grid-cols-5 gap-3">
                {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setLevel(lv)}
                    className={`p-4 rounded-lg font-bold text-white transition transform hover:scale-105 ${
                      level === lv
                        ? `bg-gradient-to-br ${DIFFICULTY_COLORS[lv]} ring-4 ring-offset-2 ring-yellow-400 shadow-xl`
                        : `bg-gradient-to-br ${DIFFICULTY_COLORS[lv]} shadow-md hover:shadow-lg opacity-75 hover:opacity-100`
                    }`}
                  >
                    <div className="text-3xl mb-2">Lv.{lv}</div>
                    <div className="text-xs leading-relaxed">{SEQUENCE_LENGTH_BY_LEVEL[lv]}개</div>
                    {level === lv && <div className="absolute top-2 right-2 text-lg">✓</div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.history.back()}
                className="px-8 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold shadow-md"
              >
                돌아가기
              </button>
              <button
                onClick={() => startGame()}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md hover:shadow-lg"
              >
                시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (gameState === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center space-y-6">
          <div className={`text-6xl font-bold ${success ? 'text-green-600' : 'text-red-600'}`}>
            {success ? '🎉' : '❌'}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            {success ? '라운드 클리어!' : '게임 종료'}
          </h2>

          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold">난이도</span>
              <span className="text-2xl font-bold text-gray-900">Lv.{level}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold">도달 라운드</span>
              <span className="text-2xl font-bold text-gray-900">{round}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold">소요 시간</span>
              <span className="text-2xl font-bold text-gray-900">{time}초</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setGameState('selection');
                setLevel(1);
                setSequence([]);
                setUserSeq([]);
                setRound(0);
                setTime(0);
                setSuccess(false);
              }}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold shadow-md"
            >
              다시하기
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-bold shadow-md"
            >
              나가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 게임 플레이 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">색상 순서 기억하기</h1>
            <p className="text-gray-600">난이도 Lv.{level} | 라운드 {round}</p>
          </div>
          <button
            onClick={() => setGameState('selection')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            난이도 선택
          </button>
        </div>

        {/* 타이머 */}
        <div className="text-center">
          <div className="inline-block bg-white rounded-lg px-6 py-3 shadow-md">
            <p className="text-gray-600 text-sm font-semibold">소요 시간</p>
            <p className="text-4xl font-bold text-blue-600">{time}초</p>
          </div>
        </div>

        {/* 게임 버튼 */}
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
          {COLOR_ORDER.map((cKey) => {
            const active = activeColor === cKey;
            const cls = `${active ? COLOR_MAP[cKey].active : COLOR_MAP[cKey].bg} rounded-full h-32 w-32 flex items-center justify-center text-white text-xl font-bold shadow-lg cursor-pointer hover:shadow-xl transition transform`;
            return (
              <motion.button
                key={cKey}
                disabled={isPlaying}
                onClick={() => handleButton(cKey)}
                whileHover={{ scale: isPlaying ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cls}
              >
                {/* 색상으로 시각화 */}
              </motion.button>
            );
          })}
        </div>

        {/* 상태 메시지 */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700 min-h-[32px]">
            {message}
          </p>
          <p className="text-sm text-gray-600">
            {userSeq.length} / {sequence.length} 입력
          </p>
        </div>
      </div>
    </div>
  );
}

export default ColorSequenceGame;
