/**
 * 보험 담보별 필요 서류 데이터
 * 라이나 해외여행보험 청구 서류 기준
 */

export const CLAIM_DOCUMENTS = {
  // 휴대품 손해 (도난, 분실, 파손)
  personal_belongings: {
    overseas: [
      {
        name: 'Police Report (경찰서 신고 확인서)',
        description: '현지 경찰서에서 발급받은 도난/분실 신고 확인서',
        required: true
      },
      {
        name: '사고 경위서',
        description: '사고 발생 경위를 상세히 작성한 문서',
        required: true
      }
    ],
    home: [
      {
        name: '물품 구입 영수증',
        description: '도난/파손된 물품의 구입 증빙 (영수증, 카드 전표 등)',
        required: true
      },
      {
        name: '여권 사본',
        description: '해외 체류 기간 확인용 여권 사본',
        required: true
      },
      {
        name: '보험금 청구서',
        description: '라이나손해보험 청구서 양식 작성',
        required: true
      },
      {
        name: '보험증권 사본',
        description: '가입한 보험 계약 확인용',
        required: false
      }
    ],
    guidance: {
      overseas_actions: [
        '즉시 현지 경찰서에 방문하여 도난/분실 신고',
        'Police Report 발급 받기 (영문 또는 현지어)',
        '사고 경위를 자세히 기록'
      ],
      home_actions: [
        '물품 구입 영수증 준비',
        '여권 사본 스캔',
        '청구서 작성',
        '라이나손해보험 고객센터(1666-5075) 연락'
      ]
    }
  },

  // 해외 의료비 (질병, 상해)
  overseas_medical: {
    overseas: [
      {
        name: '진단서 / Medical Record',
        description: '현지 병원에서 발급받은 진단서 (영문)',
        required: true
      },
      {
        name: '진료비 영수증 원본',
        description: '병원 진료비 지불 증빙 (원본 필수)',
        required: true
      },
      {
        name: '진료비 세부 내역서',
        description: '치료 항목별 상세 비용 명세',
        required: true
      }
    ],
    home: [
      {
        name: '여권 및 항공권 사본',
        description: '해외 체류 기간 및 출입국 확인용',
        required: true
      },
      {
        name: '보험금 청구서',
        description: '라이나손해보험 청구서 양식 작성',
        required: true
      },
      {
        name: '보험증권 사본',
        description: '가입한 보험 계약 확인용',
        required: false
      },
      {
        name: '진료비 지불 증빙 (신용카드)',
        description: '카드 결제 내역 (선택사항)',
        required: false
      }
    ],
    guidance: {
      overseas_actions: [
        '즉시 현지 병원 방문하여 진료 받기',
        '진단서 및 진료비 영수증 원본 발급 요청 (영문)',
        '진료비 세부 내역서 받기',
        '모든 영수증과 서류 원본 보관'
      ],
      home_actions: [
        '여권 및 항공권 사본 준비',
        '청구서 작성',
        '라이나손해보험 고객센터(1666-5075) 연락',
        '주민등록번호는 전화로만 상담원에게 제공'
      ]
    }
  },

  // 항공기 지연
  flight_delay: {
    overseas: [
      {
        name: '항공기 지연 증명서',
        description: '항공사에서 발급한 지연 확인서 (Delay Certificate)',
        required: true
      },
      {
        name: '탑승권 원본 또는 사본',
        description: '지연된 항공편의 탑승권 (Boarding Pass)',
        required: true
      },
      {
        name: '항공권 사본',
        description: 'E-ticket 또는 항공권 예약 확인서',
        required: true
      }
    ],
    home: [
      {
        name: '보험금 청구서',
        description: '라이나손해보험 청구서 양식 작성',
        required: true
      },
      {
        name: '여권 사본',
        description: '해외 여행 확인용',
        required: true
      },
      {
        name: '보험증권 사본',
        description: '가입한 보험 계약 확인용',
        required: false
      }
    ],
    guidance: {
      overseas_actions: [
        '항공사 카운터에서 지연 증명서(Delay Certificate) 발급 요청',
        '탑승권 원본 또는 사본 보관',
        '항공권(E-ticket) 사본 준비',
        '지연 시간 및 사유 확인'
      ],
      home_actions: [
        '여권 사본 준비',
        '청구서 작성',
        '라이나손해보험 고객센터(1666-5075) 연락',
        '지연 증명서 및 탑승권 제출'
      ]
    }
  }
}

/**
 * 담보 유형별 간단한 설명
 */
export const COVERAGE_INFO = {
  personal_belongings: {
    title: '휴대품 손해',
    description: '여행 중 휴대품의 도난, 분실, 파손으로 인한 손해를 보상합니다.',
    icon: '🎒'
  },
  overseas_medical: {
    title: '해외 의료비',
    description: '해외 여행 중 질병이나 상해로 인한 치료비를 보상합니다.',
    icon: '🏥'
  },
  flight_delay: {
    title: '항공기 지연',
    description: '예정 출발시각으로부터 4시간 이상 지연된 경우 보상합니다.',
    icon: '✈️'
  }
}

/**
 * 청구 안내 정보
 */
export const CLAIM_INFO = {
  phone: '1666-5075',
  phoneDescription: '라이나손해보험 여행보험 고객센터',
  url: 'https://www.chubb.com/kr-kr/',
  disclaimer: '⚠️ 보험금 지급 여부는 약관 및 심사 결과에 따라 최종 결정됩니다.'
}
