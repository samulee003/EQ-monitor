import React, { useState, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import { storageService } from '../services/StorageService';

interface UserProfileProps {
    onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
    const { t } = useLanguage();
    const { user, logout, updateProfile, changePassword, deleteAccount, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'data'>('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile state
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isEditing, setIsEditing] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    // Password state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    // Data state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    if (!isAuthenticated || !user) {
        return (
            <div className="profile-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="profile-card">
                    <h2>{t('需要登錄')}</h2>
                    <p>{t('請先登錄以查看個人資料')}</p>
                    <button className="profile-btn" onClick={onClose}>{t('關閉')}</button>
                </div>
            </div>
        );
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            updateProfile({ avatar: base64 }).then(() => {
                setUpdateMessage(t('頭像已更新'));
                setTimeout(() => setUpdateMessage(''), 2000);
            });
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        if (!displayName.trim()) return;

        const success = await updateProfile({ displayName: displayName.trim() });
        if (success) {
            setUpdateMessage(t('資料已更新'));
            setIsEditing(false);
            setTimeout(() => setUpdateMessage(''), 2000);
        }
    };

    const handleChangePassword = async () => {
        setPasswordMessage('');

        if (newPassword !== confirmNewPassword) {
            setPasswordMessage(t('兩次輸入的密碼不一致'));
            return;
        }

        const result = await changePassword(oldPassword, newPassword);
        if (result.success) {
            setPasswordMessage(t('密碼已修改'));
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => setPasswordMessage(''), 2000);
        } else {
            setPasswordMessage(result.error || t('修改失敗'));
        }
    };

    const handleExportData = () => {
        const logs = storageService.getLogs();
        const data = {
            user: {
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt,
            },
            logs,
            exportDate: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imxin-data-${user.displayName}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== t('刪除帳號')) {
            return;
        }

        const success = await deleteAccount();
        if (success) {
            onClose();
        }
    };

    const getInitials = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="profile-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="profile-card fade-in">
                {/* Header */}
                <div className="profile-header">
                    <h2>{t('個人中心')}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        {t('資料')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        {t('密碼')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                        onClick={() => setActiveTab('data')}
                    >
                        {t('數據')}
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="profile-tab-content">
                        <div className="avatar-section">
                            <div
                                className="avatar-container"
                                onClick={handleAvatarClick}
                                style={{ cursor: 'pointer' }}
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.displayName} className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {getInitials(user.displayName)}
                                    </div>
                                )}
                                <div className="avatar-overlay">
                                    <span>📷</span>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="profile-field">
                            <label>{t('昵稱')}</label>
                            {isEditing ? (
                                <div className="edit-field">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        maxLength={20}
                                    />
                                    <button className="save-btn" onClick={handleUpdateProfile}>
                                        {t('保存')}
                                    </button>
                                    <button className="cancel-btn" onClick={() => {
                                        setIsEditing(false);
                                        setDisplayName(user.displayName);
                                    }}>
                                        {t('取消')}
                                    </button>
                                </div>
                            ) : (
                                <div className="display-field">
                                    <span>{user.displayName}</span>
                                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                        {t('編輯')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label>{t('郵箱')}</label>
                            <div className="display-field">
                                <span>{user.email}</span>
                            </div>
                        </div>

                        <div className="profile-field">
                            <label>{t('加入時間')}</label>
                            <div className="display-field">
                                <span>{new Date(user.createdAt).toLocaleDateString('zh-TW')}</span>
                            </div>
                        </div>

                        {updateMessage && <div className="success-message">{updateMessage}</div>}

                        <button className="logout-btn" onClick={() => { logout(); onClose(); }}>
                            {t('退出登錄')}
                        </button>
                    </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <div className="profile-tab-content">
                        <div className="form-group">
                            <label>{t('當前密碼')}</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder={t('請輸入當前密碼')}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('新密碼')}</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t('請輸入新密碼（至少6位）')}
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('確認新密碼')}</label>
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder={t('請再次輸入新密碼')}
                            />
                        </div>

                        {passwordMessage && (
                            <div className={`message ${passwordMessage.includes('成功') || passwordMessage.includes('已') ? 'success' : 'error'}`}>
                                {passwordMessage}
                            </div>
                        )}

                        <button
                            className="profile-btn primary"
                            onClick={handleChangePassword}
                            disabled={!oldPassword || !newPassword || !confirmNewPassword}
                        >
                            {t('修改密碼')}
                        </button>
                    </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                    <div className="profile-tab-content">
                        <div className="data-section">
                            <h3>{t('數據管理')}</h3>
                            <p>{t('匯出你的所有情緒記錄和設置')}</p>
                            <button className="profile-btn" onClick={handleExportData}>
                                📤 {t('匯出所有數據')}
                            </button>
                        </div>

                        <div className="data-section danger">
                            <h3>{t('危險區域')}</h3>
                            {!showDeleteConfirm ? (
                                <button
                                    className="profile-btn danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    🗑️ {t('刪除帳號')}
                                </button>
                            ) : (
                                <div className="delete-confirm">
                                    <p className="warning-text">
                                        {t('⚠️ 此操作不可逆！輸入「刪除帳號」以確認')}
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder={t('請輸入「刪除帳號」')}
                                    />
                                    <div className="confirm-actions">
                                        <button
                                            className="profile-btn danger"
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== t('刪除帳號')}
                                        >
                                            {t('確認刪除')}
                                        </button>
                                        <button
                                            className="profile-btn"
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                        >
                                            {t('取消')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .profile-overlay {
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

                .profile-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-luxe);
                    width: 100%;
                    max-width: 420px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: var(--shadow-luxe);
                }

                .profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--s-6);
                    border-bottom: 1px solid var(--glass-border);
                }

                .profile-header h2 {
                    margin: 0;
                    font-size: 1.3rem;
                    font-weight: 700;
                }

                .close-btn {
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

                .profile-tabs {
                    display: flex;
                    border-bottom: 1px solid var(--glass-border);
                }

                .tab-btn {
                    flex: 1;
                    padding: var(--s-4);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .tab-btn.active {
                    color: var(--text-primary);
                    font-weight: 600;
                }

                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: var(--color-yellow);
                    border-radius: 2px;
                }

                .profile-tab-content {
                    padding: var(--s-6);
                }

                .avatar-section {
                    display: flex;
                    justify-content: center;
                    margin-bottom: var(--s-6);
                }

                .avatar-container {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                }

                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--color-yellow), var(--color-red));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: rgba(0,0,0,0.6);
                }

                .avatar-overlay {
                    position: absolute;
                    inset: 0;
                    background: hsla(0, 0%, 0%, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .avatar-overlay span {
                    font-size: 1.5rem;
                }

                .avatar-container:hover .avatar-overlay {
                    opacity: 1;
                }

                .profile-field {
                    margin-bottom: var(--s-4);
                }

                .profile-field label {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-bottom: var(--s-2);
                }

                .display-field {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                }

                .display-field span {
                    color: var(--text-primary);
                }

                .edit-btn {
                    background: none;
                    border: none;
                    color: var(--color-yellow);
                    font-size: 0.85rem;
                    cursor: pointer;
                    padding: var(--s-1) var(--s-2);
                }

                .edit-field {
                    display: flex;
                    gap: var(--s-2);
                }

                .edit-field input {
                    flex: 1;
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                }

                .save-btn, .cancel-btn {
                    padding: var(--s-2) var(--s-3);
                    border: none;
                    border-radius: var(--radius-sm);
                    font-size: 0.85rem;
                    cursor: pointer;
                }

                .save-btn {
                    background: var(--color-green);
                    color: rgba(0,0,0,0.7);
                    font-weight: 600;
                }

                .cancel-btn {
                    background: var(--glass-bg);
                    color: var(--text-secondary);
                }

                .form-group {
                    margin-bottom: var(--s-4);
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: var(--s-2);
                }

                .form-group input {
                    width: 100%;
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--color-yellow);
                }

                .profile-btn {
                    width: 100%;
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: var(--s-3);
                }

                .profile-btn:hover {
                    background: var(--glass-border);
                }

                .profile-btn.primary {
                    background: var(--text-primary);
                    color: var(--bg-color);
                    border: none;
                    font-weight: 600;
                }

                .profile-btn.danger {
                    background: hsla(0, 50%, 50%, 0.1);
                    border-color: hsla(0, 50%, 50%, 0.3);
                    color: #ff6b6b;
                }

                .profile-btn.danger:hover {
                    background: hsla(0, 50%, 50%, 0.2);
                }

                .profile-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .logout-btn {
                    width: 100%;
                    padding: var(--s-3);
                    background: hsla(0, 0%, 100%, 0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    margin-top: var(--s-4);
                    transition: all 0.3s ease;
                }

                .logout-btn:hover {
                    background: hsla(0, 0%, 100%, 0.1);
                    color: var(--text-primary);
                }

                .success-message {
                    padding: var(--s-3);
                    background: hsla(120, 50%, 40%, 0.1);
                    border: 1px solid hsla(120, 50%, 40%, 0.2);
                    border-radius: var(--radius-md);
                    color: #6bcb77;
                    text-align: center;
                    margin-bottom: var(--s-4);
                }

                .message {
                    padding: var(--s-3);
                    border-radius: var(--radius-md);
                    text-align: center;
                    margin-bottom: var(--s-4);
                    font-size: 0.9rem;
                }

                .message.success {
                    background: hsla(120, 50%, 40%, 0.1);
                    border: 1px solid hsla(120, 50%, 40%, 0.2);
                    color: #6bcb77;
                }

                .message.error {
                    background: hsla(0, 50%, 50%, 0.1);
                    border: 1px solid hsla(0, 50%, 50%, 0.2);
                    color: #ff6b6b;
                }

                .data-section {
                    padding: var(--s-4);
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                    margin-bottom: var(--s-4);
                }

                .data-section h3 {
                    margin: 0 0 var(--s-2);
                    font-size: 1rem;
                }

                .data-section p {
                    margin: 0 0 var(--s-4);
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .data-section.danger {
                    border: 1px solid hsla(0, 50%, 50%, 0.2);
                }

                .delete-confirm {
                    margin-top: var(--s-3);
                }

                .warning-text {
                    color: #ff6b6b;
                    font-size: 0.85rem;
                    margin-bottom: var(--s-3);
                }

                .delete-confirm input {
                    width: 100%;
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid hsla(0, 50%, 50%, 0.3);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    margin-bottom: var(--s-3);
                    box-sizing: border-box;
                }

                .confirm-actions {
                    display: flex;
                    gap: var(--s-2);
                }

                .confirm-actions .profile-btn {
                    flex: 1;
                    margin-bottom: 0;
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

export default UserProfile;
