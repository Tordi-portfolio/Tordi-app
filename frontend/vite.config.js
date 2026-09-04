import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, requests to /api and /media are proxied to the
// Django backend on :8000, so the browser sees everything as same-origin
// and you don't have to think about CORS while building. In production,
// set VITE_API_BASE_URL (see .env.example) to your deployed API's URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
    },
  },
});
