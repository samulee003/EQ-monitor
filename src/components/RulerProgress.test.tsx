import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RulerProgress from './RulerProgress';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s }),
}));

describe('RulerProgress', () => {
    it('完整流程應該顯示今心四步順序', () => {
        render(<RulerProgress currentStep="understanding" isFullFlow={true} selectedQuadrant="green" />);

        const labels = within(screen.getByTestId('ruler-progress'))
            .getAllByText(/看見|命名|安放|回應/)
            .map(element => element.textContent);

        expect(labels).toEqual(['看見', '命名', '安放', '回應']);
        expect(screen.queryByText('理解')).not.toBeInTheDocument();
        expect(screen.queryByText('標記')).not.toBeInTheDocument();
        expect(screen.queryByText('表達')).not.toBeInTheDocument();
        expect(screen.queryByText('調節')).not.toBeInTheDocument();
    });

    it('快速流程應該只顯示必要且一致的步驟', () => {
        render(<RulerProgress currentStep="labeling" isFullFlow={false} selectedQuadrant="green" />);

        const labels = within(screen.getByTestId('ruler-progress'))
            .getAllByText(/看見|命名/)
            .map(element => element.textContent);

        expect(labels).toEqual(['看見', '命名']);
        expect(screen.queryByText('標記')).not.toBeInTheDocument();
    });
});
