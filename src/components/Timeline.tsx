import { useEffect, useState } from 'react';
import { uiIcons } from './icons/SvgIcons';
const Timeline: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        loadLogs();
    }, []);

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
            const updated = existing.filter((log: any) => log.timestamp !== deleteConfirmId);
            localStorage.setItem('feelings_logs', JSON.stringify(updated));
            setLogs(updated);
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmId(null);
    };

    const handleEditStart = (log: any) => {
        setEditingId(log.timestamp);
        setEditText(log.expressing?.expression || '');
    };

    const handleEditSave = (timestamp: string) => {
        const existing = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        const updated = existing.map((log: any) => {
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
            '時間 (Time)',
            '情緒 (Emotion)',
            '能量區塊 (Quadrant)',
            '強度 (Intensity)',
            '身體部位 (Body Location)',
            '感官感受 (Sensation)',
            '觸發事件 (Trigger)',
            '關聯對象 (Who)',
            '地點 (Where)',
            '心理需求 (Need)',
            '表達內容 (Expression)',
            '調節策略 (Strategies)',
            '調節後心情 (Post Mood)'
        ];

        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString('zh-TW'),
            log.emotion.name,
            log.emotion.quadrant === 'red' ? '高能量/不愉快' :
                log.emotion.quadrant === 'yellow' ? '高能量/愉快' :
                    log.emotion.quadrant === 'blue' ? '低能量/不愉快' : '低能量/愉快',
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
        ]);

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

    if (logs.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">{uiIcons.leaf}</div>
                <p>尚無記錄，開始你的第一次情緒觀察吧。</p>
            </div>
        );
    }

    return (
        <div className="timeline-container fade-in">
            <div className="timeline-header">
                <div>
                    <h2>數據洞察</h2>
                    <p>回顧你的情緒旅程與成長點滴。</p>
                </div>
                <div className="export-actions-group">
                    <button className="export-btn primary" onClick={handleExportCSV} title="導出 Excel/CSV 表格">
                        <span className="export-icon">{uiIcons.folder}</span> 導出 Excel
                    </button>
                    <button className="export-btn secondary" onClick={handleExportJSON} title="導出 JSON 備份">
                        備份
                    </button>
                </div>
            </div>

            <div className="timeline-list">
                {logs.map((log, index) => (
                    <div key={log.timestamp || index} className="timeline-card">
                        <div className="card-top">
                            <span className="card-date">{formatDate(log.timestamp)}</span>
                            <div className="card-actions">
                                <div
                                    className="card-emotion-dot"
                                    style={{ backgroundColor: `var(--color-${log.emotion.quadrant})`, color: `var(--color-${log.emotion.quadrant})` }}
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
                            <h3 className="card-emotion-name">{log.emotion.name}</h3>

                            <div className="card-context">
                                {log.understanding && (
                                    <div className="context-item">
                                        <span className="context-label">事件：</span>
                                        <span className="context-value">{log.understanding.trigger || '未填寫'}</span>
                                    </div>
                                )}
                                <div className="card-tags">
                                    {log.understanding && (
                                        <>
                                            <span className="mini-tag">#{log.understanding.what}</span>
                                            <span className="mini-tag">#{log.understanding.who}</span>
                                            <span className="mini-tag">#{log.understanding.where}</span>
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
                                        placeholder="更新你的感受表達..."
                                    />
                                    <div className="edit-actions">
                                        <button className="save-btn" onClick={() => handleEditSave(log.timestamp)}>儲存</button>
                                        <button className="cancel-btn" onClick={() => setEditingId(null)}>取消</button>
                                    </div>
                                </div>
                            ) : (
                                (log.expressing && log.expressing.expression) && (
                                    <div className="card-note">
                                        「 {log.expressing.expression} 」
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

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

                .timeline-list { display: flex; flex-direction: column; gap: 1.5rem; }
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
            `}</style>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="delete-modal-overlay" onClick={handleDeleteCancel}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">{uiIcons.trash}</div>
                        <h3>確定要刪除嗎？</h3>
                        <p>這項操作無法復原，記錄將永久移除。</p>
                        <div className="delete-modal-actions">
                            <button className="delete-cancel-btn" onClick={handleDeleteCancel}>取消</button>
                            <button className="delete-confirm-btn" onClick={handleDeleteConfirm}>確認刪除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Timeline;

