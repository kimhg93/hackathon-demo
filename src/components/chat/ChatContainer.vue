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
        <button class="dashboard-button" @click="handleGoToDashboard">
          <span class="button-icon">←</span>
          <span class="button-text">대시보드로 가기</span>
        </button>
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
        @updateMessage="handleUpdateMessage"
        @checklistConfirm="handleChecklistConfirm"
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
      <div class="quick-actions-label">빠른 문의</div>
      <div class="quick-buttons">
        <button @click="sendQuickMessage('가방을 도난당했어요')" class="quick-button" :disabled="isLoading">
          🎒 휴대품 도난
        </button>
        <button @click="sendQuickMessage('병원에 다녀왔어요')" class="quick-button" :disabled="isLoading">
          🏥 의료비 청구
        </button>
        <button @click="sendQuickMessage('주변 경찰서를 찾아주세요')" class="quick-button" :disabled="isLoading">
          🚔 경찰서 찾기
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
import { MessageType } from '../../types/message.js'
import { searchPlace } from '../../services/placeService.js'

// Props 정의
const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

// 사용자 정보 확인 (디버깅용)
watch(() => props.user, (newUser) => {
  console.log('🔍 ChatContainer - User Info:', {
    name: newUser?.name,
    policyNumber: newUser?.policyNumber,
    flightNumber: newUser?.insurance?.flightNumber,
    location: newUser?.location,
    hasMarketingConsent: !!newUser?.marketingConsent
  })
}, { immediate: true })

// 상수 정의
const CONSTANTS = {
  CUSTOMER_SERVICE_PHONE: '1666-5075',
  CLAIM_URL: 'https://ec.aceinsurance.co.kr/jsp/acelimited/mainCert.jsp?utm_source=chubb&utm_medium=internal&utm_campaign=internal&utm_content=mob&utm_term=',
  DELAYS: {
    SHORT: 800,
    MEDIUM: 1000,
    LONG: 2000,
    FOLLOW_UP: 30000
  }
}

// Events 정의
const emit = defineEmits(['progressUpdate', 'checklistComplete', 'goToDashboard'])

// 대시보드로 이동
const handleGoToDashboard = () => {
  emit('goToDashboard')
}

// ChatGPT 연동 composable 사용
const { messages, isLoading, error, sendMessageStream } = useChat()

// 로컬 상태
const inputText = ref('')
const messagesContainer = ref(null)

// 스크립트 정보 수집 상태
const scriptInfoCollection = ref({
  isCollecting: false,
  scriptType: null, // 'police' or 'hospital'
  coverageType: null, // 'personal_belongings' or 'overseas_medical'
  currentQuestion: null, // 현재 질문 필드
  collectedData: {}, // 수집된 정보
  questionsQueue: [], // 남은 질문들
  originalAccidentDescription: '' // 원본 사고 내용 저장
})

// 유틸리티 함수: 딜레이 후 메시지 추가
const addMessageWithDelay = async (messageData, delay) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      messages.value.push(messageData)
      await scrollToBottom()
      resolve()
    }, delay)
  })
}

// 스크립트 정보 수집: 다음 질문 물어보기
const askNextScriptQuestion = async () => {
  if (scriptInfoCollection.value.questionsQueue.length === 0) {
    // 모든 정보 수집 완료 -> 스크립트 생성
    await generatePersonalizedScript()
    return
  }

  const nextQuestion = scriptInfoCollection.value.questionsQueue.shift()
  scriptInfoCollection.value.currentQuestion = nextQuestion.field

  const questionMessage = {
    id: Date.now(),
    type: 'text',
    sender: 'bot',
    content: nextQuestion.question,
    timestamp: Date.now()
  }
  messages.value.push(questionMessage)
  await scrollToBottom()
}

