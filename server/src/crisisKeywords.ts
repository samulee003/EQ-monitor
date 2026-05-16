/**
 * 危機字詞偵測共用模組
 *
 * 偵測使用者訊息中可能的自傷、自殺或求救意念，命中時應切到 SOS 回應，
 * 不進入知心四式覺察流程，也不發放任何遊戲化獎勵。
 *
 * LINE Bot（rulerBot.ts）與 PWA Coach Edge Function（coach-simple.ts）
 * 共用同一份字典。若調整，請同步檢視兩處避免安全邊界漂移。
 */

export const CRISIS_KEYWORDS = [
  '撐不下去',
  '想死',
  '想結束一切',
  '不想活',
  '活不下去',
  '沒有意義',
  '沒意義',
  '自殺',
  '自傷',
  '跳樓',
  '割腕',
  'SOS',
  '緊急協助',
  '幫幫我',
  '救命',
] as const;

export function isCrisisText(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * LINE Bot 命中危機字詞時的固定回覆。
 * 提供台灣官方求助資源，刻意不繼續推進知心四式流程。
 */
export const CRISIS_SOS_TEXT = `謝謝你願意把這句話說出口。🌿

我聽到你現在很辛苦。我沒辦法代替專業協助，但我想先陪你停一下、深呼吸三次。

如果你正在受傷或有人正在受傷，請優先撥打 **119**。
如果你想找人說話，這幾條線 24 小時都有人接：

• **1925** 安心專線（衛福部，免付費）
• **1995** 生命線
• **1980** 張老師專線

你不需要獨自面對。我會在這裡，等你回來繼續照顧自己的心。`;
