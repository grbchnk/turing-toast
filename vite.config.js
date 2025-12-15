import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Имя репозитория со слешами по бокам
  base: '/turing-toast/', 
})