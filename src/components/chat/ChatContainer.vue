<template>
  <div class="chat-container">
    <!-- 채팅 헤더 -->
    <div class="chat-header">
      <div class="header-content">
        <div class="logo-container">
          <img src="/lina-logo.png" alt="Lina" class="lina-logo" @error="handleLogoError">
        </div>
        <div class="header-text">
          <h2>해외여행보험 청구 도우미</h2>
          <p class="subtitle">Claim Helper Chatbot</p>
        </div>
      </div>
    </div>

    <!-- 메시지 리스트 영역 -->
    <div class="messages-container" ref="messagesContainer">
      <!-- 환영 메시지 (메시지가 없을 때) -->
      <div v-if="messages.length === 0" class="welcome-message">
        <h3>👋 안녕하세요!</h3>
        <p>라이나 해외여행보험 Claim Helper입니다.</p>
        <p>사고 상황을 말씀해주시면 도움을 드리겠습니다.</p>
      </div>

      <!-- 메시지 목록 -->
      <MessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
        @action="handleActionClick"
      />

      <!-- 로딩 인디케이터 -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="error" class="error-message">
        ⚠️ {{ error }}
      </div>
    </div>

    <!-- 퀵 액션 버튼 영역 -->
    <div class="quick-actions">
      <div class="quick-actions-label">빠른 테스트</div>
      <div class="quick-buttons">
        <button @click="sendQuickMessage('텍스트')" class="quick-button" :disabled="isLoading">
          💬 텍스트
        </button>
        <button @click="sendQuickMessage('이미지')" class="quick-button" :disabled="isLoading">
          🖼️ 이미지
        </button>
        <button @click="sendQuickMessage('음성')" class="quick-button" :disabled="isLoading">
          🎵 음성
        </button>
        <button @click="sendQuickMessage('동영상')" class="quick-button" :disabled="isLoading">
          🎬 동영상
        </button>
        <button @click="sendQuickMessage('지도')" class="quick-button" :disabled="isLoading">
          🗺️ 지도
        </button>
      </div>
    </div>

    <!-- 입력 영역 -->
    <div class="input-container">
      <input
        v-model="inputText"
        @keyup.enter="handleSendMessage"
        type="text"
        placeholder="메시지를 입력하세요..."
        class="message-input"
      />
      <button @click="handleSendMessage" class="send-button" :disabled="!inputText.trim() || isLoading">
        <span v-if="!isLoading">전송</span>
        <span v-else>...</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import MessageItem from './MessageItem.vue'
import { useChat } from '../../composables/useChat.js'
import { CLAIM_DOCUMENTS } from '../../data/claimDocuments.js'

// ChatGPT 연동 composable 사용
const { messages, isLoading, error, sendMessageStream } = useChat()

// 로컬 상태
const inputText = ref('')
const messagesContainer = ref(null)

// 메시지 전송 처리
const handleSendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  inputText.value = '' // 입력창 비우기
  await scrollToBottom()

  // ChatGPT API 호출 (스트리밍 방식)
  await sendMessageStream(text)
  await scrollToBottom()
}

// 퀵 버튼으로 메시지 전송
const sendQuickMessage = async (message) => {
  if (isLoading.value) return

  // "지도" 버튼은 테스트용으로 바로 지도 표시
  if (message === '지도') {
    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      type: 'text',
      sender: 'user',
      content: message,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)
    await scrollToBottom()

    // 지도 메시지 추가 (서울시청 예시)
    const mapMessage = {
      id: Date.now() + 1,
      type: 'map',
      sender: 'bot',
      content: {
        lat: 37.5665,
        lng: 126.9780,
        address: '서울특별시 중구 세종대로 110 (서울시청)',
        zoom: 15
      },
      timestamp: Date.now()
    }
    messages.value.push(mapMessage)
    await scrollToBottom()
    return
  }

  // 나머지 버튼들은 GPT API 호출
  await scrollToBottom()
  await sendMessageStream(message)
  await scrollToBottom()
}

