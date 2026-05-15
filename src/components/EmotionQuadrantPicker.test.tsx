import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmotionQuadrantPicker from './EmotionQuadrantPicker';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

describe('EmotionQuadrantPicker', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('應該渲染四個狀態區', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        expect(screen.getByLabelText(/紅色狀態區/)).toBeInTheDocument();
        expect(screen.getByLabelText(/黃色狀態區/)).toBeInTheDocument();
        expect(screen.getByLabelText(/藍色狀態區/)).toBeInTheDocument();
        expect(screen.getByLabelText(/綠色狀態區/)).toBeInTheDocument();
    });

    it('應該渲染軸標籤', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        expect(screen.getByText('很滿')).toBeInTheDocument();
        expect(screen.getByText('很慢')).toBeInTheDocument();
        expect(screen.getByText('卡住')).toBeInTheDocument();
        expect(screen.getByText('順心')).toBeInTheDocument();
    });

    it('應該處理單一象限點擊並高亮', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const redQuadrant = screen.getByLabelText(/紅色狀態區/);
        fireEvent.click(redQuadrant);

        expect(redQuadrant).toHaveClass('active');
        expect(redQuadrant).toHaveAttribute('aria-pressed', 'true');
    });

    it('應該處理多選象限', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const redQuadrant = screen.getByLabelText(/紅色狀態區/);
        const blueQuadrant = screen.getByLabelText(/藍色狀態區/);

        fireEvent.click(redQuadrant);
        fireEvent.click(blueQuadrant);

        expect(redQuadrant).toHaveClass('active');
        expect(blueQuadrant).toHaveClass('active');
    });

    it('應該取消已選象限再次點擊', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const redQuadrant = screen.getByLabelText(/紅色狀態區/);
        fireEvent.click(redQuadrant);
        fireEvent.click(redQuadrant);

        expect(redQuadrant).not.toHaveClass('active');
        expect(redQuadrant).toHaveAttribute('aria-pressed', 'false');
    });

    it('應該觸發 onSelectQuadrants 當確認按鈕點擊', () => {
        const onSelectQuadrants = vi.fn();
        render(<EmotionQuadrantPicker onSelectQuadrants={onSelectQuadrants} />);

        fireEvent.click(screen.getByLabelText(/紅色狀態區/));
        fireEvent.click(screen.getByText('確認選擇'));

        expect(onSelectQuadrants).toHaveBeenCalledWith(['red']);
    });

    it('應該禁用確認按鈕當沒有選擇任何象限', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const confirmBtn = screen.getByText('確認選擇');
        expect(confirmBtn).toBeDisabled();
    });

    it('應該支持鍵盤 Enter 選擇象限', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const greenQuadrant = screen.getByLabelText(/綠色狀態區/);
        fireEvent.keyDown(greenQuadrant, { key: 'Enter' });

        expect(greenQuadrant).toHaveClass('active');
    });
});
