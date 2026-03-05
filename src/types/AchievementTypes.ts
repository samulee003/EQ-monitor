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
    { id: 'streak_3', name: '三日探索', description: '近期連續記錄 3 天（中斷沒關係，隨時重新開始）', icon: '🔥', category: 'streak', requirement: 3 },
    { id: 'streak_7', name: '一週同行', description: '近期連續記錄 7 天（生活忙碌時可暫停）', icon: '⭐', category: 'streak', requirement: 7 },
    { id: 'streak_30', name: '月度同伴', description: '近期連續記錄 30 天（以自己的步調前進）', icon: '🏆', category: 'streak', requirement: 30 },
    { id: 'emotions_10', name: '情緒詞彙家', description: '累計辨識 10 種不同情緒，擴展情緒語言', icon: '🎨', category: 'emotion', requirement: 10 },
    { id: 'full_ruler_5', name: 'RULER 實踐者', description: '完成 5 次完整 RULER 流程', icon: '📚', category: 'special', requirement: 5 },
];
