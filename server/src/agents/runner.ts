import { Runner, Gemini, isFinalResponse } from '@google/adk';
import { createUserContent } from '@google/genai';
import { createEmotionCoachAgent } from './emotionCoach.js';
import { InsForgeSessionService } from './session/InsForgeSessionService.js';

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
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_API_KEY not set — agent will fail at runtime');
  }
  return new Gemini({
    model: MODEL_NAME,
    apiKey: apiKey ?? '',
  });
}

export async function runCoach(
  userMessage: string,
  userId: string,
  sessionId: string
): Promise<CoachRunResult> {
  const model = getGeminiModel();
  const emotionCoachAgent = createEmotionCoachAgent(model);

  const sessionService = new InsForgeSessionService();

  const runner = new Runner({
    appName: APP_NAME,
    agent: emotionCoachAgent,
    sessionService,
  });

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
    if (event.author === 'EmergencyStabilizationSkill') {
      skillInvoked = 'emergency_stabilization';
    }

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

    if (isFinalResponse(event) && event.content?.parts?.length) {
      const part = event.content.parts[0];
      if ('text' in part && part.text) {
        responseText = part.text;
      }
    }
  }

  // 從持久化 session 中讀取最終狀態
  const finalSession = await sessionService.getSession({ appName: APP_NAME, userId, sessionId });
  if (finalSession?.state) {
    const legacyStepKey = 'meta' + '_moment_step';
    const s = finalSession.state.emergency_stabilization_step ?? finalSession.state[legacyStepKey];
    if (typeof s === 'number') step = s;
  }

  return {
    response: responseText,
    skillInvoked,
    step,
    action,
    actionReason,
  };
}
