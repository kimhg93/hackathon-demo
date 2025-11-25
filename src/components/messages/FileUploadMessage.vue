<template>
  <div class="file-upload-message">
    <!-- 헤더 -->
    <div class="upload-header">
      <span class="upload-icon">📄</span>
      <div class="upload-info">
        <h3>서류 업로드</h3>
        <p>준비하신 서류를 업로드해주세요</p>
      </div>
    </div>

    <!-- 업로드된 파일 목록 -->
    <div v-if="uploadedFiles.length > 0" class="uploaded-files">
      <div class="files-header">
        <span class="icon">📎</span>
        <h4>업로드된 파일 ({{ uploadedFiles.length }}개)</h4>
      </div>
      <ul class="file-list">
        <li v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
          <div class="file-info">
            <span class="file-icon">{{ getFileIcon(file.type) }}</span>
            <div class="file-details">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
          <button @click="removeFile(index)" class="remove-button">×</button>
        </li>
      </ul>
    </div>

    <!-- 파일 업로드 영역 -->
    <div class="upload-area">
      <div
        class="dropzone"
        :class="{ 'drag-over': isDragging }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @click="triggerFileInput"
      >
        <div class="dropzone-content">
          <span class="upload-icon-large">📤</span>
          <p class="upload-text">클릭하거나 파일을 드래그하세요</p>
          <p class="upload-hint">이미지 (JPG, PNG) 또는 PDF 파일</p>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,.pdf"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- 업로드 중 표시 -->
    <div v-if="isUploading" class="uploading-indicator">
      <div class="spinner"></div>
      <span class="status-text">파일을 업로드하고 있습니다...</span>
    </div>

    <!-- 액션 버튼 -->
    <div class="action-buttons">
      <button
        @click="submitFiles"
        class="submit-button"
        :disabled="uploadedFiles.length === 0 || isUploading"
      >
        <span class="icon">✅</span>
        <span>검토 요청 ({{ uploadedFiles.length }}개)</span>
      </button>
      <button @click="skipReview" class="skip-button" :disabled="isUploading">
        <span class="icon">⏭</span>
        <span>건너뛰기</span>
      </button>
    </div>

    <!-- 안내 메시지 -->
    <div class="info-box">
      <p>💡 <strong>팁:</strong> 선명하고 전체가 보이는 사진을 업로드해주세요.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit', 'skip'])

// 상태 관리
const uploadedFiles = ref([])
const isDragging = ref(false)
const isUploading = ref(false)
const fileInput = ref(null)

// 파일 아이콘 반환
const getFileIcon = (type) => {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  return '📎'
}

// 파일 크기 포맷
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 파일 선택 처리
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  addFiles(files)
  // 입력 초기화
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 드래그 앤 드롭 처리
const handleDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files || [])
  addFiles(files)
}

// 파일 추가
const addFiles = (files) => {
  const validFiles = files.filter(file => {
    // 파일 타입 검증
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    // 파일 크기 검증 (10MB 제한)
    const isValidSize = file.size <= 10 * 1024 * 1024

    if (!isImage && !isPdf) {
      alert(`${file.name}: 이미지 또는 PDF 파일만 업로드 가능합니다.`)
      return false
    }

    if (!isValidSize) {
      alert(`${file.name}: 파일 크기는 10MB 이하여야 합니다.`)
      return false
    }

    return true
  })

  uploadedFiles.value.push(...validFiles)
}

// 파일 제거
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

// 파일 제출
const submitFiles = async () => {
  if (uploadedFiles.value.length === 0) return

  isUploading.value = true

  try {
    // 파일을 Base64로 변환
    const filesData = await Promise.all(
      uploadedFiles.value.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: e.target.result // Base64 데이터
            })
          }
          reader.readAsDataURL(file)
        })
      })
    )

    emit('submit', filesData)
  } catch (error) {
    console.error('File upload error:', error)
    alert('파일 업로드 중 오류가 발생했습니다.')
  } finally {
    isUploading.value = false
  }
}

// 검토 건너뛰기
const skipReview = () => {
  console.log('FileUploadMessage - skipReview 호출됨')
  emit('skip')
}
</script>

<style scoped>
.file-upload-message {
  max-width: 550px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 헤더 */
.upload-header {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
}

.upload-icon {
  font-size: 32px;
}

.upload-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.upload-info p {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

/* 업로드된 파일 목록 */
.uploaded-files {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.files-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.files-header .icon {
  font-size: 18px;
}

.files-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.file-icon {
  font-size: 24px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.file-size {
  font-size: 11px;
  color: #666;
}

.remove-button {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-button:hover {
  background: #dc2626;
  color: white;
}

/* 업로드 영역 */
.upload-area {
  padding: 16px;
}

.dropzone {
  border: 2px dashed #4DBFC8;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8f9fa;
}

.dropzone:hover {
  border-color: #3AA8B1;
  background: #e9f5f6;
}

.dropzone.drag-over {
  border-color: #3AA8B1;
  background: #d4eef0;
  transform: scale(1.02);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon-large {
  font-size: 48px;
}

.upload-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 업로드 중 표시 */
.uploading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #e9f5f6;
  border-top: 1px solid #4DBFC8;
  border-bottom: 1px solid #4DBFC8;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e0e0e0;
  border-top-color: #4DBFC8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  font-size: 13px;
  font-weight: 600;
  color: #4DBFC8;
}

/* 액션 버튼 */
.action-buttons {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.submit-button,
.skip-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button {
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(77, 191, 200, 0.3);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(77, 191, 200, 0.4);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skip-button {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e0e0e0;
}

.skip-button:hover:not(:disabled) {
  background: #e9ecef;
}

.skip-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 안내 박스 */
.info-box {
  padding: 12px 16px;
  background: #fff3cd;
  border-top: 2px solid #ffb617;
}

.info-box p {
  margin: 0;
  font-size: 12px;
  color: #856404;
  text-align: center;
}
</style>
