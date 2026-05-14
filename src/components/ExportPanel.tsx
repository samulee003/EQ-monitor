import React, { useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { exportService, type ExportResult } from '../services/ExportService';
import { type RulerLogEntry } from '../types/RulerTypes';
import './ExportPanel.css';

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
                    <button className="close-btn" aria-label="關閉" onClick={onClose}>✕</button>
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

        </div>
    );
};

export default ExportPanel;
