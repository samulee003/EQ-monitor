import { type RulerLogEntry } from '@/types/RulerTypes';
import { upsertCoachContext, buildCoachContextPatch } from './coachContext';

export interface MigrationMeta {
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  streak_days: number;
}

export function isMigrationNeeded(migrationCompletedAt: string | null): boolean {
  if (migrationCompletedAt) return false;
  const raw = localStorage.getItem('feelings_logs');
  if (!raw) return false;
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
    const dateStr = log.timestamp.slice(0, 10);
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
  const raw = localStorage.getItem('feelings_logs');
  const logs: RulerLogEntry[] = raw ? (JSON.parse(raw) as RulerLogEntry[]) : [];
  const total = logs.length;

  onProgress?.(0, total);

  const meta = extractCoachMetaFromLogs(logs);

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
