# 노션 API 연동 가이드

## 📋 사전 준비

### 1. 노션 Integration 생성

1. **노션 Integration 페이지 접속**
   - https://www.notion.so/my-integrations 접속
   - 로그인 후 "New integration" 클릭

2. **Integration 설정**
   - **Name**: `Mindring Development Log` (원하는 이름)
   - **Type**: Internal
   - **Associated workspace**: 본인의 워크스페이스 선택
   - "Submit" 클릭

3. **API Token 복사**
   - 생성된 Integration 페이지에서 "Internal Integration Token" 복사
   - 이 토큰을 `.env` 파일에 저장합니다

### 2. 노션 페이지 준비

1. **새 페이지 생성 또는 기존 페이지 선택**
   - 노션에서 개발 내역을 작성할 페이지 생성
   - 페이지는 비어있어야 합니다 (기존 내용이 있으면 덮어쓰기 됨)

2. **페이지 ID 추출**
   - 노션 페이지 URL에서 페이지 ID 추출
   - 예: `https://www.notion.so/My-Page-abc123def456ghi789jkl012mno345pq`
   - 페이지 ID: `abc123def456ghi789jkl012mno345pq` (32자리 문자열, 하이픈 제거)
   - 또는 페이지 설정 → "Copy link" → URL에서 ID 추출

3. **Integration 권한 부여**
   - 노션 페이지에서 우측 상단 "..." 메뉴 클릭
   - "Add connections" 선택
   - 생성한 Integration 선택하여 연결

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성 (또는 기존 파일에 추가):

```env
NOTION_API_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PAGE_ID=abc123def456ghi789jkl012mno345pq
```

**주의사항:**
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
- 토큰과 페이지 ID는 절대 공개하지 마세요

## 🚀 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 스크립트 실행

```bash
npm run notion:sync
```

또는 직접 실행:

```bash
node scripts/notion-sync.js
```

## 📝 실행 결과

스크립트가 성공적으로 실행되면:

1. `DEVELOPMENT_LOG.md` 파일을 읽습니다
2. 마크다운을 노션 블록 형식으로 변환합니다
3. 노션 페이지에 자동으로 작성합니다

```
✅ 마크다운 파일을 읽었습니다.
✅ 150개의 블록으로 변환했습니다.
✅ 블록 1-100 추가 완료
✅ 블록 101-150 추가 완료

🎉 노션에 개발 내역이 성공적으로 작성되었습니다!
```

## ⚠️ 주의사항

1. **페이지 권한**
   - Integration이 페이지에 접근 권한이 있어야 합니다
   - 페이지에서 "Add connections"로 Integration을 연결해야 합니다

2. **기존 내용**
   - 스크립트는 페이지에 내용을 **추가**합니다
   - 기존 내용을 덮어쓰지 않으므로, 빈 페이지에서 실행하는 것을 권장합니다

3. **API 제한**
   - 노션 API는 초당 3회 요청 제한이 있습니다
   - 대용량 문서의 경우 시간이 걸릴 수 있습니다

4. **마크다운 변환**
   - 일부 복잡한 마크다운 문법은 완벽하게 변환되지 않을 수 있습니다
   - 필요시 노션에서 직접 수정하세요

## 🔧 문제 해결

### 오류: "object_not_found"
- 페이지 ID가 올바른지 확인하세요
- Integration이 페이지에 연결되어 있는지 확인하세요

### 오류: "unauthorized"
- API 토큰이 올바른지 확인하세요
- Integration이 활성화되어 있는지 확인하세요

### 오류: "rate_limited"
- API 요청 제한에 걸렸습니다
- 잠시 후 다시 시도하세요

## 📚 참고 자료

- [노션 API 공식 문서](https://developers.notion.com/)
- [노션 API JavaScript SDK](https://github.com/makenotion/notion-sdk-js)

