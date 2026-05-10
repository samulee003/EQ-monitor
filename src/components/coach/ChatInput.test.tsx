import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('應該在送出時呼叫 onSend', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onSOS={vi.fn()} />);

    const input = screen.getByLabelText('輸入訊息');
    fireEvent.change(input, { target: { value: '你好' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(onSend).toHaveBeenCalledWith('你好');
  });

  it('應該在按下 Enter 時送出', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onSOS={vi.fn()} />);

    const input = screen.getByLabelText('輸入訊息');
    fireEvent.change(input, { target: { value: '測試' } });
    fireEvent.submit(input.closest('form')!);

    expect(onSend).toHaveBeenCalledWith('測試');
  });

  it('應該在點擊 SOS 時呼叫 onSOS', () => {
    const onSOS = vi.fn();
    render(<ChatInput onSend={vi.fn()} onSOS={onSOS} />);

    fireEvent.click(screen.getByLabelText('SOS 緊急協助'));
    expect(onSOS).toHaveBeenCalled();
  });

  it('應該在 disabled 時禁用輸入與按鈕', () => {
    render(<ChatInput onSend={vi.fn()} onSOS={vi.fn()} disabled />);

    expect(screen.getByLabelText('輸入訊息')).toBeDisabled();
    expect(screen.getByLabelText('SOS 緊急協助')).toBeDisabled();
    expect(screen.getByLabelText('送出訊息')).toBeDisabled();
  });

  it('空訊息不應該觸發 onSend', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onSOS={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('送出訊息'));
    expect(onSend).not.toHaveBeenCalled();
  });
});
