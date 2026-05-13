import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Timeline from './Timeline';
import { type RulerLogEntry } from '../types/RulerTypes';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

const { mockExport, mockUpdate, mockDelete, mockImport } = vi.hoisted(() => ({
    mockExport: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
    mockImport: vi.fn(),
}));

vi.mock('../adapters', () => ({
    dataAdapter: {
        logs: {
            export: mockExport,
            update: mockUpdate,
            delete: mockDelete,
            import: mockImport,
        },
    },
}));

const redLog: RulerLogEntry = {
    id: 'red-log',
    emotions: [{ id: 'angry', name: '生氣的', quadrant: 'red', energy: 3, pleasantness: 2 }],
    intensity: 7,
    bodyScan: null,
    understanding: null,
    expressing: null,
    regulating: null,
    postMood: '',
    timestamp: '2026-05-13T09:00:00.000Z',
    isFullFlow: false,
};

const greenLog: RulerLogEntry = {
    id: 'green-log',
    emotions: [{ id: 'at_ease', name: '自在的', quadrant: 'green', energy: 3, pleasantness: 4 }],
    intensity: 4,
    bodyScan: null,
    understanding: null,
    expressing: null,
    regulating: null,
    postMood: '',
    timestamp: '2026-05-13T10:00:00.000Z',
    isFullFlow: false,
};

describe('Timeline', () => {
    let logs: RulerLogEntry[];

    beforeEach(() => {
        logs = [
            { ...greenLog, emotions: [...greenLog.emotions] },
            { ...redLog, emotions: [...redLog.emotions] },
        ];
        mockExport.mockImplementation(async () => logs);
        mockUpdate.mockImplementation(async (id: string, data: Partial<RulerLogEntry>) => {
            logs = logs.map((log) => log.id === id ? { ...log, ...data } : log);
            return logs.find((log) => log.id === id);
        });
        mockDelete.mockResolvedValue(undefined);
        mockImport.mockResolvedValue({ success: true, imported: 0, skipped: 0, message: '成功匯入 0 筆記錄' });
        vi.clearAllMocks();
    });

    it('點擊象限摘要時應該篩選對應紀錄', async () => {
        render(<Timeline />);

        expect(await screen.findByText('自在的')).toBeInTheDocument();
        expect(screen.getByText('生氣的')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /高能低悅/ }));

        expect(screen.getByText('生氣的')).toBeInTheDocument();
        expect(screen.queryByText('自在的')).not.toBeInTheDocument();
    });

    it('編輯表達內容後應該在同頁立即更新', async () => {
        render(<Timeline />);

        expect(await screen.findByText('自在的')).toBeInTheDocument();

        const editButtons = screen.getAllByRole('button', { name: '編輯' });
        fireEvent.click(editButtons[0]);
        fireEvent.change(screen.getByPlaceholderText('更新你的感受表達...'), {
            target: { value: '我現在比較安定，也知道自己需要休息。' },
        });
        fireEvent.click(screen.getByRole('button', { name: '儲存' }));

        await waitFor(() => {
            expect(screen.getByText(/我現在比較安定，也知道自己需要休息/)).toBeInTheDocument();
        });
        expect(screen.queryByText('這筆紀錄尚未寫下表達內容，但情緒與情境已被保留下來。')).toBeInTheDocument();
    });
});
