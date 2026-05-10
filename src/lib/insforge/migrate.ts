#!/usr/bin/env node
/**
 * LocalStorage → InsForge 數據遷移腳本
 *
 * 用法：
 *   MIGRATION_LS_PATH=./localStorage-export.json \
 *   MIGRATION_MASTER_KEY=<hex_key> \
 *   INSFORGE_EMAIL=<email> \
 *   INSFORGE_PASSWORD=<password> \
 *   [VITE_INSFORGE_URL=<url>] \
 *   npm run migrate
 *
 * 說明：
 *   1. 從瀏覽器 DevTools Console 執行以下代碼匯出 localStorage：
 *      const data = {};
 *      for (let i = 0; i < localStorage.length; i++) {
 *        const key = localStorage.key(i);
 *        if (key) data[key] = localStorage.getItem(key);
 *      }
 *      copy(JSON.stringify(data, null, 2));
 *      console.log('已複製到剪貼簿');
 *
 *   2. 從瀏覽器 DevTools Console 執行以下代碼取得 master key：
 *      const req = indexedDB.open('imxin_crypto', 1);
 *      req.onsuccess = () => {
 *        const tx = req.result.transaction('encryption_keys', 'readonly');
 *        const store = tx.objectStore('encryption_keys');
 *        const getReq = store.get('master_key_v2');
 *        getReq.onsuccess = () => { copy(getReq.result); console.log('key copied'); };
 *      };
 */

import fs from 'node:fs';
import { createClient } from '@insforge/sdk';
import { _injectMasterKey } from '../../utils/crypto';
import { StorageKeys } from '../../adapters/types';
import type {
  UserProfile,
  AchievementRecord,
  StreakInfo,
} from '../../adapters/types';
import type { RulerLogEntry, RulerDraft } from '../../types/RulerTypes';
import type {
  Profile,
  RulerLogRow,
  RulerDraftRow,
  AchievementRecordRow,
  StreakRow,
} from './types';

/* ------------------------------------------------------------------ */
/*  localStorage polyfill                                               */
/* ------------------------------------------------------------------ */

class LocalStorageMock implements Storage {
  private data: Record<string, string> = {};

  constructor(initialData: Record<string, string> = {}) {
    this.data = { ...initialData };
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }

  key(index: number): string | null {
    return Object.keys(this.data)[index] ?? null;
  }

