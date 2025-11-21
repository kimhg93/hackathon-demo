<template>
  <div class="api-key-settings">
    <!-- API 키 설정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>🔑 OpenAI API 키 설정</h3>
        <p class="description">
          ChatGPT와 대화하려면 OpenAI API 키가 필요합니다.
        </p>

        <!-- API 키 입력 -->
        <div class="input-group">
          <label for="api-key">API Key</label>
          <input
            id="api-key"
            v-model="tempApiKey"
            type="password"
            placeholder="sk-..."
            class="api-key-input"
          />
        </div>

        <!-- 안내 메시지 -->
        <div class="info-box">
          <p>📌 API 키는 브라우저 로컬 스토리지에 저장됩니다.</p>
          <p>📌 <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI 대시보드</a>에서 키를 발급받을 수 있습니다.</p>
        </div>

        <!-- 버튼 그룹 -->
        <div class="button-group">
          <button @click="closeModal" class="btn-cancel">취소</button>
          <button @click="saveApiKey" class="btn-save">저장</button>
        </div>
      </div>
    </div>

    <!-- API 키 설정 버튼 -->
    <button @click="openModal" class="settings-button" :title="apiKeyStatus">
      <span v-if="hasApiKey">🔓</span>
      <span v-else>🔒</span>
      API 키
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props 정의
const props = defineProps({
  apiKey: {
    type: String,
    default: ''
  }
})

// Emits 정의
const emit = defineEmits(['update:apiKey'])

// 상태 관리
const showModal = ref(false)
const tempApiKey = ref('')

// API 키 설정 여부
const hasApiKey = computed(() => props.apiKey && props.apiKey.length > 0)

// API 키 상태 메시지
const apiKeyStatus = computed(() => {
  return hasApiKey.value ? 'API 키 설정됨' : 'API 키 미설정'
})

// 모달 열기
const openModal = () => {
  tempApiKey.value = props.apiKey
  showModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  tempApiKey.value = ''
}

// API 키 저장
const saveApiKey = () => {
  if (tempApiKey.value.trim()) {
    emit('update:apiKey', tempApiKey.value.trim())
  }
  closeModal()
}
</script>

<style scoped>
.api-key-settings {
  position: relative;
}

/* 설정 버튼 */
.settings-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.settings-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 모달 콘텐츠 */
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #333;
}

.description {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

/* 입력 그룹 */
.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.api-key-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  transition: border-color 0.2s;
}

.api-key-input:focus {
  outline: none;
  border-color: #10b981;
}

/* 안내 박스 */
.info-box {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #666;
}

.info-box p {
  margin: 4px 0;
}

.info-box a {
  color: #10b981;
  text-decoration: none;
}

.info-box a:hover {
  text-decoration: underline;
}

/* 버튼 그룹 */
.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
</style>
