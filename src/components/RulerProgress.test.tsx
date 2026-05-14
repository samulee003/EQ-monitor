import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RulerProgress from './RulerProgress';

vi.mock('../services/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s }),
}));

describe('RulerProgress', () => {
    it('完整流程應該顯示 RULER 五步順序', () => {
        render(<RulerProgress currentStep="understanding" isFullFlow={true} selectedQuadrant="green" />);

        const labels = within(screen.getByTestId('ruler-progress'))
            .getAllByText(/覺察|理解|標記|表達|調節/)
            .map(element => element.textContent);

        expect(labels).toEqual(['覺察', '理解', '標記', '表達', '調節']);
        expect(screen.queryByText('命名')).not.toBeInTheDocument();
        expect(screen.queryByText('定位')).not.toBeInTheDocument();
        expect(screen.queryByText('需要')).not.toBeInTheDocument();
        expect(screen.queryByText('選擇')).not.toBeInTheDocument();
    });

    it('快速流程應該只顯示必要且一致的步驟', () => {
        render(<RulerProgress currentStep="labeling" isFullFlow={false} selectedQuadrant="green" />);

        const labels = within(screen.getByTestId('ruler-progress'))
            .getAllByText(/覺察|標記/)
            .map(element => element.textContent);

        expect(labels).toEqual(['覺察', '標記']);
        expect(screen.queryByText('命名')).not.toBeInTheDocument();
    });
});
