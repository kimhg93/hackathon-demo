<template>
  <div class="map-message">
    <!-- 로딩 오버레이 -->
    <div v-if="isMapLoading" class="map-loading overlay">
      <div class="loading-spinner"></div>
      <p>지도를 불러오는 중...</p>
    </div>

    <!-- 에러 오버레이 -->
    <div v-if="mapError" class="map-error overlay">
      <span class="error-icon">⚠️</span>
      <p>{{ mapError }}</p>
    </div>

    <!-- 구글 맵 컨테이너 (항상 렌더링) -->
    <div ref="mapContainer" class="map-container"></div>
    <div v-if="location.address && !isMapLoading && !mapError" class="location-info">
      <div class="location-details">
        <span class="location-icon">📍</span>
        <span class="address">{{ location.address }}</span>
      </div>
      <a :href="googleMapsUrl" target="_blank" class="directions-button">
        🧭 길찾기
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { loadGoogleMaps } from '../../utils/googleMaps.js'

// Props 정의
const props = defineProps({
  location: {
    type: Object,
    required: true,
    // location: { lat, lng, address, zoom }
    validator: (value) => {
      return value.lat !== undefined && value.lng !== undefined
    }
  }
})

const mapContainer = ref(null)
const isMapLoading = ref(true)
const mapError = ref(null)
let map = null
let marker = null

// Google Maps 길찾기 URL 생성
const googleMapsUrl = computed(() => {
  const { lat, lng } = props.location
  // Google Maps 길찾기 URL
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
})

// 지도 초기화
const initMap = async () => {
  console.log('🗺️ MapMessage: 지도 초기화 시작')
  console.log('📍 Location:', props.location)

  try {
    // Google Maps API 로드
    console.log('⏳ MapMessage: loadGoogleMaps() 호출')
    await loadGoogleMaps()
    console.log('✅ MapMessage: loadGoogleMaps() 완료')

    // 컨테이너 확인
    console.log('📦 mapContainer.value:', mapContainer.value)
    console.log('🌍 window.google:', window.google)
    console.log('🗺️ window.google?.maps:', window.google?.maps)

    if (!mapContainer.value) {
      throw new Error('지도 컨테이너를 찾을 수 없습니다.')
    }

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API가 로드되지 않았습니다. 콘솔 로그를 확인해주세요.')
    }

    const { lat, lng, zoom = 15 } = props.location
    console.log(`🎯 지도 생성: lat=${lat}, lng=${lng}, zoom=${zoom}`)

    // 지도 생성
    map = new window.google.maps.Map(mapContainer.value, {
      center: { lat, lng },
      zoom: zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    })

    console.log('✅ 지도 생성 완료:', map)

    // 마커 추가
    marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: props.location.address || '위치',
    })

    console.log('✅ 마커 추가 완료:', marker)

    isMapLoading.value = false
    console.log('✅ MapMessage: 지도 초기화 완료!')
  } catch (error) {
    console.error('❌ MapMessage 에러:', error)
    console.error('❌ 에러 스택:', error.stack)
    mapError.value = error.message
    isMapLoading.value = false
  }
}

// 컴포넌트 마운트 시 지도 초기화
onMounted(() => {
  initMap()
})

// 위치가 변경되면 지도 업데이트
watch(() => props.location, (newLocation) => {
  if (map && marker) {
    const { lat, lng } = newLocation
    const newPos = { lat, lng }
    map.setCenter(newPos)
    marker.setPosition(newPos)
  }
}, { deep: true })
</script>

<style scoped>
.map-message {
  width: 350px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.map-container {
  width: 100%;
  height: 250px;
}

.location-info {
  padding: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #e0e0e0;
}

.location-details {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.location-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.address {
  font-size: 13px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.directions-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.directions-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 191, 200, 0.3);
}

.directions-button:active {
  transform: translateY(0);
}

/* 오버레이 공통 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

/* 로딩 상태 */
.map-loading {
  background: rgba(248, 249, 250, 0.95);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #7030A0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.map-loading p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 에러 상태 */
.map-error {
  background: rgba(255, 243, 205, 0.95);
  padding: 20px;
  text-align: center;
}

.error-icon {
  font-size: 32px;
}

.map-error p {
  margin: 0;
  font-size: 14px;
  color: #856404;
}
</style>
