/**
 * OpenAI API 서비스
 * ChatGPT API와 통신하는 서비스
 */

import { buildRAGContext, isInsuranceRelatedQuery, isTravelInfoQuery } from './ragService.js'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_TTS_API_URL = 'https://api.openai.com/v1/audio/speech'

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
    // 질문 타입 분류
    const isInsuranceQuery = isInsuranceRelatedQuery(message)
    const isTravelInfo = isTravelInfoQuery(message)
    
    // RAG 컨텍스트 생성 (보험 관련 질문인 경우만)
    let ragContext = ''
    if (isInsuranceQuery) {
      ragContext = buildRAGContext(message)
    }

    // 시스템 프롬프트 구성
    let systemContent = ''
    
    if (isTravelInfo && !isInsuranceQuery) {
      // 여행 정보 질문 (날씨, 환율 등) - 간략하게 답변
      systemContent = `당신은 라이나손해보험의 해외여행보험 고객을 돕는 AI 상담원입니다.

고객이 여행에 필요한 일반 정보(날씨, 환율 등)를 물어볼 때:
- 간결하고 핵심적인 정보만 제공
- 2-3문장 이내로 간략하게 답변
- 필요하면 실시간 정보를 참고하되, 정확하지 않은 경우 "실시간 정보는 검색을 통해 확인하시기 바랍니다"라고 안내
- 친절하지만 간결한 톤 유지

답변 예시:
- 날씨: "현재 파리 날씨는 15-20도 정도이며, 가벼운 비 예보가 있습니다. 우산을 준비하시는 것을 추천드립니다."
- 환율: "현재 유로화 환율은 약 1,400원대입니다. 실시간 환율은 은행 앱이나 환전소에서 확인하시기 바랍니다."`
    } else {
      // 보험 관련 질문 - 기존 방식
      systemContent = `당신은 라이나손해보험(Chubb 계열)의 해외여행보험 고객을 돕는 AI 상담원입니다.

역할:
- 고객의 사고 상황을 듣고 담보 유형(휴대품 손해/해외 의료비)을 분류
- 필요한 서류와 절차를 친절하게 안내
- 차분하고 공감하는 톤 유지

주의사항:
- 최종 보험금 지급 여부는 약관 및 심사 결과에 따라 결정됨을 항상 안내
- 법적/의료적 최종 판단을 대신하지 않음
- 주민등록번호 등 민감 정보는 전화로만 상담원에게 제공하도록 안내

**중요: 함수 호출 규칙**
- 고객이 사고 상황을 설명하는 경우 (예: "도난당했어요", "분실했어요", "휴대폰 잃어버렸어요", "파손됐어요", "아파요", "다쳤어요", "병원 갔어요" 등) **반드시** classifyAccident 함수를 먼저 호출해야 합니다
- 절대 일반 텍스트로만 답변하지 마세요
- 병원/경찰서 찾기 시: searchPlace 함수 사용`

      // RAG 컨텍스트가 있으면 추가
      if (ragContext) {
        systemContent += `\n\n---\n\n${ragContext}\n\n위의 지식 베이스 정보를 참고하여 정확하고 구체적으로 답변해주세요.`
      }
    }

    // 대화 히스토리 구성
    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // API 호출 - request body 조건부 구성
    const requestBody = {
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: isTravelInfo && !isInsuranceQuery ? 200 : 1000 // 여행 정보는 간략하게 (토큰 제한)
    }

    // 보험 관련 질문일 때만 Function Calling 파라미터 추가
    if (isInsuranceQuery) {
      requestBody.functions = FUNCTIONS
      requestBody.function_call = 'auto'
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
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
    // 질문 타입 분류
    const isInsuranceQuery = isInsuranceRelatedQuery(message)
    const isTravelInfo = isTravelInfoQuery(message)
    
    // RAG 컨텍스트 생성 (보험 관련 질문인 경우만)
    let ragContext = ''
    if (isInsuranceQuery) {
      ragContext = buildRAGContext(message)
    }

    // 시스템 프롬프트 구성
    let systemContent = ''
    
    if (isTravelInfo && !isInsuranceQuery) {
      // 여행 정보 질문 (날씨, 환율 등) - 간략하게 답변
      systemContent = `당신은 라이나손해보험의 해외여행보험 고객을 돕는 AI 상담원입니다.

고객이 여행에 필요한 일반 정보(날씨, 환율 등)를 물어볼 때:
- 간결하고 핵심적인 정보만 제공
- 2-3문장 이내로 간략하게 답변
- 필요하면 실시간 정보를 참고하되, 정확하지 않은 경우 "실시간 정보는 검색을 통해 확인하시기 바랍니다"라고 안내
- 친절하지만 간결한 톤 유지

답변 예시:
- 날씨: "현재 파리 날씨는 15-20도 정도이며, 가벼운 비 예보가 있습니다. 우산을 준비하시는 것을 추천드립니다."
- 환율: "현재 유로화 환율은 약 1,400원대입니다. 실시간 환율은 은행 앱이나 환전소에서 확인하시기 바랍니다."`
    } else {
      // 보험 관련 질문 - 기존 방식
      systemContent = `당신은 라이나손해보험(Chubb 계열)의 해외여행보험 고객을 돕는 AI 상담원입니다.

역할:
- 고객의 사고 상황을 듣고 담보 유형(휴대품 손해/해외 의료비)을 분류
- 필요한 서류와 절차를 친절하게 안내
- 차분하고 공감하는 톤 유지

주의사항:
- 최종 보험금 지급 여부는 약관 및 심사 결과에 따라 결정됨을 항상 안내
- 법적/의료적 최종 판단을 대신하지 않음
- 주민등록번호 등 민감 정보는 전화로만 상담원에게 제공하도록 안내

**중요: 함수 호출 규칙**
- 고객이 사고 상황을 설명하는 경우 (예: "도난당했어요", "분실했어요", "휴대폰 잃어버렸어요", "파손됐어요", "아파요", "다쳤어요", "병원 갔어요" 등) **반드시** classifyAccident 함수를 먼저 호출해야 합니다
- 절대 일반 텍스트로만 답변하지 마세요
- 병원/경찰서 찾기 시: searchPlace 함수 사용`

      // RAG 컨텍스트가 있으면 추가
      if (ragContext) {
        systemContent += `\n\n---\n\n${ragContext}\n\n위의 지식 베이스 정보를 참고하여 정확하고 구체적으로 답변해주세요.`
      }
    }

    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // API 호출 - request body 조건부 구성
    const requestBody = {
      model: 'gpt-5-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: isTravelInfo && !isInsuranceQuery ? 200 : 1000, // 여행 정보는 간략하게 (토큰 제한)
      stream: true // 스트리밍 활성화
    }

    // 보험 관련 질문일 때만 Function Calling 파라미터 추가
    if (isInsuranceQuery) {
      requestBody.functions = FUNCTIONS
      requestBody.function_call = 'auto'
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
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
      try {
        console.log('Function name:', functionName)
        console.log('Function arguments to parse:', functionArgs)
        console.log('Function arguments length:', functionArgs.length)
        console.log('Function arguments (first 100 chars):', functionArgs.substring(0, 100))

        // 빈 문자열 체크
        if (!functionArgs || functionArgs.trim() === '') {
          console.warn('Function arguments is empty, using empty object')
          return {
            type: 'function_call',
            functionName,
            functionArgs: {}
          }
        }

        // JSON 파싱 시도
        const parsedArgs = JSON.parse(functionArgs)

        return {
          type: 'function_call',
          functionName,
          functionArgs: parsedArgs
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Function name:', functionName)
        console.error('Function arguments (full):', functionArgs)
        console.error('Function arguments (char codes at position 30-40):',
          Array.from(functionArgs.substring(30, 40)).map(c => `${c}(${c.charCodeAt(0)})`).join(' '))

        // 더 자세한 에러 메시지
        throw new Error(
          `Function arguments 파싱 실패\n` +
          `함수: ${functionName}\n` +
          `에러: ${parseError.message}\n` +
          `위치: ${parseError.message.match(/position (\d+)/) ? parseError.message.match(/position (\d+)/)[1] : 'unknown'}\n` +
          `원본 (처음 200자): ${functionArgs.substring(0, 200)}`
        )
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

/**
 * OpenAI TTS (Text-to-Speech) API 호출
 * @param {string} text - 음성으로 변환할 텍스트
 * @param {string} apiKey - OpenAI API 키
 * @param {Object} options - TTS 옵션
 * @param {string} options.voice - 음성 종류 (alloy, echo, fable, onyx, nova, shimmer)
 * @param {string} options.model - 모델 (tts-1, tts-1-hd)
 * @param {number} options.speed - 속도 (0.25 ~ 4.0, 기본 1.0)
 * @returns {Promise<Blob>} 음성 파일 Blob
 */
export async function generateSpeech(text, apiKey, options = {}) {
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.')
  }

  const {
    voice = 'alloy', // 기본 음성
    model = 'tts-1', // tts-1-hd는 더 고품질이지만 느림
    speed = 0.9 // 약간 느리게 (명확하게)
  } = options

  try {
    const response = await fetch(OPENAI_TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        speed,
        response_format: 'mp3' // mp3, opus, aac, flac
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'TTS API 호출에 실패했습니다.')
    }

    // 오디오 데이터를 Blob으로 반환
    const audioBlob = await response.blob()
    return audioBlob

  } catch (error) {
    console.error('OpenAI TTS API 에러:', error)
    throw error
  }
}

/**
 * 언어 코드에 따라 적절한 음성 선택
 * @param {string} languageCode - 언어 코드 (en, ko, ja, es, fr 등)
 * @returns {string} 음성 이름
 */
export function getVoiceForLanguage(languageCode) {
  const voiceMap = {
    en: 'alloy',   // 영어 - 중성적이고 명확한 음성
    ko: 'nova',    // 한국어 - 여성 음성 (부드러움)
    ja: 'shimmer', // 일본어 - 여성 음성 (밝음)
    es: 'echo',    // 스페인어 - 남성 음성 (안정적)
    fr: 'fable'    // 프랑스어 - 영국 억양 (우아함)
  }

  return voiceMap[languageCode] || 'alloy'
}

/**
 * 텍스트를 대상 언어로 번역
 * @param {string} text - 번역할 텍스트
 * @param {string} targetLang - 대상 언어 코드 (en, ko, ja, es, fr)
 * @param {string} apiKey - OpenAI API 키
 * @returns {Promise<string>} 번역된 텍스트
 */
export async function translateText(text, targetLang, apiKey) {
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.')
  }

  if (!text || !text.trim()) {
    return text
  }

  const languageNames = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese',
    es: 'Spanish',
    fr: 'French'
  }

  const targetLanguage = languageNames[targetLang] || 'English'

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. Only return the translated text without any explanations or notes.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3, // 낮은 온도로 정확한 번역
        max_tokens: 200
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || '번역 API 호출에 실패했습니다.')
    }

    const data = await response.json()
    const translatedText = data.choices[0]?.message?.content?.trim()

    if (!translatedText) {
      throw new Error('번역 결과를 받지 못했습니다.')
    }

    return translatedText

  } catch (error) {
    console.error('Translation API 에러:', error)
    // 번역 실패 시 원본 텍스트 반환
    return text
  }
}

