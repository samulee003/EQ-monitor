import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckInFlow from './CheckInFlow';

// Mock LanguageContext
vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

// Mock useRulerFlow hook
const mockHandleMoodComplete = vi.fn();
const mockHandleBodyScanComplete = vi.fn();
const mockHandleEmotionSelect = vi.fn();
const mockHandleUnderstandingComplete = vi.fn();
const mockHandleExpressingComplete = vi.fn();
const mockHandleRegulatingComplete = vi.fn();
const mockHandleNeuroCheckComplete = vi.fn();
const mockResetFlow = vi.fn();
const mockResumeDraft = vi.fn();
const mockSetStep = vi.fn();
const mockSetIsFullFlow = vi.fn();
const mockSetShowResumePrompt = vi.fn();
const flowMockState = vi.hoisted(() => ({
    step: 'recognizing',
    selectedQuadrants: [] as string[],
    selectedEmotions: [] as unknown[],
    showResumePrompt: false,
    isFullFlow: false,
    emotionIntensity: 5,
}));

vi.mock('../hooks/useRulerFlow', () => ({
    useRulerFlow: () => ({
        step: flowMockState.step,
        selectedQuadrants: flowMockState.selectedQuadrants,
        selectedEmotions: flowMockState.selectedEmotions,
        showResumePrompt: flowMockState.showResumePrompt,
        isFullFlow: flowMockState.isFullFlow,
        emotionIntensity: flowMockState.emotionIntensity,
        setStep: mockSetStep,
        setIsFullFlow: mockSetIsFullFlow,
        setShowResumePrompt: mockSetShowResumePrompt,
        resumeDraft: mockResumeDraft,
        resetFlow: mockResetFlow,
        handleMoodComplete: mockHandleMoodComplete,
        handleBodyScanComplete: mockHandleBodyScanComplete,
        handleEmotionSelect: mockHandleEmotionSelect,
        handleUnderstandingComplete: mockHandleUnderstandingComplete,
        handleExpressingComplete: mockHandleExpressingComplete,
        handleRegulatingComplete: mockHandleRegulatingComplete,
        handleNeuroCheckComplete: mockHandleNeuroCheckComplete,
    }),
}));

// Mock child components with minimal rendered output
vi.mock('./EmotionQuadrantPicker', () => ({
    default: ({ onSelectQuadrants }: { onSelectQuadrants: (qs: string[]) => void }) => (
        <div data-testid="emotion-quadrant-picker">
            <button onClick={() => onSelectQuadrants(['red'])}>選擇紅色象限</button>
        </div>
    ),
}));

vi.mock('./EmotionGrid', () => ({
    default: ({ onSelectEmotions, onBack }: { onSelectEmotions: (es: unknown[], intensity: number) => void; onBack: () => void }) => (
        <div data-testid="emotion-grid">
            <button onClick={() => onSelectEmotions([{ id: 'angry', name: '生氣的', quadrant: 'red', energy: 3, pleasantness: 3 }], 5)}>
                選擇情緒
            </button>
            <button onClick={() => onSelectEmotions([{ id: 'enraged', name: '憤怒的', quadrant: 'red', energy: 5, pleasantness: 1 }], 9)}>
                選擇高強度情緒
            </button>
            <button onClick={onBack}>返回</button>
        </div>
    ),
}));

vi.mock('./BodyScan', () => ({
    default: ({ onComplete, onBack }: { onComplete: (data: unknown) => void; onBack: () => void }) => (
        <div data-testid="body-scan">
            <button onClick={() => onComplete({ location: '胸口', sensation: '緊繃' })}>完成掃描</button>
            <button onClick={onBack}>返回</button>
        </div>
    ),
}));

vi.mock('./UnderstandingStep', () => ({
    default: ({ onComplete, onBack }: { onComplete: (data: unknown) => void; onBack: () => void }) => (
        <div data-testid="understanding-step">
            <button onClick={() => onComplete({ trigger: '工作', what: '專案截止', who: '自己', where: '辦公室', need: '成就感', message: '' })}>
                完成理解
            </button>
            <button onClick={onBack}>返回</button>
        </div>
    ),
}));

