import { logger } from './utils/logger';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA functionality
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('有新版本可用，是否立即更新？')) {
            updateSW(true)
        }
    },
    onOfflineReady() {
        logger.info('今心 APP 已準備好離線使用！')
    },
    onRegistered(registration) {
        logger.info('Service Worker 註冊成功', { scope: registration?.scope })
    },
    onRegisterError(error) {
        logger.error('Service Worker 註冊失敗', { error: String(error) })
    }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