/**
 * 스크립트 텍스트를 자연스럽게 정돈
 * @param {string} scriptText - 정돈할 스크립트 텍스트 (플레이스홀더 포함)
 * @param {Object} personalizedData - 개인화된 데이터 (items, symptoms, date, location 등)
 * @param {string} institutionType - 기관 타입 ('police' or 'hospital')
 * @param {string} language - 언어 코드 ('ko', 'en', 'ja', 'es', 'fr')
 * @param {string} apiKey - OpenAI API 키
 * @param {string} originalAccidentDescription - 원본 사고 내용 (선택적)
 * @returns {Promise<string>} 정돈된 스크립트 텍스트
 */
export async function refineScript(scriptText, personalizedData, institutionType, language, apiKey, originalAccidentDescription = '') {
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.')
  }

  if (!scriptText || !scriptText.trim()) {
    return scriptText
  }

  const languageNames = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese',
    es: 'Spanish',
    fr: 'French'
  }

  const targetLanguage = languageNames[language] || 'English'
  const institutionName = institutionType === 'police' ? 'police station' : 'hospital'

  // 개인화 데이터를 설명 텍스트로 변환
  let dataDescription = ''
  if (personalizedData) {
    const dataParts = []
    if (personalizedData.items) dataParts.push(`Items: ${personalizedData.items}`)
    if (personalizedData.symptoms) dataParts.push(`Symptoms: ${personalizedData.symptoms}`)
    if (personalizedData.date) dataParts.push(`Date: ${personalizedData.date}`)
    if (personalizedData.time) dataParts.push(`Time: ${personalizedData.time}`)
    if (personalizedData.location) dataParts.push(`Location: ${personalizedData.location}`)
    dataDescription = dataParts.join(', ')
  }

  // 프롬프트 구성
  let userPrompt = `Please refine this script template to make it sound natural and conversational in ${targetLanguage}:\n\n${scriptText}\n\n`
  
  if (originalAccidentDescription) {
    userPrompt += `**Original accident description from the user:** "${originalAccidentDescription}"\n\n`
    userPrompt += `Use the original description as context to make the script sound more natural and authentic. For example, if the user said "${originalAccidentDescription}", reflect that natural way of speaking in the refined script.\n\n`
  }
  
  if (dataDescription) {
    userPrompt += `Additional information collected: ${dataDescription}\n\n`
  }
  
  userPrompt += `Replace placeholders with the provided information naturally, and make sure the script sounds like how the person would actually speak based on their original description.`

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional script writer. Your task is to refine a script template for a traveler to use at a ${institutionName}. 

