import fullInsuranceData from '../data/travel_insurance_rag_complete.json'
import insuranceChunksFullData from '../data/travel_insurance_chunks_full.json'

/**
 * 전체 약관 기반 RAG Service
 * - 282개 청크의 전체 약관 데이터 활용
 * - 보장내용, 면책사항, 필요서류, FAQ 등 포괄적 검색
 */

// 안전하게 청크 데이터 사용 (배열이 아니면 빈 배열로)
const insuranceChunksFull = Array.isArray(insuranceChunksFullData) 
  ? insuranceChunksFullData 
  : (insuranceChunksFullData?.default || [])

// 키워드 정규화 (유사어 처리) - 확장된 버전
const KEYWORD_SYNONYMS = {
  // 보장 관련
  '사망': ['사망', '사망보험금', '유족'],
  '장해': ['장해', '후유장해', '장해진단', '장해분류표', '장애'],
  '의료비': ['의료비', '진료비', '병원비', '치료비'],
  '입원': ['입원', '병원', '입원실'],
  '통원': ['통원', '외래', '외래진료'],
  '수술': ['수술', '수술비'],

  // 휴대품 관련
  '가방': ['가방', '배낭', '백팩', '캐리어', '짐', '수하물'],
  '도난': ['도난', '도둑', '훔쳐', '잃어버', '분실', '잃어', '잃은'],
  '파손': ['파손', '고장', '깨진', '손상', '부서진', '망가', '훼손'],
  '휴대품': ['휴대품', '소지품', '물건', '가방', '소유물'],

  // 장소 관련
  '병원': ['병원', '의료', '진료', '치료', '응급실', '의료기관'],
  '경찰서': ['경찰서', '파출소', 'police', '경찰'],
  '해외': ['해외', '국외', '외국', '외국'],
  '여행': ['여행', '출국', '입국', '여행중'],

  // 절차 관련
  '청구': ['청구', '신청', '보상', '환급', '지급'],
  '서류': ['서류', '문서', '증명서', '영수증', '진단서'],

  // 배상 관련
  '배상': ['배상', '손해배상', '배상책임', '책임'],

  // 기타
  '항공기': ['항공기', '비행기', '항공편', '비행'],
  '지연': ['지연', '연착', '취소'],
  '여권': ['여권', '패스포트'],
  
  // 회사 정보 관련
  '위치': ['위치', '주소', '어디', '어디에', '장소'],
  '전화': ['전화', '전화번호', '연락처', '번호', 'tel', 'phone'],
  '고객센터': ['고객센터', '상담', '문의', '연락'],
  '회사': ['회사', '라이나', 'lina', '처브', 'chubb']
}

/**
 * 사용자 쿼리에서 키워드 추출
 */
function extractKeywords(query) {
  const keywords = new Set()
  const queryLower = query.toLowerCase()

  // 각 동의어 그룹과 매칭
  for (const [mainKeyword, synonyms] of Object.entries(KEYWORD_SYNONYMS)) {
    if (synonyms.some(synonym => queryLower.includes(synonym))) {
      keywords.add(mainKeyword)
    }
  }

  // 직접 키워드도 추가
  const directKeywords = queryLower.split(/\s+/).filter(word => word.length >= 2)
  directKeywords.forEach(kw => keywords.add(kw))

  return Array.from(keywords)
}

/**
 * TF-IDF 기반 스코어링
 */
function calculateRelevanceScore(text, keywords) {
  const textLower = text.toLowerCase()
  let score = 0

  keywords.forEach(keyword => {
    const count = (textLower.match(new RegExp(keyword, 'g')) || []).length
    score += count * (1 + Math.log(keyword.length)) // 긴 키워드에 가중치
  })

  return score
}

/**
 * 보장내용 검색
 */
export function searchCoverage(query) {
  const keywords = extractKeywords(query.toLowerCase())
  const results = []

  // fullInsuranceData에서 보장내용 검색
  const coverages = fullInsuranceData.보장내용 || []

  coverages.forEach(coverage => {
    const searchText = JSON.stringify(coverage).toLowerCase()
    const score = calculateRelevanceScore(searchText, keywords)

    if (score > 0) {
      results.push({
        type: 'coverage',
        data: coverage,
        score
      })
    }
  })

  return results.sort((a, b) => b.score - a.score)
}

