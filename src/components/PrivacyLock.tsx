import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { settingsStore } from '../adapters';

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

            <style>{`
                .privacy-lock-overlay {
                    position: fixed;
                    inset: 0;
                    background: var(--bg-color);
                    z-index: 20000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--s-6);
                }
                .lock-content {
                    width: 100%;
                    max-width: 320px;
                    text-align: center;
                }
                .lock-icon { font-size: 3rem; margin-bottom: var(--s-6); }
                h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: var(--s-2); }
                p { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--s-10); }

                .pin-dots {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: var(--s-12);
                }
                .dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid var(--glass-border);
                    transition: all 0.2s ease;
                }
                .dot.filled {
                    background: var(--color-yellow);
                    border-color: var(--color-yellow);
                    transform: scale(1.2);
                    box-shadow: 0 0 10px var(--color-yellow);
                }
                .dot.verifying {
                    animation: pulse 0.6s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .keypad {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                }
                .key {
                    height: 60px;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 50%;
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition);
                }
                .key:hover { background: var(--surface-hover); }
                .key.empty { background: transparent; border: none; cursor: default; }
                .key:disabled { opacity: 0.5; cursor: not-allowed; }

                .error-msg { color: var(--color-red); font-size: 0.85rem; margin-bottom: var(--s-4); animation: shake 0.3s ease-in-out; }
                .verifying-msg { color: var(--text-secondary); font-size: 0.85rem; margin-bottom: var(--s-4); }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .confirm-area { margin-top: var(--s-8); display: flex; flex-direction: column; gap: 10px; }
                .confirm-input {
                    background: var(--surface-elevated);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-sm);
                    padding: 10px;
                    color: var(--text-primary);
                    text-align: center;
                    letter-spacing: 5px;
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};

export default PrivacyLock;
