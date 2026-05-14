import { type RulerLogEntry } from '@/types/RulerTypes';
import { upsertCoachContext, buildCoachContextPatch } from './coachContext';
import { insforge } from './client';
import { decryptData, isEncrypted } from '@/utils/crypto';

export interface MigrationMeta {
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  streak_days: number;
}

type MigratedRulerLogRow = {
  user_id: string;
  emotions: RulerLogEntry['emotions'];
  intensity: number;
  body_scan: RulerLogEntry['bodyScan'];
  understanding: RulerLogEntry['understanding'];
  expressing: RulerLogEntry['expressing'];
  regulating: RulerLogEntry['regulating'];
  physical_context: RulerLogEntry['physicalContext'] | null;
  post_mood: string | null;
  is_full_flow: boolean;
  created_at: string;
  updated_at: string;
};

const clampIntensity = (value: number): number =>
  Math.min(10, Math.max(1, Math.round(value || 1)));

const toRulerLogRow = (userId: string, log: RulerLogEntry): MigratedRulerLogRow => {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    emotions: log.emotions ?? [],
    intensity: clampIntensity(log.intensity),
    body_scan: log.bodyScan ?? null,
    understanding: log.understanding ?? null,
    expressing: log.expressing ?? null,
    regulating: log.regulating ?? null,
    physical_context: log.physicalContext ?? null,
    post_mood: log.postMood || null,
    is_full_flow: log.isFullFlow ?? false,
    created_at: log.timestamp || now,
    updated_at: now,
  };
};

async function readLocalLogs(): Promise<RulerLogEntry[]> {
  const raw = localStorage.getItem('feelings_logs');
  if (!raw) return [];

  const json = isEncrypted(raw) ? await decryptData(raw) : raw;
  if (!json) return [];

  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed as RulerLogEntry[] : [];
  } catch {
    console.warn('[Migration] Failed to parse feelings_logs, treating as empty');
    return [];
  }
}

async function migrateRulerLogs(userId: string, logs: RulerLogEntry[]): Promise<void> {
  if (logs.length === 0) return;

  const { error } = await insforge.database
    .from('ruler_logs')
    .insert(logs.map(log => toRulerLogRow(userId, log)));

  if (error) throw new Error(`ruler_logs migration failed: ${error.message}`);
}

export function isMigrationNeeded(migrationCompletedAt: string | null): boolean {
  if (migrationCompletedAt) return false;
  const raw = localStorage.getItem('feelings_logs');
  if (!raw) return false;
  if (isEncrypted(raw)) return true;
  try {
    const logs = JSON.parse(raw) as unknown[];
    return Array.isArray(logs) && logs.length > 0;
  } catch {
    return false;
  }
}

export function extractCoachMetaFromLogs(logs: RulerLogEntry[]): MigrationMeta {
  if (logs.length === 0) {
    return { recent_quadrants: [], recent_needs: [], avg_intensity: 0, streak_days: 0 };
  }

  const patch = buildCoachContextPatch('_', logs);
  const sorted = [...logs].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  let streak = 0;
  let prevDate = '';
  for (const log of sorted) {
    // 使用本地時區的日期，避免 UTC 邊界誤判
    const dateStr = new Date(log.timestamp).toLocaleDateString('sv-SE');
    if (!prevDate) { streak = 1; prevDate = dateStr; continue; }
    const diff = (new Date(prevDate).getTime() - new Date(dateStr).getTime()) / 86400000;
    if (diff <= 1) { streak++; prevDate = dateStr; } else break;
  }

  return {
    recent_quadrants: patch.recent_quadrants ?? [],
    recent_needs: patch.recent_needs ?? [],
    avg_intensity: patch.avg_intensity ?? 0,
    streak_days: streak,
  };
}

export async function runMigration(
  userId: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const logs = await readLocalLogs();
  const total = logs.length;

  onProgress?.(0, total);

  const meta = extractCoachMetaFromLogs(logs);

  await migrateRulerLogs(userId, logs);
  onProgress?.(Math.floor(total * 0.5), total);
  await new Promise(r => setTimeout(r, 300));
  onProgress?.(Math.floor(total * 0.8), total);
  await new Promise(r => setTimeout(r, 200));

  await upsertCoachContext({
    user_id: userId,
    ...meta,
    migration_completed_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
  });

  onProgress?.(total, total);
}
