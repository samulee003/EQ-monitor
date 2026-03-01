export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'streak' | 'emotion' | 'regulation' | 'special';
    requirement: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_log', name: '初次覺察', description: '完成第一次情緒記錄', icon: '🌱', category: 'special', requirement: 1 },
    { id: 'streak_3', name: '三日暖身', description: '連續記錄 3 天', icon: '🔥', category: 'streak', requirement: 3 },
    { id: 'streak_7', name: '一週堅持', description: '連續記錄 7 天', icon: '⭐', category: 'streak', requirement: 7 },
    { id: 'streak_30', name: '月度覺察家', description: '連續記錄 30 天', icon: '🏆', category: 'streak', requirement: 30 },
    { id: 'emotions_10', name: '情緒探索者', description: '辨識 10 種不同情緒', icon: '🎨', category: 'emotion', requirement: 10 },
    { id: 'full_ruler_5', name: 'RULER 實踐者', description: '完成 5 次完整 RULER 流程', icon: '📚', category: 'special', requirement: 5 },
];
