import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingFlow from './OnboardingFlow';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (text: string) => text }),
}));

vi.mock('../services/NotificationService', () => ({
    notificationService: {
        setEnabled: vi.fn(),
        setReminderTime: vi.fn(),
    },
}));

vi.mock('../adapters', () => ({
    settingsStore: {
        setUserRole: vi.fn(),
    },
}));

describe('OnboardingFlow', () => {
    it('第一步應該用一般人能理解的方式介紹主動教練特色', () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        expect(screen.getByText('歡迎來到 今心')).toBeInTheDocument();
        expect(screen.getByText('今心不只是情緒記錄工具，也有一位會主動陪你整理下一步的 AI 教練。')).toBeInTheDocument();
        expect(screen.getByText('你可以把它想成隨身情緒教練：看見你的紀錄、提醒你回到當下，必要時帶你做呼吸或緊急安定練習。')).toBeInTheDocument();
    });
});
