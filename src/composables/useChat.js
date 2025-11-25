import { ref } from 'vue'
import { sendMessageToGPT, sendMessageToGPTStream } from '../services/openai.js'
import { searchPlace } from '../services/placeService.js'
import { MessageType, SenderType } from '../types/message.js'
import { CLAIM_DOCUMENTS } from '../data/claimDocuments.js'
import { isClaimScenario } from '../services/ragService.js'

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

    // 사고 시나리오 감지 (우선 처리)
    const claimCheck = isClaimScenario(text)

    // 사고 시나리오인 경우 바로 청구 프로세스 시작
    if (claimCheck.isAccident) {
      isLoading.value = true

      // 간단한 물품 추출 로직
      let item = null
      const itemKeywords = ['휴대폰', '핸드폰', '스마트폰', '폰', '아이패드', '아이폰', '맥북', '노트북', '태블릿', '지갑', '여권', '가방', '카메라', '시계', '안경', '캐리어']
      for (const keyword of itemKeywords) {
        if (text.includes(keyword)) {
          item = keyword
          break
        }
      }

      // 간단한 증상 추출 로직
      let symptom = null
      const symptomKeywords = ['발목', '손목', '머리', '배', '다리', '팔', '열', '복통', '구토', '설사', '골절', '삠']
      for (const keyword of symptomKeywords) {
        if (text.includes(keyword)) {
          symptom = keyword
          break
        }
      }

      // classifyAccident 함수 호출과 동일한 로직 실행
      const coverageType = claimCheck.type

      // 1. 공감 메시지
      let empathyMessage = ''
      if (coverageType === 'personal_belongings') {
        empathyMessage = `${item ? item + '을(를)' : '휴대품을'} 잃으셨군요. 정말 난감하시겠어요. 😢\n\n걱정하지 마세요. 차근차근 안내해 드릴게요!`
      } else if (coverageType === 'overseas_medical') {
        empathyMessage = `${symptom ? symptom + '(으)로' : ''} 아프셨다니 걱정이네요. 😢\n\n빠른 쾌유를 바라며, 보험금 청구 절차를 친절하게 안내해 드리겠습니다.`
      } else if (coverageType === 'flight_delay') {
        empathyMessage = '항공기 지연으로 불편을 겪으셨군요. 😢\n\n항공기 지연 보상 청구 절차를 안내해 드리겠습니다!'
      } else {
        empathyMessage = '네, 상황을 확인했습니다.\n\n필요하신 절차를 하나씩 안내해 드릴게요.'
      }

      // 공감 메시지 - 2초 딜레이
      setTimeout(() => {
        const empathyTextMessage = {
          id: messageIdCounter++,
          type: MessageType.TEXT,
          sender: SenderType.BOT,
          content: empathyMessage,
          timestamp: Date.now()
        }
        messages.value.push(empathyTextMessage)
      }, 2000)

      // 2. 보장 확인 메시지 - 4초 딜레이 (공감 메시지 2초 후)
      if (coverageType !== 'unknown' && CLAIM_DOCUMENTS[coverageType]) {
        setTimeout(() => {
          // 보장 정보
          const coverageInfo = {
            'personal_belongings': {
              title: '휴대품 손해',
              coverage: '최대 100만원',
              deductible: '자기부담금 없음',
              description: '도난, 분실, 파손된 휴대품에 대해 보장합니다.'
            },
            'overseas_medical': {
              title: '해외 의료비',
              coverage: '최대 3,000만원',
              deductible: '건당 2만원',
              description: '해외 여행 중 질병 또는 상해로 인한 의료비를 보장합니다.'
            },
            'flight_delay': {
              title: '항공기 지연',
              coverage: '최대 30만원',
              deductible: '자기부담금 없음',
              description: '예정 출발시각으로부터 4시간 이상 지연된 경우 지연시간에 따라 보상합니다.'
            }
          }

          const info = coverageInfo[coverageType] || {
            title: '보험 보장',
            coverage: '약관에 따라 보장',
            deductible: '약관 확인 필요',
            description: '해당 사고에 대해 보장이 가능합니다.'
          }

          const coverageMessage = {
            id: messageIdCounter++,
            type: MessageType.TEXT,
            sender: SenderType.BOT,
            content: `✅ **보장 확인 완료**\n\n📋 **${info.title}**\n💰 보장 한도: ${info.coverage}\n🔸 자기부담금: ${info.deductible}\n\n${info.description}`,
            timestamp: Date.now()
          }
          messages.value.push(coverageMessage)

          // 3. 서류 안내 확인 버튼 - 2초 후
          setTimeout(() => {
            const documentConfirmMessage = {
              id: messageIdCounter++,
              type: MessageType.ACTION_BUTTONS,
              sender: SenderType.BOT,
              content: {
                message: '필요 서류를 안내해드릴까요?',
                actions: [
                  {
                    label: '✅ 네, 서류 안내 받기',
                    icon: '📋',
                    action: 'confirm_document_guide',
                    style: 'primary',
                    data: {
                      coverageType: coverageType,
                      needPolice: coverageType === 'personal_belongings',
                      needHospital: coverageType === 'overseas_medical',
                      needAirport: coverageType === 'flight_delay',
                      originalAccidentDescription: text // 원본 사고 내용 저장
                    }
                  },
                  {
                    label: '상담원과 통화하기',
                    icon: '☎️',
                    action: 'call_agent',
                    style: 'secondary'
                  }
                ]
              },
              timestamp: Date.now()
            }
            messages.value.push(documentConfirmMessage)
          }, 2000)
        }, 4000)
      }

      isLoading.value = false
      return
    }

    // 사고 시나리오가 아닌 경우 기존 로직 진행
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

      // 먼저 non-streaming으로 응답 받기 (function call 감지용)
      const initialResponse = await sendMessageToGPT(text, conversationHistory, apiKey)

      // Function call인 경우 바로 처리
      let response
      if (initialResponse.type === 'function_call') {
        response = initialResponse
      } else {
        // 일반 텍스트 응답인 경우 스트리밍 효과 시뮬레이션
        const fullText = initialResponse.content
        const messageIndex = messages.value.findIndex(m => m.id === botMessageId)

        // 타이핑 효과를 위해 한 글자씩 추가
        let currentIndex = 0
        const typingInterval = setInterval(() => {
          if (currentIndex < fullText.length && messageIndex !== -1) {
            const chunkSize = Math.min(3, fullText.length - currentIndex) // 한번에 3글자씩
            messages.value[messageIndex].content += fullText.substring(currentIndex, currentIndex + chunkSize)
            currentIndex += chunkSize
          } else {
            clearInterval(typingInterval)
          }
        }, 30) // 30ms마다 3글자씩

        response = { type: 'text', content: fullText }
      }

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
          } else if (coverageType === 'flight_delay') {
            empathyMessage = '항공기 지연으로 불편을 겪으셨군요. 😢\n\n항공기 지연 보상 청구 절차를 안내해 드리겠습니다!'
          } else {
            empathyMessage = '네, 상황을 확인했습니다.\n\n필요하신 절차를 하나씩 안내해 드릴게요.'
          }

          // 공감 메시지 - 2초 딜레이
          setTimeout(() => {
            const empathyTextMessage = {
              id: messageIdCounter++,
              type: MessageType.TEXT,
              sender: SenderType.BOT,
              content: empathyMessage,
              timestamp: Date.now()
            }
            messages.value.push(empathyTextMessage)
          }, 2000)

          // 2. 보장 확인 메시지 - 4초 딜레이 (공감 메시지 2초 후)
          if (coverageType !== 'unknown' && CLAIM_DOCUMENTS[coverageType]) {
            setTimeout(() => {
              // 보장 정보
              const coverageInfo = {
                'personal_belongings': {
                  title: '휴대품 손해',
                  coverage: '최대 100만원',
                  deductible: '자기부담금 없음',
                  description: '도난, 분실, 파손된 휴대품에 대해 보장합니다.'
                },
                'overseas_medical': {
                  title: '해외 의료비',
                  coverage: '최대 3,000만원',
                  deductible: '건당 2만원',
                  description: '해외 여행 중 질병 또는 상해로 인한 의료비를 보장합니다.'
                },
                'flight_delay': {
                  title: '항공기 지연',
                  coverage: '최대 30만원',
                  deductible: '자기부담금 없음',
                  description: '예정 출발시각으로부터 4시간 이상 지연된 경우 지연시간에 따라 보상합니다.'
                }
              }

              const info = coverageInfo[coverageType] || {
                title: '보험 보장',
                coverage: '약관에 따라 보장',
                deductible: '약관 확인 필요',
                description: '해당 사고에 대해 보장이 가능합니다.'
              }

              const coverageMessage = {
                id: messageIdCounter++,
                type: MessageType.TEXT,
                sender: SenderType.BOT,
                content: `✅ **보장 확인 완료**\n\n📋 **${info.title}**\n💰 보장 한도: ${info.coverage}\n🔸 자기부담금: ${info.deductible}\n\n${info.description}`,
                timestamp: Date.now()
              }
              messages.value.push(coverageMessage)

              // 3. 서류 안내 확인 버튼 - 2초 후
              setTimeout(() => {
                const documentConfirmMessage = {
                  id: messageIdCounter++,
                  type: MessageType.ACTION_BUTTONS,
                  sender: SenderType.BOT,
                  content: {
                    message: '필요 서류를 안내해드릴까요?',
                    actions: [
                      {
                        label: '✅ 네, 서류 안내 받기',
                        icon: '📋',
                        action: 'confirm_document_guide',
                        style: 'primary',
                        data: {
                          coverageType: coverageType,
                          needPolice: args.needPolice || false,
                          needHospital: args.needHospital || false,
                          needAirport: coverageType === 'flight_delay',
                          originalAccidentDescription: text // 원본 사고 내용 저장
                        }
                      },
                      {
                        label: '상담원과 통화하기',
                        icon: '☎️',
                        action: 'call_agent',
                        style: 'secondary'
                      }
                    ]
                  },
                  timestamp: Date.now()
                }
                messages.value.push(documentConfirmMessage)
              }, 2000)
            }, 4000)
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

            // 지도 메시지 생성 (검색 결과 전체와 현재 인덱스 포함)
            const mapMessage = {
              id: messageIdCounter++,
              type: MessageType.MAP,
              sender: SenderType.BOT,
              content: {
                lat: placeData.lat,
                lng: placeData.lng,
                address: `${placeData.placeType}: ${placeData.name}\n${placeData.address}`,
                zoom: placeData.zoom,
                // 다음 결과를 위해 검색 결과 전체와 현재 인덱스 저장
                allResults: placeData.allResults || [],
                currentIndex: placeData.currentIndex !== undefined ? placeData.currentIndex : 0,
                placeType: placeData.placeTypeRaw || response.functionArgs.placeType, // 원본 영어 타입 저장 (다음 검색을 위해)
                useCurrentLocation: response.functionArgs.useCurrentLocation || false
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
