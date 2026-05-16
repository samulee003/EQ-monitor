import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OnboardingFlow from './OnboardingFlow';

const notificationMock = vi.hoisted(() => ({
    setEnabled: vi.fn().mockResolvedValue(true),
    setReminderTime: vi.fn(),
    sendTestNotification: vi.fn(),
    getDailyReminderPreview: vi.fn(() => '今天給自己一分鐘，看看此刻的感受。'),
}));

const settingsStoreMock = vi.hoisted(() => ({
    setUserRole: vi.fn(),
}));

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (text: string) => text }),
}));

vi.mock('../services/NotificationService', () => ({
    notificationService: notificationMock,
}));

vi.mock('../adapters', () => ({
    settingsStore: settingsStoreMock,
}));

describe('OnboardingFlow', () => {
    afterEach(() => {
        vi.clearAllMocks();
        notificationMock.setEnabled.mockResolvedValue(true);
        notificationMock.getDailyReminderPreview.mockReturnValue('今天給自己一分鐘，看看此刻的感受。');
    });

    const goToStep = (targetStep: number) => {
        fireEvent.click(screen.getByRole('button', { name: '看完整導覽' }));
        for (let step = 2; step < targetStep; step += 1) {
            fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        }
    };

    it('第一步應該用一般人能理解的方式介紹阿念教練特色', () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        expect(screen.getByText('歡迎來到 今心')).toBeInTheDocument();
        expect(screen.getByText('今心不只是情緒記錄工具，也有一位會主動陪你整理下一步的阿念教練。')).toBeInTheDocument();
        expect(screen.getByText('阿念會看見你的紀錄、接續你的情緒線索，必要時帶你做呼吸或緊急安定練習。用得越久，它越能看懂你的節奏。')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '看完整導覽' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '先試一次' })).toBeInTheDocument();
    });

    it('先試一次應直接進入今日心情，不啟動通知流程', () => {
        const onComplete = vi.fn();
        render(<OnboardingFlow onComplete={onComplete} />);

        fireEvent.click(screen.getByRole('button', { name: '先試一次' }));

        expect(settingsStoreMock.setUserRole).toHaveBeenCalledWith('general');
        expect(notificationMock.setReminderTime).not.toHaveBeenCalled();
        expect(notificationMock.setEnabled).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('角色選擇應使用清楚標籤，不顯示單字大圖示', () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        goToStep(2);

        expect(screen.getByText('照顧孩子的父母')).toBeInTheDocument();
        expect(screen.getByText('一般日常使用')).toBeInTheDocument();
        expect(screen.getByText('職場工作者')).toBeInTheDocument();
        expect(screen.queryByText('育')).not.toBeInTheDocument();
        expect(screen.queryByText('通')).not.toBeInTheDocument();
        expect(screen.queryByText('職')).not.toBeInTheDocument();
    });

    it('四色狀態導覽應使用情緒心理學科普語言', () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        goToStep(3);

        expect(screen.getByText('情緒的四種常見狀態')).toBeInTheDocument();
        expect(screen.getByText('情緒心理學常用「身體喚醒程度」和「感受愉悅度」來理解當下狀態：高喚醒又不舒服時，可能是緊張、憤怒或焦慮；高喚醒又舒服時，可能是興奮、期待或有活力；低喚醒又不舒服時，可能是低落、疲憊或失望；低喚醒又舒服時，可能是平靜、放鬆或安心。這不是診斷，也不是把情緒分好壞，而是先幫你看見身體和感受正在往哪裡走。')).toBeInTheDocument();
        expect(screen.queryByText(/心裡順卡/)).not.toBeInTheDocument();
    });

    it('隱私導覽應只承諾已落實的資料保存與同步行為', () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        goToStep(7);

        expect(screen.getByText('資料怎麼保存')).toBeInTheDocument();
        expect(screen.getByText('未登入時，情緒練習記錄會留在這台裝置的瀏覽器儲存空間，其中情緒記錄會用本機加密格式保存。登入或註冊並同意後，今心才會把必要的記錄與教練脈絡同步到雲端，讓阿念接續你的狀態；你可以匯出本機記錄，登入後也可以刪除帳號雲端資料。')).toBeInTheDocument();
        expect(screen.getByText('未登入：本機保存')).toBeInTheDocument();
        expect(screen.getByText('登入同意才同步')).toBeInTheDocument();
        expect(screen.getByText('可匯出 / 刪帳')).toBeInTheDocument();
    });

    it('模式導覽應區分每日提醒、週洞察與成就，而非過度承諾主動教練推送', () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        goToStep(8);

        expect(screen.getByText('讓今心整理你的模式')).toBeInTheDocument();
        expect(screen.getByText('每次記錄都會變成你回看自己的線索。今心會在成長頁整理最近的情緒、觸發點與需要；若你有登入並開啟阿念主動關心，才會使用這些脈絡提供更個人化的提醒。')).toBeInTheDocument();
        expect(screen.getByText('每日提醒')).toBeInTheDocument();
        expect(screen.getByText('週洞察')).toBeInTheDocument();
        expect(screen.getByText('成就收藏')).toBeInTheDocument();
        expect(screen.queryByText('主動提醒')).not.toBeInTheDocument();
    });

    it('提醒時間導覽應直接說明通知會顯示什麼，並可試發提醒', async () => {
        render(<OnboardingFlow onComplete={vi.fn()} />);

        goToStep(9);

        expect(screen.getByText('提醒會像這樣')).toBeInTheDocument();
        expect(screen.getByText('今心 • 每日心情記錄')).toBeInTheDocument();
        expect(screen.getByText('今天給自己一分鐘，看看此刻的感受。')).toBeInTheDocument();
        expect(screen.getByText('看不到通知通常是權限或內建瀏覽器限制；可改用 Safari / Chrome 或加入主畫面。')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '試發提醒' }));

        await waitFor(() => expect(notificationMock.setEnabled).toHaveBeenCalledWith(true));
        await waitFor(() => expect(notificationMock.sendTestNotification).toHaveBeenCalledWith('general'));
        expect(await screen.findByText('已送出測試提醒。如果沒有看到，請檢查瀏覽器通知權限。')).toBeInTheDocument();
    });

    it('開始旅程不應被通知權限流程卡住', () => {
        const onComplete = vi.fn();
        notificationMock.setEnabled.mockImplementation(() => new Promise(() => undefined));

        render(<OnboardingFlow onComplete={onComplete} />);

        goToStep(9);
        fireEvent.click(screen.getByRole('button', { name: '開始旅程 ✨' }));

        expect(settingsStoreMock.setUserRole).toHaveBeenCalledWith('general');
        expect(notificationMock.setReminderTime).toHaveBeenCalledWith(21, 0);
        expect(notificationMock.setEnabled).toHaveBeenCalledWith(true);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