  get length(): number {
    return Object.keys(this.data).length;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ 缺少環境變數: ${name}`);
    process.exit(1);
  }
  return value;
}

function logProgress(current: number, total: number, label: string): void {
  const pct = total > 0 ? Math.round((current / total) * 100) : 100;
  process.stdout.write(`\r   [${current}/${total}] ${pct}% ${label}`);
}

/* ------------------------------------------------------------------ */
/*  Transformers                                                        */
/* ------------------------------------------------------------------ */

function transformProfile(profile: UserProfile | null, ls: Storage): Profile | null {
  if (!profile) return null;
  return {
    id: profile.id,
    display_name: profile.displayName || null,
    avatar_url: profile.avatar || null,
    timezone: profile.timezone || 'Asia/Taipei',
    language: (profile.language || 'zh-TW') as 'zh-TW' | 'zh-CN',
    theme_preference: (profile.themePreference || 'system') as 'dark' | 'light' | 'system',
    privacy_enabled: profile.privacyEnabled || false,
    notification_settings: profile.notificationSettings || {},
    onboarding_completed: ls.getItem(StorageKeys.ONBOARDING_COMPLETED) === 'true',
    user_role: ls.getItem(StorageKeys.USER_ROLE) || '',
    created_at: profile.createdAt || new Date().toISOString(),
    updated_at: profile.updatedAt || new Date().toISOString(),
  };
}

function transformLog(log: RulerLogEntry): Omit<RulerLogRow, 'user_id'> {
  return {
    id: log.id,
    emotions: log.emotions.map((e) => ({
      id: e.id,
      name: e.name,
      quadrant: e.quadrant,
      energy: e.energy ?? 0,
      pleasantness: e.pleasantness ?? 0,
    })),
    intensity: log.intensity,
    body_scan: log.bodyScan,
    understanding: log.understanding,
    expressing: log.expressing,
    regulating: log.regulating,
    physical_context: log.physicalContext
      ? {
          sleepHours: log.physicalContext.sleepHours,
          activityLevel: String(log.physicalContext.activityLevel),
        }
      : null,
    post_mood: log.postMood || null,
    is_full_flow: log.isFullFlow ?? false,
    created_at: log.timestamp,
  };
}

function transformDraft(draft: RulerDraft, userId: string): RulerDraftRow {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    step: draft.step,
    selected_quadrants: draft.selectedQuadrants,
    selected_emotions: draft.selectedEmotions.map((e) => ({
      id: e.id,
      name: e.name,
      quadrant: e.quadrant,
    })),
    emotion_intensity: draft.emotionIntensity,
    body_scan: draft.bodyScanData,
    understanding: draft.understandingData,
    expressing: draft.expressingData,
    regulating: draft.regulatingData,
    is_full_flow: draft.isFullFlow,
    post_regulation_mood: draft.postRegulationMood || null,
    updated_at: new Date().toISOString(),
  };
}

function transformAchievement(ach: AchievementRecord, userId: string): AchievementRecordRow {
  return {
    id: ach.id,
    user_id: userId,
    achievement_key: ach.achievementKey,
    unlocked_at: ach.unlockedAt,
    viewed: ach.viewed,
  };
}

function transformStreak(streak: StreakInfo, userId: string): StreakRow {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    current_streak: streak.currentStreak,
    longest_streak: streak.longestStreak,
    last_checkin_date: streak.lastCheckinDate,
    checkin_count: streak.checkinCount,
    weekly_count: streak.weeklyCount,
    monthly_count: streak.monthlyCount,
    updated_at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Main                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const lsPath = getEnv('MIGRATION_LS_PATH');
  const masterKey = getEnv('MIGRATION_MASTER_KEY');
  const email = getEnv('INSFORGE_EMAIL');
  const password = getEnv('INSFORGE_PASSWORD');
  const apiUrl = process.env.VITE_INSFORGE_URL || 'https://b88egxiz.ap-southeast.insforge.app';

  /* -- load localStorage -- */
  if (!fs.existsSync(lsPath)) {
    console.error(`❌ 找不到 localStorage 匯出檔案: ${lsPath}`);
    process.exit(1);
  }
  const lsData: Record<string, string> = JSON.parse(fs.readFileSync(lsPath, 'utf-8'));
  const ls = new LocalStorageMock(lsData);
  (globalThis as unknown as Record<string, unknown>).localStorage = ls;

  /* -- inject crypto key (bypass IndexedDB) -- */
  _injectMasterKey(masterKey);

  /* -- import storage module after polyfills are ready -- */
  const { dataAdapter } = await import('../../adapters/storage');
  await dataAdapter.initialize();

  /* -- read all local data -- */
  console.log('📖 正在讀取 LocalStorage 數據...');
  const [profile, logs, draft, progress, achievements, streak] = await Promise.all([
    dataAdapter.profile.get(),
    dataAdapter.logs.export(),
    dataAdapter.draft.get(),
    dataAdapter.profile.getProgress(),
    dataAdapter.achievements.list(),
    dataAdapter.streak.get(),
  ]);

  console.log(`   用戶: ${profile?.displayName || profile?.email || 'unknown'}`);
  console.log(`   日誌: ${logs.length} 筆`);
  console.log(`   草稿: ${draft ? '有' : '無'}`);
  console.log(`   成就: ${achievements.length} 個`);
  console.log(`   連續: ${streak?.currentStreak ?? progress?.streak?.currentStreak ?? 0} 天`);

  /* -- connect to InsForge -- */
  console.log('\n🔗 正在連接 InsForge...');
  const insforge = createClient({
    baseUrl: apiUrl,
    isServerMode: true,
  });

  const { data: session, error: authError } = await insforge.auth.signInWithPassword({
    email,
    password,
  });
  if (authError || !session) {
    console.error('❌ 登入失敗:', authError?.message || '未知錯誤');
    process.exit(1);
  }
  console.log('✅ 登入成功');

  const userId = session.user.id;

  /* -- migrate profile -- */
  console.log('\n👤 遷移用戶資料...');
  const profileRow = transformProfile(profile, ls);
  if (profileRow) {
    const { error } = await insforge.database
      .from('profiles')
      .upsert([{ ...profileRow, id: userId }], { onConflict: 'id' });
    if (error) {
      console.error('   ❌ 用戶資料遷移失敗:', error.message);
    } else {
      console.log('   ✅ 用戶資料已同步');
    }
  } else {
    console.log('   ⏭️  無用戶資料，跳過');
  }

  /* -- migrate logs (last-write-wins) -- */
  console.log('\n📝 遷移情緒日誌...');
  let logsImported = 0;
  let logsSkipped = 0;
  let logsFailed = 0;

  const { data: existingLogs } = await insforge.database
    .from('ruler_logs')
    .select('id, created_at');
  const existingLogMap = new Map<string, string>(
    (existingLogs || []).map((l: Record<string, string>) => [l.id, l.created_at]),
  );

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    logProgress(i + 1, logs.length, log.emotions.map((e) => e.name).join(', ') || '');

    const backendTs = existingLogMap.get(log.id);
    if (backendTs && new Date(backendTs) >= new Date(log.timestamp)) {
      logsSkipped++;
      continue;
    }

    const row = transformLog(log);
    const { error } = await insforge.database
      .from('ruler_logs')
      .upsert([row], { onConflict: 'id' });
    if (error) {
      logsFailed++;
      console.error(`\n   ❌ 日誌 ${log.id} 失敗:`, error.message);
    } else {
      logsImported++;
    }
  }
  console.log(`\n   ✅ 匯入 ${logsImported} 筆, 跳過 ${logsSkipped} 筆, 失敗 ${logsFailed} 筆`);

  /* -- migrate draft -- */
  console.log('\n✏️  遷移草稿...');
  if (draft) {
    const draftRow = transformDraft(draft, userId);
    const { error } = await insforge.database
      .from('ruler_drafts')
      .upsert([draftRow], { onConflict: 'user_id' });
    if (error) {
      console.error('   ❌ 草稿遷移失敗:', error.message);
    } else {
      console.log('   ✅ 草稿已同步');
    }
  } else {
    console.log('   ⏭️  無草稿，跳過');
  }

  /* -- migrate achievements (last-write-wins) -- */
  console.log('\n🏆 遷移成就...');
  let achImported = 0;
  let achSkipped = 0;

  const { data: existingAch } = await insforge.database
    .from('achievement_records')
    .select('id, achievement_key, unlocked_at');
  const existingAchMap = new Map<string, { id: string; unlocked_at: string }>(
    (existingAch || []).map((a: { achievement_key: string; id: string; unlocked_at: string }) => [
      a.achievement_key,
      { id: a.id, unlocked_at: a.unlocked_at },
    ]),
  );

  for (const ach of achievements) {
    const existing = existingAchMap.get(ach.achievementKey);
    if (existing && new Date(existing.unlocked_at) >= new Date(ach.unlockedAt)) {
      achSkipped++;
      continue;
    }

    const row = transformAchievement(ach, userId);
    const { error } = await insforge.database
      .from('achievement_records')
      .upsert([row], { onConflict: 'id' });
    if (error) {
      console.error(`   ❌ 成就 ${ach.achievementKey} 失敗:`, error.message);
    } else {
      achImported++;
    }
  }
  console.log(`   ✅ 匯入 ${achImported} 筆, 跳過 ${achSkipped} 筆`);

  /* -- migrate streak -- */
  console.log('\n🔥 遷移連續記錄...');
  const streakToMigrate: StreakInfo | null = streak
    ? streak
    : progress?.streak
      ? {
          currentStreak: progress.streak.currentStreak,
          longestStreak: progress.streak.longestStreak,
          lastCheckinDate: progress.streak.lastLogDate,
          checkinCount: 0,
          weeklyCount: 0,
          monthlyCount: 0,
        }
      : null;

  if (streakToMigrate) {
    const streakRow = transformStreak(streakToMigrate, userId);
    const { error } = await insforge.database
      .from('streaks')
      .upsert([streakRow], { onConflict: 'user_id' });
    if (error) {
      console.error('   ❌ 連續記錄遷移失敗:', error.message);
    } else {
      console.log('   ✅ 連續記錄已同步');
    }
  } else {
    console.log('   ⏭️  無連續記錄，跳過');
  }

  console.log('\n🎉 遷移完成！');
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('💥 未預期錯誤:', err);
  process.exit(1);
});
