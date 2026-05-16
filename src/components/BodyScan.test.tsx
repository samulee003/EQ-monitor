import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BodyScan from './BodyScan';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

vi.mock('../services/VoiceGuideService', () => ({
    voiceGuideService: {
        isSupported: vi.fn(() => true),
        play: vi.fn(),
        stop: vi.fn(),
        getStatus: vi.fn(() => ({ isPlaying: false, currentSection: 0, totalSections: 21 })),
    },
    bodyScanScript: {
        id: 'body-scan-basic',
        title: '正念身體掃描',
        duration: 180,
        sections: Array.from({ length: 21 }, (_, i) => ({ text: `section ${i}`, pauseAfter: 2 })),
    },
}));

const { voiceGuideService } = await import('../services/VoiceGuideService');

describe('BodyScan', () => {
    const mockOnComplete = vi.fn();
    const mockOnBack = vi.fn();

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('應該渲染身體部位選項', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        expect(screen.getByText('頭部')).toBeInTheDocument();
        expect(screen.getByText('喉嚨')).toBeInTheDocument();
        expect(screen.getByText('胸口')).toBeInTheDocument();
        expect(screen.getByText('腹部')).toBeInTheDocument();
        expect(screen.getByText('肩膀')).toBeInTheDocument();
        expect(screen.getByText('全身')).toBeInTheDocument();
    });

    it('應該渲染感覺選項', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        expect(screen.getByText('緊繃')).toBeInTheDocument();
        expect(screen.getByText('灼熱')).toBeInTheDocument();
        expect(screen.getByText('心跳感')).toBeInTheDocument();
        expect(screen.getByText('放鬆')).toBeInTheDocument();
    });

    it('應該處理身體部位選擇', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        const chestBtn = screen.getByText('胸口').closest('button');
        fireEvent.click(chestBtn!);

        expect(chestBtn!).toHaveAttribute('aria-pressed', 'true');
    });

    it('應該處理多選感覺', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        const tensionBtn = screen.getByText('緊繃').closest('button');
        const heatBtn = screen.getByText('灼熱').closest('button');

        fireEvent.click(tensionBtn!);
        fireEvent.click(heatBtn!);

        expect(tensionBtn!).toHaveAttribute('aria-pressed', 'true');
        expect(heatBtn!).toHaveAttribute('aria-pressed', 'true');
    });

    it('應該觸發 onComplete 當選擇後點擊完成', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        fireEvent.click(screen.getByText('胸口').closest('button')!);
        fireEvent.click(screen.getByText('緊繃').closest('button')!);
        fireEvent.click(screen.getByText('進入情緒標記'));

        expect(mockOnComplete).toHaveBeenCalledWith({ location: '胸口', sensation: '緊繃' });
    });

    it('應該禁用完成按鈕當沒有選擇部位', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        const completeBtn = screen.getByText('進入情緒標記');
        expect(completeBtn).toBeDisabled();
    });

    it('應該禁用完成按鈕當沒有選擇感覺', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        fireEvent.click(screen.getByText('胸口').closest('button')!);

        const completeBtn = screen.getByText('進入情緒標記');
        expect(completeBtn).toBeDisabled();
    });

    it('應該觸發 onBack 當點擊返回', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        fireEvent.click(screen.getByText('← 返回'));
        expect(mockOnBack).toHaveBeenCalled();
    });

    it('應該顯示警告提示並可關閉', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        expect(screen.getByRole('note')).toBeInTheDocument();

        fireEvent.click(screen.getByText('我了解，繼續'));
        expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });

    it('身體內觀不適合時可改做外在接地再進入情緒標記', () => {
        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        fireEvent.click(screen.getByText('改做外在接地'));

        expect(screen.getByRole('region', { name: '外在接地練習' })).toBeInTheDocument();
        expect(screen.getByText('看見 5 個物品')).toBeInTheDocument();
        expect(screen.getByText('聽見 3 種聲音')).toBeInTheDocument();

        fireEvent.click(screen.getByText('用外在接地進入情緒標記'));

        expect(mockOnComplete).toHaveBeenCalledWith({
            location: '外在環境',
            sensation: '五感接地：看見 5 個物品、聽見 3 種聲音、感覺雙腳踩地',
        });
    });

    it('應該在瀏覽器不支持語音時禁用播放按鈕', () => {
        (voiceGuideService.isSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);

        render(<BodyScan quadrant="red" onComplete={mockOnComplete} onBack={mockOnBack} />);

        const playBtn = screen.getByText('▶').closest('button');
        expect(playBtn).toBeDisabled();
    });
});