// 맞춤형 스크립트 생성
const generatePersonalizedScript = async () => {
  scriptInfoCollection.value.isCollecting = false

  const scriptMessage = {
    id: Date.now(),
    type: 'script',
    sender: 'bot',
    content: {
      institutionType: scriptInfoCollection.value.scriptType,
      defaultLanguage: 'en',
      personalizedData: scriptInfoCollection.value.collectedData, // 수집된 정보 전달
      originalAccidentDescription: scriptInfoCollection.value.originalAccidentDescription // 원본 사고 내용 전달
    },
    timestamp: Date.now()
  }
  messages.value.push(scriptMessage)
  await scrollToBottom()

  // 프로그레스 3단계로 업데이트 (서류 발급)
  emit('progressUpdate', 3)

  // coverageType 임시 저장 (체크리스트에서 사용)
  const savedCoverageType = scriptInfoCollection.value.coverageType

  // 스크립트 정보 초기화
  scriptInfoCollection.value = {
    isCollecting: false,
    scriptType: null,
    coverageType: savedCoverageType, // 체크리스트 표시 시 사용하기 위해 유지
    currentQuestion: null,
    collectedData: {},
    questionsQueue: []
  }

  // 스크립트 후 체크리스트 확인 메시지 (4초 후)
  setTimeout(async () => {
    const checkQuestion = {
      id: Date.now(),
      type: 'text',
      sender: 'bot',
      content: '서류를 잘 발급받으셨나요? 📋',
      timestamp: Date.now()
    }
    messages.value.push(checkQuestion)
    await scrollToBottom()

    // 체크리스트 보기 버튼 (2초 후)
    setTimeout(async () => {
      const checklistButton = {
        id: Date.now(),
        type: 'action_buttons',
        sender: 'bot',
        content: {
          message: '서류 체크리스트를 보여드릴까요?',
          actions: [
            {
              label: '✅ 네, 체크리스트 보기',
              icon: '📋',
              action: 'show_checklist',
              style: 'primary',
              data: {
                coverageType: savedCoverageType
              }
            },
            {
              label: '⏳ 아직 준비 중이에요',
              icon: '⏳',
              action: 'documents_pending',
              style: 'secondary'
            }
          ]
        },
        timestamp: Date.now()
      }
      messages.value.push(checklistButton)
      await scrollToBottom()
    }, 2000)
  }, 4000)
}

// 메시지 전송 처리
const handleSendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  inputText.value = '' // 입력창 비우기

  // 스크립트 정보 수집 중이면 사용자 메시지 추가하고 정보 저장
  if (scriptInfoCollection.value.isCollecting) {
    // 사용자 메시지 추가 (수집 모드에서만)
    const userMessage = {
      id: Date.now(),
      type: 'text',
      sender: 'user',
      content: text,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)
    await scrollToBottom()

    const currentField = scriptInfoCollection.value.currentQuestion
    scriptInfoCollection.value.collectedData[currentField] = text

    // 다음 질문으로 진행
    await askNextScriptQuestion()
    return
  }

  // 일반 ChatGPT API 호출 (스트리밍 방식)
  // sendMessageStream이 사용자 메시지를 추가하므로 여기서는 추가하지 않음
  await sendMessageStream(text)
  await scrollToBottom()
}

// 퀵 버튼으로 메시지 전송
const sendQuickMessage = async (message) => {
  if (isLoading.value) return

  inputText.value = message
  await handleSendMessage()
}

