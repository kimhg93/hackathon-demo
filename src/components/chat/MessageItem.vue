<template>
  <div class="message-item" :class="[message.sender]">
    <!-- 메시지 타입에 따라 다른 컴포넌트 렌더링 -->
    <div class="message-bubble">
      <component
        :is="messageComponent"
        v-bind="messageProps"
        @action="handleAction"
      />
    </div>
    <!-- 메시지 전송 시간 -->
    <div class="timestamp">{{ formattedTime }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MessageType } from '../../types/message.js'
import TextMessage from '../messages/TextMessage.vue'
import ImageMessage from '../messages/ImageMessage.vue'
import AudioMessage from '../messages/AudioMessage.vue'
import VideoMessage from '../messages/VideoMessage.vue'
import MapMessage from '../messages/MapMessage.vue'
import DocumentListMessage from '../messages/DocumentListMessage.vue'
import ActionButtonsMessage from '../messages/ActionButtonsMessage.vue'

// Props 정의
const props = defineProps({
  message: {
    type: Object,
    required: true
    // message: { id, type, sender, content, timestamp, ... }
  }
})

// Events 정의
const emit = defineEmits(['action'])

// ActionButtonsMessage에서 발생한 action 이벤트를 부모로 전달
const handleAction = (actionData) => {
  emit('action', actionData)
}

// 메시지 타입에 따라 적절한 컴포넌트 선택
const messageComponent = computed(() => {
  const componentMap = {
    [MessageType.TEXT]: TextMessage,
    [MessageType.IMAGE]: ImageMessage,
    [MessageType.AUDIO]: AudioMessage,
    [MessageType.VIDEO]: VideoMessage,
    [MessageType.MAP]: MapMessage,
    [MessageType.DOCUMENT_LIST]: DocumentListMessage,
    [MessageType.ACTION_BUTTONS]: ActionButtonsMessage,
  }
  return componentMap[props.message.type] || TextMessage
})

// 메시지 타입에 따른 props 매핑
const messageProps = computed(() => {
  const { type, content } = props.message

  switch (type) {
    case MessageType.TEXT:
      return { content }

    case MessageType.IMAGE:
      return {
        imageUrl: content.url,
        caption: content.caption,
        alt: content.alt
      }

    case MessageType.AUDIO:
      return {
        audioUrl: content.url
      }

    case MessageType.VIDEO:
      return {
        videoUrl: content.url,
        thumbnail: content.thumbnail,
        caption: content.caption
      }

    case MessageType.MAP:
      return {
        location: content
      }

    case MessageType.DOCUMENT_LIST:
      return {
        content: content
      }

    case MessageType.ACTION_BUTTONS:
      return {
        content: content
      }

    default:
      return { content: '지원하지 않는 메시지 타입입니다.' }
  }
})

// 시간 포맷팅
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<style scoped>
.message-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 사용자 메시지는 오른쪽 정렬 */
.message-item.user {
  align-items: flex-end;
}

.message-item.user .message-bubble {
  /* 라이나 청록 그라데이션: 사용자 메시지 */
  background: linear-gradient(135deg, #4DBFC8 0%, #3AA8B1 100%);
  color: white;
}

.message-item.user .message-bubble :deep(.text-message) {
  background: transparent;
  color: white;
}

.message-item.user .message-bubble :deep(.text-message p) {
  color: white !important;
}

/* 봇 메시지는 왼쪽 정렬 */
.message-item.bot {
  align-items: flex-start;
}

.message-bubble {
  max-width: 70%;
  border-radius: 12px;
}

.timestamp {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 8px;
}
</style>
