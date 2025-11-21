<template>
  <div class="video-message">
    <!-- 비디오 플레이어 -->
    <video
      ref="videoRef"
      :src="videoUrl"
      controls
      :poster="thumbnail"
      @loadedmetadata="onMetadataLoad"
    >
      브라우저가 비디오 재생을 지원하지 않습니다.
    </video>
    <div v-if="caption" class="caption">{{ caption }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props 정의
const props = defineProps({
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  }
})

const videoRef = ref(null)

// 메타데이터 로드 완료 처리
const onMetadataLoad = () => {
  console.log('비디오 메타데이터 로드 완료')
}
</script>

<style scoped>
.video-message {
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-message video {
  width: 100%;
  height: auto;
  display: block;
  background: #000;
}

.caption {
  padding: 8px 12px;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
}
</style>
