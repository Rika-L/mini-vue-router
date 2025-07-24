import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true, // 自动打开浏览器
  },
  plugins: [vue()],
})
