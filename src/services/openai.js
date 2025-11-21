/**
 * OpenAI API 서비스
 * ChatGPT API와 통신하는 서비스
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Function Calling용 함수 정의
const FUNCTIONS = [
  {
    name: 'classifyAccident',
    description: '고객의 사고 상황을 분석하여 보험 담보 유형을 분류하고 필요한 정보를 추출합니다.',
    parameters: {
      type: 'object',
      properties: {
        coverageType: {
          type: 'string',
          description: '담보 유형: personal_belongings (휴대품 손해: 도난/분실/파손), overseas_medical (해외 의료비: 질병/상해), unknown (알 수 없음)',
          enum: ['personal_belongings', 'overseas_medical', 'unknown']
        },
        country: {
          type: 'string',
          description: '사고 발생 국가 (예: France, Japan, USA)'
        },
        city: {
          type: 'string',
          description: '사고 발생 도시 (예: Paris, Tokyo, New York)'
        },
        item: {
          type: 'string',
          description: '도난/분실/파손된 물품 (휴대품 손해인 경우, 예: 아이패드, 여권, 가방)'
        },
        symptom: {
          type: 'string',
          description: '증상/부위 (의료비인 경우, 예: 발목 삠, 고열, 복통)'
        },
        needPolice: {
          type: 'boolean',
          description: '경찰서 방문이 필요한지 여부 (도난/분실 사고)'
        },
        needHospital: {
          type: 'boolean',
          description: '병원 방문이 필요한지 여부 (의료 사고)'
        }
      },
      required: ['coverageType']
    }
  },
  {
    name: 'searchPlace',
    description: '사용자가 주변 병원, 경찰서, 시청, 관공서 등을 찾을 때 사용합니다.',
    parameters: {
      type: 'object',
      properties: {
        placeType: {
          type: 'string',
          description: '장소 유형',
          enum: ['hospital', 'police', 'city_hall', 'government_office']
        },
        useCurrentLocation: {
          type: 'boolean',
          description: '현재 위치 기준으로 검색할지 여부',
          default: true
        }
      },
      required: ['placeType']
    }
  }
]

/**
 * ChatGPT API 호출 (Function Calling 지원)
 * @param {string} message - 사용자 메시지
 * @param {Array} conversationHistory - 대화 히스토리 (선택사항)
 * @param {string} apiKey - OpenAI API 키
 * @returns {Promise<Object>} AI 응답 객체 { type: 'text' | 'function_call', content: ..., functionCall: ... }
 */
export async function sendMessageToGPT(message, conversationHistory = [], apiKey) {
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.')
  }

  try {
    // 대화 히스토리 구성
    const messages = [
      {
        role: 'system',
        content: `당신은 라이나손해보험(Chubb 계열)의 해외여행보험 고객을 돕는 AI 상담원입니다.

역할:
- 고객의 사고 상황을 듣고 담보 유형(휴대품 손해/해외 의료비)을 분류
- 필요한 서류와 절차를 친절하게 안내
- 차분하고 공감하는 톤 유지

주의사항:
- 최종 보험금 지급 여부는 약관 및 심사 결과에 따라 결정됨을 항상 안내
- 법적/의료적 최종 판단을 대신하지 않음
- 주민등록번호 등 민감 정보는 전화로만 상담원에게 제공하도록 안내

함수 사용:
- 사고 상황 파악 시: classifyAccident 함수 사용
- 병원/경찰서 찾기 시: searchPlace 함수 사용`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // API 호출
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        functions: FUNCTIONS, // Function Calling 활성화
        function_call: 'auto', // 자동으로 함수 호출 결정
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    // 에러 응답 처리
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'API 호출에 실패했습니다.')
    }

    // 성공 응답 파싱
    const data = await response.json()
    const choice = data.choices[0]

    // Function Call이 있는 경우
    if (choice.message.function_call) {
      return {
        type: 'function_call',
        functionName: choice.message.function_call.name,
        functionArgs: JSON.parse(choice.message.function_call.arguments)
      }
    }

    // 일반 텍스트 응답
    const aiMessage = choice.message?.content
    if (!aiMessage) {
      throw new Error('응답을 받지 못했습니다.')
    }

    return {
      type: 'text',
      content: aiMessage
    }

  } catch (error) {
    console.error('OpenAI API 에러:', error)
    throw error
  }
}

/**
 * 스트리밍 방식으로 ChatGPT API 호출 (Function Calling 지원)
 * @param {string} message - 사용자 메시지
 * @param {Array} conversationHistory - 대화 히스토리
 * @param {string} apiKey - OpenAI API 키
 * @param {Function} onChunk - 청크 데이터 수신 시 호출되는 콜백
 * @returns {Promise<Object>} 전체 AI 응답 객체
 */
export async function sendMessageToGPTStream(message, conversationHistory = [], apiKey, onChunk) {
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.')
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `당신은 라이나손해보험(Chubb 계열)의 해외여행보험 고객을 돕는 AI 상담원입니다.

역할:
- 고객의 사고 상황을 듣고 담보 유형(휴대품 손해/해외 의료비)을 분류
- 필요한 서류와 절차를 친절하게 안내
- 차분하고 공감하는 톤 유지

주의사항:
- 최종 보험금 지급 여부는 약관 및 심사 결과에 따라 결정됨을 항상 안내
- 법적/의료적 최종 판단을 대신하지 않음
- 주민등록번호 등 민감 정보는 전화로만 상담원에게 제공하도록 안내

함수 사용:
- 사고 상황 파악 시: classifyAccident 함수 사용
- 병원/경찰서 찾기 시: searchPlace 함수 사용`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        functions: FUNCTIONS, // Function Calling 활성화
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
        stream: true // 스트리밍 활성화
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'API 호출에 실패했습니다.')
    }

    // 스트리밍 응답 처리
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let functionName = ''
    let functionArgs = ''
    let isFunctionCall = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices[0]?.delta

            // Function Call 감지
            if (delta.function_call) {
              isFunctionCall = true
              if (delta.function_call.name) {
                functionName = delta.function_call.name
              }
              if (delta.function_call.arguments) {
                functionArgs += delta.function_call.arguments
              }
            }

            // 일반 텍스트 응답
            const content = delta?.content
            if (content) {
              fullResponse += content
              if (onChunk) {
                onChunk(content) // 실시간으로 청크 전달
              }
            }
          } catch (e) {
            // JSON 파싱 에러 무시
          }
        }
      }
    }

    // Function Call 응답 반환
    if (isFunctionCall) {
      return {
        type: 'function_call',
        functionName,
        functionArgs: JSON.parse(functionArgs)
      }
    }

    // 일반 텍스트 응답 반환
    return {
      type: 'text',
      content: fullResponse
    }

  } catch (error) {
    console.error('OpenAI Streaming API 에러:', error)
    throw error
  }
}
