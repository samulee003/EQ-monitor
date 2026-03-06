import { useEffect, useState, useMemo, useRef } from 'react';
import { uiIcons } from './icons/SvgIcons';
import { useLanguage } from '../services/LanguageContext';
import { storageService, ImportResult } from '../services/StorageService';
import { RulerLogEntry } from '../types/RulerTypes';
import ExportPanel from './ExportPanel';
import Skeleton from './Skeleton';

const ITEMS_PER_PAGE = 10; // 每頁顯示數量

const Timeline: React.FC = () => {
    const { t } = useLanguage();
    const [logs, setLogs] = useState<RulerLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showExport, setShowExport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const listTopRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Simulate loading for smoother UX
        setTimeout(() => {
            loadLogs();
            setIsLoading(false);
        }, 300);
    }, []);

    // Auto-hide import result after 5 seconds
    useEffect(() => {
        if (importResult) {
            const timer = setTimeout(() => setImportResult(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [importResult]);

    const loadLogs = () => {
        const data = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        setLogs(data);
    };

    const handleDeleteClick = (timestamp: string) => {
        setDeleteConfirmId(timestamp);
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmId) {
            const existing = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
            const updated = existing.filter((log: RulerLogEntry) => log.timestamp !== deleteConfirmId);
            localStorage.setItem('feelings_logs', JSON.stringify(updated));
            setLogs(updated);
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmId(null);
    };

    const handleEditStart = (log: RulerLogEntry) => {
        setEditingId(log.timestamp);
        setEditText(log.expressing?.expression || '');
    };

    const handleEditSave = (timestamp: string) => {
        const existing = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        const updated = existing.map((log: RulerLogEntry) => {
            if (log.timestamp === timestamp) {
                return {
                    ...log,
                    expressing: {
                        ...log.expressing,
                        expression: editText
                    }
                };
            }
            return log;
        });
        localStorage.setItem('feelings_logs', JSON.stringify(updated));
        setLogs(updated);
        setEditingId(null);
    };

    const handleExportCSV = () => {
        const headers = [
            t('時間 (Time)'),
            t('情緒 (Emotion)'),
            t('能量區塊 (Quadrant)'),
            t('強度 (Intensity)'),
            t('身體部位 (Body Location)'),
            t('感官感受 (Sensation)'),
            t('觸發事件 (Trigger)'),
            t('關聯對象 (Who)'),
            t('地點 (Where)'),
            t('心理需求 (Need)'),
            t('表達內容 (Expression)'),
            t('調節策略 (Strategies)'),
            t('調節後心情 (Post Mood)')
        ];

        const rows = logs.map(log => {
            const emotion = log.emotions?.[0];
            return [
                new Date(log.timestamp).toLocaleString('zh-TW'),
                emotion ? t(emotion.name) : '',
                emotion?.quadrant === 'red' ? t('高能量/不愉快') :
                    emotion?.quadrant === 'yellow' ? t('高能量/愉快') :
                        emotion?.quadrant === 'blue' ? t('低能量/不愉快') : t('低能量/愉快'),
                log.intensity,
                log.bodyScan?.location || '',
                log.bodyScan?.sensation || '',
                log.understanding?.trigger || '',
                log.understanding?.who || '',
                log.understanding?.where || '',
                log.understanding?.need || '',
                log.expressing?.expression || '',
                log.regulating?.selectedStrategies?.join('; ') || '',
                log.postMood || ''
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imxin-records-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportJSON = () => {
        const data = JSON.stringify(logs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imxin-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = storageService.importLogs(content);
            setImportResult(result);

            if (result.success && result.imported > 0) {
                loadLogs(); // Refresh the list
            }
        };
        reader.onerror = () => {
            setImportResult({
                success: false,
                imported: 0,
                skipped: 0,
                message: t('無法讀取檔案')
            });
        };
        reader.readAsText(file);

        // Reset file input so same file can be selected again
        event.target.value = '';
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            weekday: 'narrow',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 分頁邏輯
    const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [logs, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // 滾動到列表頂部
        listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="timeline-container fade-in">
                <div className="timeline-header">
                    <Skeleton type="text" />
                    <Skeleton type="text" className="short" />
                </div>
                <div className="timeline-list">
                    <Skeleton type="card" />
                    <Skeleton type="card" />
                </div>
                <style>{`
                    .timeline-header { margin-bottom: 2.5rem; }
                    .timeline-list { display: flex; flex-direction: column; gap: 1.5rem; }
                `}</style>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="empty-state fade-in">
                <div className="empty-illustration">
                    <div className="floating-leaf leaf-1">{uiIcons.leaf}</div>
                    <div className="floating-leaf leaf-2">{uiIcons.leaf}</div>
                    <div className="empty-circle-outer">
                        <div className="empty-circle-inner">
                            <span className="empty-emoji">🌱</span>
                        </div>
                    </div>
                </div>
                <h2>{t('開始你的情緒覺察之旅')}</h2>
                <p>{t('記錄你的第一個情緒，邁向自我成長的第一步。')}</p>
                
                <div className="empty-features">
                    <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>{t('追蹤情緒趨勢')}</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🧘</span>
                        <span>{t('學習情緒調節')}</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">💡</span>
                        <span>{t('獲得個人洞察')}</span>
                    </div>
                </div>

                <div className="import-empty-action">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleImportJSON}
                        style={{ display: 'none' }}
                    />
                    <button className="import-btn-empty" onClick={handleImportClick}>
                        📥 {t('匯入備份檔案')}
                    </button>
                </div>
                {importResult && (
                    <div className={`import-toast ${importResult.success ? 'success' : 'error'}`}>
                        {t(importResult.message)}
                    </div>
                )}
                <style>{`
                    .empty-state { 
                        text-align: center; 
                        padding: 4rem 2rem; 
                        color: var(--text-secondary);
                        max-width: 400px;
                        margin: 0 auto;
                    }
                    .empty-illustration {
                        position: relative;
                        width: 160px;
                        height: 160px;
                        margin: 0 auto 2rem;
                    }
                    .empty-circle-outer {
                        width: 120px;
                        height: 120px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--color-green) 0%, var(--color-blue) 100%);
                        opacity: 0.2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto;
                        animation: pulse 3s ease-in-out infinite;
                    }
                    .empty-circle-inner {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--color-green) 0%, var(--color-blue) 100%);
                        opacity: 0.4;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .empty-emoji {
                        font-size: 2.5rem;
                        animation: float 3s ease-in-out infinite;
                    }
                    .floating-leaf {
                        position: absolute;
                        width: 32px;
                        height: 32px;
                        opacity: 0.4;
                        animation: floatLeaf 4s ease-in-out infinite;
                    }
                    .leaf-1 { top: 0; right: 10px; animation-delay: 0s; }
                    .leaf-2 { bottom: 20px; left: 0; animation-delay: 2s; }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.2; }
                        50% { transform: scale(1.05); opacity: 0.3; }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-8px); }
                    }
                    @keyframes floatLeaf {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-10px) rotate(10deg); }
                    }
                    .empty-state h2 {
                        font-size: 1.5rem;
                        color: var(--text-primary);
                        margin-bottom: 0.5rem;
                        font-weight: 700;
                    }
                    .empty-state p {
                        font-size: 0.95rem;
                        line-height: 1.6;
                        margin-bottom: 2rem;
                    }
                    .empty-features {
                        display: flex;
                        justify-content: center;
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                        flex-wrap: wrap;
                    }
                    .feature-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.8rem;
                        color: var(--text-secondary);
                    }
                    .feature-icon {
                        font-size: 1.5rem;
                    }
                    .import-empty-action { margin-top: 1.5rem; }
                    .import-btn-empty {
                        background: var(--glass-bg);
                        border: 1px dashed var(--glass-border);
                        border-radius: var(--radius-sm);
                        padding: 12px 24px;
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: var(--transition);
                    }
                    .import-btn-empty:hover {
                        background: rgba(255,255,255,0.05);
                        color: var(--text-primary);
                        border-color: var(--text-secondary);
                    }
                    .import-toast {
                        position: fixed;
                        bottom: 24px;
                        left: 50%;
                        transform: translateX(-50%);
                        padding: 12px 24px;
                        border-radius: var(--radius-sm);
                        font-size: 0.9rem;
                        animation: slideUp 0.3s ease;
                        z-index: 1000;
                    }
                    .import-toast.success { background: var(--color-green); color: white; }
                    .import-toast.error { background: var(--color-red); color: white; }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                        to { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="timeline-container fade-in">
            {/* Hidden file input for import */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
            />

            <div className="timeline-header">
                <div>
                    <h2>{t('數據洞察')}</h2>
                    <p>{t('回顧你的情緒旅程與成長點滴。')}</p>
                </div>
                <div className="export-actions-group">
                    <button className="export-btn import" onClick={handleImportClick} title={t('匯入 JSON 備份')}>
                        📥 {t('匯入')}
                    </button>
                    <button className="export-btn primary" onClick={() => setShowExport(true)} title={t('導出記錄')}>
                        <span className="export-icon">{uiIcons.folder}</span> {t('導出')}
                    </button>
                </div>
            </div>

            {/* Import Result Toast */}
            {importResult && (
                <div className={`import-toast ${importResult.success ? 'success' : 'error'}`}>
                    {t(importResult.message)}
                </div>
            )}

            <div ref={listTopRef} className="timeline-list">
                {paginatedLogs.map((log, index) => (
                    <div key={log.timestamp || index} className="timeline-card">
                        <div className="card-top">
                            <span className="card-date">{formatDate(log.timestamp)}</span>
                            <div className="card-actions">
                                <div
                                    className="card-emotion-dot"
                                    style={{ backgroundColor: `var(--color-${log.emotions?.[0]?.quadrant || 'gray'})`, color: `var(--color-${log.emotions?.[0]?.quadrant || 'gray'})` }}
                                ></div>
                                {editingId !== log.timestamp && (
                                    <>
                                        <button className="edit-btn" onClick={() => handleEditStart(log)}>✎</button>
                                        <button className="delete-btn" onClick={() => handleDeleteClick(log.timestamp)}>✕</button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="card-body">
                            <h3 className="card-emotion-name">{(log.emotions || []).map(e => t(e.name)).join('、')}</h3>

                            <div className="card-context">
                                {log.understanding && (
                                    <div className="context-item">
                                        <span className="context-label">{t('事件：')}</span>
                                        <span className="context-value">{t(log.understanding.trigger || '未填寫')}</span>
                                    </div>
                                )}
                                <div className="card-tags">
                                    {log.understanding && (
                                        <>
                                            <span className="mini-tag">#{t(log.understanding.what)}</span>
                                            <span className="mini-tag">#{t(log.understanding.who)}</span>
                                            <span className="mini-tag">#{t(log.understanding.where)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editingId === log.timestamp ? (
                                <div className="edit-area">
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="edit-textarea"
                                        placeholder={t('更新你的感受表達...')}
                                    />
                                    <div className="edit-actions">
                                        <button className="save-btn" onClick={() => handleEditSave(log.timestamp)}>{t('儲存')}</button>
                                        <button className="cancel-btn" onClick={() => setEditingId(null)}>{t('取消')}</button>
                                    </div>
                                </div>
                            ) : (
                                (log.expressing && log.expressing.expression) && (
                                    <div className="card-note">
                                        {t('「')} {t(log.expressing.expression)} {t(' 」')}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 分頁控制 */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        className="page-btn"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        ← {t('上一頁')}
                    </button>
                    <span className="page-info">
                        {currentPage} / {totalPages}
                    </span>
                    <button 
                        className="page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        {t('下一頁')} →
                    </button>
                </div>
            )}

            <style>{`
                .timeline-header { margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: flex-start; }
                .timeline-header h2 { font-size: 1.6rem; margin: 0 0 0.5rem 0; }
                .timeline-header p { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }

                .export-actions-group {
                    display: flex;
                    gap: 8px;
                }

                .export-btn {
                    padding: 8px 16px;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .export-btn.primary {
                    background: var(--text-primary);
                    color: var(--bg-color);
                    border: none;
                }
                .export-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); border-color: var(--text-secondary); }
                .export-btn.primary:hover { filter: brightness(0.9); transform: translateY(-1px); }
                .export-btn.secondary { padding: 8px 12px; opacity: 0.6; }
                .export-btn.secondary:hover { opacity: 1; }
                .export-btn.import { 
                    border-style: dashed; 
                    background: transparent;
                }
                .export-btn.import:hover { 
                    background: rgba(167,183,160,0.15); 
                    border-color: var(--color-green);
                    color: var(--color-green);
                }

                .import-toast {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    border-radius: var(--radius-sm);
                    font-size: 0.9rem;
                    animation: slideUp 0.3s ease;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                .import-toast.success { background: var(--color-green); color: white; }
                .import-toast.error { background: var(--color-red); color: white; }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }

                .timeline-list { display: flex; flex-direction: column; gap: 1.5rem; }
                @media (min-width: 768px) {
                    .timeline-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                }
                .timeline-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.5rem; transition: var(--transition); position: relative; overflow: hidden; }
                .timeline-card:hover { border-color: var(--glass-border); background: rgba(255,255,255,0.02); }
                
                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .card-date { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
                
                .card-actions { display: flex; align-items: center; gap: 12px; }
                .card-emotion-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
                
                .edit-btn, .delete-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    opacity: 0.4;  /* Always visible */
                    transition: var(--transition);
                    padding: 6px;
                    border-radius: 4px;
                }
                .timeline-card:hover .edit-btn, .timeline-card:hover .delete-btn { opacity: 0.7; background: rgba(255,255,255,0.05); }
                .edit-btn:hover, .delete-btn:hover { opacity: 1 !important; }
                .delete-btn:hover { color: var(--color-red) !important; background: rgba(180, 138, 137, 0.15) !important; }
                .edit-btn:hover { color: var(--color-yellow) !important; background: rgba(205, 185, 156, 0.15) !important; }
                
                .card-emotion-name { margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; }
                
                .card-context { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
                .context-item { font-size: 0.85rem; display: flex; gap: 0.5rem; }
                .context-label { color: var(--text-secondary); flex-shrink: 0; }
                .context-value { color: var(--text-primary); }
                
                .card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
                .mini-tag { font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
                
                .card-note { font-size: 0.9rem; color: var(--text-primary); font-style: italic; opacity: 0.9; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); border-left: 2px solid var(--text-secondary); position: relative; }
                
                .edit-area { display: flex; flex-direction: column; gap: 10px; }
                .edit-textarea {
                    width: 100%;
                    min-height: 80px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                    padding: 10px;
                    font-family: inherit;
                    font-size: 0.9rem;
                    resize: vertical;
                }
                .edit-actions { display: flex; gap: 10px; justify-content: flex-end; }
                .save-btn, .cancel-btn {
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: var(--transition);
                }
                .save-btn { background: var(--text-primary); color: var(--bg-color); border: none; }
                .cancel-btn { background: transparent; border: 1px solid var(--glass-border); color: var(--text-secondary); }
                .save-btn:hover { filter: brightness(0.9); }
                .cancel-btn:hover { background: var(--glass-bg); }

                .empty-state { text-align: center; padding: 5rem 2rem; color: var(--text-secondary); }
                .empty-icon { 
                    width: 64px; 
                    height: 64px; 
                    margin: 0 auto 1rem; 
                    color: var(--text-secondary); 
                    opacity: 0.5; 
                }
                .empty-icon svg { width: 100%; height: 100%; }
                .export-icon { width: 16px; height: 16px; display: inline-flex; }
                .export-icon svg { width: 100%; height: 100%; }

                .delete-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }
                .delete-modal {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    padding: 2rem;
                    max-width: 360px;
                    text-align: center;
                    animation: scaleIn 0.2s ease;
                }
                .delete-modal-icon { 
                    width: 48px; 
                    height: 48px; 
                    margin: 0 auto 1rem; 
                    color: var(--color-red); 
                    opacity: 0.8;
                }
                .delete-modal-icon svg { width: 100%; height: 100%; }
                .delete-modal h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
                .delete-modal p { color: var(--text-secondary); font-size: 0.9rem; margin: 0 0 1.5rem 0; }
                .delete-modal-actions { display: flex; gap: 12px; justify-content: center; }
                .delete-confirm-btn, .delete-cancel-btn {
                    padding: 10px 24px;
                    border-radius: var(--radius-sm);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: var(--transition);
                    border: none;
                }
                .delete-confirm-btn {
                    background: var(--color-red);
                    color: white;
                }
                .delete-confirm-btn:hover { filter: brightness(1.1); }
                .delete-cancel-btn {
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    color: var(--text-secondary);
                }
                .delete-cancel-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                /* 分頁樣式 */
                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding: 1rem;
                }
                .page-btn {
                    padding: 0.5rem 1rem;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: var(--transition);
                }
                .page-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.05);
                    border-color: var(--text-secondary);
                }
                .page-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .page-info {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    min-width: 60px;
                    text-align: center;
                }
            `}</style>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="delete-modal-overlay" onClick={handleDeleteCancel}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">{uiIcons.trash}</div>
                        <h3>{t('確定要刪除嗎？')}</h3>
                        <p>{t('這項操作無法復原，記錄將永久移除。')}</p>
                        <div className="delete-modal-actions">
                            <button className="delete-cancel-btn" onClick={handleDeleteCancel}>{t('取消')}</button>
                            <button className="delete-confirm-btn" onClick={handleDeleteConfirm}>{t('確認刪除')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Panel */}
            {showExport && (
                <ExportPanel logs={logs} onClose={() => setShowExport(false)} />
            )}
        </div>
    );
};


export default Timeline;

