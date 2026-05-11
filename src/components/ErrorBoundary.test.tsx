import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  it('應該渲染子組件當沒有錯誤時', () => {
    render(
      <ErrorBoundary>
        <div>正常內容</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('正常內容')).toBeInTheDocument();
  });

  it('應該捕獲錯誤並顯示預設錯誤界面', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError message="測試錯誤" />
      </ErrorBoundary>
    );

    expect(screen.getByText('發生了一些問題')).toBeInTheDocument();
    expect(screen.getByText('測試錯誤')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('應該捕獲錯誤並顯示自定義 fallback', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>自定義錯誤提示</div>}>
        <ThrowError message="測試錯誤" />
      </ErrorBoundary>
    );

    expect(screen.getByText('自定義錯誤提示')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('應該呼叫 onError 回調當提供時', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError message="回調測試錯誤" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: '回調測試錯誤' }),
      expect.any(Object)
    );

    consoleError.mockRestore();
  });
});
