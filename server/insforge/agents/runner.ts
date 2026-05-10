import { InMemoryRunner, Gemini, isFinalResponse } from 'npm:@google/adk';
import { createUserContent } from 'npm:@google/genai';
import { createEmotionCoachAgent } from './emotionCoach.ts';

const APP_NAME = 'imxin_emotion_coach';
const MODEL_NAME = 'gemini-3.1-flash-lite';

export interface CoachRunResult {
  response: string;
  skillInvoked?: string;
  step?: number;
}

function getGeminiModel() {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    console.warn('GOOGLE_API_KEY not set — agent will fail at runtime');
  }
  return new Gemini({
    model: MODEL_NAME,
    apiKey: apiKey ?? '',
  });
}

/**
 * 執行情緒教練對話一輪
 *
 * @param userMessage 使用者輸入訊息
 * @param userId      使用者 UUID
 * @param sessionId   對話 session ID
 */
export async function runCoach(
  userMessage: string,
  userId: string,
  sessionId: string
): Promise<CoachRunResult> {
  const model = getGeminiModel();
  const emotionCoachAgent = createEmotionCoachAgent(model);

  const runner = new InMemoryRunner({
    agent: emotionCoachAgent,
    appName: APP_NAME,
  });

  // 確保 session 存在
  await runner.sessionService.createSession({
    appName: APP_NAME,
    userId,
    sessionId,
  });

  const newMessage = createUserContent(userMessage);

  let responseText = '抱歉，我無法回應。';
  let skillInvoked: string | undefined;
  let step: number | undefined;

  for await (const event of runner.runAsync({
    userId,
    sessionId,
    newMessage,
  })) {
    // 記錄是否有轉介到子代理
    if (event.author === 'MetaMomentSkill') {
      skillInvoked = 'MetaMomentSkill';
    }

    // 嘗試從事件狀態中取得步驟資訊（若有的話）
    if (event?.state && typeof event.state === 'object') {
      const s = (event.state as Record<string, unknown>)?.meta_moment_step;
      if (typeof s === 'number') step = s;
    }

    // 取得最終回應文字
    if (isFinalResponse(event) && event.content?.parts?.length) {
      const part = event.content.parts[0];
      if ('text' in part && part.text) {
        responseText = part.text;
      }
    }
  }

  return {
    response: responseText,
    skillInvoked,
    step,
  };
}
