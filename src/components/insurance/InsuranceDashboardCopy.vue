<template>
  <div class="dashboard">
    <!-- 도움 섹션을 최상단으로 이동 -->
    <div class="help-section">
      <div class="help-card">
        <div class="help-icon">🆘</div>
        <div class="help-content">
          <h3>도움이 필요하신가요?</h3>
          <p>여행 중 사고가 발생하셨나요? 지금 바로 도와드리겠습니다.</p>
          <button class="help-button" @click="handleStartClaim">
            사고 접수하기
          </button>
        </div>
      </div>
    </div>

    <div class="header">
      <div class="user-info">
        <h2>안녕하세요, <span class="highlight">{{ user.name }}</span>님!</h2>
        <p class="trip-info">{{ user.insurance.destination }} 여행을 응원합니다 ✈️</p>
      </div>
      <div class="period-badge">
        <span class="label">보험 기간</span>
        <span class="dates">{{ formatDate(user.insurance.startDate) }} ~ {{ formatDate(user.insurance.endDate) }}</span>
      </div>
    </div>

    <div class="product-card">
      <div class="product-header">
        <div>
          <h3>{{ user.insurance.productName }}</h3>
          <p class="policy-number">증권번호: {{ user.policyNumber }}</p>
        </div>
        <div class="status-badge">
          <span class="dot"></span>
          보장중
        </div>
      </div>
    </div>

    <!-- 항공편 정보 (입력된 경우에만 표시) -->
    <div v-if="user.insurance?.flightNumber || user.flightInfo" class="flight-info-section">
      <div class="flight-card">
        <div class="flight-header" @click="toggleFlightInfo">
          <div class="flight-icon">✈️</div>
          <div class="flight-main-info">
            <h3>항공편 정보</h3>
            <p class="flight-number">{{ user.insurance?.flightNumber || user.flightInfo?.flightNumber }}</p>
          </div>
          <div v-if="flightSchedule" class="flight-route">
            <div class="route-item">
              <span class="airport-name">{{ flightSchedule.departure.airport }}</span>
              <span class="airport-code">{{ flightSchedule.departure.code }}</span>
              <span class="flight-time">{{ flightSchedule.departure.time }}</span>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-item">
              <span class="airport-name">{{ flightSchedule.arrival.airport }}</span>
              <span class="airport-code">{{ flightSchedule.arrival.code }}</span>
              <span class="flight-time">{{ flightSchedule.arrival.time }}</span>
            </div>
          </div>
          <div class="flight-status-badge" :class="flightStatusClass">
            {{ flightStatusText }}
          </div>
          <div class="toggle-icon">
            {{ isFlightInfoExpanded ? '▼' : '▶' }}
          </div>
        </div>

        <transition name="flight-expand">
          <div v-if="isFlightInfoExpanded" class="flight-details">
            <!-- 4시간 미만 지연: 경고 메시지 -->
            <div v-if="flightStatus.delayed && !isCompensationEligible" class="delay-alert delay-warning">
              <div class="alert-icon">⚠️</div>
              <div class="alert-content">
                <h4>항공편 지연 안내</h4>
                <p>현재 {{ flightStatus.delayMinutes }}분 ({{ Math.floor(flightStatus.delayMinutes / 60) }}시간 {{ flightStatus.delayMinutes % 60 }}분) 지연되고 있습니다.</p>
                <p class="compensation-text">4시간 이상 지연 시 최대 {{ getDelayCompensation() }} 보상이 가능합니다.</p>
              </div>
            </div>

            <!-- 4시간 이상 지연: 보상 가능 메시지 -->
            <div v-if="flightStatus.delayed && isCompensationEligible" class="delay-alert delay-compensation">
              <div class="alert-icon">✅</div>
              <div class="alert-content">
                <h4>항공편 지연 보상 안내</h4>
                <p>항공편이 {{ flightStatus.delayMinutes }}분 ({{ Math.floor(flightStatus.delayMinutes / 60) }}시간 {{ flightStatus.delayMinutes % 60 }}분) 지연되어 <strong>보상 대상</strong>입니다.</p>
                <div class="compensation-details">
                  <div class="compensation-amount">
                    <span class="label">보상 가능 금액</span>
                    <span class="amount">최대 {{ getDelayCompensation() }}</span>
                  </div>
                  <button class="claim-button" @click="handleStartClaim">
                    보상 신청하기
                  </button>
                </div>
                <p class="compensation-note">💡 보상 신청 시 항공사 지연 확인서가 필요합니다.</p>
              </div>
            </div>

            <div class="lounge-info">
              <div class="lounge-header" @click="toggleLoungeInfo">
                <span class="lounge-icon">🛋️</span>
                <div>
                  <h4>{{ departureAirport.name }} 라운지 안내</h4>
                  <p class="airport-badge">{{ departureAirport.code }}</p>
                </div>
                <div class="lounge-toggle-icon">
                  {{ isLoungeInfoExpanded ? '▼' : '▶' }}
                </div>
              </div>
              <transition name="lounge-expand">
                <div v-if="isLoungeInfoExpanded" class="lounge-content">
                  <p class="lounge-subtitle">출발 전 편안하게 이용하실 수 있는 라운지입니다</p>
                  <div class="lounge-list">
                    <div v-for="lounge in lounges" :key="lounge.name" class="lounge-item">
                      <div class="lounge-name">{{ lounge.name }}</div>
                      <div class="lounge-location">📍 {{ lounge.location }}</div>
                      <div class="lounge-hours">🕐 {{ lounge.hours }}</div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 날씨 및 환율 정보 -->
    <div class="info-cards">
      <div class="info-card weather-card">
        <div class="info-header">
          <span class="info-icon">🌤️</span>
          <div>
            <h4>현재 위치 날씨</h4>
            <p class="location">📍 {{ currentLocation }}</p>
          </div>
        </div>
        <div class="weather-main">
          <div class="temperature">{{ currentWeather.temperature }}</div>
          <div class="weather-desc">{{ currentWeather.description }}</div>
        </div>
        <div class="weather-details">
          <div class="detail-item">
            <span class="label">습도</span>
            <span class="value">{{ currentWeather.humidity }}</span>
          </div>
          <div class="detail-item">
            <span class="label">풍속</span>
            <span class="value">{{ currentWeather.windSpeed }}</span>
          </div>
          <div class="detail-item">
            <span class="label">체감</span>
            <span class="value">{{ currentWeather.feelsLike }}</span>
          </div>
        </div>
      </div>

      <div class="info-card exchange-card">
        <div class="info-header">
          <span class="info-icon">💱</span>
          <div>
            <h4>환율 정보</h4>
            <p class="update-time">2024.11.23 기준</p>
          </div>
        </div>
        <div class="exchange-main">
          <div class="exchange-rate">
            <div class="currency-pair">
              <span class="from">1,000 KRW</span>
              <span class="arrow">→</span>
              <span class="to">109.5 JPY</span>
            </div>
          </div>
        </div>
        <div class="exchange-details">
          <div class="detail-row">
            <span class="label">1 JPY</span>
            <span class="value">9.13 원</span>
          </div>
          <div class="detail-row">
            <span class="label">10,000 JPY</span>
            <span class="value">91,300 원</span>
          </div>
        </div>
        <div class="exchange-tip">
          💡 신용카드 해외결제 수수료: 약 1~2%
        </div>
      </div>
    </div>

    <div class="section-header">
      <h3>💼 보장 내용</h3>
      <p>가입하신 보험으로 보장받을 수 있는 항목입니다</p>
    </div>

    <div class="coverage-grid">
      <div
        v-for="(coverage, index) in user.insurance.coverages"
        :key="index"
        class="coverage-card"
        :class="{ expanded: expandedCoverages[index] }"
        @click="toggleCoverage(index)"
      >
        <div class="coverage-header">
          <div class="coverage-icon">{{ coverage.icon }}</div>
          <div class="coverage-title">
            <h4>{{ coverage.name }}</h4>
            <div class="toggle-icon">
              {{ expandedCoverages[index] ? '▼' : '▶' }}
            </div>
          </div>
        </div>
        <transition name="expand">
          <div v-if="expandedCoverages[index]" class="coverage-info">
            <p class="description">{{ coverage.description }}</p>
            <div class="coverage-limit">
              <span class="label">보장 한도</span>
              <span class="amount">{{ coverage.limit }}</span>
            </div>
            <div v-if="coverage.deductible" class="deductible">
              자기부담금: {{ coverage.deductible }}
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div class="quick-links">
      <button class="link-button" @click="openCustomerService">
        <span class="icon">📞</span>
        <span>고객센터</span>
      </button>
      <button class="link-button" @click="showCoverageModal = true">
        <span class="icon">📄</span>
        <span>약관 보기</span>
      </button>
      <button class="link-button" @click="openFAQ">
        <span class="icon">❓</span>
        <span>FAQ</span>
      </button>
      <button class="link-button upload-button" @click="triggerFileUpload">
        <span class="icon">📎</span>
        <span>서류 업로드</span>
        <input
          ref="fileInput"
          type="file"
          accept="application/pdf,.pdf"
          style="display: none"
          @change="handleFileUpload"
        />
      </button>
    </div>

    <!-- 업로드된 파일 목록 -->
    <div v-if="uploadedFiles.length > 0" class="uploaded-files-section">
      <div class="uploaded-header" @click="toggleUploadedFiles">
        <h4 class="uploaded-title">📂 업로드된 서류</h4>
        <div class="header-actions">
          <button
            v-if="hasPendingFiles && isUploadedFilesExpanded"
            class="upload-all-btn"
            @click.stop="uploadAllFiles"
          >
            📤 업로드하기
          </button>
          <div class="uploaded-toggle-icon">
            {{ isUploadedFilesExpanded ? '▼' : '▶' }}
          </div>
        </div>
      </div>
      <transition name="uploaded-expand">
        <div v-if="isUploadedFilesExpanded" class="uploaded-files-list">
          <div
            v-for="(file, index) in uploadedFiles"
            :key="index"
            class="uploaded-file-item"
            :class="{ 'file-uploaded': file.status === 'uploaded' }"
          >
            <div class="file-info">
              <span class="file-icon">📄</span>
              <div class="file-details">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ file.size }}</span>
                <span class="file-date">{{ file.uploadDate }}</span>
                <span
                  v-if="file.status === 'pending'"
                  class="file-status pending"
                >
                  저장 중
                </span>
                <span
                  v-if="file.status === 'uploaded'"
                  class="file-status uploaded"
                >
                  ✓ 업로드 완료
                </span>
              </div>
            </div>
            <button class="file-remove-btn" @click="removeFile(index)">
              ✕
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- 보장내용 상세 모달 -->
    <CoverageDetailModal
      :isOpen="showCoverageModal"
      @close="showCoverageModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  getFlightSchedule,
  getDepartureAirportCode,
  getAirportName,
  getAirportLounges,
  getAirportWeather,
  getFlightDelayStatus
} from '../../data/mockFlightData.js'
import CoverageDetailModal from './CoverageDetailModal.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['startClaim'])

