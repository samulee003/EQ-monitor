import './env.js';
import { UserSession, RulerStep, BotResponse, RulerData } from './types.js';
import {
  findEmotionWords,
  getQuadrantDescription,
  getNeedsForEmotion,
} from './emotionData.js';
import { db } from './db/index.js';
import { logger } from './utils/logger.js';
import {
  recordRulerSessionCompleted,
  recordRulerSessionTimedOut,
} from './utils/metrics.js';
import { isCrisisText, CRISIS_SOS_TEXT } from './crisisKeywords.js';

/**
 * 今心對話式四步狀態機
 * 管理用戶在 LINE/微信對話中的情緒覺察流程
 */

// 內存會話存儲（運行時狀態）
const sessions = new Map<string, UserSession>();
// 會話 ID 映射：userId -> sessionId（用於數據庫關聯）
const sessionIds = new Map<string, string>();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 分鐘超時

function getOrCreateSession(userId: string): UserSession {
  const existing = sessions.get(userId);
  if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) {
    existing.updatedAt = Date.now();
    return existing;
  }

  const session: UserSession = {
    userId,
    step: 'idle',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {},
  };
  sessions.set(userId, session);
  return session;
}

function clearSession(userId: string): void {
  sessions.delete(userId);
}

/**
 * 重置所有運行時會話狀態（僅用於測試）
 */
export function resetRulerBotState(): void {
  sessions.clear();
  sessionIds.clear();
  scheduledTasks.length = 0;
}

function advanceStep(session: UserSession, nextStep: RulerStep): void {
  session.step = nextStep;
  session.updatedAt = Date.now();
}

// ═══════════════════════════════════════════════════════════════
// 核心對話處理器
// ═══════════════════════════════════════════════════════════════

export async function processMessage(userId: string, text: string): Promise<BotResponse> {
  // ── 危機字詞優先處理 ──
  // 命中即回 SOS，不建立或推進知心四式 session，也不發放任何遊戲化獎勵。
  // 與 PWA Coach Edge Function（coach-simple.ts）共用 crisisKeywords.ts 字典。
  if (isCrisisText(text)) {
    const currentStep = sessions.get(userId)?.step ?? 'idle';
    try {
      await db.getOrCreateUser(userId);
      await db.saveMessage(userId, 'in', text, currentStep);
      await db.saveMessage(userId, 'out', CRISIS_SOS_TEXT, currentStep);
    } catch (err) {
      logger.error('Failed to persist crisis-flagged exchange', {
        userId,
        step: currentStep,
        error: (err as Error).message,
      });
    }
    logger.warn('Crisis keyword detected', { userId, step: currentStep });
    return { text: CRISIS_SOS_TEXT };
  }

  const session = getOrCreateSession(userId);

  // 確保用戶存在於數據庫
  await db.getOrCreateUser(userId);

  // 全局指令
  const lowerText = text.trim().toLowerCase();
  if (lowerText === '結束' || lowerText === '結束練習' || lowerText === 'end') {
    const dbSessionId = sessionIds.get(userId);
    if (dbSessionId) {
      await db.updateSession(dbSessionId, { status: 'abandoned' });
    }
    clearSession(userId);
    return {
      text: '練習已結束。照顧好自己的心，有需要隨時回來。🌿',
    };
  }

  if (lowerText === '幫助' || lowerText === 'help' || lowerText === '?') {
    return {
      text: `今心情緒陪伴 Bot 指令：
• 輸入任何話開始情緒覺察練習
• 「結束」— 結束當前練習
• 「幫助」— 顯示此說明
• 「週報」— 查看本週情緒統計

我會引導你完成知心四式情緒整理：
心照 → 喚名 → 安神 → 動念`,
    };
  }

  if (lowerText === '週報' || lowerText === 'weekly') {
    const stats = await db.getWeeklyStats(userId);
    return {
      text: `📊 你的情緒週報

• 累積覺察次數：**${stats.totalSessions}**
• 連續記錄天數：**${stats.streakDays}** 🔥

${stats.streakDays >= 3 ? '連續記錄很棒！情緒覺察是一種肌肉，越練越敏銳。' : '開始記錄就是最重要的第一步。'}

輸入任何話開始新的覺察練習。`,
    };
  }

  if (lowerText === '綁定' || lowerText === '綁定帳號' || lowerText === 'bind') {
    if (!db.createLineBindingCode) {
      return { text: '目前環境尚未支援 LINE 與 PWA 綁定。' };
    }
    const binding = await db.createLineBindingCode(userId);
    return {
      text: `這是你的 LINE 綁定碼：${binding.code}

請在今心 App 的「阿念教練」頁面輸入這 6 位碼。
綁定後，你在 LINE 完成的覺察練習會同步給阿念教練參考。

此綁定碼 10 分鐘內有效。`,
    };
  }

  // 保存用戶輸入消息
  await db.saveMessage(userId, 'in', text, session.step);

  // 狀態機分發
  let response: BotResponse;
  switch (session.step) {
    case 'idle':
      response = await handleIdle(session, text);
      break;
    case 'recognize':
      response = await handleRecognize(session, text);
      break;
    case 'understand':
      response = await handleUnderstand(session, text);
      break;
    case 'label':
      response = await handleLabel(session, text);
      break;
    case 'express':
      response = await handleExpress(session, text);
      break;
    case 'regulate':
      response = await handleRegulate(session, text);
      break;
    case 'summary':
      response = await handleSummary(session, text);
      break;
    case 'completed':
      response = await handleCompleted(session, text);
      break;
    default:
      response = { text: '抱歉，我不太明白。輸入「幫助」看看怎麼使用。' };
  }

  // 保存 Bot 回覆
  await db.saveMessage(userId, 'out', response.text, session.step);
  return response;
}

