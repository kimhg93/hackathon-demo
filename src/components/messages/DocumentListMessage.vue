<template>
  <div class="document-list-message">
    <!-- 담보 정보 헤더 -->
    <div class="coverage-header">
      <span class="coverage-icon">{{ coverageInfo.icon }}</span>
      <div class="coverage-info">
        <h3>{{ coverageInfo.title }}</h3>
        <p>{{ coverageInfo.description }}</p>
      </div>
    </div>

    <!-- 해외에서 준비할 서류 -->
    <div v-if="content.overseas && content.overseas.length > 0" class="document-section">
      <div class="section-header overseas">
        <span class="icon">✈️</span>
        <h4>해외에서 꼭 준비해야 하는 서류</h4>
      </div>
      <ul class="document-list">
        <li
          v-for="(doc, index) in content.overseas"
          :key="index"
          class="document-item"
          :class="{ 'clickable': isClickable(doc) }"
          @click="handleDocumentClick(doc)"
        >
          <div class="document-name">
            <span class="bullet">{{ index + 1 }}</span>
            {{ doc.name }}
            <span v-if="doc.required" class="required-badge">필수</span>
            <span v-if="isClickable(doc)" class="action-hint">🔍</span>
          </div>
          <p class="document-description">{{ doc.description }}</p>
        </li>
      </ul>
    </div>

    <!-- 귀국 후 준비할 서류 -->
    <div v-if="content.home && content.home.length > 0" class="document-section">
      <div class="section-header home">
        <span class="icon">🏠</span>
        <h4>귀국 후 준비하셔도 되는 서류</h4>
      </div>
      <ul class="document-list">
        <li
          v-for="(doc, index) in content.home"
          :key="index"
          class="document-item"
          :class="{ 'clickable': isClickable(doc) }"
          @click="handleDocumentClick(doc)"
        >
          <div class="document-name">
            <span class="bullet">{{ index + 1 }}</span>
            {{ doc.name }}
            <span v-if="doc.required" class="required-badge">필수</span>
            <span v-else class="optional-badge">선택</span>
            <span v-if="isClickable(doc)" class="action-hint">🔍</span>
          </div>
          <p class="document-description">{{ doc.description }}</p>
        </li>
      </ul>
    </div>

    <!-- 청구 안내 -->
    <div class="claim-info-box">
      <p class="disclaimer">{{ disclaimer }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { COVERAGE_INFO, CLAIM_INFO } from '../../data/claimDocuments.js'

const props = defineProps({
  content: {
    type: Object,
    required: true
    // content: { overseas: [], home: [], coverageType: 'personal_belongings' }
  }
})

const emit = defineEmits(['action'])

const coverageInfo = computed(() => {
  return COVERAGE_INFO[props.content.coverageType] || {
    title: '보험 청구',
    description: '필요한 서류를 안내해드립니다.',
    icon: '📄'
  }
})

const disclaimer = computed(() => {
  return CLAIM_INFO.disclaimer
})

// 클릭 가능한 서류인지 판단 (장소 검색과 연관된 서류)
const isClickable = (doc) => {
  const clickableKeywords = [
    'police report',
    '경찰서',
    '진단서',
    'medical record',
    '병원'
  ]

  const docName = doc.name.toLowerCase()
  return clickableKeywords.some(keyword => docName.includes(keyword.toLowerCase()))
}

// 서류 클릭 핸들러
const handleDocumentClick = (doc) => {
  if (!isClickable(doc)) return

  const docName = doc.name.toLowerCase()

  // 서류 이름에 따라 적절한 장소 타입 결정
  let actionType = null

  if (docName.includes('police') || docName.includes('경찰')) {
    actionType = 'search_police'
  } else if (docName.includes('medical') || docName.includes('진단서') || docName.includes('병원')) {
    actionType = 'search_hospital'
  }

  if (actionType) {
    console.log('📄 서류 클릭:', doc.name, '→', actionType)
    emit('action', {
      type: actionType,
      data: { documentName: doc.name }
    })
  }
}
</script>

<style scoped>
.document-list-message {
  max-width: 450px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 담보 정보 헤더 */
.coverage-header {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #7030A0 0%, #5AB8B8 100%);
  color: white;
}

.coverage-icon {
  font-size: 32px;
}

.coverage-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.coverage-info p {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

/* 서류 섹션 */
.document-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.document-section:last-of-type {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-header .icon {
  font-size: 20px;
}

.section-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.section-header.overseas h4 {
  color: #D24726;
}

.section-header.home h4 {
  color: #7030A0;
}

/* 서류 리스트 */
.document-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.document-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #7030A0;
  transition: all 0.2s ease;
}

.document-item:last-child {
  margin-bottom: 0;
}

/* 클릭 가능한 서류 항목 */
.document-item.clickable {
  cursor: pointer;
  position: relative;
}

.document-item.clickable:hover {
  background: #e9ecef;
  border-left-color: #5AB8B8;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(112, 48, 160, 0.15);
}

.document-item.clickable:active {
  transform: translateX(2px);
}

.document-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.bullet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #7030A0;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.required-badge {
  padding: 2px 8px;
  background: #D24726;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.optional-badge {
  padding: 2px 8px;
  background: #9AC120;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.action-hint {
  margin-left: auto;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.document-item.clickable:hover .action-hint {
  opacity: 1;
}

.document-description {
  margin: 0;
  font-size: 13px;
  color: #666;
  padding-left: 28px;
}

/* 청구 안내 */
.claim-info-box {
  padding: 12px 16px;
  background: #fff3cd;
  border-top: 2px solid #ffb617;
}

.disclaimer {
  margin: 0;
  font-size: 12px;
  color: #856404;
  text-align: center;
}
</style>
