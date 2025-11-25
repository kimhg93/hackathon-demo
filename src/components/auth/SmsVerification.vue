<template>
  <div class="sms-verification">
    <div class="verification-header">
      <h3>📱 본인인증</h3>
      <p class="subtitle">안전한 서비스 이용을 위해 본인인증이 필요합니다</p>
    </div>

    <div class="user-info-display">
      <div class="info-row">
        <span class="label">이름</span>
        <span class="value">{{ userName }}</span>
      </div>
      <div class="info-row">
        <span class="label">생년월일</span>
        <span class="value">{{ formatBirthDate(birthDate) }}</span>
      </div>
    </div>

    <div v-if="!otpSent" class="phone-input-section">
      <label>휴대폰 번호</label>
      <div class="phone-input-group">
        <input
          v-model="phoneNumber"
          type="tel"
          placeholder="010-1234-5678"
          class="input-field"
          maxlength="13"
          @input="formatPhoneNumber"
          @keyup.enter="sendOtp"
        />
      </div>
      <button class="send-button" @click="sendOtp" :disabled="!isValidPhone">
        인증번호 발송
      </button>
    </div>

    <div v-else class="otp-input-section">
      <div class="otp-sent-notice">
        <span class="icon">✅</span>
        <p>{{ phoneNumber }}로 인증번호가 발송되었습니다</p>
      </div>

      <label>인증번호 입력</label>
      <div class="otp-input-group">
        <input
          v-model="otpCode"
          type="text"
          placeholder="6자리 숫자 입력"
          class="input-field otp-input"
          maxlength="6"
          @input="filterNumbers"
          @keyup.enter="verifyOtp"
        />
        <div class="timer" :class="{ warning: remainingTime < 60 }">
          {{ formatTime(remainingTime) }}
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="button-group">
        <button class="verify-button" @click="verifyOtp" :disabled="otpCode.length !== 6">
          인증 확인
        </button>
        <button class="resend-button" @click="resendOtp">
          재발송
        </button>
      </div>

      <p class="demo-hint">💡 데모용 인증번호: 123456</p>
    </div>

    <button class="back-link" @click="$emit('back')">
      ← 다른 방법으로 로그인
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  userName: {
    type: String,
    required: true
  },
  birthDate: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['verified', 'back'])

const phoneNumber = ref('')
const otpSent = ref(false)
const otpCode = ref('')
const errorMessage = ref('')
const remainingTime = ref(180) // 3분
let timer = null

const isValidPhone = computed(() => {
  const cleaned = phoneNumber.value.replace(/[^0-9]/g, '')
  return cleaned.length === 11 && cleaned.startsWith('010')
})

const formatPhoneNumber = (event) => {
  let value = event.target.value.replace(/[^0-9]/g, '')
  if (value.length > 11) value = value.slice(0, 11)

  if (value.length > 6) {
    phoneNumber.value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`
  } else if (value.length > 3) {
    phoneNumber.value = `${value.slice(0, 3)}-${value.slice(3)}`
  } else {
    phoneNumber.value = value
  }
}

const filterNumbers = (event) => {
  otpCode.value = event.target.value.replace(/[^0-9]/g, '')
}

const formatBirthDate = (date) => {
  return date.replace(/-/g, '.')
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startTimer = () => {
  if (timer) clearInterval(timer)
  remainingTime.value = 180

  timer = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(timer)
      errorMessage.value = '인증 시간이 만료되었습니다. 재발송해주세요.'
    }
  }, 1000)
}

const sendOtp = () => {
  if (!isValidPhone.value) return

  otpSent.value = true
  startTimer()
  errorMessage.value = ''
}

const resendOtp = () => {
  otpCode.value = ''
  errorMessage.value = ''
  startTimer()
}

const verifyOtp = () => {
  if (otpCode.value.length !== 6) return

  errorMessage.value = ''

  // 데모용: 123456이 정답
  if (otpCode.value === '123456') {
    clearInterval(timer)
    emit('verified')
  } else {
    errorMessage.value = '인증번호가 일치하지 않습니다. 다시 확인해주세요.'
    otpCode.value = ''
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.sms-verification {
  padding: 24px;
}

.verification-header {
  text-align: center;
  margin-bottom: 24px;
}

.verification-header h3 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #333;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.user-info-display {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.info-row .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-row .value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.phone-input-section,
.otp-input-section {
  margin-bottom: 24px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.phone-input-group,
.otp-input-group {
  position: relative;
  margin-bottom: 16px;
}

.input-field {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #4DBFC8;
  box-shadow: 0 0 0 3px rgba(77, 191, 200, 0.1);
}

.otp-input {
  padding-right: 80px;
  letter-spacing: 4px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.timer {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  font-weight: 600;
  color: #4DBFC8;
}

.timer.warning {
  color: #f5576c;
  animation: pulse-warning 1s infinite;
}

@keyframes pulse-warning {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.otp-sent-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e8f5e9;
  border-radius: 8px;
  margin-bottom: 16px;
}

.otp-sent-notice .icon {
  font-size: 20px;
}

.otp-sent-notice p {
  margin: 0;
  font-size: 13px;
  color: #2e7d32;
  font-weight: 500;
}

.send-button,
.verify-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled),
.verify-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(77, 191, 200, 0.3);
}

.send-button:disabled,
.verify-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 8px;
}

.verify-button {
  flex: 2;
}

.resend-button {
  flex: 1;
  padding: 16px;
  background: white;
  color: #4DBFC8;
  border: 2px solid #4DBFC8;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.resend-button:hover {
  background: #f0f9fa;
}

.error-message {
  background: #fff0f0;
  border: 1px solid #ffcccc;
  color: #cc0000;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.demo-hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #999;
  text-align: center;
}

.back-link {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.back-link:hover {
  color: #4DBFC8;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .sms-verification {
    padding: 20px;
  }

  .verification-header h3 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 13px;
  }

  .input-field {
    padding: 12px 14px;
    font-size: 14px;
  }

  .otp-input {
    font-size: 16px;
  }

  .send-button,
  .verify-button {
    padding: 14px;
    font-size: 15px;
  }

  .resend-button {
    font-size: 13px;
  }
}

@media (max-width: 375px) {
  .sms-verification {
    padding: 16px;
  }

  .verification-header h3 {
    font-size: 18px;
  }

  .button-group {
    flex-direction: column;
  }

  .verify-button {
    flex: 1;
  }

  .resend-button {
    flex: 1;
  }
}
</style>
