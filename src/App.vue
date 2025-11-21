<template>
  <div class="app-container">
    <ChatContainer />
  </div>
</template>

<script setup>
import ChatContainer from './components/chat/ChatContainer.vue'
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* CHUBB Dark Blue → Purple 그라데이션 */
  background: linear-gradient(135deg, #002855 0%, #7030A0 100%);
}
</style>
