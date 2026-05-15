import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfile from './UserProfile';

const mockGetLogs = vi.hoisted(() => vi.fn());
const mockAuthFns = vi.hoisted(() => ({
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
}));

vi.mock('../services/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'user-1',
            email: 'sam@example.com',
            displayName: 'Sam',
            createdAt: '2026-05-01T00:00:00.000Z',
        },
        isAuthenticated: true,
        ...mockAuthFns,
    }),
}));

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (text: string) => text }),
}));

vi.mock('../adapters', () => ({
    storageService: {
        getLogs: mockGetLogs,
    },
}));

describe('UserProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetLogs.mockResolvedValue([
            {
                id: 'log-1',
                timestamp: '2026-05-15T10:00:00.000Z',
                emotions: [{ id: 'calm', name: '平靜', quadrant: 'green' }],
                intensity: 4,
            },
        ]);
    });

    it('匯出所有數據時應等待實際情緒記錄載入完成', async () => {
        const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:imxin-export');
        const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        render(<UserProfile onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: '數據' }));
        fireEvent.click(screen.getByRole('button', { name: /匯出所有數據/ }));

        await waitFor(() => expect(mockGetLogs).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

        const blob = createObjectURL.mock.calls[0][0] as Blob;
        const exported = JSON.parse(await blob.text());
        expect(exported.logs).toEqual([
            {
                id: 'log-1',
                timestamp: '2026-05-15T10:00:00.000Z',
                emotions: [{ id: 'calm', name: '平靜', quadrant: 'green' }],
                intensity: 4,
            },
        ]);
        expect(click).toHaveBeenCalledTimes(1);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:imxin-export');
    });
});
