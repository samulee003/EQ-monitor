import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { settingsStore } from '../adapters';
import './PrivacyLock.css';

interface PrivacyLockProps {
    onUnlock: () => void;
}

const PrivacyLock: React.FC<PrivacyLockProps> = ({ onUnlock }) => {
    const { t } = useLanguage();
    const [pin, setPin] = useState('');
    const hasPin = settingsStore.hasPrivacyPin();
    const [isSetting] = useState(!hasPin);
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleKeypad = (num: string) => {
        if (pin.length < 4) {
            setPin(p => p + num);
        }
    };

    const handleDelete = () => {
        setPin(p => p.slice(0, -1));
    };

    const handleVerifyPin = useCallback(async (enteredPin: string) => {
        setIsVerifying(true);
        try {
            const isMatch = await settingsStore.verifyPrivacyPin(enteredPin);
            if (isMatch) {
                onUnlock();
            } else {
                setError(t('密碼錯誤，請重試'));
                setTimeout(() => setPin(''), 500);
            }
        } catch {
            setError(t('驗證失敗，請重試'));
            setTimeout(() => setPin(''), 500);
        } finally {
            setIsVerifying(false);
        }
    }, [onUnlock, t]);

    useEffect(() => {
        if (pin.length === 4) {
            if (isSetting) {
                // 設定模式：等待確認步驟
            } else {
                // 驗證模式：異步比對哈希值
                handleVerifyPin(pin);
            }
        }
    }, [pin, isSetting, handleVerifyPin]);

    const handleSetPin = async () => {
        if (pin === confirmPin && pin.length === 4) {
            await settingsStore.setPrivacyPin(pin);
            settingsStore.setPrivacyEnabled(true);
            onUnlock();
        } else {
            setError(t('兩次輸入不一致'));
            setPin('');
            setConfirmPin('');
        }
    };

    if (!hasPin && !isSetting) return null;

    return (
        <div className="privacy-lock-overlay">
            <div className="lock-content">
                <div className="lock-icon">🔒</div>
                <h2>{isSetting ? t('設定隱私密碼') : t('輸入密碼解鎖')}</h2>
                <p>{isSetting ? t('為了保護你的情緒隱私，請設定 4 位數密碼') : t('今心保護你的每一份情緒記錄')}</p>

                <div className="pin-dots">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`dot ${pin.length > i ? 'filled' : ''} ${isVerifying ? 'verifying' : ''}`}></div>
                    ))}
                </div>

                {error && <div className="error-msg">{error}</div>}
                {isVerifying && <div className="verifying-msg">{t('驗證中…')}</div>}

                <div className="keypad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
                        <button
                            key={i}
                            className={`key ${!key ? 'empty' : ''}`}
                            onClick={() => key === '⌫' ? handleDelete() : key ? handleKeypad(key) : null}
                            disabled={!key || isVerifying}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                {isSetting && pin.length === 4 && (
                    <div className="confirm-area fade-in">
                        <input
                            type="password"
                            placeholder={t('再次輸入以確認')}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            maxLength={4}
                            className="confirm-input"
                        />
                        <button className="morandi-main-btn" onClick={handleSetPin}>{t('完成設定')}</button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default PrivacyLock;
