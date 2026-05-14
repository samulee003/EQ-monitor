import * as pg from 'pg';
import { RulerData } from '../types.js';
import { generateBindingCode } from './bindingCode.js';
import type { DbSession, DbUser, LineBindingCode } from './memoryAdapter.js';

/**
 * InsForge PostgreSQL 適配器
 * 透過 pg 套件直連 InsForge 託管的 PostgreSQL，
 * 與 supabaseAdapter 共用同一份 schema（bot_users / ruler_sessions / chat_messages）
 */

const { Pool } = pg;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rulerDataToColumns(data: RulerData): { columns: string[]; values: unknown[] } {
  const columns: string[] = [];
  const values: unknown[] = [];
  if (data.bodyPart !== undefined) { columns.push('body_part'); values.push(data.bodyPart); }
  if (data.emotionQuadrant !== undefined) { columns.push('emotion_quadrant'); values.push(data.emotionQuadrant); }
  if (data.emotionName !== undefined) { columns.push('emotion_name'); values.push(data.emotionName); }
  if (data.emotionIntensity !== undefined) { columns.push('emotion_intensity'); values.push(data.emotionIntensity); }
  if (data.trigger !== undefined) { columns.push('trigger_event'); values.push(data.trigger); }
  if (data.need !== undefined) { columns.push('psychological_need'); values.push(data.need); }
  if (data.expressionText !== undefined) { columns.push('expression_text'); values.push(data.expressionText); }
  if (data.regulationTechnique !== undefined) { columns.push('regulation_technique'); values.push(data.regulationTechnique); }
  if (data.postMood !== undefined) { columns.push('post_mood'); values.push(data.postMood); }
  return { columns, values };
}

function rulerDataFromRow(row: Record<string, unknown>): RulerData {
  return {
    bodyPart: (row.body_part as string | null) ?? undefined,
    emotionQuadrant: (row.emotion_quadrant as 'red' | 'yellow' | 'blue' | 'green' | null) ?? undefined,
    emotionName: (row.emotion_name as string | null) ?? undefined,
    emotionIntensity: (row.emotion_intensity as number | null) ?? undefined,
    trigger: (row.trigger_event as string | null) ?? undefined,
    need: (row.psychological_need as string | null) ?? undefined,
    expressionText: (row.expression_text as string | null) ?? undefined,
    regulationTechnique: (row.regulation_technique as 'breathing' | 'grounding54321' | 'mindfulness' | null) ?? undefined,
    postMood: (row.post_mood as string | null) ?? undefined,
  };
}

function agentLogPayload(
  appUserId: string,
  lineUserId: string,
  data: RulerData
): Record<string, unknown> {
  return {
    app_user_id: appUserId,
    line_user_id: lineUserId,
    source: 'line',
    emotions: [
      {
        name: data.emotionName ?? '未命名情緒',
        quadrant: data.emotionQuadrant ?? 'blue',
      },
    ],
    intensity: data.emotionIntensity ?? 5,
    body_scan: data.bodyPart ? { location: data.bodyPart } : null,
    understanding: {
      trigger: data.trigger ?? '',
      need: data.need ?? null,
    },
    expressing: data.expressionText ? { expression: data.expressionText, mode: 'line' } : null,
    regulating: data.regulationTechnique
      ? { selectedStrategies: [data.regulationTechnique] }
      : null,
    post_mood: data.postMood ?? null,
    is_full_flow: true,
  };
}

function dbUserFromRow(row: Record<string, unknown>): DbUser {
  return {
    lineUserId: row.line_user_id as string,
    displayName: (row.display_name as string | null) ?? undefined,
    totalSessions: (row.total_sessions as number) ?? 0,
    streakDays: (row.streak_days as number) ?? 0,
    lastSessionDate:
      row.last_session_date instanceof Date
        ? (row.last_session_date as Date).toISOString().split('T')[0]
        : ((row.last_session_date as string | null) ?? undefined),
    createdAt: row.created_at ? new Date(row.created_at as string | Date).getTime() : Date.now(),
  };
}

