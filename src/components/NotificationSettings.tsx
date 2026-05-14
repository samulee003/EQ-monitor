import React, { useState, useEffect } from 'react';
import { notificationService, type NotificationSettings } from '../services/NotificationService';
import { useLanguage } from '../services/LanguageContext';
import { settingsStore } from '../adapters';
import './NotificationSettings.css';

interface NotificationSettingsProps {
    onClose: () => void;
}

const NotificationSettingsPanel: React.FC<NotificationSettingsProps> = ({ onClose }) => {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
        notificationService.getPermissionStatus()
    );
    const [isLoading, setIsLoading] = useState(false);

    // Privacy Lock state
    const [privacyEnabled, setPrivacyEnabled] = useState(() =>
        settingsStore.isPrivacyEnabled()
    );
    const [hasPin, setHasPin] = useState(() =>
        settingsStore.hasPrivacyPin()
    );

    useEffect(() => {
        // Update permission status when component mounts
        setPermissionStatus(notificationService.getPermissionStatus());
    }, []);

    const handleToggle = async () => {
        setIsLoading(true);
        const newEnabled = !settings.enabled;

        const success = await notificationService.setEnabled(newEnabled);

        if (success) {
            setSettings(prev => ({ ...prev, enabled: newEnabled }));
            setPermissionStatus(notificationService.getPermissionStatus());
        } else if (newEnabled) {
            // Failed to enable - permission denied
            setPermissionStatus('denied');
        }

        setIsLoading(false);
    };

    const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
        const newSettings = {
            ...settings,
            [type]: value,
        };
        setSettings(newSettings);
        notificationService.setReminderTime(newSettings.hour, newSettings.minute);
    };

const handleTest = () => {
        notificationService.sendTestNotification();
    };

    const handlePrivacyToggle = () => {
        if (!hasPin) {
            // No PIN set, need to set one first - just enable and let PrivacyLock handle setup
            settingsStore.setPrivacyEnabled(true);
            setPrivacyEnabled(true);
            // Reload page to trigger PrivacyLock setup flow
            window.location.reload();
        } else {
            // Toggle existing lock
            const newValue = !privacyEnabled;
            settingsStore.setPrivacyEnabled(newValue);
            setPrivacyEnabled(newValue);
        }
    };

    const handleClearPin = () => {
        if (window.confirm(t('確定要重置密碼嗎？這將會關閉應用鎖。'))) {
            settingsStore.removePrivacyPin();
            setHasPin(false);
            setPrivacyEnabled(false);
        }
    };

    const isSupported = notificationService.isSupported();
    const isDenied = permissionStatus === 'denied';

    return (
        <div className="notification-settings-overlay" onClick={onClose}>
            <div className="notification-settings-panel" onClick={e => e.stopPropagation()}>
                <header className="settings-header">
                    <h3>🔔 {t('提醒設定')}</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <div className="settings-content">
                    {/* Unsupported browser warning */}
                    {!isSupported && (
                        <div className="warning-card">
                            <span className="warning-icon">⚠️</span>
                            <p>{t('你的瀏覽器不支援通知功能')}</p>
                        </div>
                    )}

                    {/* Permission denied warning */}
                    {isDenied && isSupported && (
                        <div className="warning-card">
                            <span className="warning-icon">🚫</span>
                            <p>{t('通知權限已被拒絕，請在瀏覽器設定中允許通知')}</p>
                        </div>
                    )}

                    {/* Enable/Disable toggle */}
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">{t('每日心情提醒')}</span>
                            <span className="setting-description">
                                {t('在設定的時間收到提醒，記錄今天的心情')}
                            </span>
                        </div>
                        <button
                            className={`toggle-switch ${settings.enabled ? 'active' : ''}`}
                            onClick={handleToggle}
                            disabled={!isSupported || isLoading}
                        >
                            <span className="toggle-knob" />
                        </button>
                    </div>

                    {/* Time picker */}
                    {settings.enabled && (
                        <div className="setting-row time-picker-row">
                            <span className="setting-label">{t('提醒時間')}</span>
                            <div className="time-picker">
                                <select
                                    value={settings.hour}
                                    onChange={e => handleTimeChange('hour', parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {i.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                <span className="time-separator">:</span>
                                <select
                                    value={settings.minute}
                                    onChange={e => handleTimeChange('minute', parseInt(e.target.value))}
                                >
                                    {[0, 15, 30, 45].map(m => (
                                        <option key={m} value={m}>
                                            {m.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Test notification button */}
                    {settings.enabled && (
                        <button className="test-btn" onClick={handleTest}>
                            🧪 {t('發送測試通知')}
                        </button>
                    )}

                    <div className="divider" style={{ 
                        height: '1px', 
                        background: 'var(--glass-border)', 
                        margin: 'var(--s-4) 0' 
                    }} />

                    {/* Privacy Lock Toggle */}
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">{t('應用鎖')}</span>
                            <span className="setting-description">
                                {t('開啟應用時需要密碼解鎖')}
                            </span>
                        </div>
                        <button
                            className={`toggle-switch ${privacyEnabled ? 'active' : ''}`}
                            onClick={handlePrivacyToggle}
                        >
                            <span className="toggle-knob" />
                        </button>
                    </div>

                    {/* Reset PIN button (only show if PIN is set) */}
                    {hasPin && (
                        <button className="reset-pin-btn" onClick={handleClearPin}>
                            🔑 {t('重置密碼')}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default NotificationSettingsPanel;