// 각 coverage의 expand/collapse 상태 관리
const expandedCoverages = ref({})

// 파일 업로드 관리
const fileInput = ref(null)
const uploadedFiles = ref([])

// 약관 상세 모달 관리
const showCoverageModal = ref(false)

// 항공편 정보 확장/축소 관리
const isFlightInfoExpanded = ref(true)

// 라운지 정보 확장/축소 관리
const isLoungeInfoExpanded = ref(true)

// 업로드된 파일 목록 확장/축소 관리
const isUploadedFilesExpanded = ref(true)

// 현재 항공편의 스케줄 정보
const flightSchedule = computed(() => {
  // user.insurance.flightNumber 또는 user.flightInfo.flightNumber 사용
  const flightNumber = props.user.insurance?.flightNumber || props.user.flightInfo?.flightNumber
  return getFlightSchedule(flightNumber)
})

// 항공편 상태 (데모용 - 실제로는 API에서 가져옴)
const flightStatus = computed(() => {
  return getFlightDelayStatus(props.user.name)
})

// 항공편 상태 텍스트
const flightStatusText = computed(() => {
  if (!flightStatus.value.delayed) {
    return '보장중'
  }

  // 지연이 발생한 경우
  if (flightStatus.value.delayMinutes >= 240) {
    return '보상대상'
  } else {
    return '보장중(지연발생)'
  }
})

