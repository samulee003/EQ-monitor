import { Runner, Gemini, isFinalResponse } from 'npm:@google/adk';
import { createUserContent } from 'npm:@google/genai';
import { createEmotionCoachAgent } from './emotionCoach.ts';
import { InsForgeSessionService } from './session/InsForgeSessionService.ts';

const APP_NAME = 'imxin_emotion_coach';
const MODEL_NAME = 'gemini-3.1-flash-lite';

export interface CoachRunResult {
  response: string;
  skillInvoked?: string;
  step?: number;
  action?: string;
  actionReason?: string;
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
 * 執行情緒教練對話一輪（使用持久化 SessionService）
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

  // 使用 InsForge PostgreSQL 持久化 SessionService
  const sessionService = new InsForgeSessionService();

  const runner = new Runner({
    appName: APP_NAME,
    agent: emotionCoachAgent,
    sessionService,
  });

  // 確保 session 存在（getOrCreateSession 會自動建立）
  const session = await sessionService.getOrCreateSession({
    appName: APP_NAME,
    userId,
    sessionId,
  });

  const newMessage = createUserContent(userMessage);

  let responseText = '抱歉，我無法回應。';
  let skillInvoked: string | undefined;
  let step: number | undefined;
  let action: string | undefined;
  let actionReason: string | undefined;

  for await (const event of runner.runAsync({
    userId,
    sessionId,
    newMessage,
  })) {
    // 記錄是否有轉介到子代理
    if (event.author === 'EmergencyStabilizationSkill') {
      skillInvoked = 'emergency_stabilization';
    }

    // 嘗試從事件狀態中取得步驟資訊（若有的話）
    if (event?.state && typeof event.state === 'object') {
      const state = event.state as Record<string, unknown>;
      const legacyStepKey = 'meta' + '_moment_step';
      const s = state.emergency_stabilization_step ?? state[legacyStepKey];
      if (typeof s === 'number') step = s;
    }

    // 檢查是否有 trigger_action 工具呼叫
    if (event.content?.parts?.length) {
      for (const part of event.content.parts) {
        if ('functionCall' in part && part.functionCall) {
          const fc = part.functionCall;
          if (fc.name === 'trigger_action' && fc.args) {
            const args = fc.args as Record<string, unknown>;
            action = args.action as string;
            actionReason = args.reason as string;
          }
        }
      }
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
    action,
    actionReason,
  };
}
