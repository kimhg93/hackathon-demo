<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- SMS 인증 화면 -->
      <div v-if="showSmsVerification">
        <SmsVerification
          :userName="pendingUser?.name || name"
          :birthDate="pendingUser?.birthDate || birthDate"
          @verified="handleSmsVerified"
          @back="showSmsVerification = false"
        />
      </div>

      <!-- 항공편 정보 입력 화면 (선택사항) -->
      <div v-else-if="showFlightInput">
        <div class="modal-header">
          <h2>✈️ 항공편 정보</h2>
          <p class="subtitle">항공편 정보를 입력하시면 더 나은 서비스를 제공해드립니다</p>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>항공편명 (선택사항)</label>
            <input
              v-model="flightNumber"
              type="text"
              placeholder="예: KE706 (김포), OZ102 (인천)"
              class="input-field"
              @keyup.enter="handleFlightSubmit"
            />
            <p class="hint">💡 출발 항공편명을 입력하면 공항별 지연 정보와 라운지 안내를 받을 수 있습니다</p>
          </div>

          <div class="flight-benefits">
            <p class="benefits-title">📋 제공되는 정보</p>
            <ul>
              <li>✓ 실시간 항공편 지연 정보</li>
              <li>✓ 출발 공항 라운지 이용 안내 (인천/김포)</li>
              <li>✓ 지연 보상 자동 안내</li>
            </ul>
          </div>

          <div class="marketing-consent-section">
            <div class="consent-card">
              <div class="consent-header">
                <span class="consent-icon">📧</span>
                <h4>마케팅 정보 수신 동의</h4>
              </div>
              <div class="consent-body">
                <label class="checkbox-label">
                  <input
                    v-model="marketingConsent.email"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">이메일 수신 동의</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="marketingConsent.sms"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">SMS 수신 동의</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="marketingConsent.push"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">앱 푸시 알림 수신 동의</span>
                </label>
              </div>
              <p class="consent-description">
                여행 정보, 특별 혜택, 보험 상품 안내 등을 받아보실 수 있습니다. 동의하지 않으셔도 서비스 이용에는 제한이 없습니다.
              </p>
            </div>
          </div>

          <button class="login-button" @click="handleFlightSubmit">
            {{ flightNumber ? '확인' : '건너뛰기' }}
          </button>
        </div>
      </div>

      <!-- 일반 로그인 화면 -->
      <div v-else>
        <div class="modal-header">
          <h2>🛡️ 보험증권 확인</h2>
          <p class="subtitle">가입하신 보험 정보를 확인해주세요</p>
        </div>

        <div class="modal-body">
          <div class="tab-buttons">
            <button
              :class="['tab-button', { active: loginMethod === 'policy' }]"
              @click="loginMethod = 'policy'"
            >
              보험증권번호
            </button>
            <button
              :class="['tab-button', { active: loginMethod === 'personal' }]"
              @click="loginMethod = 'personal'"
            >
              개인정보
            </button>
          </div>

          <!-- 보험증권번호로 로그인 -->
          <div v-if="loginMethod === 'policy'" class="form-group">
            <label>보험증권번호</label>
            <input
              v-model="policyNumber"
              type="text"
              placeholder="CHB2024-1234567"
              class="input-field"
              @keyup.enter="handleLogin"
            />
            <p class="hint">💡 데모용: CHB2024-1234567</p>
          </div>

          <!-- 개인정보로 로그인 -->
          <div v-else class="form-group">
            <label>이름</label>
            <input
              v-model="name"
              type="text"
              placeholder="김해커"
              class="input-field"
            />

            <label>생년월일</label>
            <input
              v-model="birthDate"
              type="date"
              class="input-field"
              @keyup.enter="handleLogin"
            />
            <p class="hint">💡 데모용: 김해커 / 1990-01-15, 허승진 / 1988-02-02, 김손보 / 1990-02-02</p>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button class="login-button" @click="handleLogin">
            확인
          </button>

          <div class="demo-notice">
            <p>📌 해커톤 데모용 앱입니다</p>
            <p>위의 샘플 정보를 사용해주세요</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authenticateUser } from '../../data/mockUserData.js'
import SmsVerification from './SmsVerification.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'login'])

const loginMethod = ref('policy') // 'policy' or 'personal'
const policyNumber = ref('')
const name = ref('')
const birthDate = ref('')
const errorMessage = ref('')
const showSmsVerification = ref(false)
const showFlightInput = ref(false)
const flightNumber = ref('')
const marketingConsent = ref({
  email: false,
  sms: false,
  push: false
})
const pendingUser = ref(null)

const handleOverlayClick = () => {
  // 모달 외부 클릭 시 닫지 않음 (필수 입력)
}

