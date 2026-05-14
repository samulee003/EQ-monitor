import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Timeline from './Timeline';
import { dataAdapter } from '../adapters';
import { useAppStore } from '../stores/appStore';
import { type RulerLogEntry } from '../types/RulerTypes';
import { type Quadrant } from '../data/emotionData';

const mocks = vi.hoisted(() => ({
    setView: vi.fn()
}));

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (text: string) => text })
}));

vi.mock('../adapters', () => ({
    dataAdapter: {
        logs: {
            export: vi.fn(),
            update: vi.fn(),
            import: vi.fn(),
            delete: vi.fn()
        }
    }
}));

vi.mock('../stores/appStore', () => ({
    useAppStore: {
        getState: () => ({ setView: mocks.setView })
    }
}));

const makeLog = (id: string, quadrant: Quadrant, expression: string): RulerLogEntry => ({
    id,
    emotions: [{ id: `${id}-emotion`, name: `${quadrant}情緒`, quadrant, energy: 3, pleasantness: 3 }],
    intensity: 6,
    bodyScan: null,
    understanding: {
        trigger: `${quadrant}事件`,
        message: '',
        what: `${quadrant}事情`,
        who: '我',
        where: '家裡',
        need: null
    },
    expressing: {
        expression,
        prompt: '',
        mode: 'write'
    },
    regulating: null,
    postMood: '',
    timestamp: `2026-05-${String(Number(id.replace(/\D/g, '') || 1)).padStart(2, '0')}T10:00:00.000Z`
});

const renderLoadedTimeline = async () => {
    render(<Timeline />);
};

describe('Timeline', () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn();
        vi.mocked(dataAdapter.logs.import).mockResolvedValue({
            success: true,
            imported: 0,
            skipped: 0,
            message: '完成'
        });
        vi.mocked(dataAdapter.logs.delete).mockResolvedValue();
        mocks.setView.mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('點高能低悅 chip 後只顯示紅色紀錄並回到第 1 頁', async () => {
        const yellowLogs = Array.from({ length: 11 }, (_, index) => makeLog(`yellow-${index + 1}`, 'yellow', `黃色表達 ${index + 1}`));
        vi.mocked(dataAdapter.logs.export).mockResolvedValue([
            ...yellowLogs,
            makeLog('red-1', 'red', '紅色表達')
        ]);

        await renderLoadedTimeline();
        await screen.findByTestId('timeline-entry-yellow-1');

        fireEvent.click(screen.getByRole('button', { name: /下一頁/ }));
        expect(screen.getByText('11-12')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('timeline-chip-red'));

        expect(screen.getByTestId('timeline-chip-red')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('timeline-entry-red-1')).toHaveTextContent('紅色表達');
        expect(screen.queryByTestId('timeline-entry-yellow-1')).not.toBeInTheDocument();
        expect(screen.getByText('1-1')).toBeInTheDocument();
    }, 15_000);

    it('編輯一筆紀錄並儲存後，畫面立即顯示新的表達內容', async () => {
        let logs = [makeLog('red-1', 'red', '原本的表達')];
        vi.mocked(dataAdapter.logs.export).mockImplementation(async () => logs);
        vi.mocked(dataAdapter.logs.update).mockImplementation(async (id, changes) => {
            const updatedLog = { ...logs.find((log) => log.id === id), ...changes } as RulerLogEntry;
            logs = logs.map((log) => (log.id === id ? updatedLog : log));
            return updatedLog;
        });

        await renderLoadedTimeline();
        await screen.findByText(/原本的表達/);

        const entry = screen.getByTestId('timeline-entry-red-1');
        fireEvent.click(within(entry).getByRole('button', { name: '編輯' }));
        fireEvent.change(screen.getByPlaceholderText('更新你的感受表達...'), {
            target: { value: '更新後的表達' }
        });
        fireEvent.click(screen.getByRole('button', { name: '儲存' }));

        await waitFor(() => expect(screen.getByText(/更新後的表達/)).toBeInTheDocument());
        expect(screen.queryByText(/原本的表達/)).not.toBeInTheDocument();
    });

    it('空狀態點開始第一筆紀錄會導回今日心情', async () => {
        vi.mocked(dataAdapter.logs.export).mockResolvedValue([]);

        await renderLoadedTimeline();
        await screen.findByText('第一筆情緒紀錄，會為之後的洞察打開入口。');

        fireEvent.click(screen.getByTestId('timeline-empty-start'));

        expect(useAppStore.getState().setView).toHaveBeenCalledWith('home');
    });
});
