import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
    const { t } = useLanguage();
    const { login, register } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    if (!isOpen) return null;

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
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

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('兩次輸入的密碼不一致');
                setIsLoading(false);
                return;
            }

            const result = await register(email, password, displayName);
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

        setIsLoading(false);
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        const guestEmail = `guest_${Date.now()}@imxin.app`;
        const result = await register(guestEmail, 'guest123', t('訪客用戶'));
        if (result.success) {
            onClose();
        } else {
            setError('訪客登錄失敗');
        }
        setIsLoading(false);
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

            <style>{`
                .auth-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: hsla(0, 0%, 10%, 0.85);
                    backdrop-filter: blur(12px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--s-6);
                }

                .auth-modal-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-luxe);
                    padding: var(--s-8);
                    width: 100%;
                    max-width: 400px;
                    position: relative;
                    box-shadow: var(--shadow-luxe);
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .auth-modal-header {
                    text-align: center;
                    margin-bottom: var(--s-6);
                }

                .auth-modal-header h2 {
                    font-size: 1.6rem;
                    font-weight: 800;
                    margin: 0 0 var(--s-2);
                }

                .auth-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin: 0;
                }

                .close-btn {
                    position: absolute;
                    top: var(--s-4);
                    right: var(--s-4);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 1.5rem;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .close-btn:hover {
                    background: var(--glass-bg);
                    color: var(--text-primary);
                }

                .auth-mode-toggle {
                    display: flex;
                    gap: var(--s-2);
                    margin-bottom: var(--s-6);
                    padding: 4px;
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                }

                .mode-btn {
                    flex: 1;
                    padding: var(--s-3) var(--s-4);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: var(--radius-sm);
                    transition: all 0.3s ease;
                }

                .mode-btn.active {
                    background: var(--text-primary);
                    color: var(--bg-color);
                    font-weight: 600;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-4);
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-2);
                }

                .form-group label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .form-group input {
                    padding: var(--s-3) var(--s-4);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    transition: all 0.3s ease;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--color-yellow);
                    box-shadow: 0 0 0 3px hsla(43, 40%, 70%, 0.1);
                }

                .form-group input::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.5;
                }

                .form-group input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .auth-message {
                    padding: var(--s-3) var(--s-4);
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    text-align: center;
                }

                .auth-message.error {
                    background: hsla(0, 50%, 50%, 0.1);
                    color: #ff6b6b;
                    border: 1px solid hsla(0, 50%, 50%, 0.2);
                }

                .auth-message.success {
                    background: hsla(120, 50%, 40%, 0.1);
                    color: #6bcb77;
                    border: 1px solid hsla(120, 50%, 40%, 0.2);
                }

                .auth-submit-btn {
                    padding: var(--s-4);
                    background: var(--text-primary);
                    color: var(--bg-color);
                    border: none;
                    border-radius: var(--radius-md);
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: var(--s-2);
                }

                .auth-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-luxe);
                    filter: brightness(1.1);
                }

                .auth-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    margin: var(--s-6) 0;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: var(--glass-border);
                }

                .auth-divider span {
                    padding: 0 var(--s-3);
                }

                .guest-login-btn {
                    width: 100%;
                    padding: var(--s-3) var(--s-4);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .guest-login-btn:hover:not(:disabled) {
                    background: var(--glass-border);
                    color: var(--text-primary);
                    border-color: var(--text-secondary);
                }

                .guest-login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .guest-hint {
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    margin: var(--s-3) 0 0;
                    opacity: 0.7;
                }

                @media (max-width: 480px) {
                    .auth-modal-card {
                        padding: var(--s-6);
                    }

                    .auth-modal-header h2 {
                        font-size: 1.4rem;
                    }
                }

                .fade-in {
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AuthModal;
