import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    laravel({
      input: ['resources/js/app.jsx'], // do NOT list resources/css/app.css here separately
      refresh: true,
    }),
  ],
})
