/**
 * 장소 검색 서비스
 * Google Places API를 사용하여 실제 장소 검색
 */

import { loadGoogleMaps } from '../utils/googleMaps.js'

// 장소 타입별 한글 이름 매핑
const PLACE_TYPE_NAMES = {
  hospital: '병원',
  police: '경찰서',
  city_hall: '시청',
  government_office: '관공서',
  pharmacy: '약국',
  restaurant: '음식점',
  cafe: '카페',
  gas_station: '주유소',
  convenience_store: '편의점',
  bank: '은행',
  parking: '주차장'
}

// 데모용 장소 데이터
const DEMO_PLACES = {
  hospital: [
    { name: '서울대학교병원', lat: 37.5800, lng: 127.0020, address: '서울특별시 종로구 대학로 101' },
    { name: '삼성서울병원', lat: 37.4881, lng: 127.0856, address: '서울특별시 강남구 일원로 81' },
    { name: '세브란스병원', lat: 37.5626, lng: 126.9400, address: '서울특별시 서대문구 연세로 50-1' }
  ],
  police: [
    { name: '종로경찰서', lat: 37.5729, lng: 126.9850, address: '서울특별시 종로구 율곡로 46' },
    { name: '남대문경찰서', lat: 37.5596, lng: 126.9752, address: '서울특별시 중구 세종대로 135' },
    { name: '서대문경찰서', lat: 37.5658, lng: 126.9657, address: '서울특별시 서대문구 통일로 179' }
  ],
  city_hall: [
    { name: '서울특별시청', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { name: '종로구청', lat: 37.5735, lng: 126.9788, address: '서울특별시 종로구 삼봉로 43' },
    { name: '중구청', lat: 37.5638, lng: 126.9975, address: '서울특별시 중구 다산로 120' }
  ],
  government_office: [
    { name: '서울특별시 중구청 민원실', lat: 37.5638, lng: 126.9975, address: '서울특별시 중구 다산로 120' },
    { name: '외교부 영사콜센터', lat: 37.5739, lng: 126.9771, address: '서울특별시 종로구 사직로 8길 60' },
    { name: '서울시 글로벌센터', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' }
  ],
  pharmacy: [
    { name: '온누리약국', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { name: '서울약국', lat: 37.5700, lng: 126.9760, address: '서울특별시 종로구 종로 1' },
    { name: '건강약국', lat: 37.5650, lng: 126.9850, address: '서울특별시 중구 명동길 14' }
  ],
  restaurant: [
    { name: '한옥마을', lat: 37.5832, lng: 126.9835, address: '서울특별시 종로구 북촌로 37' },
    { name: '서울식당', lat: 37.5750, lng: 126.9770, address: '서울특별시 종로구 종로3가' },
    { name: '맛있는집', lat: 37.5660, lng: 126.9800, address: '서울특별시 중구 명동 8가' }
  ],
  cafe: [
    { name: '카페서울', lat: 37.5660, lng: 126.9784, address: '서울특별시 중구 남대문로' },
    { name: '스타벅스 시청점', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { name: '투썸플레이스', lat: 37.5670, lng: 126.9790, address: '서울특별시 중구 을지로' }
  ],
  gas_station: [
    { name: 'SK에너지 서울주유소', lat: 37.5700, lng: 126.9850, address: '서울특별시 종로구 돈화문로' },
    { name: 'GS칼텍스 시청주유소', lat: 37.5640, lng: 126.9750, address: '서울특별시 중구 소공로' }
  ],
  convenience_store: [
    { name: 'CU 시청점', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { name: 'GS25 종로점', lat: 37.5700, lng: 126.9760, address: '서울특별시 종로구 종로' }
  ],
  bank: [
    { name: '신한은행 본점', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 9길 20' },
    { name: '국민은행 명동점', lat: 37.5636, lng: 126.9834, address: '서울특별시 중구 명동길 74' }
  ],
  parking: [
    { name: '서울시청 주차장', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { name: '명동 공영주차장', lat: 37.5635, lng: 126.9849, address: '서울특별시 중구 명동길' }
  ]
}

/**
 * Google Places API 장소 타입 매핑
 * GPT 함수의 placeType을 Google Places API type으로 변환
 */
const GOOGLE_PLACE_TYPE_MAP = {
  hospital: 'hospital',
  police: 'police',
  city_hall: 'city_hall',
  government_office: 'local_government_office',
  pharmacy: 'pharmacy',
  restaurant: 'restaurant',
  cafe: 'cafe',
  bank: 'bank'
}

/**
 * 장소 검색 (실제 Google Places API 사용)
 * @param {Object} params - 검색 파라미터
 * @param {string} params.placeType - 장소 타입
 * @param {string} params.name - 특정 장소 이름 (선택)
 * @param {boolean} params.useCurrentLocation - 현재 위치 사용 여부
 * @param {number} params.userLat - 사용자 위도 (mockUserData에서)
 * @param {number} params.userLng - 사용자 경도 (mockUserData에서)
 * @param {number} params.resultIndex - 검색 결과 인덱스 (기본값: 0, 첫 번째 결과)
 * @param {Array} params.cachedResults - 캐시된 검색 결과 (이미 검색한 경우 재사용)
 * @returns {Promise<Object>} 장소 정보 { name, lat, lng, address, placeType, zoom, allResults?, currentIndex? }
 */
export async function searchPlace({ placeType, name, useCurrentLocation, userLat, userLng, resultIndex = 0, cachedResults = null }) {
  try {
    // Google Maps API 로드
    await loadGoogleMaps()

    // 현재 위치 가져오기 또는 기본 위치
    let location

    // 1순위: 사용자 GPS 위치 정보 (mockUserData에서)
    if (userLat && userLng) {
      location = { lat: userLat, lng: userLng }
      console.log(`📍 사용자 GPS 위치 사용: ${userLat}, ${userLng}`)
    }
    // 2순위: 브라우저 Geolocation API
    else if (useCurrentLocation) {
      try {
        location = await getCurrentLocation()
        console.log('📍 브라우저 위치 사용:', location)
      } catch (error) {
        console.warn('현재 위치를 가져올 수 없어 서울시청 기준으로 검색합니다:', error)
        location = { lat: 37.5665, lng: 126.9780 } // 서울시청
      }
    }
    // 3순위: 기본 위치 (서울시청)
    else {
      location = { lat: 37.5665, lng: 126.9780 } // 서울시청
    }

    // Google Places API type으로 변환
    const googlePlaceType = GOOGLE_PLACE_TYPE_MAP[placeType] || placeType

    // Places Service 생성을 위한 임시 div
    const tempDiv = document.createElement('div')
    const service = new window.google.maps.places.PlacesService(tempDiv)

    // 주변 장소 검색 (거리 기준 정렬)
    return new Promise((resolve, reject) => {
      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        rankBy: window.google.maps.places.RankBy.DISTANCE, // 거리 기준 정렬
        type: googlePlaceType,
        language: 'ko' // 한글 결과
      }

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // 캐시된 결과가 있으면 사용, 없으면 새로 받은 결과 사용
          const searchResults = cachedResults || results
          const index = cachedResults ? resultIndex : 0
          
          // 인덱스 유효성 확인
          if (index >= searchResults.length) {
            reject(new Error(`검색 결과 인덱스(${index})가 범위를 초과했습니다. (총 ${searchResults.length}개 결과)`))
            return
          }

          // 해당 인덱스의 결과 선택
          const place = searchResults[index]
          const placeTypeName = PLACE_TYPE_NAMES[placeType] || placeType

          // 결과 객체 변환 (Google Places API 형식 → 우리 형식)
          const formatPlace = (place) => ({
            name: place.name,
            lat: place.geometry.location.lat ? place.geometry.location.lat() : place.geometry.location.lat,
            lng: place.geometry.location.lng ? place.geometry.location.lng() : place.geometry.location.lng,
            address: place.vicinity || place.formatted_address || place.address || '',
            placeType: placeTypeName, // 한글 이름 (화면 표시용)
            placeTypeRaw: placeType, // 원본 영어 타입 (다음 검색을 위해 저장)
            zoom: 15,
            // 전체 결과와 현재 인덱스 포함 (다음 결과를 위해)
            allResults: searchResults.map(p => ({
              name: p.name,
              lat: p.geometry.location.lat ? p.geometry.location.lat() : p.geometry.location.lat,
              lng: p.geometry.location.lng ? p.geometry.location.lng() : p.geometry.location.lng,
              address: p.vicinity || p.formatted_address || p.address || ''
            })),
            currentIndex: index
          })

          resolve(formatPlace(place))
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          // 결과가 없으면 데모 데이터 사용
          console.warn(`${placeType} 검색 결과가 없어 데모 데이터를 사용합니다.`)
          const demoPlaces = DEMO_PLACES[placeType] || []
          if (demoPlaces.length > 0) {
            const placeTypeName = PLACE_TYPE_NAMES[placeType] || placeType
            const index = cachedResults ? resultIndex : 0
            
            // 인덱스 유효성 확인
            if (index >= demoPlaces.length) {
              reject(new Error(`데모 데이터 인덱스(${index})가 범위를 초과했습니다. (총 ${demoPlaces.length}개 결과)`))
              return
            }

            const selectedPlace = demoPlaces[index]
            resolve({
              ...selectedPlace,
              placeType: placeTypeName, // 한글 이름
              placeTypeRaw: placeType, // 원본 영어 타입
              zoom: 15,
              // 전체 데모 결과와 현재 인덱스 포함
              allResults: demoPlaces,
              currentIndex: index
            })
          } else {
            reject(new Error(`${placeType}에 대한 장소를 찾을 수 없습니다.`))
          }
        } else {
          reject(new Error(`장소 검색 실패: ${status}`))
        }
      })
    })
  } catch (error) {
    console.error('Places API 에러:', error)
    // 에러 발생 시 데모 데이터 폴백
    const demoPlaces = DEMO_PLACES[placeType] || []
    if (demoPlaces.length > 0) {
      const placeTypeName = PLACE_TYPE_NAMES[placeType] || placeType
      const index = resultIndex || 0
      
      // 인덱스 유효성 확인
      if (index >= demoPlaces.length) {
        throw new Error(`데모 데이터 인덱스(${index})가 범위를 초과했습니다. (총 ${demoPlaces.length}개 결과)`)
      }

      const selectedPlace = demoPlaces[index]
      return {
        ...selectedPlace,
        placeType: placeTypeName, // 한글 이름
        placeTypeRaw: placeType, // 원본 영어 타입
        zoom: 15,
        // 전체 데모 결과와 현재 인덱스 포함
        allResults: demoPlaces,
        currentIndex: index
      }
    }
    throw error
  }
}

/**
 * 현재 위치 가져오기 (Geolocation API)
 * @returns {Promise<Object>} 위치 정보 { lat, lng }
 */
export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('브라우저가 위치 정보를 지원하지 않습니다.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(new Error('위치 정보를 가져올 수 없습니다: ' + error.message))
      }
    )
  })
}
