import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/habittracker/',
  build: { outDir: 'dist' },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
