import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import styles from './AuthModal.module.css';
import './AuthModal.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
    const { t } = useLanguage();
    const { login, register, continueAsGuest } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [coachOptIn, setCoachOptIn] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setPrivacyConsent(false);
        setCoachOptIn(false);
        setError('');
        setSuccess('');
    };

    const switchMode = (newMode: 'login' | 'register') => {
        setMode(newMode);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    setError('兩次輸入的密碼不一致');
                    setIsLoading(false);
                    return;
                }

                if (!privacyConsent) {
                    setError('請先閱讀並同意隱私聲明');
                    setIsLoading(false);
                    return;
                }

                const result = await register(email, password, displayName, coachOptIn);
                if (result.success) {
                    setSuccess('註冊成功！');
                    setTimeout(() => {
                        onClose();
                        resetForm();
                    }, 1000);
                } else {
                    setError(result.error || '註冊失敗');
                }
            } else {
                const result = await login(email, password);
                if (result.success) {
                    setSuccess('登錄成功！');
                    setTimeout(() => {
                        onClose();
                        resetForm();
                    }, 1000);
                } else {
                    setError(result.error || '登錄失敗');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '操作失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = () => {
        setIsLoading(true);
        setError('');
        try {
            continueAsGuest(t('訪客用戶'));
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : '訪客登錄失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="auth-modal-card fade-in">
                {/* Header */}
                <div className="auth-modal-header">
                    <h2>{mode === 'login' ? t('歡迎回來') : t('創建帳號')}</h2>
                    <p className="auth-subtitle">
                        {mode === 'login'
                            ? t('登錄以同步你的情緒記錄')
                            : t('註冊以開始你的情緒覺察之旅')
                        }
                    </p>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Mode Toggle */}
                <div className="auth-mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        {t('登錄')}
                    </button>
                    <button
                        className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        {t('註冊')}
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="displayName">{t('昵稱')}</label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={t('請輸入你的昵稱')}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">{t('電子郵箱')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('請輸入電子郵箱')}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('密碼')}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('請輸入密碼')}
                            required
                            minLength={6}
                            disabled={isLoading}
                        />
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t('確認密碼')}</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('請再次輸入密碼')}
                                required
                                minLength={6}
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    {mode === 'register' && (
                        <div className={styles.privacySection}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={privacyConsent}
                                    onChange={e => setPrivacyConsent(e.target.checked)}
                                    required
                                />
                                <span>
                                    {t('我同意建立雲端帳號，並同步必要的情緒記錄與教練脈絡；資料只用於提供今心與阿念教練功能，不作商業用途。')}
                                    {' '}
                                    <a href="/privacy.html" target="_blank" rel="noopener noreferrer">{t('隱私聲明')}</a>
                                </span>
                            </label>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={coachOptIn}
                                    onChange={e => setCoachOptIn(e.target.checked)}
                                />
                                <span>{t('允許阿念教練根據我的情緒模式主動傳送關心訊息（可隨時關閉）')}</span>
                            </label>
                        </div>
                    )}

                    {/* Messages */}
                    {error && <div className="auth-message error">{error}</div>}
                    {success && <div className="auth-message success">{success}</div>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? t('處理中...')
                            : mode === 'login'
                                ? t('登錄')
                                : t('註冊')
                        }
                    </button>
                </form>

                {/* Guest Login */}
                <div className="auth-divider">
                    <span>{t('或')}</span>
                </div>

                <button
                    className="guest-login-btn"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                >
                    {t('訪客登錄')}
                </button>

                <p className="guest-hint">
                    {t('訪客數據將保存在本地，註冊帳號後可同步')}
                </p>
            </div>

        </div>
    );
};

export default AuthModal;
