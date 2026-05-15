import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeCard } from './WelcomeCard';

describe('WelcomeCard', () => {
  it('應該顯示歡迎標題', () => {
    render(<WelcomeCard onPromptClick={vi.fn()} />);
    expect(screen.getByText('歡迎來到阿念教練')).toBeInTheDocument();
  });

  it('應該顯示建議提示', () => {
    render(<WelcomeCard onPromptClick={vi.fn()} />);
    expect(screen.getByText('我今天有點煩，想找人聊聊')).toBeInTheDocument();
    expect(screen.getByText('幫我啟動緊急安定練習')).toBeInTheDocument();
    expect(screen.getByText('看看我最近的情緒趨勢')).toBeInTheDocument();
  });

  it('點擊提示應該呼叫 onPromptClick', () => {
    const onPromptClick = vi.fn();
    render(<WelcomeCard onPromptClick={onPromptClick} />);

    fireEvent.click(screen.getByText('我今天有點煩，想找人聊聊'));
    expect(onPromptClick).toHaveBeenCalledWith('我今天有點煩，想找人聊聊');
  });
});
