// app/dashboard/create-work/page.tsx

"use client";

import { ChevronLeft, ChevronRight, Info, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// A4(210x297mm), 신국판(152x225mm)
const SIZE_PRESETS = {
  A4: { label: "A4 (210×297mm)", w: 210, h: 297, aspect: 210 / 297 },
  SHIN: { label: "신국판 (152×225mm)", w: 152, h: 225, aspect: 152 / 225 },
} as const;

type SizeKey = keyof typeof SIZE_PRESETS;

// 커버 타입을 API 스키마에 맞게 수정
type CoverType = 'soft_matte' | 'hard' | 'none';
type InnerPaper = 'plain' | 'none';
type Orientation = 'portrait' | 'landscape';

type CreateOptions = {
  size: SizeKey;
  coverType: CoverType;
  innerPaper: InnerPaper;
  orientation: Orientation;
  template?: string | null;
};

export default function NewWorkSetupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const template = params.get("template");

  const [opts, setOpts] = useState<CreateOptions>({
    size: "A4",
    coverType: "soft_matte",
    innerPaper: "plain",
    orientation: "portrait",
    template,
  });

  // 직전 선택 기억 (localStorage)
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("xui.newwork.opts");
    if (saved) {
      try {
        const v = JSON.parse(saved) as Partial<CreateOptions>;
        setOpts((o) => ({ ...o, ...v, template }));
      } catch {
        // JSON 파싱 오류 시 무시
      }
    }
  }, [template]);

  useEffect(() => {
    localStorage.setItem("xui.newwork.opts", JSON.stringify(opts));
  }, [opts]);

  const aspect = useMemo(() => SIZE_PRESETS[opts.size].aspect, [opts.size]);

  const handleContinue = () => {
    // API 스키마에 맞는 파라미터로 에디터 페이지로 이동
    const q = new URLSearchParams({
      template: opts.template ?? "blank",
      size: opts.size,
      cover: opts.coverType,
      paper: opts.innerPaper,
      orientation: opts.orientation,
    }).toString();
    router.push(`/dashboard/create-work/editor?${q}`);
  };

  // 커버 타입 라벨 함수
  const getCoverTypeLabel = (type: CoverType): string => {
    switch (type) {
      case 'soft_matte': return '소프트커버 무광';
      case 'hard': return '하드커버';
      case 'none': return '커버 없음';
      default: return type;
    }
  };

  const getCoverTypeDescription = (type: CoverType): string => {
    switch (type) {
      case 'soft_matte': return '지문/난반사에 강함';
      case 'hard': return '고급스러운 양장 제본';
      case 'none': return '디지털 미리보기 전용';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-[1920px] px-2 sm:px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">작품 만들기</h2>
              <p className="text-xs sm:text-sm text-gray-600">사이즈, 커버, 내지를 선택해주세요</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1920px] px-2 sm:px-3 py-2">
        <div className="flex gap-2 h-[calc(100vh-8rem)]">
          {/* Preview - 큰 영역 */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border-2 border-gray-200 bg-white p-2 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Info className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">실시간 미리보기</h2>
                </div>
              </div>

              <div className="mt-2 flex justify-center items-center gap-6 h-[calc(100%-3rem)]">
                {/* Cover mock */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-600 mb-3">표지</div>
                  <div
                    className="relative rounded-lg border border-gray-300 shadow-lg"
                    style={{ 
                      width: opts.size === 'A4' ? '420px' : '380px',
                      height: opts.size === 'A4' ? '594px' : '562px',
                      background: opts.coverType === 'hard' 
                        ? 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)' 
                        : opts.coverType === 'soft_matte'
                        ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}
                  >
                    {/* 무광 오버레이 */}
                    {opts.coverType === 'soft_matte' && (
                      <div className="absolute inset-0 rounded-lg bg-white/10 [background:repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_2px,transparent_2px,transparent_6px)]" />
                    )}
                    
                    {/* 하드커버 효과 */}
                    {opts.coverType === 'hard' && (
                      <div className="absolute inset-0 rounded-lg border-2 border-amber-800/30 shadow-inner" />
                    )}
                    
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center text-base text-gray-700">
                        {getCoverTypeLabel(opts.coverType)}
                        <div className="mt-2 text-sm text-gray-500">
                          {SIZE_PRESETS[opts.size].label.split(' ')[0]}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">(세로)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inner paper mock */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-600 mb-3">내지</div>
                  <div
                    className="relative rounded-lg border border-gray-200 bg-white shadow-lg"
                    style={{ 
                      width: opts.size === 'A4' ? '420px' : '380px',
                      height: opts.size === 'A4' ? '594px' : '562px'
                    }}
                  >
                    {opts.innerPaper === "plain" ? (
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center text-base text-gray-700">
                          일반지 내지
                          <div className="mt-3 text-sm text-gray-500">내용 페이지</div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center text-base text-gray-400">내지 선택 안함</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls - 사이드바 */}
          <div className="w-80 flex-shrink-0">
            <div className="rounded-xl border-2 border-gray-200 bg-white p-2 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">인쇄 사양 선택</h3>
              </div>
              
              {/* Size */}
              <fieldset className="mb-3">
                <legend className="text-sm font-semibold text-gray-800 mb-2">사이즈</legend>
                <div className="space-y-1">
                  {(
                    [
                      { key: "A4", help: "일반 문서/보고서 규격" },
                      { key: "SHIN", help: "국내 단행본에 많이 쓰는 규격" },
                    ] as Array<{ key: SizeKey; help: string }>
                  ).map((s) => (
                    <label
                      key={s.key}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200 ${
                        opts.size === s.key
                          ? "border-teal-500 bg-teal-600 text-white shadow-md"
                          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold truncate ${opts.size === s.key ? 'text-white' : 'text-gray-900'}`}>{SIZE_PRESETS[s.key].label}</div>
                        <div className={`text-xs truncate ${opts.size === s.key ? 'text-teal-100' : 'text-gray-500'}`}>{s.help}</div>
                      </div>
                      <input
                        type="radio"
                        name="size"
                        className="h-4 w-4 flex-shrink-0 ml-3 text-teal-600"
                        checked={opts.size === s.key}
                        onChange={() => setOpts((o) => ({ ...o, size: s.key }))}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Cover Type */}
              <fieldset className="mb-3">
                <legend className="text-sm font-semibold text-gray-800 mb-2">커버 타입</legend>
                <div className="space-y-1">
                  {(['soft_matte', 'hard', 'none'] as CoverType[]).map((type) => (
                    <label
                      key={type}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200 ${
                        opts.coverType === type
                          ? "border-teal-500 bg-teal-600 text-white shadow-md"
                          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                      } ${type === 'hard' ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold truncate ${opts.coverType === type ? 'text-white' : 'text-gray-900'}`}>
                          {getCoverTypeLabel(type)}
                          {type === 'hard' && <span className={`text-xs ml-2 ${opts.coverType === type ? 'text-teal-100' : 'text-gray-500'}`}>(준비중)</span>}
                        </div>
                        <div className={`text-xs truncate ${opts.coverType === type ? 'text-teal-100' : 'text-gray-500'}`}>{getCoverTypeDescription(type)}</div>
                      </div>
                      <input
                        type="radio"
                        name="coverType"
                        className="h-4 w-4 flex-shrink-0 ml-3 text-teal-600"
                        checked={opts.coverType === type}
                        onChange={() => setOpts((o) => ({ ...o, coverType: type }))}
                        disabled={type === 'hard'} // 하드커버는 준비중
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Inner paper */}
              <fieldset className="mb-3">
                <legend className="text-sm font-semibold text-gray-800 mb-2">내지</legend>
                <div className="space-y-1">
                  {(
                    [
                      { key: "plain", label: "일반지" },
                      { key: "none", label: "선택 안함" },
                    ] as Array<{ key: InnerPaper; label: string }>
                  ).map((it) => (
                    <label
                      key={it.key}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200 ${
                        opts.innerPaper === it.key
                          ? "border-teal-500 bg-teal-600 text-white shadow-md"
                          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold truncate ${opts.innerPaper === it.key ? 'text-white' : 'text-gray-900'}`}>{it.label}</div>
                        <div className={`text-xs truncate ${opts.innerPaper === it.key ? 'text-teal-100' : 'text-gray-500'}`}>{it.key === "plain" ? "내지에 일반 용지 사용" : "파일만 생성"}</div>
                      </div>
                      <input
                        type="radio"
                        name="innerPaper"
                        className="h-4 w-4 flex-shrink-0 ml-3 text-teal-600"
                        checked={opts.innerPaper === it.key}
                        onChange={() => setOpts((o) => ({ ...o, innerPaper: it.key }))}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Summary */}
              <div className="mb-3 rounded-xl border-2 border-gray-200 bg-gray-50 p-2">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">선택 요약</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="inline-flex items-center rounded-lg bg-teal-600 px-2 py-1.5 text-white font-medium">
                    📏 {SIZE_PRESETS[opts.size].label.split(' ')[0]}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-teal-600 px-2 py-1.5 text-white font-medium">
                    📖 {getCoverTypeLabel(opts.coverType).split(' ')[0]}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-teal-600 px-2 py-1.5 text-white font-medium col-span-2 justify-center">
                    📄 {opts.innerPaper === "plain" ? "일반지" : "내지없음"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleContinue}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors"
                >
                  작품 만들기 시작
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}