// ActionButtons 클릭 처리
const handleActionClick = async (actionData) => {
  console.log('Action 클릭:', actionData)

  if (isLoading.value) return

  const { type } = actionData

  // 각 액션 타입에 따른 처리
  switch (type) {
    case 'search_police':
      // "주변 경찰서 찾기" -> GPT에 전달하여 실제 경찰서 검색
      await sendMessageStream('주변 경찰서를 찾아주세요')

      // 1초 후 레포트 요청 메시지 작성 버튼 표시
      setTimeout(async () => {
        const policeReportButtonMessage = {
          id: Date.now(),
          type: 'action_buttons',
          sender: 'bot',
          content: {
            message: '경찰서에서 사용할 영어 메시지가 필요하신가요?',
            actions: [
              {
                label: '📝 레포트 요청 메시지 작성',
                icon: '📝',
                action: 'show_police_report_message',
                style: 'info'
              }
            ]
          },
          timestamp: Date.now()
        }
        messages.value.push(policeReportButtonMessage)
        await scrollToBottom()
      }, 2000)
      break

    case 'search_hospital':
      // "주변 병원 찾기" -> GPT에 자연어로 전달하여 searchPlace 함수 호출 유도
      await sendMessageStream('주변 병원을 찾아주세요')
      break

    case 'show_overseas_docs':
      // "꼭 준비해야하는 서류 (현지)" 선택
      {
        const { coverageType, needPolice, needHospital } = actionData.data
        const documentsData = CLAIM_DOCUMENTS[coverageType]

        // 현지 서류 리스트 표시
        const overseasDocsMessage = {
          id: Date.now(),
          type: 'document_list',
          sender: 'bot',
          content: {
            coverageType: coverageType,
            overseas: documentsData.overseas,
            home: [] // 귀국 서류는 빈 배열
          },
          timestamp: Date.now()
        }
        messages.value.push(overseasDocsMessage)
        await scrollToBottom()

        // 추가 옵션 버튼 (1초 후)
        setTimeout(async () => {
          const actions = []

          // 위치 안내 버튼
          if (needPolice || needHospital) {
            const locationLabel = needPolice ? '경찰서' : '병원'
            actions.push({
              label: `${locationLabel} 위치를 안내해드릴까요?`,
              icon: needPolice ? '🚔' : '🏥',
              action: needPolice ? 'search_police' : 'search_hospital',
              style: 'primary'
            })
          }

          // 귀국 서류 보기 버튼
          actions.push({
            label: '귀국 서류를 보여드릴까요?',
            icon: '🏠',
            action: 'show_home_docs',
            style: 'info',
            data: { coverageType }
          })

          // 상담원 연결 버튼
          actions.push({
            label: '상담원 연결',
            icon: '☎️',
            action: 'call_agent',
            style: 'secondary'
          })

          const optionsMessage = {
            id: Date.now(),
            type: 'action_buttons',
            sender: 'bot',
            content: {
              message: '더 필요하신 게 있으신가요?',
              actions: actions
            },
            timestamp: Date.now()
          }
          messages.value.push(optionsMessage)
          await scrollToBottom()

          // Follow-up 메시지 - 30초 후
          setTimeout(async () => {
            const followUpMessage = {
              id: Date.now(),
              type: 'text',
              sender: 'bot',
              content: '혹시 서류 발급은 잘 진행하고 계신가요? 📋',
              timestamp: Date.now()
            }
            messages.value.push(followUpMessage)
            await scrollToBottom()

            // Follow-up 액션 버튼 (0.8초 후)
            setTimeout(async () => {
              const followUpActions = {
                id: Date.now(),
                type: 'action_buttons',
                sender: 'bot',
                content: {
                  message: '진행 상황을 알려주시면 더 도와드릴 수 있어요',
                  actions: [
                    {
                      label: '✅ 네, 발급 받았어요',
                      icon: '✅',
                      action: 'documents_received',
                      style: 'success'
                    },
                    {
                      label: '⏳ 아직 진행 중이에요',
                      icon: '⏳',
                      action: 'documents_pending',
                      style: 'info'
                    },
                    {
                      label: '❓ 도움이 필요해요',
                      icon: '❓',
                      action: 'need_help',
                      style: 'secondary'
                    }
                  ]
                },
                timestamp: Date.now()
              }
              messages.value.push(followUpActions)
              await scrollToBottom()
            }, 800)
          }, 30000)
        }, 1000)
      }
      break

    case 'show_home_docs':
      // "귀국 후 준비할 서류" 선택
      {
        const { coverageType } = actionData.data
        const documentsData = CLAIM_DOCUMENTS[coverageType]

        // 귀국 서류 리스트 표시
        const homeDocsMessage = {
          id: Date.now(),
          type: 'document_list',
          sender: 'bot',
          content: {
            coverageType: coverageType,
            overseas: [], // 현지 서류는 빈 배열
            home: documentsData.home
          },
          timestamp: Date.now()
        }
        messages.value.push(homeDocsMessage)
        await scrollToBottom()

        // 상담원 연결 옵션 (1초 후)
        setTimeout(async () => {
          const contactMessage = {
            id: Date.now(),
            type: 'action_buttons',
            sender: 'bot',
            content: {
              message: '더 궁금한 점이 있으시면 언제든 문의해 주세요!',
              actions: [
                {
                  label: '상담원 연결',
                  icon: '☎️',
                  action: 'call_agent',
                  style: 'secondary'
                }
              ]
            },
            timestamp: Date.now()
          }
          messages.value.push(contactMessage)
          await scrollToBottom()
        }, 1000)
      }
      break

    case 'call_agent':
      // "상담원 연결" -> 안내 메시지 표시
      const agentMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: '☎️ 상담원과 직접 통화하시겠어요?\n\n📞 라이나손해보험 고객센터\n1666-5075\n\n⏰ 평일 09:00 ~ 18:00\n(주말 및 공휴일 제외)\n\n친절한 상담원이 자세히 안내해 드립니다!',
        timestamp: Date.now()
      }
      messages.value.push(agentMessage)
      await scrollToBottom()
      break

    case 'documents_received':
      // "서류 발급 완료" 응답 - 단계별 안내
      // 1단계: 전화 안내
      const step1Message = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: '👍 수고 많으셨어요!\n\n이제 귀국하신 후 청구 절차를 진행하시면 됩니다.\n\n먼저 라이나손해보험 고객센터(1666-5075)로 전화하셔서 주민등록번호 입력을 요청해 주세요.',
        timestamp: Date.now()
      }
      messages.value.push(step1Message)
      await scrollToBottom()

      // 2단계: 홈페이지 안내 (1초 후)
      setTimeout(() => {
        const step2Message = {
          id: Date.now(),
          type: 'action_buttons',
          sender: 'bot',
          content: {
            message: '전화 후 아래 버튼을 눌러 보험금 청구를 접수하실 수 있어요.',
            actions: [
              {
                label: '청구하러가기',
                icon: '🔗',
                url: 'https://ec.aceinsurance.co.kr/jsp/acelimited/mainCert.jsp?utm_source=chubb&utm_medium=internal&utm_campaign=internal&utm_content=mob&utm_term=',
                style: 'primary'
              }
            ]
          },
          timestamp: Date.now()
        }
        messages.value.push(step2Message)
        scrollToBottom()

        // 3단계: 상품 소개 제안 (1초 후)
        setTimeout(() => {
          const step3Message = {
            id: Date.now(),
            type: 'text',
            sender: 'bot',
            content: '💡 여행 후에도 일상생활 속 다양한 위험에 대비하고 싶으신가요?\n\n라이나생명의 든든한 보험 상품을 소개해 드릴 수 있어요.',
            timestamp: Date.now()
          }
          messages.value.push(step3Message)
          scrollToBottom()

          // 4단계: 마케팅 동의 버튼 (1초 후)
          setTimeout(() => {
            const marketingConsentMessage = {
              id: Date.now(),
              type: 'action_buttons',
              sender: 'bot',
              content: {
                message: '상품 안내를 받아보시겠어요?',
                actions: [
                  {
                    label: '예, 받고 싶어요',
                    icon: '✅',
                    action: 'accept_marketing',
                    style: 'primary'
                  },
                  {
                    label: '괜찮아요',
                    icon: '❌',
                    action: 'decline_marketing',
                    style: 'secondary'
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(marketingConsentMessage)
            scrollToBottom()
          }, 1000)
        }, 1000)
      }, 1000)
      break

    case 'documents_pending':
      // "아직 진행 중" 응답
      const pendingMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: '네, 충분히 이해합니다! ⏳\n\n서류 발급은 시간이 걸릴 수 있어요.\n천천히 준비하시면 됩니다.\n\n혹시 어려운 점이 있으시면 언제든 말씀해 주세요!',
        timestamp: Date.now()
      }
      messages.value.push(pendingMessage)
      await scrollToBottom()
      break

    case 'need_help':
      // "도움 필요" 응답
      await sendMessageStream('서류 발급에 어려움이 있어요. 도와주세요.')
      break

    case 'accept_marketing':
      // "예" - 마케팅 동의
      const acceptMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: '감사합니다! 😊\n\n곧 맞춤형 보험 상품 정보를 안내해 드리겠습니다.\n\n더 궁금하신 점이 있으시면 고객센터(1666-5075)로 연락 주시거나, 저를 다시 불러주세요!',
        timestamp: Date.now()
      }
      messages.value.push(acceptMessage)
      await scrollToBottom()
      break

    case 'decline_marketing':
      // "아니오" - 마케팅 거부
      const declineMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: '네, 알겠습니다! 😊\n\n다른 도움이 필요하시면 언제든지\n고객센터(1666-5075)로 연락하시거나\n저를 다시 찾아주세요!\n\n항상 도와드릴 준비가 되어 있어요.',
        timestamp: Date.now()
      }
      messages.value.push(declineMessage)
      await scrollToBottom()
      break

    case 'show_police_report_message':
      // 경찰서 레포트 요청 영어 메시지 표시
      const policeReportMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: `📋 경찰서에서 사용할 영어 메시지입니다:

━━━━━━━━━━━━━━━━━━━━━━━

Hello, I would like to report an incident.

I am a traveler from South Korea and I need to file a police report for my travel insurance claim.

Details:
• Date of incident: [사고 발생 날짜]
• Location: [사고 발생 장소]
• What happened: [사고 내용 설명]
• Items lost/stolen (if applicable): [분실/도난 물품 목록]

Could you please help me file an official police report? I need this document for my insurance claim.

Thank you for your assistance.

━━━━━━━━━━━━━━━━━━━━━━━

💡 위 내용을 복사해서 경찰관에게 보여주시면 됩니다.
[  ] 안의 내용은 실제 정보로 채워주세요.`,
        timestamp: Date.now()
      }
      messages.value.push(policeReportMessage)
      await scrollToBottom()
      break

    default:
      console.warn('알 수 없는 액션 타입:', type)
  }
}

