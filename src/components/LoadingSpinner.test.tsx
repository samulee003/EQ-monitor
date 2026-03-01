import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
    it('應該渲染預設訊息', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('應該渲染自定義訊息', () => {
        render(<LoadingSpinner message="加載頁面中..." />);
        expect(screen.getByText('加載頁面中...')).toBeInTheDocument();
    });

    it('應該包含 spinner 元素', () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.querySelector('.spinner');
        expect(spinner).toBeInTheDocument();
    });
});
