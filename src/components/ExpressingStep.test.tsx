import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ExpressingStep from './ExpressingStep';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

vi.mock('./VoiceRecorder', () => ({
    default: ({ onTranscription }: { onTranscription?: (text: string) => void }) => (
        <button onClick={() => onTranscription?.('語音轉錄文字')}>🎙️</button>
    ),
}));

describe('ExpressingStep', () => {
    const mockEmotion = { id: 'angry', name: '生氣的', quadrant: 'red' as const, energy: 3, pleasantness: 3 };
    const mockOnComplete = vi.fn();
    const mockOnBack = vi.fn();

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('應該渲染輸入區域與模式選擇', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('心情書信', { selector: '.mode-label' })).toBeInTheDocument();
        expect(screen.getByText('情緒碎紙機', { selector: '.mode-label' })).toBeInTheDocument();
        expect(screen.getByText('自由書寫', { selector: '.mode-label' })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('應該處理文字輸入', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '我今天很沮喪' } });

        expect(textarea).toHaveValue('我今天很沮喪');
    });

    it('應該觸發 onComplete 當點擊下一步', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '測試內容' } });
        fireEvent.click(screen.getByText('下一步：調節'));

        expect(mockOnComplete).toHaveBeenCalledWith({
            expression: '測試內容',
            prompt: '心情書信',
            mode: 'letter',
        });
    });

    it('應該切換表達模式', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('情緒碎紙機', { selector: '.mode-label' }));

        const shredderRadio = screen.getByRole('radio', { name: /情緒碎紙機/ });
        expect(shredderRadio).toHaveAttribute('aria-checked', 'true');
    });

    it('應該觸發 onBack 當點擊返回', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('← 返回'));
        expect(mockOnBack).toHaveBeenCalled();
    });

    it('應該禁用下一步按鈕當沒有輸入內容', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        const nextBtn = screen.getByText('下一步：調節');
        expect(nextBtn).toBeDisabled();
    });

    it('應該處理碎紙機模式銷毀內容', async () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        fireEvent.click(screen.getByText('情緒碎紙機', { selector: '.mode-label' }));

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '想銷毀的秘密' } });

        fireEvent.click(screen.getByText('啟動碎紙機'));

        act(() => {
            vi.runOnlyPendingTimers();
        });

        expect(screen.getByText('那些負擔已經隨風而逝了。')).toBeInTheDocument();

        fireEvent.click(screen.getByText('帶著輕鬆的心前進'));
        expect(mockOnComplete).toHaveBeenCalledWith({
            expression: '(內容已銷毀)',
            prompt: '情緒碎紙機',
            mode: 'shredder',
        });
    });

    it('應該接收語音轉錄並追加文字', () => {
        render(
            <ExpressingStep
                emotion={mockEmotion}
                onComplete={mockOnComplete}
                onBack={mockOnBack}
            />
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '第一行' } });

        fireEvent.click(screen.getByText('🎙️'));

        expect(textarea).toHaveValue('第一行\n語音轉錄文字');
    });
});