// 항공편 상태에 따른 CSS 클래스
const flightStatusClass = computed(() => {
  if (!flightStatus.value.delayed) {
    return 'status-covered'
  }

  // 지연이 발생한 경우
  if (flightStatus.value.delayMinutes >= 240) {
    return 'status-compensation'
  } else {
    return 'status-delayed'
  }
})

// 4시간(240분) 이상 지연 여부
const isCompensationEligible = computed(() => {
  return flightStatus.value.delayMinutes >= 240
})

// 출발 공항 정보
const departureAirport = computed(() => {
  // user.insurance.flightNumber 또는 user.flightInfo.flightNumber 사용
  const flightNumber = props.user.insurance?.flightNumber || props.user.flightInfo?.flightNumber
  const code = getDepartureAirportCode(flightNumber)
  return {
    code,
    name: getAirportName(code)
  }
})

// 해당 공항의 라운지 정보
const lounges = computed(() => {
  return getAirportLounges(departureAirport.value.code)
})

// 현재 위치 (사용자의 실제 위치 정보 사용)
const currentLocation = computed(() => {
  // 사용자의 위치 정보가 있으면 사용
  if (props.user.location) {
    return `${props.user.location.city}, ${props.user.location.country}`
  }

  // 항공편이 있으면 출발 공항
  const hasFlightNumber = props.user.insurance?.flightNumber || props.user.flightInfo
  if (hasFlightNumber) {
    const weather = getAirportWeather(departureAirport.value.code)
    return weather?.location || '인천국제공항'
  }

  return '여행지' // 기본값
})

