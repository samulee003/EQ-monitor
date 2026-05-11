import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoodMeter from './MoodMeter';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

describe('MoodMeter', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('應該渲染四個象限', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        expect(screen.getByLabelText(/紅色象限/)).toBeInTheDocument();
        expect(screen.getByLabelText(/黃色象限/)).toBeInTheDocument();
        expect(screen.getByLabelText(/藍色象限/)).toBeInTheDocument();
        expect(screen.getByLabelText(/綠色象限/)).toBeInTheDocument();
    });

    it('應該渲染軸標籤', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        expect(screen.getByText('高能量')).toBeInTheDocument();
        expect(screen.getByText('低能量')).toBeInTheDocument();
        expect(screen.getByText('不愉快')).toBeInTheDocument();
        expect(screen.getByText('愉快')).toBeInTheDocument();
    });

    it('應該處理單一象限點擊並高亮', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        const redQuadrant = screen.getByLabelText(/紅色象限/);
        fireEvent.click(redQuadrant);

        expect(redQuadrant).toHaveClass('active');
        expect(redQuadrant).toHaveAttribute('aria-pressed', 'true');
    });

    it('應該處理多選象限', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        const redQuadrant = screen.getByLabelText(/紅色象限/);
        const blueQuadrant = screen.getByLabelText(/藍色象限/);

        fireEvent.click(redQuadrant);
        fireEvent.click(blueQuadrant);

        expect(redQuadrant).toHaveClass('active');
        expect(blueQuadrant).toHaveClass('active');
    });

    it('應該取消已選象限再次點擊', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        const redQuadrant = screen.getByLabelText(/紅色象限/);
        fireEvent.click(redQuadrant);
        fireEvent.click(redQuadrant);

        expect(redQuadrant).not.toHaveClass('active');
        expect(redQuadrant).toHaveAttribute('aria-pressed', 'false');
    });

    it('應該觸發 onSelectQuadrants 當確認按鈕點擊', () => {
        const onSelectQuadrants = vi.fn();
        render(<MoodMeter onSelectQuadrants={onSelectQuadrants} />);

        fireEvent.click(screen.getByLabelText(/紅色象限/));
        fireEvent.click(screen.getByText('確認選擇'));

        expect(onSelectQuadrants).toHaveBeenCalledWith(['red']);
    });

    it('應該禁用確認按鈕當沒有選擇任何象限', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        const confirmBtn = screen.getByText('確認選擇');
        expect(confirmBtn).toBeDisabled();
    });

    it('應該支持鍵盤 Enter 選擇象限', () => {
        render(<MoodMeter onSelectQuadrants={vi.fn()} />);

        const greenQuadrant = screen.getByLabelText(/綠色象限/);
        fireEvent.keyDown(greenQuadrant, { key: 'Enter' });

        expect(greenQuadrant).toHaveClass('active');
    });
});
