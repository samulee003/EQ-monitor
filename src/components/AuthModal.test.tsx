import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthModal from './AuthModal';

vi.mock('../services/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    continueAsGuest: vi.fn(),
  }),
}));

vi.mock('../services/LanguageContext', () => ({
  useLanguage: () => ({ t: (text: string) => text }),
}));

describe('AuthModal 發布信任資訊', () => {
  it('註冊時的隱私聲明連到可被靜態託管打開的頁面', () => {
    render(<AuthModal isOpen onClose={vi.fn()} defaultMode="register" />);

    expect(screen.getByRole('link', { name: '隱私聲明' })).toHaveAttribute('href', '/privacy.html');
  });
});
