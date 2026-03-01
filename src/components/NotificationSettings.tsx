import React, { useState, useEffect } from 'react';
import { notificationService, NotificationSettings } from '../services/NotificationService';
import { useLanguage } from '../services/LanguageContext';

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
        localStorage.getItem('imxin_privacy_enabled') === 'true'
    );
    const [hasPin, setHasPin] = useState(() => 
        !!localStorage.getItem('imxin_privacy_pin')
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
            localStorage.setItem('imxin_privacy_enabled', 'true');
            setPrivacyEnabled(true);
            // Reload page to trigger PrivacyLock setup flow
            window.location.reload();
        } else {
            // Toggle existing lock
            const newValue = !privacyEnabled;
            localStorage.setItem('imxin_privacy_enabled', newValue.toString());
            setPrivacyEnabled(newValue);
        }
    };

    const handleClearPin = () => {
        if (window.confirm(t('確定要重置密碼嗎？這將會關閉應用鎖。'))) {
            localStorage.removeItem('imxin_privacy_pin');
            localStorage.removeItem('imxin_privacy_enabled');
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

                <style>{`
                    .notification-settings-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        animation: fadeIn 0.2s ease;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .notification-settings-panel {
                        background: var(--glass-bg);
                        backdrop-filter: var(--glass-blur);
                        border: 1px solid var(--glass-border);
                        border-radius: 20px;
                        width: 90%;
                        max-width: 400px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: slideUp 0.3s ease;
                    }

                    @keyframes slideUp {
                        from { 
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to { 
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .settings-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: var(--s-5);
                        border-bottom: 1px solid var(--glass-border);
                    }

                    .settings-header h3 {
                        margin: 0;
                        font-size: 1.2rem;
                        color: var(--text-primary);
                    }

                    .close-btn {
                        background: transparent;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        color: var(--text-muted);
                        padding: var(--s-2);
                        transition: color 0.2s;
                    }

                    .close-btn:hover {
                        color: var(--text-primary);
                    }

                    .settings-content {
                        padding: var(--s-5);
                        display: flex;
                        flex-direction: column;
                        gap: var(--s-4);
                    }

                    .warning-card {
                        display: flex;
                        align-items: center;
                        gap: var(--s-3);
                        background: rgba(197, 139, 138, 0.15);
                        border: 1px solid var(--color-red);
                        border-radius: 12px;
                        padding: var(--s-4);
                    }

                    .warning-icon {
                        font-size: 1.5rem;
                    }

                    .warning-card p {
                        margin: 0;
                        font-size: 0.9rem;
                        color: var(--text-primary);
                    }

                    .setting-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: var(--s-3);
                    }

                    .setting-info {
                        display: flex;
                        flex-direction: column;
                        gap: var(--s-1);
                    }

                    .setting-label {
                        font-weight: 600;
                        color: var(--text-primary);
                    }

                    .setting-description {
                        font-size: 0.85rem;
                        color: var(--text-muted);
                    }

                    .toggle-switch {
                        width: 52px;
                        height: 28px;
                        border-radius: 14px;
                        background: var(--bg-secondary);
                        border: 1px solid var(--glass-border);
                        cursor: pointer;
                        position: relative;
                        transition: all 0.3s ease;
                        flex-shrink: 0;
                    }

                    .toggle-switch:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .toggle-switch.active {
                        background: linear-gradient(135deg, var(--color-green) 0%, var(--color-blue) 100%);
                        border-color: transparent;
                    }

                    .toggle-knob {
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        width: 22px;
                        height: 22px;
                        border-radius: 50%;
                        background: white;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        transition: transform 0.3s ease;
                    }

                    .toggle-switch.active .toggle-knob {
                        transform: translateX(24px);
                    }

                    .time-picker-row {
                        background: var(--bg-secondary);
                        padding: var(--s-4);
                        border-radius: 12px;
                    }

                    .time-picker {
                        display: flex;
                        align-items: center;
                        gap: var(--s-2);
                    }

                    .time-picker select {
                        background: var(--glass-bg);
                        border: 1px solid var(--glass-border);
                        border-radius: 8px;
                        padding: var(--s-2) var(--s-3);
                        font-size: 1rem;
                        color: var(--text-primary);
                        cursor: pointer;
                        appearance: none;
                        text-align: center;
                        min-width: 60px;
                    }

                    .time-separator {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: var(--text-muted);
                    }

                    .test-btn {
                        background: linear-gradient(135deg, var(--color-yellow) 0%, var(--color-green) 100%);
                        border: none;
                        border-radius: 12px;
                        padding: var(--s-3) var(--s-4);
                        font-size: 0.95rem;
                        font-weight: 600;
                        color: white;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    }

                    .test-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }

                    .test-btn:active {
                        transform: translateY(0);
                    }

                    .reset-pin-btn {
                        width: 100%;
                        background: rgba(197, 139, 138, 0.15);
                        border: 1px solid var(--glass-border);
                        border-radius: 12px;
                        padding: var(--s-3) var(--s-4);
                        font-size: 0.95rem;
                        font-weight: 600;
                        color: var(--text-primary);
                        cursor: pointer;
                        transition: all 0.2s ease;
                        margin-top: var(--s-2);
                    }
                    .reset-pin-btn:hover {
                        background: rgba(197, 139, 138, 0.25);
                    }
                `}</style>
            </div>
        </div>
    );
};

export default NotificationSettingsPanel;
