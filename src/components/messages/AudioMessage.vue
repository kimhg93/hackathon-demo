<template>
  <div class="audio-message">
    <!-- 오디오 플레이어 -->
    <div class="audio-player">
      <button @click="togglePlay" class="play-button">
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
      <audio
        ref="audioRef"
        :src="audioUrl"
        @ended="onEnded"
        @timeupdate="onTimeUpdate"
      />
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="duration">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props 정의
const props = defineProps({
  audioUrl: {
    type: String,
    required: true
  }
})

// 반응형 상태
const audioRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)

// 재생/일시정지 토글
const togglePlay = () => {
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

// 재생 종료 처리
const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  progress.value = 0
}

// 재생 시간 업데이트
const onTimeUpdate = () => {
  currentTime.value = audioRef.value.currentTime
  progress.value = (currentTime.value / duration.value) * 100
}

// 시간 포맷 (초 → mm:ss)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 컴포넌트 마운트 시 duration 설정
onMounted(() => {
  if (audioRef.value) {
    audioRef.value.addEventListener('loadedmetadata', () => {
      duration.value = audioRef.value.duration
    })
  }
})
</script>

<style scoped>
.audio-message {
  min-width: 250px;
  padding: 12px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  /* 에메랄드 그린 */
  background: #10b981;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.play-button:hover {
  /* 다크 에메랄드 hover */
  background: #059669;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  /* 에메랄드 그린 */
  background: #10b981;
  transition: width 0.1s;
}

.duration {
  font-size: 12px;
  color: #666;
  min-width: 80px;
  text-align: right;
}
</style>
