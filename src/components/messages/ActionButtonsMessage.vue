<template>
  <div class="action-buttons-message">
    <!-- 안내 텍스트 (선택사항) -->
    <p v-if="content.message" class="guidance-text">{{ content.message }}</p>

    <!-- 액션 버튼 목록 -->
    <div class="button-list">
      <button
        v-for="(action, index) in content.actions"
        :key="index"
        class="action-button"
        :class="action.style || 'default'"
        @click="handleClick(action)"
      >
        <span v-if="action.icon" class="button-icon">{{ action.icon }}</span>
        <span class="button-text">{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  content: {
    type: Object,
    required: true
    // content: {
    //   message: '원하시는 도움을 선택해주세요',
    //   actions: [
    //     { label: '주변 경찰서 찾기', icon: '🚔', action: 'search_police', style: 'primary' },
    //     { label: '주변 병원 찾기', icon: '🏥', action: 'search_hospital', style: 'primary' },
    //     { label: '상담원 연결', icon: '☎️', action: 'call_agent', style: 'secondary' }
    //   ]
    // }
  }
})

const emit = defineEmits(['action'])

const handleClick = (action) => {
  console.log('ActionButton 클릭:', action)

  // URL이 있으면 새 탭으로 열기
  if (action.url) {
    window.open(action.url, '_blank')
    return
  }

  // 부모 컴포넌트로 액션 전달
  emit('action', {
    type: action.action,
    data: action.data || {}
  })
}
</script>

<style scoped>
.action-buttons-message {
  max-width: 400px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 안내 텍스트 */
.guidance-text {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
  text-align: center;
  font-weight: 500;
}

/* 버튼 리스트 */
.button-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 액션 버튼 기본 스타일 */
.action-button {
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
  transition: all 0.2s ease;
  background: #f8f9fa;
  color: #333;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-button:active {
  transform: translateY(0);
}

/* Primary 버튼 - Turquoise (메인 컬러) */
.action-button.primary {
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
}

.action-button.primary:hover {
  background: linear-gradient(135deg, #3AA8B1 0%, #2E8C94 100%);
}

/* Secondary 버튼 - Orange */
.action-button.secondary {
  background: #E67635;
  color: white;
}

.action-button.secondary:hover {
  background: #d4621f;
}

/* Success 버튼 - Green */
.action-button.success {
  background: #9AC120;
  color: white;
}

.action-button.success:hover {
  background: #82a41a;
}

/* Info 버튼 - Purple */
.action-button.info {
  background: #7030A0;
  color: white;
}

.action-button.info:hover {
  background: #5a2580;
}

/* Warning 버튼 - Yellow */
.action-button.warning {
  background: #F5C542;
  color: #333;
}

.action-button.warning:hover {
  background: #e5b532;
}

/* Danger 버튼 - Red */
.action-button.danger {
  background: #D24726;
  color: white;
}

.action-button.danger:hover {
  background: #b23820;
}

/* Default 버튼 - Gray */
.action-button.default {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #e0e0e0;
}

.action-button.default:hover {
  background: #e9ecef;
}

/* 버튼 아이콘 */
.button-icon {
  font-size: 18px;
}

/* 버튼 텍스트 */
.button-text {
  flex: 1;
}
</style>