// ═══════════════════════════════════════════════════════════════
// 各步驟處理器
// ═══════════════════════════════════════════════════════════════

async function handleIdle(session: UserSession, text: string): Promise<BotResponse> {
  // 創建數據庫會話
  const dbSession = await db.createSession(session.userId);
  sessionIds.set(session.userId, dbSession.id);

  // 任何輸入都觸發覺察流程
  advanceStep(session, 'recognize');

  return {
    text: `謝謝你願意打開這個對話。✨

我注意到你說「${text}」。

讓我們一起做一次簡短的情緒覺察練習。只需要幾分鐘。

**第一式：心照**
心照一念，心不被情緒牽著走。
現在，閉上眼睛或放鬆視線，掃描一下你的身體——
哪個部位感覺最緊、最重或最不適？
（例如：胸口、肩膀、胃、頭、喉嚨）`,
    quickReplies: [
      { label: '胸口', text: '胸口', type: 'text' },
      { label: '肩膀', text: '肩膀', type: 'text' },
      { label: '胃部', text: '胃', type: 'text' },
      { label: '頭部', text: '頭', type: 'text' },
      { label: '喉嚨', text: '喉嚨', type: 'text' },
      { label: '說不出來', text: '說不出來', type: 'text' },
    ],
  };
}

async function handleRecognize(session: UserSession, text: string): Promise<BotResponse> {
  session.data.bodyPart = text;
  advanceStep(session, 'understand');

  // 更新數據庫會話
  const dbSessionId = sessionIds.get(session.userId);
  if (dbSessionId) {
    await db.updateSession(dbSessionId, { data: { bodyPart: text } });
  }

  return {
    text: `收到。${text === '說不出來' ? '沒關係，身體的感覺有時候很模糊。' : `你感覺到 ${text} 有些緊繃。`}

**第二式：喚名**
喚其真名，情緒就少三分迷霧。
如果用一個詞或幾個字來描述你現在的情緒，會是什麼？
（可以直接打出來，或選一個最接近的）`,
    quickReplies: [
      { label: '焦慮', text: '焦慮', type: 'text' },
      { label: '憤怒', text: '憤怒', type: 'text' },
      { label: '疲憊', text: '疲憊', type: 'text' },
      { label: '難過', text: '難過', type: 'text' },
      { label: '平靜', text: '平靜', type: 'text' },
      { label: '煩躁', text: '煩躁', type: 'text' },
    ],
  };
}

