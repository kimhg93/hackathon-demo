<template>
  <div class="main-container">
    <!-- 로그인 모달 -->
    <LoginModal
      :isOpen="viewMode === 'login'"
      @login="handleLogin"
      @close="() => {}"
    />

    <!-- 보험 대시보드 -->
    <div v-if="viewMode === 'dashboard'" class="dashboard-view">
      <!-- 테스트용 증권번호일 때 InsuranceDashboardCopy 표시 -->
      <InsuranceDashboardCopy
        v-if="currentUser?.policyNumber === 'LPA2024-1234567' || currentUser?.policyNumber === 'OTA2024-1234567'"
        :user="currentUser"
        @startClaim="handleStartClaim"
      />
      <!-- 일반 대시보드 -->
      <InsuranceDashboard
        v-else
        :user="currentUser"
        @startClaim="handleStartClaim"
      />
    </div>

    <!-- 챗봇 화면 -->
    <div v-if="viewMode === 'chat'" class="chat-view">
      <!-- 진행 상태 바 (컴팩트) -->
      <div class="progress-section">
        <ProgressBar
          :currentStep="currentStep"
          :steps="progressSteps"
        />
      </div>

      <!-- 챗봇 영역 (메인 콘텐츠) -->
      <div class="chat-section">
        <ChatContainer
          ref="chatContainerRef"
          :user="currentUser"
          @progressUpdate="handleProgressUpdate"
          @checklistComplete="handleChecklistComplete"
          @goToDashboard="handleBackToDashboard"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import LoginModal from './auth/LoginModal.vue'
import InsuranceDashboard from './insurance/InsuranceDashboard.vue'
import InsuranceDashboardCopy from './insurance/InsuranceDashboardCopy.vue'
import ChatContainer from './chat/ChatContainer.vue'
import ProgressBar from './progress/ProgressBar.vue'
import { MessageType, SenderType } from '../types/message.js'
import { useWebPush } from '../composables/useWebPush.js'

// 상태 관리
const viewMode = ref('login') // 'login' | 'dashboard' | 'chat'
const chatPhase = ref('initial') // 'initial' | 'accident_classification' | 'coverage_check' | 'emergency_action' | 'document_collection' | 'claim_process'
const currentUser = ref(null)
const currentStep = ref(0)
const chatContainerRef = ref(null)
const progressTimers = ref([]) // 타이머 관리용

// 웹푸시 기능
const {
  isSupported,
  permission,
  requestPermission,
  showNotification,
  startMarketingPush,
  stopMarketingPush
} = useWebPush()

// 진행 단계 정의
const progressSteps = computed(() => {
  const steps = [
    {
      title: '사고 접수',
      description: currentStep.value === 0 ? '진행 중' : '완료'
    },
    {
      title: '보장 확인',
      description: currentStep.value === 1 ? '분석 중' :
                   currentStep.value > 1 ? '완료' : '대기 중'
    },
    {
      title: '서류 안내',
      description: currentStep.value === 2 ? '안내 중' :
                   currentStep.value > 2 ? '완료' : '대기 중'
    },
    {
      title: '서류 준비',
      description: currentStep.value === 3 ? '발급 중' :
                   currentStep.value > 3 ? '완료' : '대기 중'
    },
    {
      title: '청구 절차',
      description: currentStep.value === 4 ? '안내 중' : '대기 중'
    }
  ]

  return steps
})

// 서류 체크리스트와 타임라인은 챗봇 메시지로 주입됨

// 웹푸시 알림 클릭 핸들러
const handleNotificationClick = (url) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// 이벤트 핸들러
const handleLogin = (user) => {
  currentUser.value = user
  viewMode.value = 'dashboard'
}

