import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const triggerActionTool = new FunctionTool({
  name: 'trigger_action',
  description: '觸發前端執行特定功能。當使用者同意或需要引導至某個功能時使用。例如：「我帶你做呼吸練習」→ trigger_action("start_breathing")；「來記錄一下今天的情緒」→ trigger_action("start_checkin")',
  parameters: z.object({
    action: z.enum([
      'start_breathing',
      'start_checkin',
      'open_sos',
      'show_history',
      'show_growth',
    ]).describe('要觸發的前端動作'),
    reason: z.string().optional().describe('觸發原因，會一併回傳給前端顯示'),
  }),
  execute: async (params: { action: string; reason?: string }) => {
    return {
      action_triggered: params.action,
      reason: params.reason ?? '',
      message: `已準備好「${params.action}」，請確認開始。`,
    };
  },
});
