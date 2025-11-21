# 해외여행보험 약관 기반 챗봇 설계 문서

## 1. 문서 목적 및 범위

-   **목적**
    -   해외여행보험 사고(휴대품 도난, 해외 질병/상해 등)에 대해 고객이
        자연어로 말하면 약관/내부 매뉴얼 기반으로 필요한 서류, 행동,
        병원/경찰서 위치까지 안내하는 챗봇 시스템을 설계한다.
-   **대상**
    -   프론트엔드(Vue)
    -   백엔드(Spring Boot)
    -   외부 API(GPT, Embedding, Google Places)
-   **범위**
    -   요구사항 정의, 비즈니스/기술 설계, RAG(약관 검색), GPT 프롬프트,
        지도 연동

------------------------------------------------------------------------

## 2. 주요 시나리오 예시

### Case 1: 프랑스 파리 태블릿 도난

1.  고객: "누가 아이패드를 훔쳐갔어"
2.  분류: 휴대품 손해
3.  약관 검색 → 필요 서류 도출
4.  고객 안내: 경찰서 신고 + Police Report
5.  "근처 경찰서를 알려드릴까요?"
6.  Google Places로 지도에 표시
7.  귀국 후 추가 서류 + 청구절차 안내

### Case 2: 일본 도쿄 발목 삠/고열

1.  고객: "발목 삐끗했어" 또는 "열이 39도야"
2.  분류: 해외 의료비
3.  약관 검색 → 필요 서류 도출
4.  "근처 병원을 알려드릴까요?"
5.  Google Places로 병원 표시
6.  귀국 후 추가 서류 + 청구절차 안내

------------------------------------------------------------------------

## 3. 주요 개념 정의

-   **Coverage Type(담보 유형)**
    -   personal_belongings\
    -   overseas_medical
-   **Document Type(서류 유형)**
    -   overseas_docs\
    -   home_docs
-   **Place Type**
    -   hospital\
    -   police
-   **RAG (Retrieval-Augmented Generation)**
    -   약관 텍스트를 청크로 나누어 임베딩 후 검색하여 GPT에 제공

------------------------------------------------------------------------

## 4. 기능 요구사항

### 4.1 자연어 사고 인식

-   고객 발화를 GPT로 분석해 사고 구조화(JSON)
-   coverageType, item, symptom, needPolice/hospital 등 도출

### 4.2 약관 기반 필요 서류/행동 안내

-   RAG 검색으로 약관 조항 조회
-   해외에서 준비할 서류, 귀국 후 서류 구분
-   즉시 조치(경찰 신고/병원 방문) 안내

### 4.3 병원/경찰서 위치 안내

-   Vue에서 Google Places API 호출
-   지도 + 리스트 제공

### 4.4 청구 접수 안내

-   1666-5075 전화
-   온라인 청구 URL
-   디스클레이머 표시

------------------------------------------------------------------------

## 5. 비기능 요구사항

### 5.1 성능

-   3‒5초 내 전체 응답

### 5.2 보안/개인정보

-   주민번호 등 금지
-   민감정보 입력 시 차단/경고

### 5.3 규제 준수

-   "지급 여부는 약관 및 심사 결과에 따름" 고지 필수

### 5.4 기술 제약

-   GPT/Embedding 외부 통신 필수

------------------------------------------------------------------------

## 6. 전체 아키텍처

    Vue Front ───► Spring Boot Backend ───► GPT API
        │                 │
        │                 ├──► Embedding / Vector DB (약관)
        │
        └──► Google Maps / Places (프론트 직접 호출)

------------------------------------------------------------------------

## 7. 백엔드(Spring Boot) 설계

### 7.1 주요 모듈

-   ChatController
-   ChatService
-   AccidentClassifier (GPT)
-   TermsRetriever (RAG)
-   ClaimGuideGenerator (GPT)
-   GptClient / EmbeddingClient
-   PolicyIngestionService (약관 인덱싱)

### 7.2 API 예시

#### `/api/chat/message` (POST)

**Request**

``` json
{
  "sessionId": "optional",
  "userText": "프랑스 파리에서 아이패드를 도난당함"
}
```

**Response**

``` json
{
  "assistantMessages": [...],
  "structuredResult": {
    "coverageType": "personal_belongings",
    "needPolice": true,
    "overseasDocs": [...],
    "homeDocs": [...]
  }
}
```

------------------------------------------------------------------------

## 8. 약관 처리 방법 (RAG)

### 8.1 데이터 소스

-   여행자보험 약관 PDF
-   청구 매뉴얼

### 8.2 사전 처리

1.  텍스트 추출\
2.  청크 분할\
3.  메타데이터 부여\
4.  Embedding 생성\
5.  Vector DB 저장

### 8.3 검색

-   사고 요약 기반 embedding 생성
-   Vector DB에서 관련 청크 top-k 조회
-   GPT에 청크 전달해 '약관 기반 답변' 생성

------------------------------------------------------------------------

## 9. GPT 프롬프트 설계

### 9.1 사고 분류(Classification)

**System**

    당신은 라이나손해보험 여행보험 사고 분류 시스템…
    coverage_type 기준:
    - 도난/분실/파손 → personal_belongings
    - 다침/질병 → overseas_medical
    JSON으로만 응답

**User**

    프랑스 파리에서 아이패드를 도난당했어

**Response**

``` json
{
  "coverage_type": "personal_belongings",
  "need_police": true,
  "country": "France",
  "city": "Paris",
  "item": "아이패드"
}
```

------------------------------------------------------------------------

### 9.2 청구 가이드 생성 (RAG 기반)

**입력** - 사고 요약 JSON - 약관 청크들

**출력(JSON)**

``` json
{
  "overseas_actions": [...],
  "home_actions": [...],
  "overseas_docs": [...],
  "home_docs": [...],
  "need_police": true,
  "need_hospital": false,
  "customer_friendly_summary": "...",
  "disclaimer": "보험금 지급 여부는 약관 및 심사 결과에 따라..."
}
```

------------------------------------------------------------------------

## 10. 프론트(Vue) 설계 요약

-   채팅창 + 지도 영역
-   상태머신(step):
    -   idle → 사고분류 → 병원/경찰서 제안 → 지도 표시 → 청구 안내
-   Google Places는 프론트에서 직접 호출

------------------------------------------------------------------------

## 11. 예외 처리

-   GPT 실패 시: "지금 정확한 정보를 가져오지 못했습니다"\
-   Vector DB 실패 시: 기본 고정 안내 문구 제공\
-   Google Maps 실패 시: "위치 권한을 확인해주세요"

------------------------------------------------------------------------

## 12. 향후 확장

-   담보 확장
-   다국어 지원
-   관리자 화면(약관 업로드/인덱싱)
-   상담원 연계
