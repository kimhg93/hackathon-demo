/**
 * 해커톤 데모용 가상 사용자 데이터
 */

export const MOCK_USERS = [
  {
    id: 'user1',
    name: '김해커',
    policyNumber: 'CHB2024-1234567',
    birthDate: '1990-01-15',
    phoneNumber: '010-1234-5678',
    email: 'hacker@example.com',

    // 보험 상품 정보
    insurance: {
      productName: 'Chubb 해외여행보험 프리미엄',
      startDate: '2024-11-20',
      endDate: '2024-12-05',
      destination: '프랑스 파리',

      // 보장 내용
      coverages: [
        {
          name: '해외여행 중 상해사망/후유장해',
          limit: '1억원',
          description: '여행 중 사고로 인한 사망 또는 장해',
          icon: '🏥',
          covered: true
        },
        {
          name: '질병사망 및 80% 이상 후유장해',
          limit: '5,000만원',
          description: '질병으로 인한 사망 또는 심각한 장해',
          icon: '💊',
          covered: true
        },
        {
          name: '해외여행 실손의료비',
          limit: '3,000만원',
          description: '해외 의료비 및 국내 입원/통원비',
          icon: '🏥',
          covered: true
        },
        {
          name: '휴대품 손해',
          limit: '100만원',
          description: '휴대품 도난/파손 (개당 20만원 한도)',
          icon: '🎒',
          covered: true,
          deductible: '1만원'
        },
        {
          name: '배상책임',
          limit: '1억원',
          description: '타인의 신체/재물 손해 배상',
          icon: '⚖️',
          covered: true,
          deductible: '1만원'
        },
        {
          name: '항공기 및 수하물 지연',
          limit: '30만원',
          description: '4시간 이상 지연 시 보상',
          icon: '✈️',
          covered: true
        },
        {
          name: '여권 분실',
          limit: '6.7만원',
          description: '여권 재발급 비용',
          icon: '📕',
          covered: true
        }
      ]
    },

    // 현재 진행 중인 사고 (있을 수도, 없을 수도)
    currentClaim: null
  },
  {
    id: 'user2',
    name: '허승진',
    policyNumber: 'LPA2024-1234567',
    birthDate: '1988-02-02',
    phoneNumber: '010-5555-6666',
    email: 'seungjin@example.com',

    // 보험 상품 정보
    insurance: {
      productName: 'Chubb 해외여행보험 베이직',
      startDate: '2024-11-15',
      endDate: '2024-11-30',
      destination: '일본',

      // 보장 내용
      coverages: [
        {
          name: '해외여행 중 상해사망/후유장해',
          limit: '5,000만원',
          description: '여행 중 사고로 인한 사망 또는 장해',
          icon: '🏥',
          covered: true
        },
        {
          name: '질병사망 및 80% 이상 후유장해',
          limit: '3,000만원',
          description: '질병으로 인한 사망 또는 심각한 장해',
          icon: '💊',
          covered: true
        },
        {
          name: '해외여행 실손의료비',
          limit: '2,000만원',
          description: '해외 의료비 및 국내 입원/통원비',
          icon: '🏥',
          covered: true
        },
        {
          name: '휴대품 손해',
          limit: '50만원',
          description: '휴대품 도난/파손 (개당 10만원 한도)',
          icon: '🎒',
          covered: true,
          deductible: '1만원'
        },
        {
          name: '배상책임',
          limit: '5,000만원',
          description: '타인의 신체/재물 손해 배상',
          icon: '⚖️',
          covered: true,
          deductible: '1만원'
        },
        {
          name: '항공기 및 수하물 지연',
          limit: '20만원',
          description: '4시간 이상 지연 시 보상',
          icon: '✈️',
          covered: true
        }
      ]
    },

    // 현재 진행 중인 사고 (있을 수도, 없을 수도)
    currentClaim: null
  },
  {
    id: 'user3',
    name: '김손보',
    policyNumber: 'OTA2024-1234567',
    birthDate: '1990-02-02',
    phoneNumber: '010-7777-8888',
    email: 'sonbo@example.com',

    // 보험 상품 정보
    insurance: {
      productName: 'Chubb 해외여행보험 베이직',
      startDate: '2024-11-15',
      endDate: '2024-11-30',
      destination: '일본',

      // 보장 내용
      coverages: [
        {
          name: '해외여행 중 상해사망/후유장해',
          limit: '5,000만원',
          description: '여행 중 사고로 인한 사망 또는 장해',
          icon: '🏥',
          covered: true
        },
        {
          name: '질병사망 및 80% 이상 후유장해',
          limit: '3,000만원',
          description: '질병으로 인한 사망 또는 심각한 장해',
          icon: '💊',
          covered: true
        },
        {
          name: '해외여행 실손의료비',
          limit: '2,000만원',
          description: '해외 의료비 및 국내 입원/통원비',
          icon: '🏥',
          covered: true
        },
        {
          name: '휴대품 손해',
          limit: '50만원',
          description: '휴대품 도난/파손 (개당 10만원 한도)',
          icon: '🎒',
          covered: true,
          deductible: '1만원'
        },
        {
          name: '배상책임',
          limit: '5,000만원',
          description: '타인의 신체/재물 손해 배상',
          icon: '⚖️',
          covered: true,
          deductible: '1만원'
        },
        {
          name: '항공기 및 수하물 지연',
          limit: '20만원',
          description: '4시간 이상 지연 시 보상',
          icon: '✈️',
          covered: true
        }
      ]
    },

    // 현재 진행 중인 사고 (있을 수도, 없을 수도)
    currentClaim: null
  }
]

/**
 * 보험증권번호로 사용자 찾기
 */
export function findUserByPolicyNumber(policyNumber) {
  return MOCK_USERS.find(user => user.policyNumber === policyNumber)
}

/**
 * 이름과 생년월일로 사용자 찾기
 */
export function findUserByNameAndBirth(name, birthDate) {
  return MOCK_USERS.find(user =>
    user.name === name && user.birthDate === birthDate
  )
}

/**
 * 간단 인증 (데모용)
 */
export function authenticateUser(credentials) {
  const { policyNumber, name, birthDate } = credentials

  if (policyNumber) {
    return findUserByPolicyNumber(policyNumber)
  }

  if (name && birthDate) {
    return findUserByNameAndBirth(name, birthDate)
  }

  return null
}
