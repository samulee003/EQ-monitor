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

    private getReminderMessages(role = settingsStore.getUserRole() || 'general'): string[] {
        const messagesByRole: Record<string, string[]> = {
            parent: [
                '今天照顧孩子也照顧你自己了嗎？留一分鐘回到心裡。',
                '如果今天有一刻很滿，先記下一個最靠近的感受。',
            ],
            student: [
                '今天給自己一分鐘，看看課業和人際之外的感受。',
                '不用寫很多，留下一個情緒名字也可以。',
            ],
            professional: [
                '下班前後，留一分鐘把今天的情緒放下來。',
                '今天的壓力可以先被看見，不必一次解決。',
            ],
            general: [
                '今天給自己一分鐘，看看此刻的感受。',
                '不用寫很多，留下一個情緒名字也可以。',
            ],
        };

        return messagesByRole[role] || messagesByRole.general;
    }

    getDailyReminderPreview(role?: string): string {
        return this.getReminderMessages(role)[0];
    }

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
        const stored = settingsStore.getCached<NotificationSettings>(SETTINGS_KEY);
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
    sendTestNotification(role?: string): void {
        this.showNotification(
            '今心 • 每日心情記錄',
            this.getDailyReminderPreview(role),
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
        const messages = this.getReminderMessages();

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
