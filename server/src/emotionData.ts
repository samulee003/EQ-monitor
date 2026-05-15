import { EmotionWord } from './types.js';

/**
 * 今心情緒詞彙庫 — 繁體中文
 * 使用今心四色狀態分類
 */

export const EMOTION_WORDS: EmotionWord[] = [
  // 紅色狀態：很滿、卡住
  { name: '憤怒', quadrant: 'red', intensity: 8 },
  { name: '焦慮', quadrant: 'red', intensity: 7 },
  { name: '緊張', quadrant: 'red', intensity: 6 },
  { name: '煩躁', quadrant: 'red', intensity: 6 },
  { name: '惱怒', quadrant: 'red', intensity: 7 },
  { name: '驚慌', quadrant: 'red', intensity: 8 },
  { name: '壓力大', quadrant: 'red', intensity: 7 },
  { name: '無力感', quadrant: 'red', intensity: 6 },
  { name: '委屈', quadrant: 'red', intensity: 5 },
  { name: '不公平', quadrant: 'red', intensity: 6 },

  // 黃色狀態：很滿、順心
  { name: '興奮', quadrant: 'yellow', intensity: 8 },
  { name: '快樂', quadrant: 'yellow', intensity: 7 },
  { name: '滿足', quadrant: 'yellow', intensity: 6 },
  { name: '感恩', quadrant: 'yellow', intensity: 6 },
  { name: '希望', quadrant: 'yellow', intensity: 7 },
  { name: '自豪', quadrant: 'yellow', intensity: 6 },
  { name: '期待', quadrant: 'yellow', intensity: 7 },

  // 藍色狀態：很慢、卡住
  { name: '憂鬱', quadrant: 'blue', intensity: 7 },
  { name: '疲憊', quadrant: 'blue', intensity: 6 },
  { name: '沮喪', quadrant: 'blue', intensity: 6 },
  { name: '孤單', quadrant: 'blue', intensity: 7 },
  { name: '無助', quadrant: 'blue', intensity: 8 },
  { name: '失落', quadrant: 'blue', intensity: 6 },
  { name: '空虛', quadrant: 'blue', intensity: 7 },
  { name: '悲傷', quadrant: 'blue', intensity: 6 },
  { name: '絕望', quadrant: 'blue', intensity: 8 },

  // 綠色狀態：很慢、順心
  { name: '平靜', quadrant: 'green', intensity: 5 },
  { name: '放鬆', quadrant: 'green', intensity: 5 },
  { name: '安心', quadrant: 'green', intensity: 6 },
  { name: '舒服', quadrant: 'green', intensity: 5 },
  { name: '踏實', quadrant: 'green', intensity: 5 },
  { name: '穩定', quadrant: 'green', intensity: 4 },
  { name: '自在', quadrant: 'green', intensity: 5 },
];

/**
 * 根據用戶輸入匹配情緒詞
 */
export function findEmotionWords(input: string, limit = 6): EmotionWord[] {
  const normalized = input.trim();

  // 直接匹配
  const exactMatch = EMOTION_WORDS.find((e) => e.name === normalized);
  if (exactMatch) return [exactMatch];

  // 部分匹配
  const matches = EMOTION_WORDS.filter((e) =>
    e.name.includes(normalized) || normalized.includes(e.name)
  );

  if (matches.length > 0) return matches.slice(0, limit);

  // 關鍵字模糊匹配（簡易版）
  const keywords: Record<string, string[]> = {
    red: ['生氣', '怒', '煩', '急', '壓', '慌'],
    yellow: ['開心', '高興', '棒', '好', '喜', '樂'],
    blue: ['難過', '累', '悶', '低', '哭', 'down'],
    green: ['還好', 'OK', 'ok', '平', '穩', '靜'],
  };

  for (const [quadrant, words] of Object.entries(keywords)) {
    if (words.some((w) => normalized.includes(w))) {
      return EMOTION_WORDS.filter((e) => e.quadrant === quadrant).slice(0, limit);
    }
  }

  // 默認返回高頻情緒詞
  return EMOTION_WORDS.slice(0, limit);
}

/**
 * 獲取狀態色彩描述
 */
export function getQuadrantDescription(quadrant: string): string {
  const descriptions: Record<string, string> = {
    red: '紅色狀態：很滿、卡住 — 憤怒、焦慮、緊張',
    yellow: '黃色狀態：很滿、順心 — 興奮、快樂、感恩',
    blue: '藍色狀態：很慢、卡住 — 憂鬱、疲憊、孤單',
    green: '綠色狀態：很慢、順心 — 平靜、放鬆、安心',
  };
  return descriptions[quadrant] || '';
}

/**
 * 常見心理需求對照
 */
export const PSYCHOLOGICAL_NEEDS: Record<string, string[]> = {
  憤怒: ['被尊重', '公平對待', '掌控感'],
  焦慮: ['安全感', '確定性', '被支持'],
  緊張: ['準備時間', '掌控感', '被肯定'],
  煩躁: ['空間', '安靜', '被理解'],
  憂鬱: ['連結', '意義感', '被看見'],
  疲憊: ['休息', '界限', '被照顧'],
  孤單: ['歸屬', '陪伴', '被接納'],
  無助: ['支持', '選擇權', '被信任'],
  沮喪: ['希望', '進展', '被鼓勵'],
  興奮: ['分享', '表達', '被認可'],
  快樂: ['延續', '感恩', '被回應'],
  平靜: ['穩定', '信任', '被允許'],
  放鬆: ['放下', '享受', '被接納'],
};

export function getNeedsForEmotion(emotionName: string): string[] {
  return PSYCHOLOGICAL_NEEDS[emotionName] || ['被理解', '被接納', '安全感'];
}
