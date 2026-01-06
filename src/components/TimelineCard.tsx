import React, { useState, useEffect } from 'react';

interface TimelineCardProps {
    log: any;
    isEditing: boolean;
    onEditStart: (log: any) => void;
    onEditSave: (id: string, text: string) => void;
    onEditCancel: () => void;
    onDelete: (id: string) => void;
    formatDate: (iso: string) => string;
}

const TimelineCard: React.FC<TimelineCardProps> = React.memo(({
    log,
    isEditing,
    onEditStart,
    onEditSave,
    onEditCancel,
    onDelete,
    formatDate
}) => {
    const [draftText, setDraftText] = useState('');

    // Initialize draft text when entering edit mode
    useEffect(() => {
        if (isEditing) {
            setDraftText(log.expressing?.expression || '');
        }
    }, [isEditing, log.expressing?.expression]);

    return (
        <div className="timeline-card">
            <div className="card-top">
                <span className="card-date">{formatDate(log.timestamp)}</span>
                <div className="card-actions">
                    <div
                        className="card-emotion-dot"
                        style={{ backgroundColor: `var(--color-${log.emotion.quadrant})`, color: `var(--color-${log.emotion.quadrant})` }}
                    ></div>
                    {!isEditing && (
                        <>
                            <button className="edit-btn" onClick={() => onEditStart(log)}>✎</button>
                            <button className="delete-btn" onClick={() => onDelete(log.timestamp)}>✕</button>
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

                {isEditing ? (
                    <div className="edit-area">
                        <textarea
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            className="edit-textarea"
                            placeholder="更新你的感受表達..."
                        />
                        <div className="edit-actions">
                            <button className="save-btn" onClick={() => onEditSave(log.timestamp, draftText)}>儲存</button>
                            <button className="cancel-btn" onClick={onEditCancel}>取消</button>
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
    );
});

export default TimelineCard;
