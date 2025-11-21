# Vue.js ChatGPT App

ChatGPT API를 연동한 AI 채팅 애플리케이션입니다.

## 기능

- 🤖 **ChatGPT API 연동** - 실시간 AI 대화
- 💬 스트리밍 응답 (타이핑 효과)
- 🔑 API 키 관리 (브라우저 로컬 스토리지)
- 📱 반응형 UI
- ⚡ 실시간 로딩 상태 및 에러 처리
- 🎨 그린-에메랄드 테마

## 프로젝트 구조

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.vue      # 메인 채팅 컨테이너
│   │   ├── MessageItem.vue        # 메시지 아이템 렌더러
│   │   └── ApiKeySettings.vue     # API 키 설정 모달
│   └── messages/
│       ├── TextMessage.vue        # 텍스트 메시지 컴포넌트
│       ├── ImageMessage.vue       # 이미지 메시지 컴포넌트
│       ├── AudioMessage.vue       # 음성 메시지 컴포넌트
│       ├── VideoMessage.vue       # 동영상 메시지 컴포넌트
│       └── MapMessage.vue         # 지도 메시지 컴포넌트
├── composables/
│   ├── useChat.js                 # ChatGPT 연동 로직
│   └── useChatDemo.js             # 데모 응답 생성 로직
├── services/
│   └── openai.js                  # OpenAI API 서비스
├── types/
│   └── message.js                 # 메시지 타입 정의
├── App.vue                        # 루트 컴포넌트
├── main.js                        # 앱 진입점
└── style.css                      # 전역 스타일
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. OpenAI API 키 설정

**방법 1: 앱 내에서 설정 (권장)**
1. 개발 서버 실행 후 앱에서 "🔒 API 키" 버튼 클릭
2. OpenAI API 키 입력
3. 저장 (브라우저 로컬 스토리지에 저장됨)

**방법 2: 환경 변수 설정**
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집하여 API 키 입력
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

**OpenAI API 키 발급:**
1. [OpenAI Platform](https://platform.openai.com/api-keys) 접속
2. 로그인 후 "Create new secret key" 클릭
3. 생성된 API 키 복사 (한 번만 표시되므로 안전하게 보관)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 사용 방법

1. **API 키 설정**: 우측 상단 "🔒 API 키" 버튼 클릭하여 OpenAI API 키 입력
2. **대화 시작**: 메시지 입력창에 질문이나 명령 입력
3. **실시간 응답**: ChatGPT의 응답이 스트리밍 방식으로 표시됨

## 주요 기능 설명

### ChatGPT API 연동

- **스트리밍 응답**: 실시간으로 AI 응답을 받아 타이핑 효과 구현
- **대화 히스토리 관리**: 이전 대화 맥락을 유지하며 자연스러운 대화
- **에러 처리**: API 호출 실패 시 사용자 친화적인 에러 메시지 표시

### API 키 관리

- 로컬 스토리지에 안전하게 저장
- 모달 UI를 통한 간편한 설정
- 키 설정 여부를 시각적으로 표시

### 확장 가능성

**다양한 메시지 타입 지원 준비됨:**
- 텍스트, 이미지, 음성, 동영상, 지도 컴포넌트 포함
- `src/composables/useChatDemo.js`에서 데모 응답 확인 가능

**커스터마이징:**
- `src/services/openai.js`에서 모델 변경 가능 (gpt-3.5-turbo ↔ gpt-4)
- `temperature`, `max_tokens` 등 파라미터 조정
- 시스템 프롬프트 커스터마이징

## 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 기술 스택

- **Vue 3** (Composition API)
- **Vite** (빌드 도구)
- **OpenAI API** (ChatGPT)
- **Fetch API** (스트리밍 지원)

## 주의사항

⚠️ **API 키 보안**
- API 키는 절대 공개 저장소에 커밋하지 마세요
- `.env` 파일은 `.gitignore`에 포함되어 있습니다
- 프로덕션 환경에서는 백엔드 서버를 통해 API 호출하는 것을 권장합니다

💰 **비용 관리**
- OpenAI API는 사용량에 따라 과금됩니다
- [사용량 대시보드](https://platform.openai.com/usage)에서 모니터링하세요
- `max_tokens` 설정으로 응답 길이 제한 가능

## 문제 해결

**API 키 오류:**
```
API 키가 설정되지 않았습니다
```
→ API 키 설정 버튼을 클릭하여 OpenAI API 키를 입력하세요

**CORS 에러:**
```
Access to fetch has been blocked by CORS policy
```
→ 브라우저에서 직접 OpenAI API를 호출하므로, 로컬 개발 환경에서는 문제없습니다. 프로덕션에서는 백엔드 프록시 사용을 권장합니다.

**응답이 느린 경우:**
- 네트워크 상태 확인
- OpenAI API 서버 상태 확인: [Status Page](https://status.openai.com/)