async function handleUnderstand(session: UserSession, text: string): Promise<BotResponse> {
  const matches = findEmotionWords(text, 6);

  if (matches.length === 1) {
    // 精確匹配一個詞
    const emotion = matches[0];
    session.data.emotionName = emotion.name;
    session.data.emotionQuadrant = emotion.quadrant;
    session.data.emotionIntensity = emotion.intensity;
    advanceStep(session, 'label');

    // 更新數據庫
    const dbSessionId = sessionIds.get(session.userId);
    if (dbSessionId) {
      await db.updateSession(dbSessionId, {
        data: {
          ...session.data,
          emotionName: emotion.name,
          emotionQuadrant: emotion.quadrant,
          emotionIntensity: emotion.intensity,
        },
      });
    }

    const needs = getNeedsForEmotion(emotion.name);

    return {
      text: `「${emotion.name}」——這個詞很準。

${getQuadrantDescription(emotion.quadrant)}

**第三式：安神**
安住心神，先把感受安放好。
先不用急著解決它。${emotion.name} 背後，你內心深處需要什麼？
（選一個最觸動你的，或自己打出來）`,
      quickReplies: needs.map((need) => ({
        label: need,
        text: need,
        type: 'text' as const,
      })),
    };
  }

  // 多個匹配，讓用戶選擇
  const options = matches.map((e) => e.name).join('、');

  return {
    text: `我聽到你可能在經歷這些情緒中的一些：${options}

哪一個**最準確**描述你現在的感受？（直接打出那個詞）`,
    quickReplies: matches.slice(0, 5).map((e) => ({
      label: e.name,
      text: e.name,
      type: 'text' as const,
    })),
  };
}

async function handleLabel(session: UserSession, text: string): Promise<BotResponse> {
  session.data.need = text;
  advanceStep(session, 'express');

  const dbSessionId = sessionIds.get(session.userId);
  if (dbSessionId) {
    await db.updateSession(dbSessionId, {
      data: { ...session.data, need: text },
    });
  }

  return {
    text: `「${text}」——這個需求很重要。

**第三式：安神**
現在我們來做一個小儀式，叫做「情緒碎紙機」。

把你此刻想說的話、想發的牢騷、想流的淚，
**全部打在這裡**。不需要邏輯，不需要禮貌，
就像把紙揉成一團丟進碎紙機一樣。

我會在這裡陪著你。`,
    quickReplies: [
      { label: '開始碎紙', text: '開始碎紙', type: 'text' },
      { label: '跳過這步', text: '跳過', type: 'text' },
    ],
  };
}

async function handleExpress(session: UserSession, text: string): Promise<BotResponse> {
  if (text === '跳過') {
    advanceStep(session, 'regulate');
    return regulationMenu();
  }

  session.data.expressionText = text;
  advanceStep(session, 'regulate');

  const dbSessionId = sessionIds.get(session.userId);
  if (dbSessionId) {
    await db.updateSession(dbSessionId, {
      data: { ...session.data, expressionText: text },
    });
  }

  return {
    text: `\uD83D\uDDD1️ 碎掉了。

那些話不需要被保存，不需要被評價。
它們只是需要**被說出來**。

你做得很好。

**第四式：動念**
一念可轉，再動下一念。
現在讓我們一起做一個回應練習，
幫助身體和情緒回到一個更平穩的狀態。`,
    quickReplies: [
      { label: '呼吸引導', text: '呼吸', type: 'text' },
      { label: '5-4-3-2-1 接地', text: '接地', type: 'text' },
      { label: '正念短引導', text: '正念', type: 'text' },
    ],
  };
}

