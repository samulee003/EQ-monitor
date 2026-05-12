import { createClient } from '@supabase/supabase-js';
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

// 懶初始化：避免測試環境缺少環境變數時模組載入失敗
let _client: ReturnType<typeof createClient> | null = null;
function getClient(): ReturnType<typeof createClient> {
  if (!_client) {
    _client = createClient(
      process.env.INSFORGE_URL || process.env.INSFORGE_BASE_URL || 'http://localhost',
      process.env.SERVICE_ROLE_KEY || 'placeholder'
    );
  }
  return _client;
}
const client = { from: (table: string) => getClient().from(table) } as ReturnType<typeof createClient>;

export const getEmotionTrendTool = new FunctionTool({
  name: 'get_emotion_trend',
  description: '分析使用者最近 N 天的情緒趨勢，包含最常出現的情緒、平均強度、象限分佈與連續記錄資訊。用於個人化回應與模式洞察。',
  parameters: z.object({
    userId: z.string().describe('使用者的 UUID'),
    days: z.number().min(1).max(90).default(7).describe('分析最近幾天，預設 7 天'),
  }),
  execute: async (params: { userId: string; days: number }) => {
    const since = new Date();
    since.setDate(since.getDate() - params.days);
    const sinceIso = since.toISOString();

    const [{ data: logs, error: logsErr }, { data: streak, error: streakErr }] = await Promise.all([
      client
        .from('ruler_logs')
        .select('emotions, intensity, created_at')
        .eq('user_id', params.userId)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false }),
      client
        .from('streaks')
        .select('current_streak, longest_streak, total_logs, last_checkin_date')
        .eq('user_id', params.userId)
        .maybeSingle(),
    ]);

    if (logsErr) {
      console.error('getEmotionTrend logs error:', logsErr);
    }

    const entries = logs ?? [];
    if (entries.length === 0) {
      return {
        has_data: false,
        days_analyzed: params.days,
        message: '這段時間尚無情緒日誌記錄。',
        streak: streak ?? { current_streak: 0, longest_streak: 0, total_logs: 0 },
      };
    }

    const intensities = entries.map((e: { intensity: number }) => e.intensity);
    const avgIntensity = Math.round(
      intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length
    );

    const quadrantCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    for (const entry of entries) {
      const quads = (entry as { emotions?: Array<{ quadrant?: string; name?: string }> }).emotions ?? [];
      for (const em of quads) {
        if (em.quadrant) {
          quadrantCounts[em.quadrant] = (quadrantCounts[em.quadrant] || 0) + 1;
        }
        if (em.name) {
          emotionCounts[em.name] = (emotionCounts[em.name] || 0) + 1;
        }
      }
    }

    const dominantQuadrant = Object.entries(quadrantCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const latestIntensity = entries[0]?.intensity ?? 0;
    const trend = latestIntensity > avgIntensity ? 'rising' : latestIntensity < avgIntensity ? 'falling' : 'stable';

    return {
      has_data: true,
      days_analyzed: params.days,
      total_entries: entries.length,
      avg_intensity: avgIntensity,
      latest_intensity: latestIntensity,
      trend,
      dominant_quadrant: dominantQuadrant,
      top_emotions: topEmotions,
      quadrant_distribution: quadrantCounts,
      streak: streak ?? { current_streak: 0, longest_streak: 0, total_logs: entries.length },
    };
  },
});