// ActionButtons 클릭 처리
const handleActionClick = async (actionData) => {
  console.log('Action 클릭:', actionData)

  if (isLoading.value) return

  const { type } = actionData

  // 각 액션 타입에 따른 처리
  switch (type) {
    case 'search_police':
    case 'search_hospital':
      // "주변 경찰서/병원 찾기" -> 직접 장소 검색
      {
        const placeTypeForSearch = type === 'search_police' ? 'police' : 'hospital'
        const placeType = type === 'search_police' ? '경찰서' : '병원'
        
        try {
          // 사용자 위치 정보 활용
          const userLocation = props.user?.location

          console.log('📍 장소 검색 시작:', {
            placeType: placeTypeForSearch,
            userName: props.user?.name,
            userLocation: userLocation ? {
              city: userLocation.city,
              lat: userLocation.latitude,
              lng: userLocation.longitude
            } : 'No location',
            flightNumber: props.user?.insurance?.flightNumber
          })

          // 장소 검색 직접 호출
          const placeData = await searchPlace({
            placeType: placeTypeForSearch,
            useCurrentLocation: true,
            // 사용자 GPS 위치가 있으면 사용
            userLat: userLocation?.latitude,
            userLng: userLocation?.longitude
          })

          console.log('✅ 장소 검색 결과:', {
            name: placeData.name,
            address: placeData.address,
            lat: placeData.lat,
            lng: placeData.lng
          })

          // 지도 메시지 생성
          const mapMessage = {
            id: Date.now(),
            type: MessageType.MAP,
            sender: 'bot',
            content: {
              lat: placeData.lat,
              lng: placeData.lng,
              address: `${placeData.placeType}: ${placeData.name}\n${placeData.address}`,
              zoom: placeData.zoom || 15,
              allResults: placeData.allResults || [],
              currentIndex: placeData.currentIndex !== undefined ? placeData.currentIndex : 0,
              placeType: placeTypeForSearch,
              useCurrentLocation: true
            },
            timestamp: Date.now()
          }
          messages.value.push(mapMessage)
          await scrollToBottom()

          // 3초 후 확인 메시지 표시
          setTimeout(async () => {
            const confirmMessage = {
              id: Date.now(),
              type: 'action_buttons',
              sender: 'bot',
              content: {
                message: `찾으신 ${placeType}이(가) 도움이 되셨나요?`,
                actions: [
                  {
                    label: `✅ 네, 여기로 갈게요`,
                    icon: '👍',
                    action: type === 'search_police' ? 'confirm_police_location' : 'confirm_hospital_location',
                    style: 'primary',
                    data: actionData.data || {}
                  },
                  {
                    label: `다른 ${placeType}을(를) 찾아주세요`,
                    icon: '🔍',
                    action: type === 'search_police' ? 'search_next_police' : 'search_next_hospital',
                    style: 'secondary',
                    data: actionData.data || {}
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(confirmMessage)
            await scrollToBottom()
          }, 3000)
        } catch (error) {
          // 장소 검색 실패 시 에러 메시지
          const errorMessage = {
            id: Date.now(),
            type: MessageType.TEXT,
            sender: 'bot',
            content: `⚠️ ${placeType}를 찾을 수 없습니다: ${error.message}\n\n다시 시도해주시거나 직접 검색해주세요.`,
            timestamp: Date.now()
          }
          messages.value.push(errorMessage)
          await scrollToBottom()
        }
      }
      break

    case 'search_next_police':
    case 'search_next_hospital':
      // "다른 경찰서/병원 찾기" -> 저장된 검색 결과에서 다음 인덱스 사용
      {
        const placeTypeForSearch = type === 'search_next_police' ? 'police' : 'hospital'
        const placeTypeKorean = type === 'search_next_police' ? '경찰서' : '병원'
        
        // 이전 지도 메시지 찾기 (가장 최근 것)
        const previousMapMessage = [...messages.value]
          .reverse()
          .find(msg => msg.type === MessageType.MAP && 
                msg.content?.placeType === placeTypeForSearch)

        if (!previousMapMessage || !previousMapMessage.content.allResults) {
          // 이전 검색 결과가 없으면 새로 검색
          const searchMessage = type === 'search_next_police' ? '주변 경찰서를 찾아주세요' : '주변 병원을 찾아주세요'
          await sendMessageStream(searchMessage)
          
          setTimeout(async () => {
            const confirmMessage = {
              id: Date.now(),
              type: 'action_buttons',
              sender: 'bot',
              content: {
                message: `찾으신 ${placeTypeKorean}이(가) 도움이 되셨나요?`,
                actions: [
                  {
                    label: `✅ 네, 여기로 갈게요`,
                    icon: '👍',
                    action: type === 'search_next_police' ? 'confirm_police_location' : 'confirm_hospital_location',
                    style: 'primary',
                    data: actionData.data || {}
                  },
                  {
                    label: `다른 ${placeTypeKorean}을(를) 찾아주세요`,
                    icon: '🔍',
                    action: type === 'search_next_police' ? 'search_next_police' : 'search_next_hospital',
                    style: 'secondary',
                    data: actionData.data || {}
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(confirmMessage)
            await scrollToBottom()
          }, 3000)
          break
        }

        // 다음 인덱스 계산
        const currentIndex = previousMapMessage.content.currentIndex || 0
        const allResults = previousMapMessage.content.allResults || []
        const nextIndex = currentIndex + 1

        // 다음 결과가 있는지 확인
        if (nextIndex >= allResults.length) {
          const errorMessage = {
            id: Date.now(),
            type: 'text',
            sender: 'bot',
            content: `죄송합니다. 더 이상 찾을 수 있는 ${placeTypeKorean}이(가) 없습니다.`,
            timestamp: Date.now()
          }
          messages.value.push(errorMessage)
          await scrollToBottom()
          break
        }

        // 다음 결과 가져오기
        const nextPlace = allResults[nextIndex]
        const placeTypeName = type === 'search_next_police' ? '경찰서' : '병원'

        // 새로운 지도 메시지 생성
        const newMapMessage = {
          id: Date.now(),
          type: MessageType.MAP,
          sender: 'bot',
          content: {
            lat: nextPlace.lat,
            lng: nextPlace.lng,
            address: `${placeTypeName}: ${nextPlace.name}\n${nextPlace.address}`,
            zoom: 15,
            // 검색 결과 전체와 새로운 인덱스 저장
            allResults: allResults,
            currentIndex: nextIndex,
            placeType: placeTypeForSearch,
            useCurrentLocation: previousMapMessage.content.useCurrentLocation || false
          },
          timestamp: Date.now()
        }
        messages.value.push(newMapMessage)
        await scrollToBottom()

        // 3초 후 확인 메시지 표시
        setTimeout(async () => {
          const confirmMessage = {
            id: Date.now(),
            type: 'action_buttons',
            sender: 'bot',
            content: {
              message: `찾으신 ${placeTypeKorean}이(가) 도움이 되셨나요?`,
              actions: [
                {
                  label: `✅ 네, 여기로 갈게요`,
                  icon: '👍',
                  action: type === 'search_next_police' ? 'confirm_police_location' : 'confirm_hospital_location',
                  style: 'primary',
                  data: actionData.data || {}
                },
                {
                  label: `다른 ${placeTypeKorean}을(를) 찾아주세요`,
                  icon: '🔍',
                  action: type === 'search_next_police' ? 'search_next_police' : 'search_next_hospital',
                  style: 'secondary',
                  data: actionData.data || {}
                }
              ]
            },
            timestamp: Date.now()
          }
          messages.value.push(confirmMessage)
          await scrollToBottom()
        }, 3000)
      }
      break

    case 'confirm_document_guide':
      // "필요 서류를 안내해드릴까요?" 확인 후 서류 선택 버튼 표시
      {
        const { coverageType, needPolice, needHospital, originalAccidentDescription } = actionData.data || {}
        
        // 원본 사고 내용 저장
        scriptInfoCollection.value.originalAccidentDescription = originalAccidentDescription || ''

        // 프로그레스 1단계로 업데이트 (보장 확인 완료)
        emit('progressUpdate', 1)

        const documentSelectionMessage = {
          id: Date.now(),
          type: 'action_buttons',
          sender: 'bot',
          content: {
            message: '어떤 서류를 안내해드릴까요?',
            actions: [
              {
                label: '꼭 준비해야하는 서류 (현지)',
                icon: '📋',
                action: 'show_overseas_docs',
                style: 'primary',
                data: {
                  coverageType: coverageType,
                  needPolice: needPolice || false,
                  needHospital: needHospital || false
                }
              },
              {
                label: '귀국 후 준비할 서류',
                icon: '🏠',
                action: 'show_home_docs',
                style: 'info',
                data: {
                  coverageType: coverageType
                }
              }
            ]
          },
          timestamp: Date.now()
        }
        messages.value.push(documentSelectionMessage)
        await scrollToBottom()
      }
      break

    case 'show_overseas_docs':
      // "꼭 준비해야하는 서류 (현지)" 선택
      {
        const { coverageType, needPolice, needHospital } = actionData.data
        const documentsData = CLAIM_DOCUMENTS[coverageType]

        // 프로그레스 2단계로 업데이트 (서류 안내)
        emit('progressUpdate', 2)

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

        // 추가 옵션 버튼 (2초 후)
        setTimeout(async () => {
          const actions = []

          // 위치 안내 버튼
          if (needPolice || needHospital) {
            const locationLabel = needPolice ? '경찰서' : '병원'
            actions.push({
              label: `${locationLabel} 위치를 안내해드릴까요?`,
              icon: needPolice ? '🚔' : '🏥',
              action: needPolice ? 'search_police' : 'search_hospital',
              style: 'primary',
              data: { 
                coverageType, 
                needPolice, 
                needHospital,
                originalAccidentDescription: scriptInfoCollection.value.originalAccidentDescription 
              }
            })
          }

          // 귀국 서류 보기 버튼과 스킵 옵션
          actions.push({
            label: '귀국 서류를 보여드릴까요?',
            icon: '🏠',
            action: 'show_home_docs',
            style: 'info',
            data: { coverageType }
          })

          actions.push({
            label: '아니요, 괜찮아요',
            icon: '👍',
            action: 'skip_to_checklist',
            style: 'secondary',
            data: { coverageType }
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
        }, 2000)
      }
      break

    case 'show_home_docs':
      // "귀국 후 준비할 서류" 선택
      {
        const { coverageType } = actionData.data
        const documentsData = CLAIM_DOCUMENTS[coverageType]

        // 프로그레스 3단계로 업데이트 (서류 발급)
        emit('progressUpdate', 3)

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

        // 서류 확인 옵션 (2초 후)
        setTimeout(async () => {
          const checkQuestion = {
            id: Date.now(),
            type: 'text',
            sender: 'bot',
            content: '서류를 잘 발급받으셨나요? 📋',
            timestamp: Date.now()
          }
          messages.value.push(checkQuestion)
          await scrollToBottom()

          // 체크리스트 보기 버튼 (2초 후)
          setTimeout(async () => {
            const checklistButton = {
              id: Date.now(),
              type: 'action_buttons',
              sender: 'bot',
              content: {
                message: '서류 체크리스트를 보여드릴까요?',
                actions: [
                  {
                    label: '✅ 네, 체크리스트 보기',
                    icon: '📋',
                    action: 'show_checklist',
                    style: 'primary',
                    data: { coverageType }
                  },
                  {
                    label: '⏳ 아직 준비 중이에요',
                    icon: '⏳',
                    action: 'documents_pending',
                    style: 'secondary'
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(checklistButton)
            await scrollToBottom()
          }, 2000)
        }, 2000)
      }
      break

    case 'skip_to_checklist':
      // "아니요, 괜찮아요" - 귀국 서류 건너뛰고 서류 확인으로
      {
        const { coverageType } = actionData.data || {}
        
        // 프로그레스 3단계로 업데이트 (서류 발급)
        emit('progressUpdate', 3)

        // 서류 발급 확인 메시지
        setTimeout(async () => {
          const checkQuestion = {
            id: Date.now(),
            type: 'text',
            sender: 'bot',
            content: '서류를 잘 발급받으셨나요? 📋',
            timestamp: Date.now()
          }
          messages.value.push(checkQuestion)
          await scrollToBottom()

          // 체크리스트 보기 버튼 (2초 후)
          setTimeout(async () => {
            const checklistButton = {
              id: Date.now(),
              type: 'action_buttons',
              sender: 'bot',
              content: {
                message: '서류 체크리스트를 보여드릴까요?',
                actions: [
                  {
                    label: '✅ 네, 체크리스트 보기',
                    icon: '📋',
                    action: 'show_checklist',
                    style: 'primary',
                    data: {
                      coverageType: coverageType
                    }
                  },
                  {
                    label: '⏳ 아직 준비 중이에요',
                    icon: '⏳',
                    action: 'documents_pending',
                    style: 'secondary'
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(checklistButton)
            await scrollToBottom()
          }, 2000)
        }, 1000)
      }
      break

    case 'call_agent':
      // "상담원 연결" -> 안내 메시지 표시
      const agentMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: `☎️ 상담원과 직접 통화하시겠어요?\n\n📞 라이나손해보험 고객센터\n${CONSTANTS.CUSTOMER_SERVICE_PHONE}\n\n⏰ 평일 09:00 ~ 18:00\n(주말 및 공휴일 제외)\n\n친절한 상담원이 자세히 안내해 드립니다!`,
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
        content: `👍 수고 많으셨어요!\n\n이제 귀국하신 후 청구 절차를 진행하시면 됩니다.\n\n먼저 라이나손해보험 고객센터(${CONSTANTS.CUSTOMER_SERVICE_PHONE})로 전화하셔서 주민등록번호 입력을 요청해 주세요.`,
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
                url: CONSTANTS.CLAIM_URL,
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
        content: `감사합니다! 😊\n\n곧 맞춤형 보험 상품 정보를 안내해 드리겠습니다.\n\n더 궁금하신 점이 있으시면 고객센터(${CONSTANTS.CUSTOMER_SERVICE_PHONE})로 연락 주시거나, 저를 다시 불러주세요!`,
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
        content: `네, 알겠습니다! 😊\n\n다른 도움이 필요하시면 언제든지\n고객센터(${CONSTANTS.CUSTOMER_SERVICE_PHONE})로 연락하시거나\n저를 다시 찾아주세요!\n\n항상 도와드릴 준비가 되어 있어요.`,
        timestamp: Date.now()
      }
      messages.value.push(declineMessage)
      await scrollToBottom()
      break

    case 'confirm_police_location':
      // "네, 여기로 갈게요" (경찰서) - 스크립트 버튼 표시
      {
        const thanksMessage = {
          id: Date.now(),
          type: 'text',
          sender: 'bot',
          content: '좋아요! 경찰서 방문 시 사용할 스크립트를 준비해드릴게요. 📝',
          timestamp: Date.now()
        }
        messages.value.push(thanksMessage)
        await scrollToBottom()

        // 2초 후 스크립트 버튼 표시
        setTimeout(async () => {
          const policeScriptButtonMessage = {
            id: Date.now(),
            type: 'action_buttons',
            sender: 'bot',
            content: {
              message: '경찰서에서 사용할 스크립트가 필요하신가요?',
              actions: [
                {
                  label: '🔊 경찰서 방문 스크립트 보기',
                  icon: '📝',
                  action: 'show_police_script',
                  style: 'primary',
                  data: actionData.data || {} // coverageType 전달
                },
                {
                  label: '아니요, 혼자 힘으로 할 수 있어요!',
                  icon: '👍',
                  action: 'skip_script',
                  style: 'secondary',
                  data: actionData.data || {}
                }
              ]
            },
            timestamp: Date.now()
          }
          messages.value.push(policeScriptButtonMessage)
          await scrollToBottom()
        }, 2000)
      }
      break

    case 'confirm_hospital_location':
      // "네, 여기로 갈게요" (병원) - 스크립트 버튼 표시
      {
        const thanksMessage = {
          id: Date.now(),
          type: 'text',
          sender: 'bot',
          content: '좋아요! 병원 방문 시 사용할 스크립트를 준비해드릴게요. 📝',
          timestamp: Date.now()
        }
        messages.value.push(thanksMessage)
        await scrollToBottom()

        // 2초 후 스크립트 버튼 표시
        setTimeout(async () => {
          const hospitalScriptButtonMessage = {
            id: Date.now(),
            type: 'action_buttons',
            sender: 'bot',
            content: {
              message: '병원에서 사용할 스크립트가 필요하신가요?',
              actions: [
                {
                  label: '🔊 병원 방문 스크립트 보기',
                  icon: '🏥',
                  action: 'show_hospital_script',
                  style: 'primary',
                  data: actionData.data || {} // coverageType 전달
                },
                {
                  label: '아니요, 혼자 힘으로 할 수 있어요!',
                  icon: '👍',
                  action: 'skip_script',
                  style: 'secondary',
                  data: actionData.data || {}
                }
              ]
            },
            timestamp: Date.now()
          }
          messages.value.push(hospitalScriptButtonMessage)
          await scrollToBottom()
        }, 2000)
      }
      break

    case 'show_police_report_message':
    case 'show_police_script':
      // 경찰서 스크립트 작성을 위한 정보 수집 시작
      {
        const { coverageType, originalAccidentDescription } = actionData.data || {}

        const introMessage = {
          id: Date.now(),
          type: 'text',
          sender: 'bot',
          content: '경찰서 방문 시 사용할 스크립트를 작성해드리겠습니다! 📝\n\n몇 가지 정보가 필요해요.',
          timestamp: Date.now()
        }
        messages.value.push(introMessage)
        await scrollToBottom()

        // 정보 수집 시작
        scriptInfoCollection.value = {
          isCollecting: true,
          scriptType: 'police',
          coverageType: coverageType || 'personal_belongings', // 기본값
          currentQuestion: null,
          collectedData: {},
          questionsQueue: [
            { field: 'items', question: '어떤 물품을 도난/분실하셨나요?\n\n예시: 아이패드, 여권, 가방 등' },
            { field: 'date', question: '언제 발생했나요?\n\n예시: 2024년 1월 15일' },
            { field: 'time', question: '몇 시경에 발생했나요?\n\n예시: 오후 3시경, 14:00경' },
            { field: 'location', question: '어디에서 발생했나요?\n\n예시: 에펠탑 근처 카페, 호텔 로비' }
          ],
          originalAccidentDescription: originalAccidentDescription || scriptInfoCollection.value.originalAccidentDescription || '' // 원본 사고 내용 저장
        }

        // 첫 번째 질문 시작 (2초 후)
        setTimeout(async () => {
          await askNextScriptQuestion()
        }, 2000)
      }
      break

    case 'show_hospital_script':
      // 병원 스크립트 작성을 위한 정보 수집 시작
      {
        const { coverageType, originalAccidentDescription } = actionData.data || {}

        const introMessage = {
          id: Date.now(),
          type: 'text',
          sender: 'bot',
          content: '병원 방문 시 사용할 스크립트를 작성해드리겠습니다! 📝\n\n몇 가지 정보가 필요해요.',
          timestamp: Date.now()
        }
        messages.value.push(introMessage)
        await scrollToBottom()

        // 정보 수집 시작
        scriptInfoCollection.value = {
          isCollecting: true,
          scriptType: 'hospital',
          coverageType: coverageType || 'overseas_medical', // 기본값
          currentQuestion: null,
          collectedData: {},
          questionsQueue: [
            { field: 'symptoms', question: '어떤 증상이 있으신가요?\n\n예시: 발목 삠, 고열과 두통, 복통' },
            { field: 'date', question: '언제부터 증상이 시작되었나요?\n\n예시: 어제 오후부터, 2024년 1월 15일' },
            { field: 'time', question: '몇 시경인가요?\n\n예시: 오후 3시경, 14:00경' }
          ],
          originalAccidentDescription: originalAccidentDescription || scriptInfoCollection.value.originalAccidentDescription || '' // 원본 사고 내용 저장
        }

        // 첫 번째 질문 시작 (2초 후)
        setTimeout(async () => {
          await askNextScriptQuestion()
        }, 2000)
      }
      break

    case 'skip_script':
      // "아니요, 혼자 힘으로 할 수 있어요!" - 스크립트 건너뛰고 서류 확인으로
      {
        const { coverageType } = actionData.data || {}
        
        const encouragementMessage = {
          id: Date.now(),
          type: 'text',
          sender: 'bot',
          content: '네, 충분히 하실 수 있으실 거예요! 💪\n\n서류 발급이 완료되시면 알려주세요.',
          timestamp: Date.now()
        }
        messages.value.push(encouragementMessage)
        await scrollToBottom()

        // 프로그레스 3단계로 업데이트 (서류 발급)
        emit('progressUpdate', 3)

        // 2초 후 서류 발급 확인 메시지
        setTimeout(async () => {
          const checkQuestion = {
            id: Date.now(),
            type: 'text',
            sender: 'bot',
            content: '서류를 잘 발급받으셨나요? 📋',
            timestamp: Date.now()
          }
          messages.value.push(checkQuestion)
          await scrollToBottom()

          // 체크리스트 보기 버튼 (2초 후)
          setTimeout(async () => {
            const checklistButton = {
              id: Date.now(),
              type: 'action_buttons',
              sender: 'bot',
              content: {
                message: '서류 체크리스트를 보여드릴까요?',
                actions: [
                  {
                    label: '✅ 네, 체크리스트 보기',
                    icon: '📋',
                    action: 'show_checklist',
                    style: 'primary',
                    data: {
                      coverageType: coverageType
                    }
                  },
                  {
                    label: '⏳ 아직 준비 중이에요',
                    icon: '⏳',
                    action: 'documents_pending',
                    style: 'secondary'
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(checklistButton)
            await scrollToBottom()
          }, 2000)
        }, 2000)
      }
      break

    case 'show_checklist':
      // 체크리스트 표시
      {
        const { coverageType } = actionData.data || {}

        // coverageType이 없으면 기본값 사용
        const actualCoverageType = coverageType || 'personal_belongings'
        console.log('show_checklist - coverageType:', coverageType)
        console.log('show_checklist - actualCoverageType:', actualCoverageType)
        const documentsData = CLAIM_DOCUMENTS[actualCoverageType]
        console.log('show_checklist - documentsData:', documentsData)

        const checklistMessage = {
          id: Date.now(),
          type: 'checklist',
          sender: 'bot',
          content: [
            {
              title: '해외에서 준비',
              icon: '🌍',
              description: '현지',
              documents: documentsData.overseas.map(doc => ({
                ...doc,
                checked: false
              }))
            },
            {
              title: '귀국 후 준비',
              icon: '🏠',
              description: '국내',
              documents: documentsData.home.map(doc => ({
                ...doc,
                checked: false
              }))
            }
          ],
          timestamp: Date.now()
        }
        messages.value.push(checklistMessage)
        await scrollToBottom()
      }
      break

    case 'submit_claim':
      // 타임라인에서 "청구서 작성하기" 클릭
      {
        const confirmMessage = {
          id: Date.now(),
          type: 'text',
          sender: 'bot',
          content: `🔗 보험금 청구 페이지로 이동합니다.\n\n라이나손해보험 온라인 청구 시스템에서 청구서를 작성하실 수 있습니다.`,
          timestamp: Date.now()
        }
        messages.value.push(confirmMessage)
        await scrollToBottom()

        // 1초 후 링크로 이동
        setTimeout(() => {
          window.open(CONSTANTS.CLAIM_URL, '_blank')
        }, 1000)
      }
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

// 외부에서 메시지 주입 가능하도록 expose
const addMessage = async (message) => {
  messages.value.push({
    id: Date.now(),
    ...message,
    timestamp: message.timestamp || Date.now()
  })
  await scrollToBottom()
}

// 메시지 업데이트 처리 (체크리스트 상태 변경)
const handleUpdateMessage = ({ id, content }) => {
  console.log('ChatContainer - handleUpdateMessage called:', { id, content })
  const messageIndex = messages.value.findIndex(msg => msg.id === id)
  console.log('ChatContainer - messageIndex:', messageIndex)

  if (messageIndex !== -1) {
    console.log('ChatContainer - current message:', messages.value[messageIndex])
    // Vue 반응성을 위해 새 객체 생성
    messages.value[messageIndex] = {
      ...messages.value[messageIndex],
      content: content
    }
    console.log('ChatContainer - updated message:', messages.value[messageIndex])

    // 체크리스트 메시지인 경우, 상태만 업데이트 (자동 완료 제거)
    if (messages.value[messageIndex].type === 'checklist') {
      // 상태만 업데이트하고 자동 완료는 하지 않음
      // 확인 버튼 클릭 시 handleChecklistConfirm에서 처리
    }
  } else {
    console.error('ChatContainer - message not found with id:', id)
  }
}

// 체크리스트 확인 버튼 클릭 처리
const handleChecklistConfirm = async ({ messageId, marketingConsent }) => {
  console.log('ChatContainer - handleChecklistConfirm called:', { messageId, marketingConsent })
  
  // 체크리스트 메시지 찾기
  const checklistMessage = messages.value.find(msg => msg.id === messageId)
  if (!checklistMessage || checklistMessage.type !== 'checklist') {
    console.error('ChatContainer - checklist message not found')
    return
  }

  // 필수 서류 체크 확인
  const categories = checklistMessage.content
  const allRequiredChecked = categories.every(category =>
    category.documents
      .filter(doc => doc.required)
      .every(doc => doc.checked)
  )

  if (!allRequiredChecked) {
    // 필수 서류 누락 경고는 체크리스트 컴포넌트에서 처리됨
    return
  }

  // 완료 메시지 추가
  const completionMessage = {
    id: Date.now(),
    type: 'text',
    sender: 'bot',
    content: '✅ 필수 서류를 모두 확인하셨네요! 정말 수고 많으셨어요. 😊',
    timestamp: Date.now()
  }
  messages.value.push(completionMessage)
  await scrollToBottom()

  // 마케팅 동의 처리
  if (marketingConsent) {
    setTimeout(async () => {
      const marketingMessage = {
        id: Date.now(),
        type: 'text',
        sender: 'bot',
        content: '📧 감사합니다! 라이나손해보험의 맞춤형 보험 상품 정보와 유용한 생활 정보를 안내해 드리겠습니다.',
        timestamp: Date.now()
      }
      messages.value.push(marketingMessage)
      await scrollToBottom()
    }, 1000)
  }

  // 타임라인 표시 및 다음 단계로 진행
  setTimeout(() => {
    emit('checklistComplete')
  }, 1500)
}

// 부모 컴포넌트에서 접근 가능하도록 expose
defineExpose({
  addMessage
})
</script>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 900px;
  height: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 모바일에서는 전체 너비 사용 */
@media (max-width: 768px) {
  .chat-container {
    border-radius: 0;
    box-shadow: none;
  }
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
  justify-content: space-between;
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
  min-width: 0; /* 텍스트 오버플로우 방지 */
}

.dashboard-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.dashboard-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.dashboard-button:active {
  transform: translateY(0);
}

.button-icon {
  font-size: 16px;
  font-weight: 600;
}

.button-text {
  font-size: 13px;
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .header-content {
    gap: 10px;
  }

  .chat-header h2 {
    font-size: 16px;
  }

  .subtitle {
    font-size: 11px;
  }

  .dashboard-button {
    padding: 6px 12px;
    font-size: 12px;
  }

  .button-text {
    font-size: 12px;
  }

  .button-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .chat-header {
    padding: 16px;
  }

  .header-content {
    gap: 8px;
  }

  .lina-logo {
    height: 28px;
  }

  .chat-header h2 {
    font-size: 15px;
  }

  .dashboard-button {
    padding: 6px 10px;
    gap: 4px;
  }

  .button-text {
    display: none; /* 모바일에서는 아이콘만 표시 */
  }
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

/* 🎒 휴대품 도난 */
.quick-button:nth-child(1) {
  border-color: #D24726;
  color: #D24726;
}

.quick-button:nth-child(1):hover:not(:disabled) {
  background: #D24726;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(210, 71, 38, 0.3);
}

/* 🏥 의료비 청구 */
.quick-button:nth-child(2) {
  border-color: #7030A0;
  color: #7030A0;
}

.quick-button:nth-child(2):hover:not(:disabled) {
  background: #7030A0;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(112, 48, 160, 0.3);
}

/* 🚔 경찰서 찾기 */
.quick-button:nth-child(3) {
  border-color: #4DBFC8;
  color: #4DBFC8;
}

.quick-button:nth-child(3):hover:not(:disabled) {
  background: #4DBFC8;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 191, 200, 0.3);
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
