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
        console.log('🌿 今心 APP 已準備好離線使用！')
    },
    onRegistered(registration) {
        console.log('🎉 Service Worker 註冊成功:', registration)
    },
    onRegisterError(error) {
        console.error('❌ Service Worker 註冊失敗:', error)
    }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

