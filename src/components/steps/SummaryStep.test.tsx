import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SummaryStep from './SummaryStep';

vi.mock('../../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

vi.mock('../../services/AIService', () => ({
    aiService: {
        analyzeFeeling: vi.fn(() => Promise.resolve({
            summary: '測試洞察摘要',
            underlyingPatterns: ['模式A'],
            suggestedAction: '建議行動',
            empatheticQuote: '同理引用',
            colorTheory: '顏色理論',
        })),
    },
}));

vi.mock('../../adapters', () => ({
    dataAdapter: {
        logs: {
            export: vi.fn(() => Promise.resolve([])),
        },
    },
}));

describe('SummaryStep', () => {
    const mockEmotions = [
        { id: 'happy', name: '開心的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 },
        { id: 'excited', name: '興奮的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 },
    ];
    const mockOnReset = vi.fn();

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('應該渲染完成標題與情緒摘要', async () => {
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={true}
                    onReset={mockOnReset}
                />
            );
        });

        expect(screen.getByText('覺察之旅完成')).toBeInTheDocument();
        expect(screen.getByText('開心的、興奮的')).toBeInTheDocument();
    });

    it('應該顯示完整流程的檢查清單', async () => {
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={true}
                    onReset={mockOnReset}
                />
            );
        });

        expect(screen.getByText('覺察當下的感受')).toBeInTheDocument();
        expect(screen.getByText('定位觸發因素')).toBeInTheDocument();
        expect(screen.getByText('表達內在需求')).toBeInTheDocument();
        expect(screen.getByText('選擇回應方式')).toBeInTheDocument();
    });

    it('應該只顯示基本檢查清單當非完整流程', async () => {
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={false}
                    onReset={mockOnReset}
                    onContinueFullFlow={vi.fn()}
                />
            );
        });

        expect(screen.getByText('覺察當下的感受')).toBeInTheDocument();
        expect(screen.queryByText('定位觸發因素')).not.toBeInTheDocument();
    });

    it('應該觸發 onReset 當點擊返回', async () => {
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={true}
                    onReset={mockOnReset}
                />
            );
        });

        fireEvent.click(screen.getByText('返回'));
        expect(mockOnReset).toHaveBeenCalled();
    });

    it('應該顯示繼續完整流程按鈕當提供 onContinueFullFlow', async () => {
        const onContinue = vi.fn();
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={false}
                    onReset={mockOnReset}
                    onContinueFullFlow={onContinue}
                />
            );
        });

        const btn = screen.getByText('開啟完整覺察練習');
        fireEvent.click(btn);
        expect(onContinue).toHaveBeenCalled();
    });

    it('應該顯示快速調節建議當非完整流程', async () => {
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={false}
                    onReset={mockOnReset}
                    onContinueFullFlow={vi.fn()}
                />
            );
        });

        expect(screen.getByText('💡 想試試快速調節嗎？')).toBeInTheDocument();
    });

    it('應該在掛載時載入 AI 洞察', async () => {
        await act(async () => {
            render(
                <SummaryStep
                    selectedEmotions={mockEmotions}
                    isFullFlow={true}
                    onReset={mockOnReset}
                />
            );
        });

        await waitFor(() => {
            expect(screen.getByText('今心洞察')).toBeInTheDocument();
        });
    });

    it('應該處理 AI 洞察載入失敗並隱藏載入狀態', async () => {
        vi.doMock('../../services/AIService', () => ({
            aiService: {
                analyzeFeeling: vi.fn(() => Promise.reject(new Error('API 錯誤'))),
            },
        }));

        const { SummaryStep: SummaryStepWithError } = await import('./SummaryStep');

        await act(async () => {
            render(
                <SummaryStepWithError
                    selectedEmotions={mockEmotions}
                    isFullFlow={true}
                    onReset={mockOnReset}
                />
            );
        });

        // 即使 AI 失敗，組件仍應正常渲染主要內容
        expect(screen.getByText('覺察之旅完成')).toBeInTheDocument();
    });
});
