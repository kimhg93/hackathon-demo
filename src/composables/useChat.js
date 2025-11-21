import { ref } from 'vue'
import { sendMessageToGPT, sendMessageToGPTStream } from '../services/openai.js'
import { searchPlace } from '../services/placeService.js'
import { MessageType, SenderType } from '../types/message.js'
import { CLAIM_DOCUMENTS } from '../data/claimDocuments.js'

/**
 * ChatGPT 연동 채팅 composable
 * 실제 AI와 대화할 수 있는 기능 제공
 */
export function useChat() {
  // 상태 관리
  const messages = ref([]) // 메시지 목록
  const isLoading = ref(false) // 로딩 상태
  const error = ref(null) // 에러 상태

  // 환경 변수에서 API 키 가져오기
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''

  let messageIdCounter = 0

  /**
   * 대화 히스토리를 OpenAI 형식으로 변환
   * @returns {Array} OpenAI API 형식의 메시지 배열
   */
  const getConversationHistory = () => {
    return messages.value
      .filter(msg => msg.type === MessageType.TEXT) // 텍스트 메시지만
      .map(msg => ({
        role: msg.sender === SenderType.USER ? 'user' : 'assistant',
        content: msg.content
      }))
  }

  /**
   * 사용자 메시지 전송 (일반 방식)
   * @param {string} text - 사용자 입력 텍스트
   */
  const sendMessage = async (text) => {
    if (!text.trim()) return
    if (!apiKey) {
      error.value = 'API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.'
      return
    }

    error.value = null

    // 사용자 메시지 추가
    const userMessage = {
      id: messageIdCounter++,
      type: MessageType.TEXT,
      sender: SenderType.USER,
      content: text,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)

    // 로딩 시작
    isLoading.value = true

    try {
      // ChatGPT API 호출
      const conversationHistory = getConversationHistory()
      const aiResponse = await sendMessageToGPT(text, conversationHistory, apiKey)

      // AI 응답 추가
      const botMessage = {
        id: messageIdCounter++,
        type: MessageType.TEXT,
        sender: SenderType.BOT,
        content: aiResponse,
        timestamp: Date.now()
      }
      messages.value.push(botMessage)

    } catch (err) {
      error.value = err.message || 'AI 응답을 받는데 실패했습니다.'
      console.error('Chat error:', err)

      // 에러 메시지 표시
      const errorMessage = {
        id: messageIdCounter++,
        type: MessageType.TEXT,
        sender: SenderType.BOT,
        content: `⚠️ 오류: ${error.value}`,
        timestamp: Date.now()
      }
      messages.value.push(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 사용자 메시지 전송 (스트리밍 방식 - 타이핑 효과)
   * @param {string} text - 사용자 입력 텍스트
   */
  const sendMessageStream = async (text) => {
    if (!text.trim()) return
    if (!apiKey) {
      error.value = 'API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.'
      return
    }

    error.value = null

    // 사용자 메시지 추가
    const userMessage = {
      id: messageIdCounter++,
      type: MessageType.TEXT,
      sender: SenderType.USER,
      content: text,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)

    // 빈 AI 메시지 생성 (실시간으로 채워짐)
    const botMessageId = messageIdCounter++
    const botMessage = {
      id: botMessageId,
      type: MessageType.TEXT,
      sender: SenderType.BOT,
      content: '',
      timestamp: Date.now()
    }
    messages.value.push(botMessage)

    isLoading.value = true

    try {
      const conversationHistory = getConversationHistory()

      // 스트리밍으로 응답 받기
      const response = await sendMessageToGPTStream(
        text,
        conversationHistory,
        apiKey,
        (chunk) => {
          // 실시간으로 메시지 내용 업데이트 (Vue 반응성 보장)
          const messageIndex = messages.value.findIndex(m => m.id === botMessageId)
          if (messageIndex !== -1) {
            messages.value[messageIndex].content += chunk
          }
        }
      )

      // Function Call 응답 처리
      if (response.type === 'function_call') {
        // 기존 텍스트 메시지 제거
        messages.value.pop()

        // classifyAccident 함수 호출 - 사고 분류 및 서류 안내
        if (response.functionName === 'classifyAccident') {
          const args = response.functionArgs
          const coverageType = args.coverageType

          // 1. 공감 메시지
          let empathyMessage = ''
          if (coverageType === 'personal_belongings') {
            empathyMessage = `${args.item ? args.item + '을(를)' : '휴대품을'} 잃으셨군요. 정말 난감하시겠어요. 😢\n\n걱정하지 마세요. 차근차근 안내해 드릴게요!`
          } else if (coverageType === 'overseas_medical') {
            empathyMessage = `${args.symptom ? args.symptom + '(으)로' : ''} 아프셨다니 걱정이네요. 😢\n\n빠른 쾌유를 바라며, 보험금 청구 절차를 친절하게 안내해 드리겠습니다.`
          } else {
            empathyMessage = '네, 상황을 확인했습니다.\n\n필요하신 절차를 하나씩 안내해 드릴게요.'
          }

          const empathyTextMessage = {
            id: messageIdCounter++,
            type: MessageType.TEXT,
            sender: SenderType.BOT,
            content: empathyMessage,
            timestamp: Date.now()
          }
          messages.value.push(empathyTextMessage)

          // 2. 서류 선택 버튼 - 0.8초 딜레이
          if (coverageType !== 'unknown' && CLAIM_DOCUMENTS[coverageType]) {
            setTimeout(() => {
              const documentSelectionMessage = {
                id: messageIdCounter++,
                type: MessageType.ACTION_BUTTONS,
                sender: SenderType.BOT,
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
                        needPolice: args.needPolice || false,
                        needHospital: args.needHospital || false
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
            }, 800)
          } else {
            // 담보 타입을 파악하지 못한 경우
            setTimeout(() => {
              const clarificationMessage = {
                id: messageIdCounter++,
                type: MessageType.TEXT,
                sender: SenderType.BOT,
                content: '죄송합니다. 정확한 상황 파악을 위해 좀 더 자세히 설명해주시겠어요?\n\n예를 들어:\n- 물건을 도난/분실하셨나요?\n- 다치셔서 병원에 가셨나요?',
                timestamp: Date.now()
              }
              messages.value.push(clarificationMessage)
            }, 800)
          }
        }

        // searchPlace 함수 호출
        if (response.functionName === 'searchPlace') {
          try {
            const placeData = await searchPlace(response.functionArgs)

            // 지도 메시지 생성
            const mapMessage = {
              id: messageIdCounter++,
              type: MessageType.MAP,
              sender: SenderType.BOT,
              content: {
                lat: placeData.lat,
                lng: placeData.lng,
                address: `${placeData.placeType}: ${placeData.name}\n${placeData.address}`,
                zoom: placeData.zoom
              },
              timestamp: Date.now()
            }
            messages.value.push(mapMessage)

          } catch (placeError) {
            // 장소 검색 실패 시 에러 메시지
            const errorMessage = {
              id: messageIdCounter++,
              type: MessageType.TEXT,
              sender: SenderType.BOT,
              content: `⚠️ 장소를 찾을 수 없습니다: ${placeError.message}`,
              timestamp: Date.now()
            }
            messages.value.push(errorMessage)
          }
        }
      }

    } catch (err) {
      error.value = err.message || 'AI 응답을 받는데 실패했습니다.'
      console.error('Chat streaming error:', err)

      // 에러 메시지로 업데이트
      botMessage.content = `⚠️ 오류: ${error.value}`
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 대화 내역 초기화
   */
  const clearMessages = () => {
    messages.value = []
    messageIdCounter = 0
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendMessageStream,
    clearMessages
  }
}
