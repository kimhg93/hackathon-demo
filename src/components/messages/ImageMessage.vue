<template>
  <div class="image-message">
    <!-- 이미지 표시 -->
    <img :src="imageUrl" :alt="alt" @load="onImageLoad" />
    <div v-if="caption" class="caption">{{ caption }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props 정의
const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: '이미지'
  }
})

// 이미지 로딩 완료 처리
const onImageLoad = () => {
  console.log('이미지 로드 완료:', props.imageUrl)
}
</script>

<style scoped>
.image-message {
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-message img {
  width: 100%;
  height: auto;
  display: block;
}

.caption {
  padding: 8px 12px;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
}
</style>
