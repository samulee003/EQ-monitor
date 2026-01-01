import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui-components': [
            './src/components/MoodMeter.tsx',
            './src/components/EmotionGrid.tsx',
            './src/components/GrowthDashboard.tsx'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