function regulationMenu(): BotResponse {
  return {
    text: `**第四式：動念**

選一個你想嘗試的練習：`,
    quickReplies: [
      { label: '\uD83C\uDF2C️ 呼吸引導', text: '呼吸', type: 'text' },
      { label: '\uD83E\uDDF1 5-4-3-2-1 接地', text: '接地', type: 'text' },
      { label: '\uD83E\uDDD8 正念短引導', text: '正念', type: 'text' },
    ],
  };
}

async function handleRegulate(session: UserSession, text: string): Promise<BotResponse> {
  const technique =
    text.includes('呼吸') || text.includes('吸')
      ? 'breathing'
      : text.includes('接地') || text.includes('54321')
        ? 'grounding54321'
        : 'mindfulness';

  session.data.regulationTechnique = technique;
  advanceStep(session, 'summary');

  const dbSessionId = sessionIds.get(session.userId);
  if (dbSessionId) {
    await db.updateSession(dbSessionId, {
      data: { ...session.data, regulationTechnique: technique },
    });
  }

  const guides: Record<string, string> = {
    breathing: `\uD83C\uDF2C️ **呼吸引導**

跟著我的節奏：
• 吸氣 4 秒... 1、2、3、4
• 屏息 4 秒... 1、2、3、4
• 吐氣 6 秒... 1、2、3、4、5、6

再來一次。
吸... 吐...

最後一次。
讓呼吸回到自然的節奏。

完成後告訴我你現在感覺如何。`,
    grounding54321: `\uD83E\uDDF1 **5-4-3-2-1 接地練習**

讓我們用五官回到當下：

\uD83D\uDC41️ **看見 5 樣東西** — 環顧四周，說出你看到的 5 個物品
\uD83D\uDC42 **觸摸 4 樣東西** — 感受 4 種不同的質地
\uD83D\uDC42 **聽見 3 種聲音** — 靜下來，聽到 3 種聲音
\uD83D\uDC43 **聞到 2 種氣味** — 深呼吸，聞到 2 種氣味
\uD83D\uDC45 **嚐到 1 種味道** — 感受口腔裡的 1 種味道

完成後告訴我你現在感覺如何。`,
    mindfulness: `\uD83E\uDDD8 **正念短引導**

把注意輕輕地放在呼吸上。
不用改變它，只是觀察它。

吸氣... 呼氣...

如果腦中出現想法，沒關係，
這是大脑的工作。注意到它，
然後溫柔地把注意力帶回呼吸。

給自己 30 秒，
只需要陪伴此刻的呼吸。

完成後告訴我你現在感覺如何。`,
  };

  return {
    text: guides[technique],
    quickReplies: [
      { label: '好多了', text: '好多了', type: 'text' },
      { label: '平靜一些', text: '平靜一些', type: 'text' },
      { label: '還是一樣', text: '還是一樣', type: 'text' },
      { label: '更糟了', text: '更糟了', type: 'text' },
    ],
  };
}

async function handleSummary(session: UserSession, text: string): Promise<BotResponse> {
  session.data.postMood = text;

  const d = session.data;
  const emotion = d.emotionName || '此刻的情緒';
  const need = d.need || '內心的需求';

  // 完成數據庫會話
  const dbSessionId = sessionIds.get(session.userId);
  if (dbSessionId) {
    await db.completeSession(dbSessionId, session.data);
    recordRulerSessionCompleted();
  }

  let feedback = '';
  if (text.includes('好') || text.includes('平靜')) {
    feedback = '很高興聽到你感覺好一些了。這些練習需要時間，你已經在路上了。';
  } else if (text.includes('一樣') || text.includes('還是')) {
    feedback = '沒關係。有些情緒需要更多時間和陪伴。重要的是你願意面對它，這本身就是力量。';
  } else {
    feedback = '謝謝你誠實地說出來。如果情緒持續困擾你，請不要猶豫尋求專業支持。你值得被好好照顧。';
  }

  // 進入 completed 狀態，等待用戶最後回應後再清除
  advanceStep(session, 'completed');

  return {
    text: `**練習完成** ✨

讓我們回顧一下剛才的覺察：
• 身體感受：${d.bodyPart || '—'}
• 情緒命名：**${emotion}**
• 內在需求：**${need}**
• 調節後感受：${text}

${feedback}

---

\uD83D\uDCA1 **一個小建議**：
如果身邊有信任的人，
考慮把今天的覺察分享給他們。
「我今天發現自己很容易 ${emotion}，
原來我內心需要的是 ${need}。」

真實的連結，會讓這份覺察更容易被承接。

隨時回來，我在這裡。🌿`,
    quickReplies: [
      { label: '謝謝', text: '謝謝', type: 'text' },
      { label: '再練一次', text: '再練一次', type: 'text' },
    ],
  };
}

