import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,      // Use standard Vite port
    strictPort: false, // Allow fallback to other ports
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})