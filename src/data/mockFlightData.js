/**
 * 공항 중심의 항공편 관련 데이터
 */

// 공항별 통합 데이터
export const AIRPORTS = {
  ICN: {
    code: 'ICN',
    name: '인천국제공항',
    // 날씨 정보
    weather: {
      temperature: '12°C',
      description: '맑음',
      humidity: '55%',
      windSpeed: '3m/s',
      feelsLike: '10°C'
    },
    // 라운지 정보
    lounges: [
      {
        name: '스카이허브 라운지',
        location: '제1터미널 3층 동편 28번 게이트 근처',
        hours: '05:30 - 21:30'
      },
      {
        name: 'KAL 비즈니스클래스 라운지',
        location: '제2터미널 3층 253번 게이트 근처',
        hours: '05:00 - 22:00'
      },
      {
        name: '아시아나 비즈니스 라운지',
        location: '제1터미널 3층 동편 29번 게이트',
        hours: '05:00 - 21:00'
      },
      {
        name: 'MATINA',
        location: '제2터미널 지하1층 푸드코트',
        hours: '24시간'
      }
    ],
    // 해당 공항에서 출발하는 항공편들
    flights: [
      {
        flightNumber: 'OZ102',
        airline: '아시아나항공',
        departure: {
          airport: '인천',
          code: 'ICN',
          date: '2024-11-25',
          time: '17:00',
          datetime: '2024-11-25T17:00:00+09:00'
        },
        arrival: {
          airport: '하네다',
          code: 'HND',
          date: '2024-11-25',
          time: '19:30',
          datetime: '2024-11-25T19:30:00+09:00'
        }
      }
    ]
  },
  GMP: {
    code: 'GMP',
    name: '김포국제공항',
    // 날씨 정보
    weather: {
      temperature: '13°C',
      description: '구름 조금',
      humidity: '60%',
      windSpeed: '2m/s',
      feelsLike: '11°C'
    },
    // 라운지 정보
    lounges: [
      {
        name: 'KAL 라운지',
        location: '국제선청사 3층 28번 게이트 맞은편',
        hours: '06:00 - 19:00'
      },
      {
        name: '아시아나 라운지',
        location: '국제선청사 3층 출국장',
        hours: '06:00 - 18:30'
      },
      {
        name: 'SKY HUB LOUNGE',
        location: '국제선청사 3층 26번 게이트 인근',
        hours: '06:00 - 19:00'
      }
    ],
    // 해당 공항에서 출발하는 항공편들
    flights: [
      {
        flightNumber: 'KE706',
        airline: '대한항공',
        departure: {
          airport: '김포',
          code: 'GMP',
          date: '2024-11-25',
          time: '10:45',
          datetime: '2024-11-25T10:45:00+09:00'
        },
        arrival: {
          airport: '나리타',
          code: 'NRT',
          date: '2024-11-25',
          time: '13:10',
          datetime: '2024-11-25T13:10:00+09:00'
        }
      }
    ]
  }
}

/**
 * 항공편명으로 항공편 정보 찾기
 * @param {string} flightNumber - 항공편명 (예: OZ102, KE706)
 * @returns {Object|null} { airport, flight } - 공항 정보와 항공편 정보
 */
function findFlightInfo(flightNumber) {
  if (!flightNumber) return null

  const upperFlightNumber = flightNumber.toUpperCase()

  // 모든 공항을 순회하며 해당 항공편 찾기
  for (const airportCode in AIRPORTS) {
    const airport = AIRPORTS[airportCode]
    if (airport.flights && Array.isArray(airport.flights)) {
      const flight = airport.flights.find(f => f.flightNumber === upperFlightNumber)
      if (flight) {
        return { airport, flight }
      }
    }
  }

  return null
}

/**
 * 항공편명으로 출발 공항 코드 가져오기
 * @param {string} flightNumber - 항공편명 (예: OZ102, KE706)
 * @returns {string} 공항 코드 (ICN, GMP 등)
 */
export function getDepartureAirportCode(flightNumber) {
  if (!flightNumber) return 'ICN'

  const flightInfo = findFlightInfo(flightNumber)
  return flightInfo ? flightInfo.airport.code : 'ICN'
}

/**
 * 공항 코드로 공항 정보 가져오기
 * @param {string} code - 공항 코드 (ICN, GMP)
 * @returns {Object} 공항 정보
 */
export function getAirport(code) {
  return AIRPORTS[code] || AIRPORTS.ICN
}

/**
 * 공항 코드로 공항 이름 가져오기
 * @param {string} code - 공항 코드 (ICN, GMP)
 * @returns {string} 공항 이름
 */
export function getAirportName(code) {
  const airport = AIRPORTS[code]
  return airport ? airport.name : '인천국제공항'
}

/**
 * 항공편 스케줄 정보 가져오기
 * @param {string} flightNumber - 항공편명
 * @returns {Object|null} 스케줄 정보
 */
export function getFlightSchedule(flightNumber) {
  if (!flightNumber) return null

  const flightInfo = findFlightInfo(flightNumber)
  return flightInfo ? flightInfo.flight : null
}

/**
 * 공항별 라운지 정보 가져오기
 * @param {string} airportCode - 공항 코드 (ICN, GMP)
 * @returns {Array} 라운지 목록
 */
export function getAirportLounges(airportCode) {
  const airport = AIRPORTS[airportCode] || AIRPORTS.ICN
  return airport.lounges || []
}

/**
 * 공항별 날씨 정보 가져오기
 * @param {string} airportCode - 공항 코드 (ICN, GMP)
 * @returns {Object} 날씨 정보
 */
export function getAirportWeather(airportCode) {
  const airport = AIRPORTS[airportCode] || AIRPORTS.ICN
  return {
    ...airport.weather,
    location: airport.name
  }
}

/**
 * 항공편 지연 상태 가져오기 (데모용)
 * @param {string} userName - 사용자 이름
 * @returns {Object} 지연 정보 { delayed, delayMinutes, text }
 */
export function getFlightDelayStatus(userName) {
  // 김손보: 4시간 이상 지연(보상 가능), 허승진: 2.5시간 지연(보상 불가)
  const delayMinutes = userName === '김손보' ? 250 : 150
  return {
    delayed: true,
    delayMinutes,
    text: '지연'
  }
}
