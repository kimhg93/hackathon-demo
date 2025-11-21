/**
 * Google Maps API 동적 로딩 유틸리티
 */

let isLoading = false
let isLoaded = false
let loadPromise = null

/**
 * Google Maps API 스크립트를 동적으로 로드
 * @returns {Promise<void>}
 */
export function loadGoogleMaps() {
  // 이미 로드된 경우
  if (window.google && window.google.maps) {
    console.log('✅ Google Maps API 이미 로드됨')
    isLoaded = true
    return Promise.resolve()
  }

  // 로딩 중인 경우 같은 Promise 반환
  if (isLoading && loadPromise) {
    console.log('⏳ Google Maps API 로딩 중... 대기')
    return loadPromise
  }

  // API 키 확인
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  console.log('🔑 API 키 확인:', apiKey ? `${apiKey.substring(0, 20)}...` : 'API 키 없음')

  if (!apiKey) {
    const error = new Error('Google Maps API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.')
    console.error('❌', error.message)
    return Promise.reject(error)
  }

  isLoading = true

  loadPromise = new Promise((resolve, reject) => {
    // 스크립트 동적 로드
    const script = document.createElement('script')
    const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    console.log('📡 Google Maps API 로딩 시작:', url.substring(0, 80) + '...')

    script.src = url
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log('✅ Google Maps API 로드 성공')
      isLoading = false
      isLoaded = true

      // Google API가 실제로 사용 가능한지 확인
      if (window.google && window.google.maps) {
        console.log('✅ window.google.maps 확인됨')
        resolve()
      } else {
        console.error('❌ 스크립트는 로드되었지만 window.google가 없음')
        reject(new Error('Google Maps API 객체를 찾을 수 없습니다.'))
      }
    }

    script.onerror = (error) => {
      console.error('❌ Google Maps API 로드 실패:', error)
      isLoading = false
      reject(new Error('Google Maps API 로드에 실패했습니다. API 키와 네트워크를 확인해주세요.'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}
