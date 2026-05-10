import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'vite.svg'],
      manifest: {
        name: '今心 ImXin - 你的每日情緒覺察夥伴',
        short_name: '今心',
        description: '引導式情緒覺察工具。透過覺察、命名與選擇回應，助你找回內在的平靜。',
        theme_color: '#fdfaf3',
        background_color: '#fdfaf3',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    // Bundle 分析器（僅在分析模式啟用）
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // npm 套件分割
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('opencc-js')) return 'i18n';
            return 'vendor';
          }
          // 重型組件獨立分割
          if (id.includes('/src/components/Timeline')) return 'ui-timeline';
          if (id.includes('/src/components/GrowthDashboard')) return 'ui-dashboard';
          if (id.includes('/src/components/AchievementPage')) return 'ui-achievement';
          if (id.includes('/src/components/CheckInFlow')) return 'ui-checkin';
          if (id.includes('/src/components/ParentHome') || id.includes('/src/components/ParentScenarios')) return 'ui-parent';
          if (id.includes('/src/components/RegulatingStep') || id.includes('/src/components/ExpressingStep') || id.includes('/src/components/UnderstandingStep')) return 'ui-steps';
          if (id.includes('/src/components/BodyScan') || id.includes('/src/components/MoodMeter') || id.includes('/src/components/EmotionGrid')) return 'ui-emotion';
          if (id.includes('/src/components/ExportPanel') || id.includes('/src/components/NotificationSettings') || id.includes('/src/components/UserProfile')) return 'ui-settings';
          if (id.includes('/src/components/AIChatAssistant') || id.includes('/src/components/AIInsightCard')) return 'ui-ai';
          if (id.includes('/src/services/AIService') || id.includes('/src/services/StorageService') || id.includes('/src/services/HabitService')) return 'services-core';
          if (id.includes('/src/data/emotionData')) return 'emotion-data';
        },
        // 優化 chunk 文件命名
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    // 啟用源碼映射（生產環境可關閉）
    sourcemap: mode === 'development',
  },
  // 開發服務器配置
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    cors: true,
  },
  // 預覽服務器配置
  preview: {
    port: 4173,
    strictPort: false,
  },
  // 優化依賴預構建
  optimizeDeps: {
    include: ['react', 'react-dom', 'opencc-js'],
    exclude: []
  },
  // CSS 配置
  css: {
    devSourcemap: true,
    modules: {
      scopeBehaviour: 'local'
    }
  }
}))
