import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    strictPort: true, // Không tự động nhảy sang 3001 nếu cổng 3000 đang được dùng
    headers: {
      'Cache-Control': 'no-store', // Ngăn Google Chrome cache module cũ trong lúc dev
    },
  },
})