// 스크롤을 최하단으로 이동
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 메시지가 추가될 때마다 자동 스크롤
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// 로고 에러 핸들러 (로고 로드 실패 시 텍스트로 대체)
const handleLogoError = (event) => {
  event.target.style.display = 'none'
  const textLogo = document.createElement('div')
  textLogo.className = 'text-logo'
  textLogo.textContent = 'LINA'
  event.target.parentElement.appendChild(textLogo)
}
</script>

<style scoped>
.chat-container {
  width: 600px;
  height: 700px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 20px;
  /* 라이나 청록색 그라데이션 */
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-container {
  flex-shrink: 0;
}

.lina-logo {
  height: 32px;
  width: auto;
  /* 원본 로고 색상 표시 */
}

.text-logo {
  font-size: 24px;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
}

.header-text {
  flex: 1;
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.85;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
  scroll-behavior: smooth;
}

/* 스크롤바 스타일링 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 퀵 액션 버튼 영역 */
.quick-actions {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.quick-actions-label {
  font-size: 12px;
  color: #4DBFC8;
  margin-bottom: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-button {
  padding: 8px 14px;
  background: #F5F5F5;
  border: 2px solid transparent;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  color: #4B4E53;
  font-weight: 500;
}

/* 💬 텍스트 - 라이나 청록 */
.quick-button:nth-child(1) {
  border-color: #4DBFC8;
  color: #4DBFC8;
}

.quick-button:nth-child(1):hover:not(:disabled) {
  background: #4DBFC8;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 191, 200, 0.3);
}

/* 🖼️ 이미지 - 라이나 청록 밝게 */
.quick-button:nth-child(2) {
  border-color: #5ACCD5;
  color: #5ACCD5;
}

.quick-button:nth-child(2):hover:not(:disabled) {
  background: #5ACCD5;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(90, 204, 213, 0.3);
}

/* 🎵 음성 - 라이나 청록 중간 */
.quick-button:nth-child(3) {
  border-color: #3AA8B1;
  color: #3AA8B1;
}

.quick-button:nth-child(3):hover:not(:disabled) {
  background: #3AA8B1;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 168, 177, 0.3);
}

/* 🎬 동영상 - 라이나 청록 진하게 */
.quick-button:nth-child(4) {
  border-color: #2E8C94;
  color: #2E8C94;
}

.quick-button:nth-child(4):hover:not(:disabled) {
  background: #2E8C94;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 140, 148, 0.3);
}

/* 🗺️ 지도 - 라이나 청록 어둡게 */
.quick-button:nth-child(5) {
  border-color: #247078;
  color: #247078;
}

.quick-button:nth-child(5):hover:not(:disabled) {
  background: #247078;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(36, 112, 120, 0.3);
}

.quick-button:active:not(:disabled) {
  transform: translateY(0);
}

.quick-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-container {
  padding: 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  /* 라이나 청록 포커스 */
  border-color: #4DBFC8;
}

.send-button {
  padding: 12px 24px;
  /* 라이나 청록 그라데이션 */
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(77, 191, 200, 0.3);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(77, 191, 200, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 환영 메시지 */
.welcome-message {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.welcome-message h3 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #333;
}

.welcome-message p {
  margin: 8px 0;
  font-size: 14px;
}

.welcome-message .warning {
  color: #f59e0b;
  font-weight: 500;
  margin-top: 20px;
}

/* 로딩 인디케이터 */
.loading-indicator {
  display: flex;
  justify-content: flex-start;
  padding: 10px 0;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(1) {
  background: #4DBFC8;
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  background: #5ACCD5;
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  background: #3AA8B1;
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 에러 메시지 */
.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 10px;
}
</style>
