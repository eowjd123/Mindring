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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" /> 뒤로
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>템플릿: {template ?? "blank"}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent text-xl sm:text-2xl lg:text-3xl font-extrabold">
            인쇄 사양 선택
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            작품의 <strong>사이즈</strong>, <strong>커버</strong>, <strong>내지</strong>를 선택하고 방향을 설정하세요.
          </p>
        </div>

        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Preview - 큰 영역 */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm h-full">
              <h2 className="text-lg font-semibold text-gray-800">실시간 미리보기</h2>
              <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                <Info className="h-4 w-4" /> 화면 비율 미리보기(인쇄 비율과 근사)
              </p>

              <div className="mt-4 flex justify-center items-center gap-8 h-[calc(100%-4rem)]">
                {/* Cover mock */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-600 mb-3">표지</div>
                  <div
                    className="relative rounded-lg border border-gray-300 shadow-lg"
                    style={{ 
                      width: opts.size === 'A4' ? '300px' : '270px',
                      height: opts.size === 'A4' ? '424px' : '400px',
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
                        <div className="mt-3 text-sm text-gray-500">
                          {SIZE_PRESETS[opts.size].label}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          (세로)
                        </div>
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
                      width: opts.size === 'A4' ? '300px' : '270px',
                      height: opts.size === 'A4' ? '424px' : '400px'
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
          <div className="w-72 flex-shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm h-full overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">인쇄 사양 선택</h3>
              
              {/* Size */}
              <fieldset className="mb-3">
                <legend className="text-xs font-semibold text-gray-800 mb-2">사이즈</legend>
                <div className="space-y-1">
                  {(
                    [
                      { key: "A4", help: "일반 문서/보고서 규격" },
                      { key: "SHIN", help: "국내 단행본에 많이 쓰는 규격" },
                    ] as Array<{ key: SizeKey; help: string }>
                  ).map((s) => (
                    <label
                      key={s.key}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-2 py-1.5 text-xs shadow-sm transition ${
                        opts.size === s.key
                          ? "border-blue-500 bg-blue-50/70"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{SIZE_PRESETS[s.key].label}</div>
                        <div className="text-[10px] text-gray-500 truncate">{s.help}</div>
                      </div>
                      <input
                        type="radio"
                        name="size"
                        className="h-3 w-3 flex-shrink-0 ml-2"
                        checked={opts.size === s.key}
                        onChange={() => setOpts((o) => ({ ...o, size: s.key }))}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Cover Type */}
              <fieldset className="mb-3">
                <legend className="text-xs font-semibold text-gray-800 mb-2">커버 타입</legend>
                <div className="space-y-1">
                  {(['soft_matte', 'hard', 'none'] as CoverType[]).map((type) => (
                    <label
                      key={type}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-2 py-1.5 text-xs shadow-sm transition ${
                        opts.coverType === type
                          ? "border-indigo-500 bg-indigo-50/70"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${type === 'hard' ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {getCoverTypeLabel(type)}
                          {type === 'hard' && <span className="text-[10px] text-gray-500 ml-1">(준비중)</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{getCoverTypeDescription(type)}</div>
                      </div>
                      <input
                        type="radio"
                        name="coverType"
                        className="h-3 w-3 flex-shrink-0 ml-2"
                        checked={opts.coverType === type}
                        onChange={() => setOpts((o) => ({ ...o, coverType: type }))}
                        disabled={type === 'hard'} // 하드커버는 준비중
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Inner paper */}
              <fieldset className="mb-4">
                <legend className="text-xs font-semibold text-gray-800 mb-2">내지</legend>
                <div className="space-y-1">
                  {(
                    [
                      { key: "plain", label: "일반지" },
                      { key: "none", label: "선택 안함" },
                    ] as Array<{ key: InnerPaper; label: string }>
                  ).map((it) => (
                    <label
                      key={it.key}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-2 py-1.5 text-xs shadow-sm transition ${
                        opts.innerPaper === it.key
                          ? "border-emerald-500 bg-emerald-50/70"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{it.label}</div>
                        <div className="text-[10px] text-gray-500 truncate">{it.key === "plain" ? "내지에 일반 용지 사용" : "파일만 생성"}</div>
                      </div>
                      <input
                        type="radio"
                        name="innerPaper"
                        className="h-3 w-3 flex-shrink-0 ml-2"
                        checked={opts.innerPaper === it.key}
                        onChange={() => setOpts((o) => ({ ...o, innerPaper: it.key }))}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Summary */}
              <div className="mb-3 rounded-xl border border-gray-200 bg-white/80 p-2 text-xs text-gray-700">
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700 truncate">
                    📏 {SIZE_PRESETS[opts.size].label.split(' ')[0]}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-indigo-700 truncate">
                    📖 {getCoverTypeLabel(opts.coverType).split(' ')[0]}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700 truncate col-span-2 justify-center">
                    📄 {opts.innerPaper === "plain" ? "일반지" : "내지없음"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleContinue}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-gray-800"
                >
                  작품 만들기 시작
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm hover:bg-gray-50"
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