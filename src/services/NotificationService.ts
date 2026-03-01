/**
 * NotificationService
 * Handles browser notifications for daily check-in reminders.
 */

export interface NotificationSettings {
    enabled: boolean;
    hour: number;
    minute: number;
    lastNotifiedDate?: string; // ISO date string to prevent duplicate daily notifications
}

const STORAGE_KEY = 'imxin_notification_settings';
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
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('Notification permission was denied');
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
     * Get notification settings from localStorage
     */
    getSettings(): NotificationSettings {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load notification settings:', e);
        }
        return DEFAULT_SETTINGS;
    }

    /**
     * Save notification settings to localStorage
     */
    saveSettings(settings: Partial<NotificationSettings>): void {
        try {
            const current = this.getSettings();
            const updated = { ...current, ...settings };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save notification settings:', e);
        }
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
            console.warn('Cannot show notification: permission not granted');
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
        const today = now.toISOString().split('T')[0];

        // Already notified today
        if (settings.lastNotifiedDate === today) {
            return false;
        }

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if current time is within the reminder window (within 1 minute)
        if (currentHour === settings.hour && currentMinute === settings.minute) {
            return true;
        }

        return false;
    }

    /**
     * Send the daily reminder notification
     */
    private sendDailyReminder(): void {
        const messages = [
            '🌿 今天過得如何？花一分鐘記錄你的心情吧！',
            '🧘 放慢腳步，和自己的情緒對話一下？',
            '💚 今心提醒：覺察情緒是照顧自己的第一步',
            '🌸 每日的小覺察，累積成長的大力量',
            '✨ 今天的心情值得被記錄，來和今心聊聊吧！',
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        this.showNotification('今心 • 每日心情記錄', randomMessage, 'imxin-daily');

        // Mark as notified today
        const today = new Date().toISOString().split('T')[0];
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

        console.log('🔔 Daily reminder check started');
    }

    /**
     * Stop the reminder check interval
     */
    stopReminderCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('🔕 Daily reminder check stopped');
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
}

export const notificationService = new NotificationService();