// 현재 위치 날씨
const currentWeather = computed(() => {
  const hasFlightNumber = props.user.insurance?.flightNumber || props.user.flightInfo
  if (hasFlightNumber) {
    return getAirportWeather(departureAirport.value.code)
  }
  // 기본 날씨 정보
  return {
    temperature: '15°C',
    description: '맑음',
    humidity: '58%',
    windSpeed: '2m/s',
    feelsLike: '13°C'
  }
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

const handleStartClaim = () => {
  emit('startClaim')
}

const toggleCoverage = (index) => {
  expandedCoverages.value[index] = !expandedCoverages.value[index]
}

const getDelayCompensation = () => {
  // user의 보장 내용에서 항공기 지연 한도 찾기
  const delayCoverage = props.user.insurance.coverages.find(
    c => c.name.includes('항공기') && c.name.includes('지연')
  )
  return delayCoverage ? delayCoverage.limit : '20만원'
}

const openCustomerService = () => {
  window.open('https://ec.aceinsurance.co.kr/jsp/acelimited/mainCert.jsp', '_blank', 'noopener,noreferrer')
}

const openFAQ = () => {
  window.open('https://ec.aceinsurance.co.kr/jsp/customercenter/acelimited/cs/CsSFAQList.jsp', '_blank', 'noopener,noreferrer')
}

// 파일 업로드 관련 함수
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

const handleFileUpload = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  // 선택된 파일들을 업로드된 파일 목록에 추가 (실제 업로드는 하지 않음)
  Array.from(files).forEach(file => {
    // PDF 파일만 허용
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      uploadedFiles.value.push({
        name: file.name,
        size: formatFileSize(file.size),
        uploadDate: formatDateTime(new Date()),
        type: 'pdf',
        status: 'pending' // 'pending' | 'uploaded'
      })
    } else {
      alert('PDF 파일만 업로드 가능합니다.')
    }
  })

  // 파일 input 초기화 (같은 파일을 다시 선택할 수 있도록)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 대기 중인 파일이 있는지 확인
const hasPendingFiles = computed(() => {
  return uploadedFiles.value.some(file => file.status === 'pending')
})

// 모든 대기 중인 파일 업로드
const uploadAllFiles = () => {
  uploadedFiles.value.forEach(file => {
    if (file.status === 'pending') {
      file.status = 'uploaded'
    }
  })
}

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

const toggleFlightInfo = () => {
  isFlightInfoExpanded.value = !isFlightInfoExpanded.value
}

const toggleLoungeInfo = () => {
  isLoungeInfoExpanded.value = !isLoungeInfoExpanded.value
}

const toggleUploadedFiles = () => {
  isUploadedFilesExpanded.value = !isUploadedFilesExpanded.value
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.user-info h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #333;
}

.highlight {
  color: #4DBFC8;
  font-weight: 700;
}

.trip-info {
  margin: 0;
  font-size: 15px;
  color: #666;
}

.period-badge {
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(77, 191, 200, 0.2);
}

.period-badge .label {
  font-size: 12px;
  opacity: 0.9;
}

.period-badge .dates {
  font-size: 14px;
  font-weight: 600;
}

.product-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.product-header h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.policy-number {
  margin: 0;
  font-size: 13px;
  color: #999;
  font-family: monospace;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge .dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 항공편 정보 섹션 */
.flight-info-section {
  margin-bottom: 32px;
}

.flight-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.flight-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  flex-wrap: wrap;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.flight-header:hover {
  background: #f8f9fa;
  margin: -8px -12px 0;
  padding: 8px 12px 20px;
  border-radius: 8px 8px 0 0;
}

.toggle-icon {
  margin-left: auto;
  font-size: 18px;
  color: #4DBFC8;
  font-weight: bold;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.flight-details {
  padding-top: 20px;
}

.flight-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.flight-main-info {
  flex-shrink: 0;
}

.flight-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #333;
}

.flight-number {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #4DBFC8;
  font-family: monospace;
}

.flight-route {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-left: auto;
}

.route-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  text-align: center;
}

.airport-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.airport-code {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.5px;
}

.flight-time {
  font-size: 16px;
  font-weight: 700;
  color: #4DBFC8;
  margin-top: 4px;
}

.route-arrow {
  font-size: 20px;
  color: #999;
  margin: 0 4px;
}

.flight-status-badge {
  margin-left: auto;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status-covered {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-delayed {
  background: #fff3e0;
  color: #e65100;
}

.status-compensation {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  font-weight: 700;
}

.delay-alert {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.delay-warning {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #ff9800;
}

.delay-compensation {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid #4caf50;
}

.alert-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.alert-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.delay-warning .alert-content h4 {
  color: #e65100;
}

.delay-compensation .alert-content h4 {
  color: #2e7d32;
}

.alert-content p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.alert-content strong {
  color: #2e7d32;
  font-weight: 700;
}

.compensation-text {
  font-weight: 600;
  color: #e65100 !important;
}

.compensation-details {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.compensation-amount {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compensation-amount .label {
  font-size: 13px;
  color: #666;
}

.compensation-amount .amount {
  font-size: 20px;
  font-weight: 700;
  color: #2e7d32;
}

.claim-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.claim-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
}

.claim-button:active {
  transform: translateY(0);
}

.compensation-note {
  margin: 12px 0 0 !important;
  font-size: 12px !important;
  color: #666 !important;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.lounge-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.lounge-header {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;
  margin: -8px -8px 8px;
  border-radius: 8px;
  position: relative;
}

.lounge-header:hover {
  background: rgba(77, 191, 200, 0.1);
}

.lounge-toggle-icon {
  margin-left: auto;
  font-size: 16px;
  color: #4DBFC8;
  font-weight: bold;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.lounge-content {
  padding-top: 8px;
}

.lounge-icon {
  font-size: 28px;
}

.lounge-header h4 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #333;
}

.airport-badge {
  margin: 0;
  display: inline-block;
  padding: 2px 8px;
  background: #4DBFC8;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.lounge-subtitle {
  margin: 12px 0 16px;
  font-size: 13px;
  color: #666;
  padding-left: 40px;
}

.lounge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lounge-item {
  background: white;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.lounge-item:hover {
  border-color: #4DBFC8;
  transform: translateX(4px);
}

.lounge-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.lounge-location {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}

.lounge-hours {
  font-size: 12px;
  color: #999;
}

/* 날씨 및 환율 정보 카드 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.info-icon {
  font-size: 32px;
}

.info-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.info-header .location,
.info-header .update-time {
  margin: 4px 0 0;
  font-size: 12px;
  color: #999;
}

/* 날씨 카드 */
.weather-card {
  background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%);
  color: white;
}

.weather-card .info-header h4,
.weather-card .info-header .location {
  color: white;
}

.weather-main {
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
}

.temperature {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.weather-desc {
  font-size: 18px;
  opacity: 0.9;
}

.weather-details {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  opacity: 0.8;
}

.detail-item .value {
  font-size: 16px;
  font-weight: 600;
}

/* 환율 카드 */
.exchange-card {
  background: linear-gradient(135deg, #F093FB 0%, #F5576C 100%);
  color: white;
}

.exchange-card .info-header h4,
.exchange-card .info-header .update-time {
  color: white;
}

.exchange-main {
  padding: 16px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.currency-pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

.arrow {
  font-size: 20px;
  opacity: 0.8;
}

.exchange-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}

.detail-row .label {
  font-size: 13px;
  opacity: 0.9;
}

.detail-row .value {
  font-size: 15px;
  font-weight: 600;
}

.exchange-tip {
  font-size: 12px;
  text-align: center;
  opacity: 0.9;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #333;
}

.section-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.coverage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.coverage-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  border: 2px solid transparent;
  cursor: pointer;
}

.coverage-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #4DBFC8;
}

.coverage-card.expanded {
  border-color: #4DBFC8;
  background: #f8fffe;
}

.coverage-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coverage-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.coverage-title {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coverage-title h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.toggle-icon {
  font-size: 14px;
  color: #4DBFC8;
  margin-left: 8px;
  transition: transform 0.3s;
}

.coverage-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.coverage-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #333;
}

.description {
  margin: 0 0 12px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.coverage-limit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 12px;
}

.coverage-limit .label {
  font-size: 13px;
  color: #666;
}

.coverage-limit .amount {
  font-size: 15px;
  font-weight: 700;
  color: #4DBFC8;
}

.deductible {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  padding-left: 12px;
}

/* Expand/Collapse 애니메이션 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* 항공편 정보 Expand/Collapse 애니메이션 */
.flight-expand-enter-active,
.flight-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.flight-expand-enter-from,
.flight-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.flight-expand-enter-to,
.flight-expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

/* 라운지 정보 Expand/Collapse 애니메이션 */
.lounge-expand-enter-active,
.lounge-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.lounge-expand-enter-from,
.lounge-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.lounge-expand-enter-to,
.lounge-expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* 업로드된 파일 목록 Expand/Collapse 애니메이션 */
.uploaded-expand-enter-active,
.uploaded-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.uploaded-expand-enter-from,
.uploaded-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.uploaded-expand-enter-to,
.uploaded-expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.help-section {
  margin-bottom: 32px;
}

.help-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  gap: 24px;
  align-items: center;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.help-icon {
  font-size: 64px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.help-content {
  flex: 1;
}

.help-content h3 {
  margin: 0 0 8px;
  font-size: 22px;
  color: white;
}

.help-content p {
  margin: 0 0 20px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.help-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.help-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.help-button:active {
  transform: translateY(0);
}

.quick-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.link-button {
  flex: 1;
  min-width: 120px;
  background: white;
  border: 2px solid #e0e0e0;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.link-button:hover {
  border-color: #4DBFC8;
  background: #f8fffe;
  transform: translateY(-2px);
}

.link-button .icon {
  font-size: 24px;
}

.link-button span:last-child {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.upload-button {
  position: relative;
}

/* 업로드된 파일 섹션 */
.uploaded-files-section {
  margin-top: 32px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.uploaded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 8px;
  margin: -8px -8px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.uploaded-header:hover {
  background: #f8f9fa;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.uploaded-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.upload-all-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.upload-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(77, 191, 200, 0.3);
}

.upload-all-btn:active {
  transform: translateY(0);
}

.uploaded-toggle-icon {
  font-size: 16px;
  color: #4DBFC8;
  font-weight: bold;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.uploaded-files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.uploaded-file-item:hover {
  background: #f0f0f0;
  border-color: #4DBFC8;
}

.uploaded-file-item.file-uploaded {
  background: #e8f5e9;
  border-color: #4caf50;
}

.uploaded-file-item.file-uploaded:hover {
  background: #c8e6c9;
  border-color: #2e7d32;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 13px;
  color: #666;
}

.file-date {
  font-size: 12px;
  color: #999;
}

.file-status {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  margin-top: 2px;
}

.file-status.pending {
  background: #fff3e0;
  color: #e65100;
}

.file-status.uploaded {
  background: #e8f5e9;
  color: #2e7d32;
}

.file-remove-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: #fff;
  color: #999;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-remove-btn:hover {
  background: #fee;
  color: #f44;
  transform: scale(1.1);
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    margin-bottom: 16px;
  }

  .user-info h2 {
    font-size: 20px;
  }

  .trip-info {
    font-size: 14px;
  }

  .period-badge {
    width: 100%;
    padding: 10px 16px;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
  }

  .period-badge .label {
    font-size: 13px;
  }

  .period-badge .dates {
    font-size: 13px;
  }

  .product-card {
    padding: 16px;
    margin-bottom: 20px;
  }

  .product-header {
    flex-direction: column;
    gap: 12px;
  }

  .product-header h3 {
    font-size: 16px;
  }

  .status-badge {
    align-self: flex-start;
  }

  .section-header h3 {
    font-size: 18px;
  }

  .section-header p {
    font-size: 13px;
  }

  .coverage-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .coverage-card {
    padding: 16px;
  }

  .coverage-icon {
    font-size: 32px;
  }

  .coverage-info h4 {
    font-size: 15px;
  }

  .description {
    font-size: 12px;
  }

  .coverage-limit {
    padding: 8px 10px;
  }

  .coverage-limit .label {
    font-size: 12px;
  }

  .coverage-limit .amount {
    font-size: 14px;
  }

  .info-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .info-card {
    padding: 16px;
  }

  .temperature {
    font-size: 40px;
  }

  .weather-desc {
    font-size: 16px;
  }

  .detail-item .label {
    font-size: 11px;
  }

  .detail-item .value {
    font-size: 14px;
  }

  .currency-pair {
    font-size: 16px;
  }

  .exchange-tip {
    font-size: 11px;
  }

  .help-section {
    margin-bottom: 20px;
  }

  .help-card {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
  }

  .help-icon {
    font-size: 56px;
  }

  .help-content h3 {
    font-size: 20px;
  }

  .help-content p {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .help-button {
    width: 100%;
    padding: 16px 24px;
    font-size: 15px;
  }

  .quick-links {
    gap: 8px;
  }

  .link-button {
    min-width: 100px;
    padding: 14px 12px;
  }

  .link-button .icon {
    font-size: 20px;
  }

  .link-button span:last-child {
    font-size: 12px;
  }

  .flight-info-section {
    margin-bottom: 20px;
  }

  .flight-card {
    padding: 16px;
  }

  .flight-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 16px;
  }

  .flight-icon {
    font-size: 32px;
  }

  .flight-header h3 {
    font-size: 16px;
  }

  .flight-number {
    font-size: 18px;
  }

  .flight-route {
    width: 100%;
    margin-left: 0;
    padding: 10px 12px;
    gap: 8px;
  }

  .airport-name {
    font-size: 12px;
  }

  .airport-code {
    font-size: 10px;
  }

  .flight-time {
    font-size: 14px;
  }

  .route-arrow {
    font-size: 16px;
  }

  .flight-status-badge {
    width: 100%;
    text-align: center;
    margin-left: 0;
  }

  .delay-alert {
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }

  .alert-icon {
    font-size: 28px;
  }

  .alert-content h4 {
    font-size: 15px;
  }

  .alert-content p {
    font-size: 13px;
  }

  .compensation-details {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }

  .compensation-amount .amount {
    font-size: 18px;
  }

  .claim-button {
    width: 100%;
    padding: 14px;
    font-size: 14px;
  }

  .compensation-note {
    font-size: 11px !important;
  }

  .lounge-info {
    padding: 16px;
  }

  .lounge-header h4 {
    font-size: 15px;
  }

  .lounge-subtitle {
    font-size: 12px;
    padding-left: 0;
  }

  .lounge-item {
    padding: 12px 14px;
  }

  .lounge-name {
    font-size: 14px;
  }

  .lounge-location {
    font-size: 12px;
  }

  .lounge-hours {
    font-size: 11px;
  }

  .uploaded-files-section {
    margin-top: 20px;
    padding: 16px;
  }

  .uploaded-header {
    flex-wrap: wrap;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .uploaded-title {
    font-size: 16px;
  }

  .upload-all-btn {
    flex: 1;
    padding: 10px 16px;
    font-size: 13px;
  }

  .uploaded-file-item {
    padding: 12px;
  }

  .file-icon {
    font-size: 28px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-size {
    font-size: 12px;
  }

  .file-date {
    font-size: 11px;
  }

  .file-remove-btn {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
}

/* 더 작은 모바일 (iPhone SE 등) */
@media (max-width: 375px) {
  .dashboard {
    padding: 10px;
  }

  .user-info h2 {
    font-size: 18px;
  }

  .help-card {
    padding: 20px 16px;
  }

  .help-content h3 {
    font-size: 18px;
  }

  .coverage-card {
    padding: 14px;
  }

  .quick-links {
    flex-direction: column;
  }

  .link-button {
    width: 100%;
  }

  .uploaded-files-section {
    margin-top: 16px;
    padding: 14px;
  }

  .uploaded-title {
    font-size: 15px;
  }

  .file-details {
    gap: 2px;
  }
}
</style>