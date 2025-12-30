# 게임 컴포넌트 라이브러리 사용 가이드

## 📋 개요

`src/components/games/` 에는 인지 게임 개발을 위한 재사용 가능한 컴포넌트들이 있습니다.

## 📁 구조

```
src/components/games/
├── GameLayout.tsx                  # 기본 레이아웃 컴포넌트
├── AssessmentProgress.tsx          # 진행률 표시 컴포넌트
├── UserInfoForm.tsx                # 사용자 정보 입력 폼
├── QuestionForm.tsx                # Yes/No 답변 폼
├── LikertScaleForm.tsx             # 5점 척도 답변 폼
├── IntroScreen.tsx                 # 게임 시작 화면
├── ResultDisplay.tsx               # 결과 표시 컴포넌트
├── GameCard.tsx                    # 게임 카드 (선택)
├── index.ts                        # 메인 export 파일
└── specific/                       # 게임별 전용 컴포넌트
    ├── DeathAnxietyAssessment.tsx  # 죽음 불안 평가
    ├── DepressionAssessment.tsx    # 우울증 평가
    ├── SocialNetworkAssessment.tsx # 사회 네트워크 평가
    └── index.ts
```

## 🎮 기본 컴포넌트 사용법

### 1. GameLayout - 기본 레이아웃

모든 게임 페이지의 최상위 래퍼 컴포넌트입니다.

```tsx
import { GameLayout } from "@/components/games";

<GameLayout
  onBack={() => router.back()}
  title="게임 제목"
  description="게임 설명"
  showBackButton={true}
  gradientFrom="from-blue-50"
  gradientTo="to-indigo-50/30"
  gradientVia="via-purple-50/30"
>
  {/* 게임 콘텐츠 */}
</GameLayout>
```

### 2. IntroScreen - 시작 화면

게임 규칙과 소개를 표시합니다.

```tsx
import { IntroScreen } from "@/components/games";

<IntroScreen
  title="게임 이름"
  description="게임 설명"
  estimatedTime="10-15분"
  icon={<Brain className="h-6 w-6 text-blue-600" />}
  features={[
    {
      title: "기능 1",
      description: "설명 1"
    },
    {
      title: "기능 2",
      description: "설명 2"
    }
  ]}
  onStart={() => setStep("info")}
/>
```

### 3. UserInfoForm - 사용자 정보 입력

```tsx
import { UserInfoForm } from "@/components/games";

<UserInfoForm
  userInfo={userInfo}
  onUserInfoChange={setUserInfo}
  onNext={() => setStep("questions")}
  title="기본 정보 입력"
  description="정확한 평가를 위해 정보를 입력해주세요"
/>
```

### 4. QuestionForm - Yes/No 질문

```tsx
import { QuestionForm } from "@/components/games";

<QuestionForm
  question="질문 내용?"
  description="질문에 대한 설명"
  currentAnswer={answers[questionId] || null}
  onAnswer={(answer) => setAnswers({ ...answers, [questionId]: answer })}
/>
```

### 5. LikertScaleForm - 5점 척도 질문

```tsx
import { LikertScaleForm } from "@/components/games";

const options = [
  { value: 1, label: "전혀 그렇지 않다" },
  { value: 2, label: "그렇지 않다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" }
];

<LikertScaleForm
  question="질문 내용?"
  description="질문에 대한 설명"
  options={options}
  currentAnswer={answers[questionId] || null}
  onAnswer={(score) => setAnswers({ ...answers, [questionId]: score })}
/>
```

### 6. AssessmentProgress - 진행률

```tsx
import { AssessmentProgress } from "@/components/games";

<AssessmentProgress
  currentStep={currentQuestionIndex + 1}
  totalSteps={questions.length}
  onPrevious={handlePrev}
  onNext={handleNext}
  canGoPrevious={currentQuestionIndex > 0}
  canGoNext={currentAnswer !== null}
/>
```

### 7. ResultDisplay - 결과 표시

