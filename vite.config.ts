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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-toast'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          'supabase': ['@supabase/supabase-js'],
          'routing': ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1MB
  }
})