import { useEffect, useState } from 'react';

const Timeline: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = () => {
        const data = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        setLogs(data);
    };

    const handleDelete = (timestamp: string) => {
        if (window.confirm('確定要刪除這筆記錄嗎？這項操作無法復原。')) {
            const existing = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
            const updated = existing.filter((log: any) => log.timestamp !== timestamp);
            localStorage.setItem('feelings_logs', JSON.stringify(updated));
            setLogs(updated);
        }
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

    const handleExport = () => {
        const data = JSON.stringify(logs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imxin-logs-${new Date().toISOString().split('T')[0]}.json`;
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
                <div className="empty-icon">🍃</div>
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
                <button className="export-btn" onClick={handleExport} title="導出 JSON 數據">
                    📁 導出數據
                </button>
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
                                        <button className="delete-btn" onClick={() => handleDelete(log.timestamp)}>✕</button>
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
                .export-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); border-color: var(--text-secondary); }

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
                    font-size: 0.8rem;
                    cursor: pointer;
                    opacity: 0;
                    transition: var(--transition);
                    padding: 4px;
                }
                .timeline-card:hover .edit-btn, .timeline-card:hover .delete-btn { opacity: 0.6; }
                .edit-btn:hover, .delete-btn:hover { opacity: 1 !important; }
                .delete-btn:hover { color: var(--color-red) !important; }
                .edit-btn:hover { color: var(--color-yellow) !important; }
                
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
                .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
            `}</style>
        </div>
    );
};


export default Timeline;