async function handleCompleted(session: UserSession, _text: string): Promise<BotResponse> {
  // 清除運行時會話
  clearSession(session.userId);
  sessionIds.delete(session.userId);

  return {
    text: `不客氣。照顧好自己的心，有需要隨時回來。🌿`,
  };
}

// ═══════════════════════════════════════════════════════════════
// 工具函數
// ═══════════════════════════════════════════════════════════════

/**
 * 獲取用戶當前狀態（用於調試）
 */
export function getSessionStatus(userId: string): string {
  const s = sessions.get(userId);
  if (!s) return '無活躍會話';
  return `步驟: ${s.step} | 情緒: ${s.data.emotionName || '未設置'} | 已進行 ${Math.round((Date.now() - s.createdAt) / 1000)} 秒`;
}

/**
 * 定期清理過期會話
 * 超時會話將標記為 abandoned，並從運行時移除
 */
export function cleanupSessions(): void {
  const now = Date.now();
  for (const [userId, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      const dbSessionId = sessionIds.get(userId);
      if (dbSessionId) {
        db
          .updateSession(dbSessionId, { status: 'abandoned' })
          .catch((err) => {
            logger.error('Failed to mark session abandoned on timeout', {
              userId,
              dbSessionId,
              error: (err as Error).message,
            });
          });
        sessionIds.delete(userId);
      }
      sessions.delete(userId);
      recordRulerSessionTimedOut();
      logger.info('Session timed out and cleaned up', { userId, step: session.step });
    }
  }
}

// 每 5 分鐘清理一次
setInterval(cleanupSessions, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// 每日主動推送調度框架
// ═══════════════════════════════════════════════════════════════

export interface PushMessage {
  userId: string;
  text: string;
  quickReplies?: BotResponse['quickReplies'];
}

export interface PushScheduler {
  /** 註冊一條每日推送任務 */
  schedule(dailyHour: number, factory: () => Promise<PushMessage[]>): void;
  /** 手動觸發所有已註冊的推送（用於測試） */
  triggerAll(): Promise<PushMessage[]>;
  /** 獲取已註冊的任務列表 */
  listTasks(): Array<{ dailyHour: number; name: string }>;
}

interface ScheduledTask {
  dailyHour: number;
  factory: () => Promise<PushMessage[]>;
  name: string;
}

const scheduledTasks: ScheduledTask[] = [];

export const pushScheduler: PushScheduler = {
  schedule(dailyHour: number, factory: () => Promise<PushMessage[]>): void {
    const name = `push-${dailyHour}h-${scheduledTasks.length}`;
    scheduledTasks.push({ dailyHour, factory, name });
    logger.info('Push task scheduled', { name, dailyHour });
  },

  async triggerAll(): Promise<PushMessage[]> {
    const results: PushMessage[] = [];
    for (const task of scheduledTasks) {
      try {
        const messages = await task.factory();
        results.push(...messages);
      } catch (err) {
        logger.error('Push task failed', {
          task: task.name,
          error: (err as Error).message,
        });
      }
    }
    return results;
  },

  listTasks(): Array<{ dailyHour: number; name: string }> {
    return scheduledTasks.map((t) => ({ dailyHour: t.dailyHour, name: t.name }));
  },
};

/**
 * 獲取活躍會話數（用於健康檢查）
 */
export function getActiveSessionCount(): number {
  return sessions.size;
}
