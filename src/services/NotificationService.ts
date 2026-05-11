/**
 * NotificationService
 * Handles browser notifications for daily check-in reminders.
 */

import { settingsStore } from '../adapters';

export interface NotificationSettings {
    enabled: boolean;
    hour: number;
    minute: number;
    lastNotifiedDate?: string; // ISO date string to prevent duplicate daily notifications
}

const SETTINGS_KEY = 'imxin_notification_settings';
const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: false,
    hour: 20, // Default: 8 PM
    minute: 0,
};

class NotificationService {
    private checkInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Request notification permission from the browser
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    /**
     * Check if notifications are supported and permission is granted
     */
    isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    }

    /**
     * Get notification settings
     */
    getSettings(): NotificationSettings {
        const stored = settingsStore.get<NotificationSettings>(SETTINGS_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
    }

    /**
     * Save notification settings
     */
    saveSettings(settings: Partial<NotificationSettings>): void {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        settingsStore.set(SETTINGS_KEY, updated);
    }

    /**
     * Enable or disable notifications
     */
    async setEnabled(enabled: boolean): Promise<boolean> {
        if (enabled) {
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                return false;
            }
        }

        this.saveSettings({ enabled });

        if (enabled) {
            this.startReminderCheck();
        } else {
            this.stopReminderCheck();
        }

        return true;
    }

    /**
     * Set reminder time (hour and minute)
     */
    setReminderTime(hour: number, minute: number): void {
        this.saveSettings({ hour, minute });
    }

    /**
     * Show a notification
     */
    showNotification(title: string, body: string, tag?: string): void {
        if (Notification.permission !== 'granted') {
            return;
        }

        const notification = new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: tag || 'imxin-reminder',
            requireInteraction: false,
            silent: false,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);
    }

    /**
     * Send a test notification
     */
    sendTestNotification(): void {
        this.showNotification(
            '🌿 今心提醒測試',
            '如果你看到這則通知，代表提醒功能已設定成功！',
            'imxin-test'
        );
    }

    /**
     * Check if it's time to send a reminder
     */
    private shouldSendReminder(): boolean {
        const settings = this.getSettings();
        if (!settings.enabled) return false;

        const now = new Date();
        const today = now.toLocaleDateString('sv');

        // Already notified today
        if (settings.lastNotifiedDate === today) {
            return false;
        }

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const targetTotalMinutes = settings.hour * 60 + settings.minute;

        // Check if current time has reached or passed the target time
        if (currentTotalMinutes >= targetTotalMinutes) {
            return true;
        }

        return false;
    }

    /**
     * Send the daily reminder notification
     */
    private sendDailyReminder(): void {
        const messages = [
            '🌿 今天帶孩子過得如何？花一分鐘記錄你的心情吧！',
            '🧘 孩子睡了嗎？現在是你的時間，和自己的情緒對話一下？',
            '💚 照顧好自己，才能照顧好孩子。覺察情緒是第一步',
            '🌸 每日的小覺察，累積成長的大力量',
            '✨ 你今天的感受值得被記錄，來和今心聊聊吧！',
            '🤗 當爸媽好辛苦，但你不是一個人。記錄一下今天的心情？',
            '💛 育兒之路有高有低，今天你感受到了什麼？',
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        this.showNotification('今心 • 每日心情記錄', randomMessage, 'imxin-daily');

        // Mark as notified today
        const today = new Date().toLocaleDateString('sv');
        this.saveSettings({ lastNotifiedDate: today });
    }

    /**
     * Start the reminder check interval
     */
    startReminderCheck(): void {
        // Clear any existing interval
        this.stopReminderCheck();

        // Check every minute
        this.checkInterval = setInterval(() => {
            if (this.shouldSendReminder()) {
                this.sendDailyReminder();
            }
        }, 60000); // 60 seconds

        // Also check immediately
        if (this.shouldSendReminder()) {
            this.sendDailyReminder();
        }
    }

    /**
     * Stop the reminder check interval
     */
    stopReminderCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Initialize the service (call on app start)
     */
    initialize(): void {
        const settings = this.getSettings();
        if (settings.enabled && Notification.permission === 'granted') {
            this.startReminderCheck();
        }
    }

    /**
     * Destroy the service and clean up all intervals
     */
    destroy(): void {
        this.stopReminderCheck();
    }
}

export const notificationService = new NotificationService();
