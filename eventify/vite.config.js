import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    laravel({
      // include every entry that should boot your app; for Inertia it's usually just app.jsx
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    // ✅ this injects the React preamble + Fast Refresh
    react(),
  ],
});
