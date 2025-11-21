<template>
  <div class="text-message">
    <!-- 텍스트 메시지 내용 -->
    <p>{{ content }}</p>
  </div>
</template>

<script setup>
// 부모로부터 메시지 내용을 받음
defineProps({
  content: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.text-message {
  padding: 12px 16px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.text-message p {
  margin: 0;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}
</style>