```tsx
import { ResultDisplay } from "@/components/games";

<ResultDisplay
  title="평가 결과"
  message="정상 범위입니다"
  description="설명 텍스트"
  score={80}
  maxScore={100}
  level="normal"
  icon={<CheckCircle2 className="h-10 w-10" />}
  recommendations={[
    {
      title: "권장사항 1",
      description: "설명"
    }
  ]}
  onRetry={handleRetry}
  onExit={handleExit}
/>
```

### 8. GameCard - 게임 선택 카드

```tsx
import { GameCard } from "@/components/games";

<GameCard
  id="game-1"
  title="게임 제목"
  description="게임 설명"
  href="/path/to/game"
  status="not-started"
  icon={<Brain className="h-8 w-8 text-white" />}
  gradient="from-blue-500 to-indigo-600"
  badge="추천"
  estimatedTime="10분"
/>
```

## 🎯 게임별 전용 컴포넌트

### DeathAnxietyAssessment 사용 예

```tsx
import { DeathAnxietyAssessment } from "@/components/games/specific";
import { deathAnxietyQuestions } from "./data/questions";
import { saveAssessment } from "@/lib/save-assessment";

export default function DeathAnxietyPage() {
  const router = useRouter();

  return (
    <DeathAnxietyAssessment
      questions={deathAnxietyQuestions}
      onResultSave={async (data) => {
        await saveAssessment({
          type: "death-anxiety",
          ...data
        });
      }}
      onBack={() => router.back()}
    />
  );
}
```

### DepressionAssessment 사용 예

```tsx
import { DepressionAssessment } from "@/components/games/specific";

<DepressionAssessment
  questions={depressionQuestions}
  onResultSave={handleSaveResult}
  onBack={() => router.back()}
/>
```

### SocialNetworkAssessment 사용 예

```tsx
import { SocialNetworkAssessment } from "@/components/games/specific";

<SocialNetworkAssessment
  questions={lsnsQuestions}
  likertOptions={likertScaleOptions}
  onResultSave={handleSaveResult}
  onBack={() => router.back()}
/>
```

## 🎨 커스터마이징

### 색상 테마 변경

```tsx
<GameLayout
  gradientFrom="from-slate-50"
  gradientTo="to-pink-50/30"
  gradientVia="via-rose-50/30"
>
  {/* 내용 */}
</GameLayout>
```

### 결과 레벨별 색상

- `"normal"` - 초록색 (정상)
- `"mild"` - 파란색 (경미)
- `"moderate"` - 노란색 (중등)
- `"severe"` - 빨간색 (심각)

## 📝 데이터 흐름

1. **IntroScreen** → 게임 소개
2. **UserInfoForm** → 사용자 정보 수집
3. **QuestionForm/LikertScaleForm** (반복) → 질문과 답변
4. **AssessmentProgress** → 진행 상황 표시
5. **ResultDisplay** → 최종 결과 표시

## 💾 상태 관리

모든 전용 컴포넌트는 `localStorage`를 사용하여 진행 상황을 자동으로 저장합니다.
사용자가 중단 후 재방문시 계속 진행할 수 있습니다.

## 🔧 확장하기

새로운 게임을 추가하려면:

1. `src/components/games/specific/`에 새 컴포넌트 생성
2. 필요한 기본 컴포넌트들 import
3. 게임 로직 구현
4. `specific/index.ts`에 export 추가

```tsx
// 예: 새로운 게임 컴포넌트
import { GameLayout, IntroScreen, QuestionForm } from "../index";

export function NewGameAssessment({ ... }) {
  // 구현
}
```

## 📚 타입 정의

```tsx
interface UserInfo {
  age: string;
  gender: "" | "male" | "female";
  date: string;
}

interface Question {
  id: number;
  question: string;
  description?: string;
}

type GameStatus = "not-started" | "in-progress" | "completed";
```

---

이 컴포넌트 라이브러리를 사용하면 모든 인지 게임을 일관된 방식으로 빠르게 개발할 수 있습니다! 🚀
