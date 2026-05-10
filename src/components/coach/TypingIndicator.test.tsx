import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('應該顯示「教練正在思考...」', () => {
    render(<TypingIndicator />);
    expect(screen.getByText('教練正在思考...')).toBeInTheDocument();
  });

  it('應該渲染打字指示器', () => {
    render(<TypingIndicator />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });
});