vi.mock('./ExpressingStep', () => ({
    default: ({ onComplete, onBack }: { onComplete: (data: unknown) => void; onBack: () => void }) => (
        <div data-testid="expressing-step">
            <button onClick={() => onComplete({ expression: '我需要休息', prompt: '自由書寫', mode: 'free' })}>
                完成表達
            </button>
            <button onClick={onBack}>返回</button>
        </div>
    ),
}));

vi.mock('./RegulatingStep', () => ({
    default: ({ onComplete, onBack }: { onComplete: (data: unknown) => void; onBack: () => void }) => (
        <div data-testid="regulating-step">
            <button onClick={() => onComplete({ selectedStrategies: ['breathing'] })}>完成調節</button>
            <button onClick={onBack}>返回</button>
        </div>
    ),
}));

vi.mock('./steps/NeuroCheckStep', () => ({
    default: ({ onComplete }: { onComplete: (data: unknown) => void }) => (
        <div data-testid="neuro-check-step">
            <button onClick={() => onComplete({ sleepHours: 7, activityLevel: 3 })}>完成檢查</button>
        </div>
    ),
}));

vi.mock('./steps/SummaryStep', () => ({
    default: ({ onReset, onContinueFullFlow }: { onReset: () => void; onContinueFullFlow?: () => void }) => (
        <div data-testid="summary-step">
            <button onClick={onReset}>重新開始</button>
            {onContinueFullFlow && <button onClick={onContinueFullFlow}>開啟完整流程</button>}
        </div>
    ),
}));

vi.mock('./steps/CenteringStep', () => ({
    default: () => <div data-testid="centering-step">Centering</div>,
}));

vi.mock('./RulerProgress', () => ({
    default: () => <div data-testid="ruler-progress">RulerProgress</div>,
}));

describe('CheckInFlow', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        flowMockState.step = 'recognizing';
        flowMockState.selectedQuadrants = [];
        flowMockState.selectedEmotions = [];
        flowMockState.showResumePrompt = false;
        flowMockState.isFullFlow = false;
        flowMockState.emotionIntensity = 5;
    });

    it('初始首頁只渲染四色狀態入口，不顯示額外入口', () => {
        render(<CheckInFlow />);

        expect(screen.getByTestId('emotion-quadrant-picker')).toBeInTheDocument();
        expect(screen.queryByTestId('ruler-progress')).not.toBeInTheDocument();
        expect(screen.queryByText('今日教練建議')).not.toBeInTheDocument();
        expect(screen.queryByText('快速統計')).not.toBeInTheDocument();
        expect(screen.queryByText('快速記錄')).not.toBeInTheDocument();
        expect(screen.queryByText('LINE Bot 也可以使用今心')).not.toBeInTheDocument();
    });

    it('應該處理四色狀態入口完成並呼叫 handleMoodComplete', () => {
        render(<CheckInFlow />);

        fireEvent.click(screen.getByText('選擇紅色象限'));
        expect(mockHandleMoodComplete).toHaveBeenCalledWith(['red'], 5);
    });

    it('高強度或高風險情緒要先確認安全，再保存記錄', () => {
        flowMockState.step = 'labeling';
        flowMockState.selectedQuadrants = ['red'];

        render(<CheckInFlow />);

        fireEvent.click(screen.getByText('選擇高強度情緒'));

        expect(screen.getByRole('dialog', { name: '先確認安全' })).toBeInTheDocument();
        expect(screen.getByText(/如果你或身邊的人有立即危險/)).toBeInTheDocument();
        expect(screen.getByText(/119 或 110/)).toBeInTheDocument();
        expect(mockHandleEmotionSelect).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: '我現在安全，保存這筆記錄' }));

        expect(mockHandleEmotionSelect).toHaveBeenCalledWith(
            [{ id: 'enraged', name: '憤怒的', quadrant: 'red', energy: 5, pleasantness: 1 }],
            9
        );
    });
});