function dbSessionFromRow(row: Record<string, unknown>): DbSession {
  return {
    id: row.id as string,
    lineUserId: row.line_user_id as string,
    status: row.status as 'in_progress' | 'completed' | 'abandoned',
    startedAt: row.started_at ? new Date(row.started_at as string | Date).getTime() : Date.now(),
    completedAt: row.completed_at ? new Date(row.completed_at as string | Date).getTime() : undefined,
    data: rulerDataFromRow(row),
  };
}

export function createInsforgeAdapter(connectionString: string) {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });

  pool.on('error', (err) => {
    console.error('[InsForge] pg pool error:', err);
  });

  return {
    async getOrCreateUser(lineUserId: string, displayName?: string): Promise<DbUser> {
      try {
        const existing = await pool.query(
          'SELECT * FROM bot_users WHERE line_user_id = $1 LIMIT 1',
          [lineUserId]
        );
        if (existing.rows.length > 0) {
          return dbUserFromRow(existing.rows[0]);
        }

        const inserted = await pool.query(
          `INSERT INTO bot_users (line_user_id, display_name, language, total_sessions, streak_days)
           VALUES ($1, $2, 'zh-TW', 0, 0)
           RETURNING *`,
          [lineUserId, displayName ?? null]
        );
        return dbUserFromRow(inserted.rows[0]);
      } catch (err) {
        console.error('[InsForge] getOrCreateUser error:', err);
        return {
          lineUserId,
          displayName,
          totalSessions: 0,
          streakDays: 0,
          createdAt: Date.now(),
        };
      }
    },

    async createSession(lineUserId: string, data?: RulerData): Promise<DbSession> {
      try {
        const userResult = await pool.query(
          'SELECT id FROM bot_users WHERE line_user_id = $1 LIMIT 1',
          [lineUserId]
        );
        const userId = userResult.rows[0]?.id ?? null;

        const { columns, values } = rulerDataToColumns(data ?? {});
        const baseCols = ['line_user_id', 'user_id', 'status', ...columns];
        const baseVals = [lineUserId, userId, 'in_progress', ...values];
        const placeholders = baseVals.map((_, i) => `$${i + 1}`).join(', ');

        const inserted = await pool.query(
          `INSERT INTO ruler_sessions (${baseCols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          baseVals
        );
        return dbSessionFromRow(inserted.rows[0]);
      } catch (err) {
        console.error('[InsForge] createSession error:', err);
        return {
          id: generateId(),
          lineUserId,
          status: 'in_progress',
          startedAt: Date.now(),
          data: data ?? {},
        };
      }
    },

    async updateSession(sessionId: string, updates: Partial<DbSession>): Promise<void> {
      try {
        const setParts: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (updates.status !== undefined) {
          setParts.push(`status = $${idx++}`);
          values.push(updates.status);
        }
        if (updates.startedAt !== undefined) {
          setParts.push(`started_at = $${idx++}`);
          values.push(new Date(updates.startedAt).toISOString());
        }
        if (updates.completedAt !== undefined) {
          setParts.push(`completed_at = $${idx++}`);
          values.push(updates.completedAt ? new Date(updates.completedAt).toISOString() : null);
        }
        if (updates.data !== undefined) {
          const { columns, values: dataValues } = rulerDataToColumns(updates.data);
          for (let i = 0; i < columns.length; i++) {
            setParts.push(`${columns[i]} = $${idx++}`);
            values.push(dataValues[i]);
          }
        }

        if (setParts.length === 0) return;

        values.push(sessionId);
        await pool.query(
          `UPDATE ruler_sessions SET ${setParts.join(', ')} WHERE id = $${idx}`,
          values
        );
      } catch (err) {
        console.error('[InsForge] updateSession error:', err);
      }
    },

    async completeSession(sessionId: string, data: RulerData): Promise<void> {
      try {
        const sessionResult = await pool.query(
          'SELECT * FROM ruler_sessions WHERE id = $1 LIMIT 1',
          [sessionId]
        );
        const sessionRow = sessionResult.rows[0];
        if (!sessionRow) {
          console.warn('[InsForge] completeSession: session not found', sessionId);
          return;
        }

        const now = new Date();
        const startedAt = sessionRow.started_at ? new Date(sessionRow.started_at) : now;
        const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

        const { columns, values: dataValues } = rulerDataToColumns(data);
        const setParts = ['status = $1', 'completed_at = $2', 'duration_seconds = $3'];
        const setValues: unknown[] = ['completed', now.toISOString(), durationSeconds];
        let idx = 4;
        for (let i = 0; i < columns.length; i++) {
          setParts.push(`${columns[i]} = $${idx++}`);
          setValues.push(dataValues[i]);
        }
        setValues.push(sessionId);

        await pool.query(
          `UPDATE ruler_sessions SET ${setParts.join(', ')} WHERE id = $${idx}`,
          setValues
        );

        const lineUserId = sessionRow.line_user_id as string;
        const userResult = await pool.query(
          'SELECT total_sessions, streak_days, last_session_date FROM bot_users WHERE line_user_id = $1 LIMIT 1',
          [lineUserId]
        );
        const userRow = userResult.rows[0];
        if (!userRow) return;

        const today = now.toISOString().split('T')[0];
        let streakDays = (userRow.streak_days as number) ?? 0;
        const lastSessionDate =
          userRow.last_session_date instanceof Date
            ? (userRow.last_session_date as Date).toISOString().split('T')[0]
            : (userRow.last_session_date as string | null);

        if (lastSessionDate && lastSessionDate !== today) {
          const lastDate = new Date(lastSessionDate);
          const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
          if (diffDays === 1) {
            streakDays++;
          } else {
            streakDays = 1;
          }
        } else if (!lastSessionDate) {
          streakDays = 1;
        }

        await pool.query(
          `UPDATE bot_users
           SET total_sessions = $1, streak_days = $2, last_session_date = $3,
               last_interaction_at = $4, updated_at = $4
           WHERE line_user_id = $5`,
          [
            ((userRow.total_sessions as number) ?? 0) + 1,
            streakDays,
            today,
            now.toISOString(),
            lineUserId,
          ]
        );

        const bindingResult = await pool.query(
          `SELECT app_user_id FROM line_user_bindings
           WHERE line_user_id = $1 AND status = 'claimed' AND app_user_id IS NOT NULL
           ORDER BY claimed_at DESC NULLS LAST, created_at DESC
           LIMIT 1`,
          [lineUserId]
        );
        const appUserId = bindingResult.rows[0]?.app_user_id as string | undefined;
        if (appUserId) {
          const payload = agentLogPayload(appUserId, lineUserId, { ...rulerDataFromRow(sessionRow), ...data });
          await pool.query(
            `INSERT INTO agent_ruler_logs (
              app_user_id, line_user_id, source, emotions, intensity,
              body_scan, understanding, expressing, regulating,
              post_mood, is_full_flow
            )
            VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11)`,
            [
              payload.app_user_id,
              payload.line_user_id,
              payload.source,
              JSON.stringify(payload.emotions),
              payload.intensity,
              JSON.stringify(payload.body_scan),
              JSON.stringify(payload.understanding),
              JSON.stringify(payload.expressing),
              JSON.stringify(payload.regulating),
              payload.post_mood,
              payload.is_full_flow,
            ]
          );
        }
      } catch (err) {
        console.error('[InsForge] completeSession error:', err);
      }
    },

    async saveMessage(
      lineUserId: string,
      direction: 'in' | 'out',
      content: string,
      step?: string
    ): Promise<void> {
      try {
        const userResult = await pool.query(
          'SELECT id FROM bot_users WHERE line_user_id = $1 LIMIT 1',
          [lineUserId]
        );
        const userId = userResult.rows[0]?.id ?? null;

        const sessionResult = await pool.query(
          `SELECT id FROM ruler_sessions
           WHERE line_user_id = $1 AND status = 'in_progress'
           ORDER BY created_at DESC LIMIT 1`,
          [lineUserId]
        );
        const sessionId = sessionResult.rows[0]?.id ?? null;

        await pool.query(
          `INSERT INTO chat_messages (user_id, line_user_id, session_id, direction, content, step, message_type)
           VALUES ($1, $2, $3, $4, $5, $6, 'text')`,
          [userId, lineUserId, sessionId, direction, content, step ?? null]
        );
      } catch (err) {
        console.error('[InsForge] saveMessage error:', err);
      }
    },

    async getUserHistory(
      lineUserId: string,
      limit = 10
    ): Promise<Array<{ direction: 'in' | 'out'; content: string; createdAt: number }>> {
      try {
        const result = await pool.query(
          `SELECT direction, content, created_at FROM chat_messages
           WHERE line_user_id = $1 ORDER BY created_at DESC LIMIT $2`,
          [lineUserId, limit]
        );
        return result.rows
          .reverse()
          .map((row) => ({
            direction: row.direction as 'in' | 'out',
            content: row.content as string,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          }));
      } catch (err) {
        console.error('[InsForge] getUserHistory error:', err);
        return [];
      }
    },

    async getWeeklyStats(lineUserId: string): Promise<{ totalSessions: number; streakDays: number }> {
      try {
        const result = await pool.query(
          'SELECT total_sessions, streak_days FROM bot_users WHERE line_user_id = $1 LIMIT 1',
          [lineUserId]
        );
        const row = result.rows[0];
        return {
          totalSessions: (row?.total_sessions as number) ?? 0,
          streakDays: (row?.streak_days as number) ?? 0,
        };
      } catch (err) {
        console.error('[InsForge] getWeeklyStats error:', err);
        return { totalSessions: 0, streakDays: 0 };
      }
    },

    async getAllUsers(): Promise<DbUser[]> {
      try {
        const result = await pool.query('SELECT * FROM bot_users');
        return result.rows.map((row) => dbUserFromRow(row));
      } catch (err) {
        console.error('[InsForge] getAllUsers error:', err);
        return [];
      }
    },

    async getAllSessions(): Promise<DbSession[]> {
      try {
        const result = await pool.query('SELECT * FROM ruler_sessions');
        return result.rows.map((row) => dbSessionFromRow(row));
      } catch (err) {
        console.error('[InsForge] getAllSessions error:', err);
        return [];
      }
    },

    async createLineBindingCode(lineUserId: string): Promise<LineBindingCode> {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateBindingCode();
        try {
          const result = await pool.query(
            `INSERT INTO line_user_bindings (code, line_user_id, status, expires_at)
             VALUES ($1, $2, 'pending', $3)
             RETURNING code, line_user_id, app_user_id, expires_at, claimed_at`,
            [code, lineUserId, expiresAt.toISOString()]
          );
          const row = result.rows[0];
          return {
            code: row.code,
            lineUserId: row.line_user_id,
            appUserId: row.app_user_id ?? undefined,
            expiresAt: new Date(row.expires_at).getTime(),
            claimedAt: row.claimed_at ? new Date(row.claimed_at).getTime() : undefined,
          };
        } catch (err) {
          if (attempt === 4) throw err;
        }
      }
      throw new Error('無法建立 LINE 綁定碼');
    },

    async claimLineBindingCode(code: string, appUserId: string): Promise<LineBindingCode | null> {
      try {
        const result = await pool.query(
          `UPDATE line_user_bindings
           SET app_user_id = $1, status = 'claimed', claimed_at = NOW()
           WHERE code = $2 AND status = 'pending' AND expires_at > NOW()
           RETURNING code, line_user_id, app_user_id, expires_at, claimed_at`,
          [appUserId, code.trim().toUpperCase()]
        );
        const row = result.rows[0];
        if (!row) return null;
        return {
          code: row.code,
          lineUserId: row.line_user_id,
          appUserId: row.app_user_id ?? undefined,
          expiresAt: new Date(row.expires_at).getTime(),
          claimedAt: row.claimed_at ? new Date(row.claimed_at).getTime() : undefined,
        };
      } catch (err) {
        console.error('[InsForge] claimLineBindingCode error:', err);
        return null;
      }
    },
  };
}
