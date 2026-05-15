import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmotionGrid from './EmotionGrid';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

vi.mock('../adapters', () => ({
    settingsStore: {
        getUserRole: vi.fn(() => 'user'),
    },
}));

const { settingsStore } = await import('../adapters');

describe('EmotionGrid', () => {
    const mockOnSelect = vi.fn();
    const mockOnBack = vi.fn();

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('應該根據象限渲染情緒氣泡', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('憤怒的')).toBeInTheDocument();
        expect(screen.getByText('生氣的')).toBeInTheDocument();
        expect(screen.queryByText('開心的')).not.toBeInTheDocument();
    });

    it('應該根據多個象限渲染情緒', () => {
        render(
            <EmotionGrid
                quadrants={['red', 'yellow']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('憤怒的')).toBeInTheDocument();
        expect(screen.getByText('開心的')).toBeInTheDocument();
    });

    it('應該處理情緒多選', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        const angryBtn = screen.getByText('憤怒的');
        const furiousBtn = screen.getByText('暴怒的');

        fireEvent.click(angryBtn);
        fireEvent.click(furiousBtn);

        expect(angryBtn).toHaveClass('active');
        expect(furiousBtn).toHaveClass('active');
    });

    it('應該取消已選情緒再次點擊', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        const angryBtn = screen.getByText('憤怒的');
        fireEvent.click(angryBtn);
        fireEvent.click(angryBtn);

        expect(angryBtn).not.toHaveClass('active');
    });

    it('應該進入強度步驟當點擊下一步', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('憤怒的'));
        fireEvent.click(screen.getByText('下一步'));

        expect(screen.getByText('命名感覺與強度')).toBeInTheDocument();
        expect(screen.getByText('這些感覺目前有多強烈？')).toBeInTheDocument();
    });

    it('應該返回情緒選擇從強度步驟', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('憤怒的'));
        fireEvent.click(screen.getByText('下一步'));
        fireEvent.click(screen.getByText('← 重新選擇'));

        expect(screen.getByText('精確標記你的感受')).toBeInTheDocument();
    });

    it('應該觸發 onSelectEmotions 當確認強度', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('憤怒的'));
        fireEvent.click(screen.getByText('下一步'));
        fireEvent.click(screen.getByText('確認並前往下一步'));

        expect(mockOnSelect).toHaveBeenCalledOnce();
        expect(mockOnSelect.mock.calls[0][0]).toHaveLength(1);
        expect(mockOnSelect.mock.calls[0][0][0].id).toBe('enraged');
    });

    it('應該觸發 onBack 當點擊返回', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('← 返回'));
        expect(mockOnBack).toHaveBeenCalled();
    });

    it('應該禁用下一步按鈕當沒有選擇情緒', () => {
        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        const nextBtn = screen.getByText('下一步');
        expect(nextBtn).toBeDisabled();
    });

    it('應該渲染親職專屬情緒當角色為 parent', () => {
        (settingsStore.getUserRole as ReturnType<typeof vi.fn>).mockReturnValue('parent');

        render(
            <EmotionGrid
                quadrants={['red']}
                onSelectEmotions={mockOnSelect}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('想逃離的')).toBeInTheDocument();
        expect(screen.getByText('抓狂的')).toBeInTheDocument();
    });
});
