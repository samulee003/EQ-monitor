import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MicroActionCard } from './MicroActionCard';
import type { CoachMicroAction, CoachMicroActionProposal } from '../../lib/adk/types';

const proposal: CoachMicroActionProposal = {
  key: 'sleep-check',
  goalKey: 'sleep_anxiety',
  category: 'sleep',
  title: '睡前把明天最擔心的一件事寫成一句話',
  dueHours: 24,
};

const activeAction: CoachMicroAction = {
  id: 'action-1',
  title: '對孩子說一句我剛剛太急了',
  category: 'repair',
  status: 'active',
  due_at: '2026-05-16T12:00:00.000Z',
  created_at: '2026-05-15T12:00:00.000Z',
};

describe('MicroActionCard', () => {
  it('顯示提案並可確認或略過', () => {
    const onConfirmProposal = vi.fn();
    const onRejectProposal = vi.fn();

    render(
      <MicroActionCard
        proposal={proposal}
        onConfirmProposal={onConfirmProposal}
        onRejectProposal={onRejectProposal}
        onReportAction={vi.fn()}
      />
    );

    expect(screen.getByLabelText('今天的小行動')).toBeInTheDocument();
    expect(screen.getByText(proposal.title)).toBeInTheDocument();
    expect(screen.getByText('24 小時內回來看一眼就可以。做一半也算數，沒做到但回來說也算數。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '設為今天的小行動' }));
    expect(onConfirmProposal).toHaveBeenCalledWith(proposal.title);

    fireEvent.click(screen.getByRole('button', { name: '先不要' }));
    expect(onRejectProposal).toHaveBeenCalledTimes(1);
  });

  it('顯示既有小行動並回報狀態', () => {
    const onReportAction = vi.fn();

    render(
      <MicroActionCard
        activeAction={activeAction}
        onConfirmProposal={vi.fn()}
        onRejectProposal={vi.fn()}
        onReportAction={onReportAction}
      />
    );

    expect(screen.getByLabelText('上次的小行動')).toBeInTheDocument();
    expect(screen.getByText(activeAction.title)).toBeInTheDocument();
    expect(screen.getByText('回來看一眼就好，不是成績單。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '有做到' }));
    fireEvent.click(screen.getByRole('button', { name: '做了一半' }));
    fireEvent.click(screen.getByRole('button', { name: '沒做到，但我回來了' }));

    expect(onReportAction).toHaveBeenNthCalledWith(1, 'completed');
    expect(onReportAction).toHaveBeenNthCalledWith(2, 'partial');
    expect(onReportAction).toHaveBeenNthCalledWith(3, 'skipped');
  });

  it('沒有提案或小行動時不渲染', () => {
    const { container } = render(
      <MicroActionCard
        onConfirmProposal={vi.fn()}
        onRejectProposal={vi.fn()}
        onReportAction={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