const handleLogin = () => {
  errorMessage.value = ''

  let credentials = {}
  if (loginMethod.value === 'policy') {
    if (!policyNumber.value.trim()) {
      errorMessage.value = '보험증권번호를 입력해주세요'
      return
    }
    credentials.policyNumber = policyNumber.value.trim()
  } else {
    if (!name.value.trim() || !birthDate.value) {
      errorMessage.value = '이름과 생년월일을 모두 입력해주세요'
      return
    }
    credentials.name = name.value.trim()
    credentials.birthDate = birthDate.value
  }

  const user = authenticateUser(credentials)

  if (user) {
    // 허승진/1988-02-02 또는 김손보/1990-02-02 인 경우 SMS 인증 필요
    if ((user.name === '허승진' && user.birthDate === '1988-02-02') ||
        (user.name === '김손보' && user.birthDate === '1990-02-02')) {
      pendingUser.value = user
      showSmsVerification.value = true
    } else {
      // 일반 로그인
      emit('login', user)
      emit('close')
    }
  } else {
    errorMessage.value = '일치하는 보험 가입 정보를 찾을 수 없습니다'
  }
}

const handleSmsVerified = () => {
  // SMS 인증 완료 후 항공편 정보 입력 화면으로 이동
  if (pendingUser.value) {
    showSmsVerification.value = false
    showFlightInput.value = true
  }
}

const handleFlightSubmit = () => {
  // 항공편 정보와 마케팅 동의를 사용자 객체에 추가
  if (pendingUser.value) {
    const userWithFlight = {
      ...pendingUser.value,
      // insurance 객체 내부의 flightNumber 업데이트
      insurance: {
        ...pendingUser.value.insurance,
        flightNumber: flightNumber.value ? flightNumber.value.trim().toUpperCase() : null
      },
      // 하위 호환성을 위해 flightInfo도 유지
      flightInfo: flightNumber.value ? {
        flightNumber: flightNumber.value.trim().toUpperCase(),
        timestamp: new Date().toISOString()
      } : null,
      marketingConsent: {
        email: marketingConsent.value.email,
        sms: marketingConsent.value.sms,
        push: marketingConsent.value.push,
        timestamp: new Date().toISOString()
      }
    }

    emit('login', userWithFlight)
    emit('close')

    // 상태 초기화
    showFlightInput.value = false
    flightNumber.value = ''
    marketingConsent.value = { email: false, sms: false, push: false }
    pendingUser.value = null
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 32px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.modal-body {
  padding: 24px;
}

.tab-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 12px;
}

.tab-button {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  background: white;
  color: #4DBFC8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: -8px;
}

.input-field {
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #4DBFC8;
  box-shadow: 0 0 0 3px rgba(77, 191, 200, 0.1);
}

.hint {
  font-size: 13px;
  color: #999;
  margin-top: -8px;
  padding-left: 4px;
}

.error-message {
  background: #fff0f0;
  border: 1px solid #ffcccc;
  color: #cc0000;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 16px;
}

.login-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(77, 191, 200, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.demo-notice {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
}

.demo-notice p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}

.flight-benefits {
  background: #f0f9ff;
  border: 1px solid #b3e0ff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.benefits-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.flight-benefits ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.flight-benefits li {
  font-size: 13px;
  color: #666;
  padding: 6px 0;
  line-height: 1.5;
}

.marketing-consent-section {
  margin-top: 20px;
}

.consent-card {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
}

.consent-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.consent-icon {
  font-size: 24px;
}

.consent-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.consent-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: rgba(77, 191, 200, 0.05);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox-input:checked ~ .checkbox-custom {
  background: #4DBFC8;
  border-color: #4DBFC8;
}

.checkbox-input:checked ~ .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-text {
  font-size: 14px;
  color: #333;
  user-select: none;
}

.consent-description {
  margin: 12px 0 0;
  padding: 12px;
  background: white;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  border: 1px solid #e0e0e0;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-width: 100%;
    margin: 20px;
  }

  .modal-header {
    padding: 24px 20px 20px;
  }

  .modal-header h2 {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .modal-body {
    padding: 20px;
  }

  .tab-button {
    padding: 10px;
    font-size: 13px;
  }

  .input-field {
    padding: 12px 14px;
    font-size: 14px;
  }

  .hint {
    font-size: 12px;
  }

  .login-button {
    padding: 14px;
    font-size: 15px;
  }

  .demo-notice {
    padding: 14px;
  }

  .demo-notice p {
    font-size: 12px;
  }

  .consent-card {
    padding: 16px;
  }

  .consent-header h4 {
    font-size: 14px;
  }

  .checkbox-label {
    padding: 8px;
  }

  .checkbox-text {
    font-size: 13px;
  }

  .consent-description {
    font-size: 11px;
    padding: 10px;
  }
}

/* 작은 모바일 */
@media (max-width: 375px) {
  .modal-container {
    width: 100%;
    margin: 10px;
    border-radius: 16px;
  }

  .modal-header {
    padding: 20px 16px 16px;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>
