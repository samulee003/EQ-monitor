import { createClient } from 'npm:@insforge/sdk';
import { FunctionTool } from 'npm:@google/adk';
import { z } from 'npm:zod';

const client = createClient({
  baseUrl: Deno.env.get('INSFORGE_URL')!,
  anonKey: Deno.env.get('SERVICE_ROLE_KEY')!,
});

export interface EmotionLog {
  emotions: Array<{ name?: string; quadrant?: string; id?: string }>;
  intensity: number;
  created_at: string;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  last_checkin_date: string | null;
}

export interface EmotionSummary {
  recentLogs: EmotionLog[];
  streak: StreakData;
}

/**
 * 查詢使用者的情緒日誌與連續記錄統計
 */
export async function getUserEmotionSummary(userId: string): Promise<EmotionSummary> {
  const { data: logs, error: logsError } = await client.database
    .from('ruler_logs')
    .select('emotions, intensity, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) {
    console.error('ruler_logs query error:', logsError);
  }

  const { data: streak, error: streakError } = await client.database
    .from('streaks')
    .select('current_streak, longest_streak, total_logs, last_checkin_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (streakError) {
    console.error('streaks query error:', streakError);
  }

  return {
    recentLogs: (logs ?? []) as EmotionLog[],
    streak: (streak ?? {
      current_streak: 0,
      longest_streak: 0,
      total_logs: 0,
      last_checkin_date: null,
    }) as StreakData,
  };
}

/**
 * ADK FunctionTool 包裝：讓 Agent 可以查詢使用者情緒歷史
 */
export const rulerDataTool = new FunctionTool({
  name: 'get_user_emotion_summary',
  description: '查詢使用者的最近情緒日誌與連續記錄統計，幫助教練了解使用者背景。',
  parameters: z.object({
    userId: z.string().describe('使用者的 UUID'),
  }),
  execute: async (params: { userId: string }) => {
    const summary = await getUserEmotionSummary(params.userId);
    return {
      recent_logs_count: summary.recentLogs.length,
      recent_emotions: summary.recentLogs.map((log) => ({
        emotions: log.emotions,
        intensity: log.intensity,
        date: log.created_at,
      })),
      current_streak: summary.streak.current_streak,
      longest_streak: summary.streak.longest_streak,
      total_logs: summary.streak.total_logs,
    };
  },
});