const handleStartClaim = () => {
  console.log('🚀 사고 접수하기 클릭 - 챗봇으로 이동', {
    userName: currentUser.value?.name,
    policyNumber: currentUser.value?.policyNumber,
    flightNumber: currentUser.value?.insurance?.flightNumber,
    hasLocation: !!currentUser.value?.location,
    hasMarketingConsent: !!currentUser.value?.marketingConsent
  })

  viewMode.value = 'chat'
  chatPhase.value = 'accident_classification'
  currentStep.value = 0

  // 기존 타이머 정리
  progressTimers.value.forEach(timer => clearTimeout(timer))
  progressTimers.value = []
}

const handleBackToDashboard = () => {
  // 타이머 정리
  progressTimers.value.forEach(timer => clearTimeout(timer))
  progressTimers.value = []

  viewMode.value = 'dashboard'
  chatPhase.value = 'initial'
  currentStep.value = 0
}

const handleProgressUpdate = (step) => {
  // ChatContainer에서 진행 상태 업데이트 요청
  currentStep.value = step

  // 단계별 phase 설정
  const phases = [
    'accident_classification',  // 0: 사고 접수
    'coverage_check',           // 1: 보장 확인
    'document_guide',           // 2: 서류 안내
    'document_preparation',     // 3: 서류 준비
    'claim_process'             // 4: 청구 절차
  ]
  if (step < phases.length) {
    chatPhase.value = phases[step]
  }
}

const handleChecklistComplete = () => {
  // 체크리스트 완료 -> 타임라인 표시
  currentStep.value = 4
  chatPhase.value = 'claim_process'

  // 타임라인을 챗봇 메시지로 주입
  if (chatContainerRef.value) {
    chatContainerRef.value.addMessage({
      type: MessageType.TIMELINE,
      sender: SenderType.BOT,
      content: [
        {
          title: '사고 발생',
          icon: '⚠️',
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: '해외여행 중 사고 발생'
        },
        {
          title: '현지 조치',
          icon: '🏥',
          status: 'completed',
          description: '현지 병원/경찰서 방문 및 서류 수집'
        },
        {
          title: '보험금 청구 접수',
          icon: '📝',
          status: 'inProgress',
          estimatedDate: '진행 중',
          description: '온라인으로 보험금 청구서 제출',
          action: {
            label: '청구서 작성하기',
            type: 'submit_claim'
          }
        },
        {
          title: '서류 심사',
          icon: '🔍',
          status: 'pending',
          estimatedDate: '영업일 기준 3-5일',
          description: '제출하신 서류를 검토합니다'
        },
        {
          title: '보험금 지급',
          icon: '💰',
          status: 'upcoming',
          estimatedDate: '심사 완료 후 2-3일',
          description: '지정하신 계좌로 보험금을 입금합니다'
        }
      ]
    })
  }
}

// currentUser와 viewMode를 감시하여 마케팅 푸시 시작/중지
watch([currentUser, viewMode], ([user, mode]) => {
  // 대시보드 화면이고, 사용자가 있고, 마케팅 동의(푸시)한 경우
  if (mode === 'dashboard' && user?.marketingConsent?.push) {
    // 웹푸시 권한 요청 후 시작
    if (permission.value === 'granted') {
      startMarketingPush(handleNotificationClick)
    } else if (permission.value === 'default') {
      // 권한이 아직 결정되지 않은 경우 요청
      requestPermission().then((granted) => {
        if (granted) {
          startMarketingPush(handleNotificationClick)
        }
      })
    }
  } else {
    // 대시보드가 아니거나 마케팅 동의하지 않은 경우 중지
    stopMarketingPush()
  }
}, { immediate: true })

// 초기 로딩
onMounted(() => {
  // 실제 앱에서는 localStorage에서 사용자 정보 확인
  // 데모용으로 바로 로그인 모달 표시
  viewMode.value = 'login'
})
</script>

<style scoped>
.main-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard-view {
  min-height: 100vh;
}

.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.progress-section {
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  padding: 20px;
}

/* 태블릿 */
@media (max-width: 768px) {
  .chat-section {
    padding: 8px;
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .chat-section {
    padding: 0;
  }
}
</style>
