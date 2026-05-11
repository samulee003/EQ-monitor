export type UserRole = 'general' | 'parent' | 'student' | 'professional';

export interface HomeContent {
  sos: {
    title: string;
    description: string;
  };
  quick: {
    title: string;
    description: string;
  };
  deep: {
    title: string;
    description: string;
  };
  footerTip: string;
  footerSub: string;
}

export const homeContentMap: Record<UserRole, HomeContent> = {
  parent: {
    sos: {
      title: '我需要急救',
      description: '剛對孩子發脾氣 / 孩子哭鬧 / 快崩潰',
    },
    quick: {
      title: '快速記錄心情',
      description: '花 1 分鐘記下現在的感受',
    },
    deep: {
      title: '深度覺察練習',
      description: '完整的情緒探索與調節',
    },
    footerTip: '小提示：修復比完美更重要',
    footerSub: '每次願意面對自己的情緒，都是很棒的成長',
  },
  student: {
    sos: {
      title: '我需要急救',
      description: '考試壓力 / 同儕衝突 / 快要爆發',
    },
    quick: {
      title: '快速記錄心情',
      description: '花 1 分鐘釐清現在的情緒',
    },
    deep: {
      title: '深度覺察練習',
      description: '完整梳理情緒源頭與調節方式',
    },
    footerTip: '小提示：情緒沒有對錯，覺察就是力量',
    footerSub: '願意停下來看看自己，已經很勇敢了',
  },
  professional: {
    sos: {
      title: '我需要急救',
      description: '職場衝突 / deadline 壓力 / 瀕臨失控',
    },
    quick: {
      title: '快速記錄心情',
      description: '花 1 分鐘整理當下狀態',
    },
    deep: {
      title: '深度覺察練習',
      description: '從觸發到調節的完整探索',
    },
    footerTip: '小提示：暫停不是怠惰，是為了更好地前進',
    footerSub: '能覺察情緒的人，才有選擇回應的自由',
  },
  general: {
    sos: {
      title: '我需要急救',
      description: '情緒高漲 / 需要暫停 / 無法思考',
    },
    quick: {
      title: '快速記錄心情',
      description: '花 1 分鐘記下現在的感受',
    },
    deep: {
      title: '深度覺察練習',
      description: '完整的情緒探索與調節',
    },
    footerTip: '小提示：每一次覺察，都是改變的開始',
    footerSub: '你不需要立刻變好，只需要先看見自己',
  },
};