Make the script sound natural and conversational in ${targetLanguage}. The script should reflect how the person actually speaks based on their original accident description.

Important guidelines:
- Keep the meaning and intent of the original script
- Make it sound natural and friendly, matching the user's original speaking style
- Use the original accident description to understand the user's natural way of expressing themselves
- Replace placeholders (like [물품 설명], [증상 설명], [날짜], [시간], [장소]) with the provided data naturally
- Instead of rigid formats like "도난/분실된 물품은 가방입니다", make it more natural like "제 가방을 도난당했습니다" or similar, based on how the user originally described it
- Do not add extra explanations or notes
- Return only the refined script text in ${targetLanguage}`
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7, // 적절한 온도로 자연스러운 문장 생성
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || '스크립트 정돈 API 호출에 실패했습니다.')
    }

    const data = await response.json()
    const refinedText = data.choices[0]?.message?.content?.trim()

    if (!refinedText) {
      throw new Error('정돈된 스크립트를 받지 못했습니다.')
    }

    return refinedText

  } catch (error) {
    console.error('Script refinement API 에러:', error)
    // 정돈 실패 시 원본 텍스트 반환
    return scriptText
  }
}

/**
 * 업로드된 서류를 AI로 검증
 * @param {Array} filesData - 업로드된 파일 데이터 (Base64)
 * @param {string} coverageType - 보험 담보 유형
 * @param {string} apiKey - OpenAI API 키
 * @returns {Promise<Object>} 검증 결과
 */
export async function verifyDocuments(filesData, coverageType, apiKey) {
  try {
    // 담보 유형별 필요 서류 정의
    const requiredDocuments = {
      personal_belongings: {
        overseas: ['경찰서 신고 확인서', 'Police Report', '도난/분실 신고서'],
        description: '휴대품 손해 (도난/분실/파손)'
      },
      overseas_medical: {
        overseas: ['진단서', 'Medical Record', 'Medical Certificate', '진료비 영수증', 'Receipt'],
        description: '해외 의료비'
      },
      flight_delay: {
        overseas: ['항공기 지연 증명서', 'Delay Certificate', '탑승권', 'Boarding Pass'],
        description: '항공기 지연'
      }
    }

    const docInfo = requiredDocuments[coverageType] || requiredDocuments.personal_belongings

    // Vision API를 위한 메시지 구성
    const messages = [
      {
        role: 'system',
        content: `당신은 해외여행보험 서류 검증 전문가입니다. 업로드된 서류가 ${docInfo.description} 청구에 필요한 올바른 서류인지 검증해주세요.

