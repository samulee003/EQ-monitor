import React, { useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { exportService, ExportResult } from '../services/ExportService';
import { RulerLogEntry } from '../types/RulerTypes';

interface ExportPanelProps {
    logs: RulerLogEntry[];
    onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ logs, onClose }) => {
    const { t } = useLanguage();
    const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'markdown' | 'text'>('csv');
    const [preview, setPreview] = useState<string>('');

    const formats = [
        { id: 'csv', label: 'Excel (CSV)', desc: '適合數據分析', icon: '📊' },
        { id: 'json', label: 'JSON 備份', desc: '完整數據備份', icon: '💾' },
        { id: 'markdown', label: 'Markdown', desc: '可讀性格式', icon: '📝' },
        { id: 'text', label: '純文字', desc: '簡潔文本', icon: '📄' },
    ] as const;

    const handlePreview = () => {
        let result: ExportResult;
        switch (selectedFormat) {
            case 'csv':
                result = exportService.exportToCSV(logs);
                break;
            case 'json':
                result = exportService.exportToJSON(logs);
                break;
            case 'markdown':
                result = exportService.exportToMarkdown(logs);
                break;
            case 'text':
                result = exportService.exportToText(logs);
                break;
        }
        // 只顯示前 1000 字符作為預覽
        setPreview(result.data.substring(0, 1000) + (result.data.length > 1000 ? '\n\n...' : ''));
    };

    const handleExport = () => {
        let result: ExportResult;
        switch (selectedFormat) {
            case 'csv':
                result = exportService.exportToCSV(logs);
                break;
            case 'json':
                result = exportService.exportToJSON(logs);
                break;
            case 'markdown':
                result = exportService.exportToMarkdown(logs);
                break;
            case 'text':
                result = exportService.exportToText(logs);
                break;
        }
        exportService.download(result);
        onClose();
    };

    return (
        <div className="export-panel-overlay" onClick={onClose}>
            <div className="export-panel" onClick={(e) => e.stopPropagation()}>
                <div className="export-panel-header">
                    <h3>📤 {t('導出記錄')}</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="export-stats">
                    {t('共')} {logs.length} {t('條記錄')}
                </div>

                <div className="format-grid">
                    {formats.map((format) => (
                        <button
                            key={format.id}
                            className={`format-option ${selectedFormat === format.id ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedFormat(format.id);
                                setPreview('');
                            }}
                        >
                            <span className="format-icon">{format.icon}</span>
                            <div className="format-info">
                                <span className="format-label">{format.label}</span>
                                <span className="format-desc">{format.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {preview && (
                    <div className="preview-section">
                        <label>{t('預覽')}</label>
                        <pre className="preview-content">{preview}</pre>
                    </div>
                )}

                <div className="export-actions">
                    <button className="preview-btn" onClick={handlePreview}>
                        {preview ? t('更新預覽') : t('預覽')}
                    </button>
                    <button className="export-btn primary" onClick={handleExport}>
                        {t('導出')}
                    </button>
                </div>
            </div>

            <style>{`
                .export-panel-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                    padding: 1rem;
                }

                .export-panel {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    width: 100%;
                    max-width: 480px;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }

                .export-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--glass-border);
                }

                .export-panel-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: var(--glass-bg);
                    color: var(--text-primary);
                }

                .export-stats {
                    padding: 1rem 1.5rem;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    border-bottom: 1px solid var(--glass-border);
                }

                .format-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                    padding: 1.5rem;
                }

                .format-option {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .format-option:hover {
                    border-color: var(--text-secondary);
                    transform: translateY(-2px);
                }

                .format-option.active {
                    border-color: var(--color-yellow);
                    background: hsla(0, 0%, 100%, 0.05);
                }

                .format-icon {
                    font-size: 1.5rem;
                }

                .format-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .format-label {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .format-desc {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .preview-section {
                    padding: 0 1.5rem 1rem;
                }

                .preview-section label {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .preview-content {
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-sm);
                    padding: 1rem;
                    font-family: monospace;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    max-height: 150px;
                    overflow: auto;
                    white-space: pre-wrap;
                    word-break: break-all;
                    margin: 0;
                }

                .export-actions {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem 1.5rem 1.5rem;
                    border-top: 1px solid var(--glass-border);
                }

                .export-actions button {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: var(--radius-sm);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .preview-btn {
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border) !important;
                    color: var(--text-primary);
                }

                .preview-btn:hover {
                    background: hsla(0, 0%, 100%, 0.05);
                }

                .export-btn.primary {
                    background: var(--text-primary);
                    color: var(--bg-color);
                }

                .export-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-luxe);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .format-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default ExportPanel;
