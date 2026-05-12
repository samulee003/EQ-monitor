import { createClient } from '@supabase/supabase-js';
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const client = createClient(
  process.env.INSFORGE_URL || process.env.INSFORGE_BASE_URL || '',
  process.env.SERVICE_ROLE_KEY || ''
);

export const saveRulerLogTool = new FunctionTool({
  name: 'save_ruler_log',
  description: '幫使用者記錄一筆情緒日誌到資料庫。當使用者分享情緒狀態且沒有主動記錄時，主動幫他存下來。',
  parameters: z.object({
    userId: z.string().describe('使用者的 UUID'),
    emotions: z.array(z.object({
      name: z.string().describe('情緒名稱，例如「焦慮」、「平靜」'),
      quadrant: z.enum(['red', 'yellow', 'blue', 'green']).describe('情緒所在象限'),
    })).describe('辨識出的情緒列表'),
    intensity: z.number().min(1).max(10).describe('情緒強度 1-10'),
    notes: z.string().optional().describe('額外備註或情境描述'),
    trigger: z.string().optional().describe('情緒觸發事件'),
  }),
  execute: async (params: {
    userId: string;
    emotions: Array<{ name: string; quadrant: string }>;
    intensity: number;
    notes?: string;
    trigger?: string;
  }) => {
    const { error } = await client
      .from('ruler_logs')
      .insert({
        user_id: params.userId,
        emotions: params.emotions.map(e => ({ name: e.name, quadrant: e.quadrant })),
        intensity: params.intensity,
        notes: params.notes ?? null,
        trigger: params.trigger ?? null,
      });

    if (error) {
      console.error('save_ruler_log error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `已記錄 ${params.emotions.map(e => e.name).join('、')}，強度 ${params.intensity}/10。`,
    };
  },
});
