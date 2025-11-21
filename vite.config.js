import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 설정
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    strictPort: false,
    hmr: {
      clientPort: process.env.PORT || 3000
    }
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    strictPort: false,
    allowedHosts: [
      'hakathon-demo.onrender.com',
      '.onrender.com'
    ]
  }
})