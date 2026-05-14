import React, { useState, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import { storageService } from '../adapters';
import './UserProfile.css';

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
    const [deleteMessage, setDeleteMessage] = useState('');

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
            return;
        }
        setDeleteMessage(t('刪除失敗，請稍後再試或使用資料刪除申請。'));
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
                    <button className="close-btn" aria-label="關閉" onClick={onClose}>×</button>
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
                                    onClick={() => {
                                        setDeleteMessage('');
                                        setShowDeleteConfirm(true);
                                    }}
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
                                                setDeleteMessage('');
                                            }}
                                        >
                                            {t('取消')}
                                        </button>
                                    </div>
                                    {deleteMessage && <div className="message error">{deleteMessage}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