/**
 * 면책사항 검색
 */
export function searchExclusions(query) {
  const keywords = extractKeywords(query.toLowerCase())
  const results = []

  const exclusions = fullInsuranceData.면책사항 || []

  exclusions.forEach((exclusion, index) => {
    const score = calculateRelevanceScore(exclusion.toLowerCase(), keywords)

    if (score > 0) {
      results.push({
        type: 'exclusion',
        data: exclusion,
        index,
        score
      })
    }
  })

  return results.sort((a, b) => b.score - a.score)
}

/**
 * 필요서류 검색
 */
export function searchRequiredDocuments(query) {
  const keywords = extractKeywords(query.toLowerCase())
  const results = []

  const documents = fullInsuranceData.필요서류 || {}

  for (const [docType, docList] of Object.entries(documents)) {
    const searchText = `${docType} ${JSON.stringify(docList)}`.toLowerCase()
    const score = calculateRelevanceScore(searchText, keywords)

    if (score > 0) {
      results.push({
        type: 'documents',
        docType,
        documents: docList,
        score
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

/**
 * FAQ 검색
 */
export function searchFAQ(query) {
  const keywords = extractKeywords(query.toLowerCase())
  const results = []

  const faqs = fullInsuranceData.FAQ || []

  faqs.forEach((faq, index) => {
    const searchText = `${faq.질문} ${faq.답변} ${faq.관련키워드?.join(' ') || ''}`.toLowerCase()
    const score = calculateRelevanceScore(searchText, keywords)

    if (score > 0) {
      results.push({
        type: 'faq',
        data: faq,
        index,
        score
      })
    }
  })

  return results.sort((a, b) => b.score - a.score)
}

/**
 * 청크 기반 의미 검색 (전체 약관 텍스트에서 검색)
 * 282개 전체 청크에서 검색
 */
export function searchChunks(query, topK = 10) {
  const keywords = extractKeywords(query.toLowerCase())
  const results = []

  // 안전하게 청크 데이터 확인
  if (!Array.isArray(insuranceChunksFull) || insuranceChunksFull.length === 0) {
    console.warn('청크 데이터가 없거나 배열이 아닙니다:', insuranceChunksFull)
    return []
  }

  // 전체 282개 청크에서 검색
  insuranceChunksFull.forEach(chunk => {
    if (!chunk) return // null/undefined 체크
    
    const title = chunk.title || ''
    const content = chunk.content || ''
    const category = chunk.category || ''
    const searchText = `${title} ${content} ${category}`.toLowerCase()
    const score = calculateRelevanceScore(searchText, keywords)

    if (score > 0) {
      results.push({
        type: 'chunk',
        chunk_id: chunk.chunk_id,
        title: title,
        content: content,
        category: category,
        char_count: chunk.char_count,
        score
      })
    }
  })

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/**
 * 특약 검색
 */
export function searchSpecialTerms(query) {
  const keywords = extractKeywords(query.toLowerCase())
  const results = []

  const specialTerms = fullInsuranceData.특약상세 || []

  specialTerms.forEach((term, index) => {
    const searchText = JSON.stringify(term).toLowerCase()
    const score = calculateRelevanceScore(searchText, keywords)

    if (score > 0) {
      results.push({
        type: 'special_term',
        data: term,
        index,
        score
      })
    }
  })

  return results.sort((a, b) => b.score - a.score)
}

/**
 * 통합 검색 - 모든 지식 베이스에서 검색
 */
export function searchKnowledge(query) {
  const coverages = searchCoverage(query)
  const exclusions = searchExclusions(query)
  const documents = searchRequiredDocuments(query)
  const faqs = searchFAQ(query)
  const chunks = searchChunks(query, 10) // 10개 청크까지 검색
  const specialTerms = searchSpecialTerms(query)

  return {
    coverages: coverages.slice(0, 5),
    exclusions: exclusions.slice(0, 3),
    documents: documents.slice(0, 3),
    faqs: faqs.slice(0, 3),
    chunks: chunks,
    specialTerms: specialTerms.slice(0, 3),
    contactInfo: fullInsuranceData.문서정보.연락처,
    address: fullInsuranceData.문서정보.주소, // 주소 정보 추가
    companyInfo: fullInsuranceData.문서정보, // 전체 회사 정보
    claimProcess: fullInsuranceData.청구절차
  }
}

/**
 * RAG 컨텍스트 생성 - OpenAI에 전달할 컨텍스트 구성
 */
export function buildRAGContext(query) {
  const searchResults = searchKnowledge(query)

  let context = `# 해외여행보험 약관 지식 베이스\n\n`
  context += `사용자 질문: ${query}\n\n`

  // 보장 내용
  if (searchResults.coverages.length > 0) {
    context += `## 관련 보장 내용\n`
    searchResults.coverages.forEach((item, idx) => {
      const coverage = item.data
      context += `${idx + 1}. **${coverage.구분}**\n`
      context += `   - 지급사유: ${coverage.지급사유}\n`
      if (coverage.보장한도) {
        context += `   - 보장한도: ${coverage.보장한도}\n`
      }
      if (coverage.특이사항) {
        context += `   - 특이사항: ${coverage.특이사항}\n`
      }
      if (coverage.포함항목) {
        context += `   - 포함항목: ${coverage.포함항목.join(', ')}\n`
      }
      if (coverage.자기부담금) {
        context += `   - 자기부담금: ${coverage.자기부담금}\n`
      }
      context += `\n`
    })
  }

  // 필요 서류
  if (searchResults.documents.length > 0) {
    context += `## 필요 서류\n`
    searchResults.documents.forEach((item, idx) => {
      context += `${idx + 1}. **${item.docType}**\n`
      item.documents.forEach(doc => {
        context += `   - ${doc}\n`
      })
      context += `\n`
    })
  }

  // 면책 사항
  if (searchResults.exclusions.length > 0) {
    context += `## 면책 사항 (보장하지 않는 경우)\n`
    searchResults.exclusions.slice(0, 5).forEach((item, idx) => {
      context += `${idx + 1}. ${item.data}\n`
    })
    context += `\n`
  }

  // FAQ
  if (searchResults.faqs.length > 0) {
    context += `## 관련 FAQ\n`
    searchResults.faqs.forEach((item, idx) => {
      const faq = item.data
      context += `${idx + 1}. Q: ${faq.질문}\n`
      context += `   A: ${faq.답변}\n\n`
    })
  }

  // 청크 검색 결과 (상세 약관 내용) - 더 많은 정보 포함
  if (searchResults.chunks.length > 0) {
    context += `## 관련 약관 조항 (상세 내용)\n`
    searchResults.chunks.forEach((chunk, idx) => {
      if (chunk.title && chunk.title.trim()) {
        context += `${idx + 1}. **${chunk.title}**`
        if (chunk.category) {
          context += ` [${chunk.category}]`
        }
        context += `\n`
      }
      // 더 긴 내용 포함 (600자까지)
      const contentPreview = chunk.content ? chunk.content.substring(0, 600) : ''
      if (contentPreview) {
        context += `${contentPreview}${chunk.content.length > 600 ? '...' : ''}\n\n`
      }
    })
  }

  // 특약 정보
  if (searchResults.specialTerms.length > 0) {
    context += `## 관련 특약\n`
    searchResults.specialTerms.forEach((item, idx) => {
      const term = item.data
      context += `${idx + 1}. ${term.특약명} (${term.선택가능여부})\n`
    })
    context += `\n`
  }

  // 청구 절차
  if (searchResults.claimProcess) {
    context += `## 보험금 청구 절차\n`
    searchResults.claimProcess.절차?.forEach(step => {
      context += `${step.단계}. ${step.내용}\n`
      context += `   ${step.설명}\n`
    })
    if (searchResults.claimProcess.청구기한) {
      context += `\n청구기한: ${searchResults.claimProcess.청구기한}\n`
    }
    context += `\n`
  }

  // 회사 정보 (항상 포함 - 회사 위치, 전화번호 등의 질문에 대응)
  if (searchResults.companyInfo) {
    context += `## 라이나손해보험 회사 정보\n`
    context += `- 상품명: ${searchResults.companyInfo.상품명 || ''}\n`
    context += `- 보험사: ${searchResults.companyInfo.보험사 || ''}\n`
    context += `- 소속그룹: ${searchResults.companyInfo.소속그룹 || ''}\n`
    if (searchResults.contactInfo) {
      context += `- 고객센터: ${searchResults.contactInfo.고객센터 || ''}\n`
      context += `- 대표번호: ${searchResults.contactInfo.대표번호 || ''}\n`
      context += `- 홈페이지: ${searchResults.contactInfo.홈페이지 || ''}\n`
    }
    if (searchResults.address) {
      context += `- 주소: ${searchResults.address}\n`
    }
    if (searchResults.companyInfo.발행일) {
      context += `- 발행일: ${searchResults.companyInfo.발행일}\n`
    }
    context += `\n`
  }

  // 주의사항
  const notes = fullInsuranceData.주의사항 || []
  if (notes.length > 0) {
    context += `## 중요 안내사항\n`
    notes.forEach(note => {
      context += `- ${note}\n`
    })
    context += `\n`
  }

  // 핵심 용어 정의 (참고용)
  const termDefinitions = fullInsuranceData.핵심용어 || {}
  if (Object.keys(termDefinitions).length > 0) {
    // 질문과 관련된 용어만 포함
    const queryLower = query.toLowerCase()
    const relevantTerms = Object.entries(termDefinitions).filter(([term]) => 
      queryLower.includes(term.toLowerCase())
    )
    if (relevantTerms.length > 0) {
      context += `## 핵심 용어 정의\n`
      relevantTerms.forEach(([term, definition]) => {
        context += `- **${term}**: ${definition.정의 || ''}\n`
        if (definition.제외) {
          context += `  (제외: ${definition.제외})\n`
        }
      })
      context += `\n`
    }
  }

  return context
}

/**
 * 여행 정보 질문인지 판단 (날씨, 환율 등)
 */
export function isTravelInfoQuery(query) {
  const travelInfoKeywords = [
    '날씨', 'weather', '기온', '온도', '비', '눈', '맑음',
    '환율', 'exchange rate', '달러', '유로', '엔', '위안',
    '통화', '원화', 'currency', '환전',
    '시차', 'timezone', '시간대', '현지시간',
    '비자', 'visa', '입국', '출국',
    '공항', 'airport', '항공권', 'flight',
    '숙박', '호텔', 'hotel', '예약',
    '교통', '지하철', '버스', '택시',
    '맛집', '음식', '레스토랑', 'restaurant'
  ]

  return travelInfoKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  )
}

/**
 * 보험 관련 질문인지 판단
 * 회사 정보 질문도 포함 (위치, 전화번호 등)
 */
export function isInsuranceRelatedQuery(query) {
  const insuranceKeywords = [
    '보험', '청구', '보상', '서류', '증명서', '영수증',
    '도난', '파손', '분실', '사고', '의료비', '병원',
    '휴대품', '상해', '질병', '배상', '책임',
    '경찰서', 'police', '진단서', '사망', '장해',
    '입원', '통원', '수술', '치료', '항공기', '지연',
    '여권', '면책', '약관', '가입', '계약',
    // 회사 정보 관련 키워드 추가
    '주소', '전화', '전화번호', '연락처', '고객센터',
    '회사', '라이나', 'lina', '처브', 'chubb', '상담', '문의',
    '어디', '어디에', '번호', 'tel', 'phone', '홈페이지'
  ]

  // '여행' 키워드는 제외 (여행 정보 질문과 겹칠 수 있음)
  // 대신 '해외여행', '여행보험' 같은 조합으로 판단

  const queryLower = query.toLowerCase()

  // 보험 관련 키워드 확인
  if (insuranceKeywords.some(keyword => queryLower.includes(keyword))) {
    return true
  }

  // '여행' 키워드가 있으면 보험 관련 맥락인지 확인
  if (queryLower.includes('여행')) {
    // '여행보험', '여행 중 사고' 등 보험 관련 맥락이면 true
    const insuranceContextKeywords = ['보험', '사고', '청구', '보상', '서류', '보장']
    if (insuranceContextKeywords.some(keyword => queryLower.includes(keyword))) {
      return true
    }
  }

  return false
}

/**
 * 청구 시나리오(사고 상황)인지 판단
 * 도난, 분실, 파손, 질병, 상해, 항공기 지연 등의 키워드로 사고 발생 여부 감지
 */
export function isClaimScenario(query) {
  const queryLower = query.toLowerCase()

  // 휴대품 손해 관련 키워드
  const personalBelongingsKeywords = [
    '도난', '도둑', '훔쳐', '훔친', '도난당',
    '분실', '잃어버', '잃은', '잃었', '없어졌', '못 찾',
    '파손', '깨진', '깨졌', '부서진', '고장', '망가', '훼손',
    '부러진', '찢어진'
  ]

  // 의료비 관련 키워드
  const medicalKeywords = [
    '아파', '아픈', '아프', '통증', '아팠',
    '다쳤', '다친', '다쳐', '부상',
    '병원', '응급실', '진료', '치료', '입원',
    '발목', '손목', '머리', '배', '다리', '팔',
    '삠', '골절', '염좌', '타박상',
    '열', '발열', '고열', '구토', '설사', '복통',
    '식중독', '감기', '독감'
  ]

  // 항공기 지연 관련 키워드
  const flightDelayKeywords = [
    '항공기', '비행기', '항공편', '비행', 'flight',
    '지연', '연착', '취소', 'delay', 'delayed', 'cancel',
    '못 타', '못탔', '놓쳤'
  ]

  // 물품 관련 키워드 (사고와 함께 언급될 때)
  const itemKeywords = [
    '휴대폰', '핸드폰', '스마트폰', '폰', 'phone',
    '아이패드', '아이폰', '맥북', '노트북', '태블릿',
    '지갑', '여권', '가방', '카메라', '시계', '안경',
    '캐리어', '짐', '수하물'
  ]

  // 휴대품 손해 키워드 확인
  const hasPersonalBelongingsIncident = personalBelongingsKeywords.some(
    keyword => queryLower.includes(keyword)
  )

  // 의료 사고 키워드 확인
  const hasMedicalIncident = medicalKeywords.some(
    keyword => queryLower.includes(keyword)
  )

  // 항공기 지연 키워드 확인
  const hasFlightDelayIncident = flightDelayKeywords.some(
    keyword => queryLower.includes(keyword)
  )

  // 물품 키워드 확인
  const hasItemMention = itemKeywords.some(
    keyword => queryLower.includes(keyword)
  )

  // 사고 시나리오 판단 (우선순위 순서대로)
  // 1. 휴대품 손해 키워드만 있어도 사고로 판단
  if (hasPersonalBelongingsIncident) {
    return {
      isAccident: true,
      type: 'personal_belongings'
    }
  }

  // 2. 의료 키워드만 있어도 사고로 판단
  if (hasMedicalIncident) {
    return {
      isAccident: true,
      type: 'overseas_medical'
    }
  }

  // 3. 항공기 지연 키워드 확인
  if (hasFlightDelayIncident) {
    return {
      isAccident: true,
      type: 'flight_delay'
    }
  }

  // 4. 물품 언급 + "없어졌어요", "못 찾겠어요" 같은 표현
  if (hasItemMention && (queryLower.includes('없어') || queryLower.includes('못 찾'))) {
    return {
      isAccident: true,
      type: 'personal_belongings'
    }
  }

  return {
    isAccident: false,
    type: null
  }
}

/**
 * 카테고리별 키워드 매핑 조회
 */
export function getCategoryKeywords() {
  return fullInsuranceData.카테고리_키워드매핑 || {}
}

/**
 * 핵심 용어 정의 조회
 */
export function getTermDefinitions() {
  return fullInsuranceData.핵심용어 || {}
}

/**
 * 전체 데이터 통계
 */
export function getDataStats() {
  return {
    보장내용: fullInsuranceData.보장내용?.length || 0,
    면책사항: fullInsuranceData.면책사항?.length || 0,
    필요서류카테고리: Object.keys(fullInsuranceData.필요서류 || {}).length,
    FAQ: fullInsuranceData.FAQ?.length || 0,
    특약: fullInsuranceData.특약상세?.length || 0,
    청크: insuranceChunksFull.length
  }
}
