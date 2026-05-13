import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckInFlow from './CheckInFlow';

// Mock LanguageContext
vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s, language: 'zh-TW' as const, toggleLanguage: vi.fn() }),
}));

// Mock settings store
const { mockCreateLog } = vi.hoisted(() => ({
    mockCreateLog: vi.fn(),
}));
vi.mock('../adapters', () => ({
    dataAdapter: {
        logs: {
            create: mockCreateLog,
        },
    },
    settingsStore: {
        getUserRole: vi.fn(() => 'user'),
    },
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

vi.mock('../hooks/useRulerFlow', () => ({
    useRulerFlow: () => ({
        step: 'recognizing',
        selectedQuadrants: [],
        selectedEmotions: [],
        showResumePrompt: false,
        isFullFlow: false,
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
vi.mock('./MoodMeter', () => ({
    default: ({ onSelectQuadrants }: { onSelectQuadrants: (qs: string[]) => void }) => (
        <div data-testid="mood-meter">
            <button onClick={() => onSelectQuadrants(['red'])}>選擇紅色象限</button>
        </div>
    ),
}));

vi.mock('./EmotionGrid', () => ({
    default: ({ onSelectEmotions, onBack }: { onSelectEmotions: (es: unknown[]) => void; onBack: () => void }) => (
        <div data-testid="emotion-grid">
            <button onClick={() => onSelectEmotions([{ id: 'angry', name: '生氣的', quadrant: 'red', energy: 3, pleasantness: 3 }])}>
                選擇情緒
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

vi.mock('./QuickStats', () => ({
    default: () => <div data-testid="quick-stats">QuickStats</div>,
}));

vi.mock('./QuickCheckIn', () => ({
    default: ({ onComplete, onCancel }: { onComplete: (data: unknown) => void; onCancel: () => void }) => (
        <div data-testid="quick-check-in">
            <button onClick={() => onComplete({
                emotion: {
                    id: 'anxious',
                    name: '焦慮的',
                    quadrant: 'red',
                    energy: 2,
                    pleasantness: 1,
                    description: '擔心接下來的狀況',
                },
                intensity: 6,
                scenarioTag: '工作',
                note: '今天事情很多，有點緊繃。',
                timestamp: '2026-05-13T13:00:00.000Z',
            })}>快速完成</button>
            <button onClick={onCancel}>取消</button>
        </div>
    ),
}));

vi.mock('./ParentScenarios', () => ({
    default: ({ onDismiss }: { onDismiss: () => void }) => (
        <div data-testid="parent-scenarios">
            <button onClick={onDismiss}>關閉</button>
        </div>
    ),
}));

vi.mock('./RulerProgress', () => ({
    default: () => <div data-testid="ruler-progress">RulerProgress</div>,
}));

describe('CheckInFlow', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        mockCreateLog.mockResolvedValue({
            id: 'quick-log-1',
            emotions: [],
            intensity: 6,
            bodyScan: null,
            understanding: null,
            expressing: null,
            regulating: null,
            postMood: '',
            timestamp: '2026-05-13T13:00:00.000Z',
        });
    });

    it('應該在初始步驟渲染 MoodMeter 與快捷入口', () => {
        render(<CheckInFlow />);

        expect(screen.getByTestId('mood-meter')).toBeInTheDocument();
        expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
        expect(screen.getByText('快速記錄')).toBeInTheDocument();
    });

    it('應該進入快速記錄模式', () => {
        render(<CheckInFlow />);

        fireEvent.click(screen.getByText('快速記錄'));
        expect(screen.getByTestId('quick-check-in')).toBeInTheDocument();
    });

    it('應該從快速記錄返回並重置流程', async () => {
        render(<CheckInFlow />);

        fireEvent.click(screen.getByText('快速記錄'));
        fireEvent.click(screen.getByText('快速完成'));

        await waitFor(() => expect(mockResetFlow).toHaveBeenCalled());
    });

    it('快速記錄完成後應該保存到情緒紀錄', async () => {
        render(<CheckInFlow />);

        fireEvent.click(screen.getByText('快速記錄'));
        fireEvent.click(screen.getByText('快速完成'));

        expect(mockCreateLog).toHaveBeenCalledWith(expect.objectContaining({
            emotions: [expect.objectContaining({
                id: 'anxious',
                name: '焦慮的',
                quadrant: 'red',
            })],
            intensity: 6,
            bodyScan: null,
            understanding: expect.objectContaining({
                trigger: '工作',
                what: '工作',
                who: '',
                where: '',
                need: null,
            }),
            expressing: expect.objectContaining({
                expression: '今天事情很多，有點緊繃。',
                mode: 'quick',
            }),
            regulating: null,
            postMood: '',
            timestamp: '2026-05-13T13:00:00.000Z',
            isFullFlow: false,
        }));
    });

    it('應該處理 MoodMeter 完成並呼叫 handleMoodComplete', () => {
        render(<CheckInFlow />);

        fireEvent.click(screen.getByText('選擇紅色象限'));
        expect(mockHandleMoodComplete).toHaveBeenCalledWith(['red'], 5);
    });
});
