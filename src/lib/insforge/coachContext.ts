import { insforge } from './client';
import { type RulerLogEntry } from '@/types/RulerTypes';

export interface CoachContext {
  id?: string;
  user_id: string;
  last_active: string;
  streak_days: number;
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  subscription_tier: 'free' | 'pro';
  proactive_count_this_month: number;
  coach_opted_in: boolean;
  line_user_id: string | null;
  push_token: string | null;
  coach_memory_expires_at: string | null;
  migration_completed_at: string | null;
  updated_at?: string;
}

export type CoachContextPatch = Partial<CoachContext> & { user_id: string };

// ── 元數據提取工具（純函數，可測試）────────────────────────────

export function extractRecentQuadrants(logs: RulerLogEntry[]): string[] {
  return logs
    .slice(-5)
    .map(l => l.emotions?.[0]?.quadrant ?? '')
    .filter(Boolean);
}

export function extractRecentNeeds(logs: RulerLogEntry[]): string[] {
  const seen = new Set<string>();
  return logs
    .slice(-10)
    .map(l => l.understanding?.need ?? null)
    .filter((n): n is string => n !== null && n.length > 0)
    .filter(n => !seen.has(n) && seen.add(n));
}

export function buildCoachContextPatch(
  userId: string,
  logs: RulerLogEntry[]
): CoachContextPatch {
  const recent = logs.slice(-10);
  const avgIntensity = recent.length > 0
    ? recent.reduce((sum, l) => sum + (l.intensity ?? 0), 0) / recent.length
    : 0;

  return {
    user_id: userId,
    last_active: new Date().toISOString(),
    recent_quadrants: extractRecentQuadrants(logs),
    recent_needs: extractRecentNeeds(logs),
    avg_intensity: Math.round(avgIntensity * 10) / 10,
  };
}

// ── InsForge CRUD ─────────────────────────────────────────────

export async function upsertCoachContext(patch: CoachContextPatch): Promise<void> {
  const { error } = await insforge.database
    .from('coach_context')
    .upsert(
      { ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(`coach_context upsert failed: ${error.message}`);
}

export async function getCoachContext(userId: string): Promise<CoachContext | null> {
  const { data, error } = await insforge.database
    .from('coach_context')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`coach_context fetch failed: ${error.message}`);
  return data as CoachContext | null;
}
