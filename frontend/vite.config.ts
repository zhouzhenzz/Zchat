import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 将 @ 指向 src 目录的绝对路径
      '@': path.resolve(__dirname, './src'),
    },
  },
})