필요한 서류: ${docInfo.overseas.join(', ')}

다음 형식의 JSON으로 응답해주세요:
{
  "isValid": true/false,
  "documentType": "인식된 서류 유형",
  "confidence": "높음/중간/낮음",
  "findings": ["발견한 내용 1", "발견한 내용 2"],
  "issues": ["문제점 1", "문제점 2"] (문제가 있는 경우),
  "recommendation": "추천 사항"
}`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `업로드된 ${filesData.length}개의 서류를 검증해주세요. 각 서류가 ${docInfo.description} 청구에 적합한지 확인해주세요.`
          },
          // 이미지들 추가
          ...filesData.map(file => ({
            type: 'image_url',
            image_url: {
              url: file.data, // Base64 데이터
              detail: 'high'
            }
          }))
        ]
      }
    ]

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Vision 지원 모델
        messages: messages,
        max_tokens: 1000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || '서류 검증 API 호출에 실패했습니다.')
    }

    const data = await response.json()
    const resultText = data.choices[0]?.message?.content?.trim()

    // JSON 파싱 시도
    try {
      const result = JSON.parse(resultText)
      return result
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트 결과 반환
      return {
        isValid: true,
        documentType: '서류',
        confidence: '중간',
        findings: [resultText],
        issues: [],
        recommendation: '서류를 확인했습니다.'
      }
    }

  } catch (error) {
    console.error('Document verification API 에러:', error)
    throw error
  }
}
