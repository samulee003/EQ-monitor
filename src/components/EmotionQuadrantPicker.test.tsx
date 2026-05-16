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

    it('應該用新朋友看得懂的文案引導第一步', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        expect(screen.getByText('今日心情')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '先選一個最像現在的狀態' })).toBeInTheDocument();
        expect(screen.getByText('不用想很準，選接近的就好。等一下阿念會陪你慢慢整理。')).toBeInTheDocument();
        expect(screen.getByText('先不用知道原因，點一格就好')).toBeInTheDocument();
        expect(screen.queryByText(/身體速度與心裡狀態/)).not.toBeInTheDocument();
    });

    it('應該常駐顯示四個狀態名稱與描述', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        expect(screen.getByText('很滿 / 卡住')).toBeInTheDocument();
        expect(screen.getByText('緊繃、焦躁、快爆開')).toBeInTheDocument();
        expect(screen.getByText('很滿 / 順心')).toBeInTheDocument();
        expect(screen.getByText('有勁、期待、被點亮')).toBeInTheDocument();
        expect(screen.getByText('很慢 / 卡住')).toBeInTheDocument();
        expect(screen.getByText('低落、疲累、想躲起來')).toBeInTheDocument();
        expect(screen.getByText('很慢 / 順心')).toBeInTheDocument();
        expect(screen.getByText('安穩、鬆開、剛剛好')).toBeInTheDocument();
    });

    it('應該渲染新的狀態軸標籤', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        expect(screen.getByText('身體很滿')).toBeInTheDocument();
        expect(screen.getByText('身體很慢')).toBeInTheDocument();
        expect(screen.getByText('不太舒服')).toBeInTheDocument();
        expect(screen.getByText('比較順心')).toBeInTheDocument();
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
        fireEvent.click(screen.getByText('用這個狀態開始'));

        expect(onSelectQuadrants).toHaveBeenCalledWith(['red']);
    });

    it('應該禁用確認按鈕當沒有選擇任何象限', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const confirmBtn = screen.getByText('用這個狀態開始');
        expect(confirmBtn).toBeDisabled();
    });

    it('應該支持鍵盤 Enter 選擇象限', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const greenQuadrant = screen.getByLabelText(/綠色狀態區/);
        fireEvent.keyDown(greenQuadrant, { key: 'Enter' });

        expect(greenQuadrant).toHaveClass('active');
    });

    it('應該支持鍵盤 Space 選擇象限', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        const yellowQuadrant = screen.getByLabelText(/黃色狀態區/);
        fireEvent.keyDown(yellowQuadrant, { key: ' ' });

        expect(yellowQuadrant).toHaveClass('active');
    });

    it('選取狀態後應提示下一步會找更準的情緒詞', () => {
        render(<EmotionQuadrantPicker onSelectQuadrants={vi.fn()} />);

        fireEvent.click(screen.getByLabelText(/藍色狀態區/));

        expect(screen.getByText('下一步：幫你找一個更準的情緒詞')).toBeInTheDocument();
    });
});
