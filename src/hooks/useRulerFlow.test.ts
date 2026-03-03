import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRulerFlow, steps } from './useRulerFlow';

// Mock dependencies
vi.mock('../services/StorageService', () => ({
    storageService: {
        getDraft: vi.fn(() => null),
        saveDraft: vi.fn(),
        clearDraft: vi.fn(),
        saveLog: vi.fn(),
    },
}));

vi.mock('../services/HabitContext', () => ({
    HabitContext: {
        Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    useHabit: () => ({
        refreshProgress: vi.fn(),
    }),
}));

describe('useRulerFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('initial state', () => {
        it('should start with recognizing step', () => {
            const { result } = renderHook(() => useRulerFlow());
            expect(result.current.step).toBe('recognizing');
        });

        it('should have empty initial selections', () => {
            const { result } = renderHook(() => useRulerFlow());
            expect(result.current.selectedQuadrants).toEqual([]);
            expect(result.current.selectedEmotions).toEqual([]);
        });

        it('should have default intensity of 5', () => {
            const { result } = renderHook(() => useRulerFlow());
            expect(result.current.emotionIntensity).toBe(5);
        });
    });

    describe('step navigation', () => {
        it('should update step correctly', () => {
            const { result } = renderHook(() => useRulerFlow());
            
            act(() => {
                result.current.setStep('labeling');
            });

            expect(result.current.step).toBe('labeling');
        });

        it('should have correct step order', () => {
            expect(steps).toHaveLength(5);
            expect(steps[0].key).toBe('recognizing');
            expect(steps[1].key).toBe('labeling');
            expect(steps[2].key).toBe('understanding');
            expect(steps[3].key).toBe('expressing');
            expect(steps[4].key).toBe('regulating');
        });
    });

    describe('quadrant selection', () => {
        it('should add quadrant on handleMoodComplete', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            act(() => {
                result.current.handleMoodComplete(['yellow'], 7);
            });

            expect(result.current.selectedQuadrants).toContain('yellow');
            expect(result.current.emotionIntensity).toBe(7);
            expect(result.current.step).toBe('centering');
        });

        it('should handle multiple quadrants', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            act(() => {
                result.current.handleMoodComplete(['red', 'blue'], 5);
            });

            expect(result.current.selectedQuadrants).toContain('red');
            expect(result.current.selectedQuadrants).toContain('blue');
        });
    });

    describe('body scan', () => {
        it('should set body scan data and move to labeling', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            // First select a quadrant
            act(() => {
                result.current.handleMoodComplete(['yellow'], 5);
            });

            // Then complete body scan
            act(() => {
                result.current.handleBodyScanComplete({
                    location: 'chest',
                    sensation: 'tight',
                });
            });

            expect(result.current.bodyScanData).toEqual({
                location: 'chest',
                sensation: 'tight',
            });
            expect(result.current.step).toBe('labeling');
        });
    });

    describe('emotion selection', () => {
        it('should add emotion on handleEmotionSelect', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            // Setup - complete mood and body scan
            act(() => {
                result.current.handleMoodComplete(['yellow'], 5);
            });
            act(() => {
                result.current.handleBodyScanComplete({ location: 'chest', sensation: 'warm' });
            });

            // Select emotion
            const mockEmotion = { id: 'happy', name: 'happy', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 };
            act(() => {
                result.current.handleEmotionSelect([mockEmotion]);
            });

            expect(result.current.selectedEmotions).toHaveLength(1);
            expect(result.current.selectedEmotions[0].id).toBe('happy');
        });
    });

    describe('understanding step', () => {
        it('should set understanding data and move to expressing', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            // Setup
            act(() => {
                result.current.handleMoodComplete(['yellow'], 5);
            });
            act(() => {
                result.current.handleBodyScanComplete({ location: 'chest', sensation: 'warm' });
            });
            act(() => {
                result.current.handleEmotionSelect([{ id: 'happy', name: 'happy', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }]);
            });

            // Complete understanding
            act(() => {
                result.current.handleUnderstandingComplete({
                    trigger: 'work done',
                    what: 'project launch',
                    who: 'self',
                    where: 'office',
                    need: 'achievement',
                });
            });

            expect(result.current.understandingData?.trigger).toBe('work done');
            expect(result.current.step).toBe('expressing');
        });
    });

    describe('expressing step', () => {
        it('should set expressing data and move to regulating', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            // Setup
            act(() => {
                result.current.handleMoodComplete(['yellow'], 5);
            });
            act(() => {
                result.current.handleBodyScanComplete({ location: 'chest', sensation: 'warm' });
            });
            act(() => {
                result.current.handleEmotionSelect([{ id: 'happy', name: 'happy', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }]);
            });
            act(() => {
                result.current.handleUnderstandingComplete({
                    trigger: 'work done',
                    what: 'project launch',
                    who: 'self',
                    where: 'office',
                    need: 'achievement',
                });
            });

            // Complete expressing
            act(() => {
                result.current.handleExpressingComplete({
                    expression: 'I did well today',
                    prompt: 'Write your feelings',
                    mode: 'writing',
                });
            });

            expect(result.current.expressingData?.expression).toBe('I did well today');
            expect(result.current.step).toBe('regulating');
        });
    });

    describe('regulating step', () => {
        it('should set regulating data and move to neuroCheck', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            // Setup
            act(() => {
                result.current.handleMoodComplete(['yellow'], 5);
            });
            act(() => {
                result.current.handleBodyScanComplete({ location: 'chest', sensation: 'warm' });
            });
            act(() => {
                result.current.handleEmotionSelect([{ id: 'happy', name: 'happy', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }]);
            });
            act(() => {
                result.current.handleUnderstandingComplete({
                    trigger: 'work done',
                    what: 'project launch',
                    who: 'self',
                    where: 'office',
                    need: 'achievement',
                });
            });
            act(() => {
                result.current.handleExpressingComplete({
                    expression: 'I did well today',
                    prompt: 'Write your feelings',
                    mode: 'writing',
                });
            });

            // Complete regulating
            act(() => {
                result.current.handleRegulatingComplete({
                    selectedStrategies: ['breathing', 'mindfulness'],
                });
            });

            expect(result.current.regulatingData?.selectedStrategies).toContain('breathing');
            expect(result.current.step).toBe('neuroCheck');
        });
    });

    describe('reset flow', () => {
        it('should reset all state on resetFlow', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            // Make some changes
            act(() => {
                result.current.handleMoodComplete(['yellow'], 5);
            });
            act(() => {
                result.current.handleBodyScanComplete({ location: 'chest', sensation: 'warm' });
            });

            // Reset
            act(() => {
                result.current.resetFlow();
            });

            expect(result.current.step).toBe('recognizing');
            expect(result.current.selectedQuadrants).toEqual([]);
            expect(result.current.selectedEmotions).toEqual([]);
            expect(result.current.bodyScanData).toBeNull();
        });
    });

    describe('full flow mode', () => {
        it('should toggle full flow mode', () => {
            const { result } = renderHook(() => useRulerFlow(), {});
            
            expect(result.current.isFullFlow).toBe(false);

            act(() => {
                result.current.setIsFullFlow(true);
            });

            expect(result.current.isFullFlow).toBe(true);
        });
    });
});