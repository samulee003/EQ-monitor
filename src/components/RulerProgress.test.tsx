import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RulerProgress from './RulerProgress';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s }),
}));

describe('RulerProgress', () => {
    it('完整流程應該顯示知心四式順序', () => {
        render(<RulerProgress currentStep="understanding" isFullFlow={true} selectedQuadrant="green" />);

        const labels = within(screen.getByTestId('ruler-progress'))
            .getAllByText(/心照|喚名|安神|動念/)
            .map(element => element.textContent);

        expect(labels).toEqual(['心照', '喚名', '安神', '動念']);
        expect(screen.queryByText('理解')).not.toBeInTheDocument();
        expect(screen.queryByText('標記')).not.toBeInTheDocument();
        expect(screen.queryByText('表達')).not.toBeInTheDocument();
        expect(screen.queryByText('調節')).not.toBeInTheDocument();
    });

    it('快速流程應該只顯示必要且一致的步驟', () => {
        render(<RulerProgress currentStep="labeling" isFullFlow={false} selectedQuadrant="green" />);

        const labels = within(screen.getByTestId('ruler-progress'))
            .getAllByText(/心照|喚名/)
            .map(element => element.textContent);

        expect(labels).toEqual(['心照', '喚名']);
        expect(screen.queryByText('標記')).not.toBeInTheDocument();
    });
});
