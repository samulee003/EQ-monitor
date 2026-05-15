import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GamificationStrip } from './GamificationStrip';
import type { CoachGamificationSummary } from '../../lib/adk/types';

const summary: CoachGamificationSummary = {
  total_xp: 160,
  coin_balance: 12,
  lifetime_coins: 20,
  total_reported: 5,
  completed_count: 3,
  partial_count: 1,
  skipped_count: 1,
  current_review_streak: 4,
  longest_review_streak: 6,
  last_review_date: '2026-05-15',
  level: {
    level: 2,
    title: '回來看一眼',
    currentXp: 60,
    nextLevelXp: 120,
  },
};

describe('GamificationStrip', () => {
  it('顯示等級、XP、金幣與復盤連續摘要', () => {
    render(<GamificationStrip summary={summary} />);

    expect(screen.getByLabelText('阿念行動陪跑進度')).toBeInTheDocument();
    expect(screen.getByText('Lv.2 回來看一眼')).toBeInTheDocument();
    expect(screen.getByText('60 / 120 XP')).toBeInTheDocument();
    expect(screen.getByText('12 金幣')).toBeInTheDocument();
    expect(screen.getByText('復盤連續 4 天')).toBeInTheDocument();
  });

  it('沒有摘要時不渲染', () => {
    const { container } = render(<GamificationStrip summary={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
