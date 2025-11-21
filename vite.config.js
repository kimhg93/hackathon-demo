import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 설정
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  }
})