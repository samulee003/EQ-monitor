import { RulerLogEntry } from '../types/RulerTypes';

/**
 * ExportService - 數據導出服務
 * 
 * 支持多種格式導出情緒記錄：
 * - CSV (Excel)
 * - JSON (備份)
 * - Markdown (可讀格式)
 * - PDF (簡易文本)
 */

export interface ExportResult {
    success: boolean;
    data: string;
    filename: string;
    mimeType: string;
}

class ExportService {
    /**
     * 導出為 CSV 格式 (Excel 兼容)
     */
    exportToCSV(logs: RulerLogEntry[]): ExportResult {
        const headers = [
            '時間',
            '情緒',
            '象限',
            '強度',
            '身體部位',
            '感官感受',
            '觸發事件',
            '對象',
            '地點',
            '心理需求',
            '表達內容',
            '調節策略',
            '調節後心情'
        ];

        const rows = logs.map(log => {
            const emotion = log.emotions?.[0];
            return [
                new Date(log.timestamp).toLocaleString('zh-TW'),
                emotion?.name || '',
                this.getQuadrantLabel(emotion?.quadrant),
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
        
        return {
            success: true,
            data: BOM + csvContent,
            filename: `今心-情緒記錄-${new Date().toISOString().split('T')[0]}.csv`,
            mimeType: 'text/csv;charset=utf-8;'
        };
    }

    /**
     * 導出為 JSON 格式 (完整備份)
     */
    exportToJSON(logs: RulerLogEntry[]): ExportResult {
        return {
            success: true,
            data: JSON.stringify(logs, null, 2),
            filename: `今心-備份-${new Date().toISOString().split('T')[0]}.json`,
            mimeType: 'application/json'
        };
    }

    /**
     * 導出為 Markdown 格式 (可讀格式)
     */
    exportToMarkdown(logs: RulerLogEntry[]): ExportResult {
        const title = `# 今心情緒日誌\n\n導出日期：${new Date().toLocaleDateString('zh-TW')}\n\n---\n\n`;
        
        const content = logs.map((log, index) => {
            const emotion = log.emotions?.[0];
            const date = new Date(log.timestamp).toLocaleString('zh-TW');
            const quadrant = emotion?.quadrant || '';
            const quadrantEmoji = {
                red: '🔴',
                yellow: '🟡',
                blue: '🔵',
                green: '🟢'
            }[quadrant] || '⚪';

            let md = `## ${index + 1}. ${quadrantEmoji} ${emotion?.name || '未知情緒'}\n\n`;
            md += `**時間：** ${date}\n\n`;
            md += `**強度：** ${log.intensity}/10\n\n`;

            if (log.bodyScan?.location) {
                md += `**身體感受：** ${log.bodyScan.location} - ${log.bodyScan.sensation}\n\n`;
            }

            if (log.understanding?.trigger) {
                md += `**觸發事件：** ${log.understanding.trigger}\n\n`;
                md += `**情境：** ${log.understanding.what} / ${log.understanding.who} / ${log.understanding.where}\n\n`;
                if (log.understanding.need) {
                    md += `**心理需求：** ${log.understanding.need}\n\n`;
                }
            }

            if (log.expressing?.expression) {
                md += `**心情筆記：**\n> ${log.expressing.expression}\n\n`;
            }

            if (log.regulating?.selectedStrategies?.length) {
                md += `**調節策略：** ${log.regulating.selectedStrategies.join(', ')}\n\n`;
            }

            if (log.postMood) {
                md += `**調節後：** ${log.postMood}\n\n`;
            }

            md += `---\n\n`;
            return md;
        }).join('');

        return {
            success: true,
            data: title + content,
            filename: `今心-情緒日誌-${new Date().toISOString().split('T')[0]}.md`,
            mimeType: 'text/markdown;charset=utf-8;'
        };
    }

    /**
     * 導出為純文本格式
     */
    exportToText(logs: RulerLogEntry[]): ExportResult {
        const title = `今心情緒日誌 - ${new Date().toLocaleDateString('zh-TW')}\n${'='.repeat(40)}\n\n`;
        
        const content = logs.map((log, index) => {
            const emotion = log.emotions?.[0];
            const date = new Date(log.timestamp).toLocaleString('zh-TW');
            
            let text = `[${index + 1}] ${emotion?.name || '未知情緒'} (${date})\n`;
            text += `    強度: ${log.intensity}/10`;
            
            if (log.bodyScan?.location) {
                text += ` | 身體: ${log.bodyScan.location}`;
            }
            
            text += '\n';
            
            if (log.understanding?.trigger) {
                text += `    事件: ${log.understanding.trigger}\n`;
            }
            
            if (log.expressing?.expression) {
                const shortExpr = log.expressing.expression.substring(0, 50);
                text += `    筆記: ${shortExpr}${log.expressing.expression.length > 50 ? '...' : ''}\n`;
            }
            
            return text + '\n';
        }).join('');

        return {
            success: true,
            data: title + content,
            filename: `今心-情緒記錄-${new Date().toISOString().split('T')[0]}.txt`,
            mimeType: 'text/plain;charset=utf-8;'
        };
    }

    /**
     * 執行下載
     */
    download(result: ExportResult): void {
        const blob = new Blob([result.data], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private getQuadrantLabel(quadrant?: string): string {
        const labels: Record<string, string> = {
            red: '高能量/不愉快',
            yellow: '高能量/愉快',
            blue: '低能量/不愉快',
            green: '低能量/愉快'
        };
        return labels[quadrant || ''] || '';
    }
}

export const exportService = new ExportService();
export default exportService;
