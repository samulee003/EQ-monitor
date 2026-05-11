import { createClient } from '@supabase/supabase-js';
import { RulerData } from '../types.js';
import type { DbSession, DbUser } from './memoryAdapter.js';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rulerDataToDb(data: RulerData): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  if (data.bodyPart !== undefined) mapped.body_part = data.bodyPart;
  if (data.emotionQuadrant !== undefined) mapped.emotion_quadrant = data.emotionQuadrant;
  if (data.emotionName !== undefined) mapped.emotion_name = data.emotionName;
  if (data.emotionIntensity !== undefined) mapped.emotion_intensity = data.emotionIntensity;
  if (data.trigger !== undefined) mapped.trigger_event = data.trigger;
  if (data.need !== undefined) mapped.psychological_need = data.need;
  if (data.expressionText !== undefined) mapped.expression_text = data.expressionText;
  if (data.regulationTechnique !== undefined) mapped.regulation_technique = data.regulationTechnique;
  if (data.postMood !== undefined) mapped.post_mood = data.postMood;
  return mapped;
}

function rulerDataFromDb(row: Record<string, unknown>): RulerData {
  return {
    bodyPart: row.body_part as string | undefined,
    emotionQuadrant: row.emotion_quadrant as 'red' | 'yellow' | 'blue' | 'green' | undefined,
    emotionName: row.emotion_name as string | undefined,
    emotionIntensity: row.emotion_intensity as number | undefined,
    trigger: row.trigger_event as string | undefined,
    need: row.psychological_need as string | undefined,
    expressionText: row.expression_text as string | undefined,
    regulationTechnique: row.regulation_technique as 'breathing' | 'grounding54321' | 'mindfulness' | undefined,
    postMood: row.post_mood as string | undefined,
  };
}

function dbUserFromRow(row: Record<string, unknown>): DbUser {
  return {
    lineUserId: row.line_user_id as string,
    displayName: (row.display_name as string | null) ?? undefined,
    totalSessions: (row.total_sessions as number) ?? 0,
    streakDays: (row.streak_days as number) ?? 0,
    lastSessionDate: (row.last_session_date as string | null) ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
  };
}

function dbSessionFromRow(row: Record<string, unknown>): DbSession {
  return {
    id: row.id as string,
    lineUserId: row.line_user_id as string,
    status: row.status as 'in_progress' | 'completed' | 'abandoned',
    startedAt: row.started_at ? new Date(row.started_at as string).getTime() : Date.now(),
    completedAt: row.completed_at ? new Date(row.completed_at as string).getTime() : undefined,
    data: rulerDataFromDb(row),
  };
}

export function createSupabaseAdapter(url: string, key: string) {
  const supabase = createClient(url, key);

  return {
    async getOrCreateUser(lineUserId: string, displayName?: string): Promise<DbUser> {
      try {
        const { data: existing, error: selectError } = await supabase
          .from('bot_users')
          .select('*')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (selectError) {
          console.error('[Supabase] getOrCreateUser select error:', selectError);
          return {
            lineUserId,
            displayName,
            totalSessions: 0,
            streakDays: 0,
            createdAt: Date.now(),
          };
        }

        if (existing) {
          return dbUserFromRow(existing as Record<string, unknown>);
        }

        const { data: created, error: insertError } = await supabase
          .from('bot_users')
          .insert({
            line_user_id: lineUserId,
            display_name: displayName ?? null,
            language: 'zh-TW',
            total_sessions: 0,
            streak_days: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Supabase] getOrCreateUser insert error:', insertError);
          return {
            lineUserId,
            displayName,
            totalSessions: 0,
            streakDays: 0,
            createdAt: Date.now(),
          };
        }

        return dbUserFromRow(created as Record<string, unknown>);
      } catch (err) {
        console.error('[Supabase] getOrCreateUser unexpected error:', err);
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
        const { data: userRow, error: userError } = await supabase
          .from('bot_users')
          .select('id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (userError) {
          console.error('[Supabase] createSession get user error:', userError);
        }

        const insertData: Record<string, unknown> = {
          line_user_id: lineUserId,
          user_id: userRow?.id ?? null,
          status: 'in_progress',
          ...rulerDataToDb(data ?? {}),
        };

        const { data: created, error } = await supabase
          .from('ruler_sessions')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('[Supabase] createSession error:', error);
          return {
            id: generateId(),
            lineUserId,
            status: 'in_progress',
            startedAt: Date.now(),
            data: data ?? {},
          };
        }

        return dbSessionFromRow(created as Record<string, unknown>);
      } catch (err) {
        console.error('[Supabase] createSession unexpected error:', err);
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
        const updateData: Record<string, unknown> = {};

        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.startedAt !== undefined) updateData.started_at = new Date(updates.startedAt).toISOString();
        if (updates.completedAt !== undefined) {
          updateData.completed_at = updates.completedAt ? new Date(updates.completedAt).toISOString() : null;
        }
        if (updates.data !== undefined) {
          Object.assign(updateData, rulerDataToDb(updates.data));
        }

        const { error } = await supabase
          .from('ruler_sessions')
          .update(updateData)
          .eq('id', sessionId);

        if (error) {
          console.error('[Supabase] updateSession error:', error);
        }
      } catch (err) {
        console.error('[Supabase] updateSession unexpected error:', err);
      }
    },

    async completeSession(sessionId: string, data: RulerData): Promise<void> {
      try {
        const { data: sessionRow, error: sessionError } = await supabase
          .from('ruler_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (sessionError) {
          console.error('[Supabase] completeSession get session error:', sessionError);
          return;
        }

        if (!sessionRow) {
          console.warn('[Supabase] completeSession: session not found', sessionId);
          return;
        }

        const now = new Date();
        const startedAt = sessionRow.started_at ? new Date(sessionRow.started_at as string) : now;
        const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

        const { error: updateError } = await supabase
          .from('ruler_sessions')
          .update({
            status: 'completed',
            completed_at: now.toISOString(),
            duration_seconds: durationSeconds,
            ...rulerDataToDb(data),
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error('[Supabase] completeSession update error:', updateError);
          return;
        }

        const lineUserId = sessionRow.line_user_id as string;
        const { data: userRow, error: userError } = await supabase
          .from('bot_users')
          .select('total_sessions, streak_days, last_session_date')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (userError || !userRow) {
          console.error('[Supabase] completeSession get user error:', userError);
          return;
        }

        const today = now.toISOString().split('T')[0];
        let streakDays = (userRow.streak_days as number) ?? 0;
        const lastSessionDate = (userRow.last_session_date as string | null) ?? undefined;

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

        const { error: userUpdateError } = await supabase
          .from('bot_users')
          .update({
            total_sessions: ((userRow.total_sessions as number) ?? 0) + 1,
            streak_days: streakDays,
            last_session_date: today,
            last_interaction_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('line_user_id', lineUserId);

        if (userUpdateError) {
          console.error('[Supabase] completeSession update user error:', userUpdateError);
        }
      } catch (err) {
        console.error('[Supabase] completeSession unexpected error:', err);
      }
    },

    async saveMessage(
      lineUserId: string,
      direction: 'in' | 'out',
      content: string,
      step?: string
    ): Promise<void> {
      try {
        const { data: userRow, error: userError } = await supabase
          .from('bot_users')
          .select('id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (userError) {
          console.error('[Supabase] saveMessage get user error:', userError);
        }

        const { data: sessionRow, error: sessionError } = await supabase
          .from('ruler_sessions')
          .select('id')
          .eq('line_user_id', lineUserId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          console.error('[Supabase] saveMessage get session error:', sessionError);
        }

        const { error } = await supabase
          .from('chat_messages')
          .insert({
            user_id: userRow?.id ?? null,
            line_user_id: lineUserId,
            session_id: sessionRow?.id ?? null,
            direction,
            content,
            step: step ?? null,
            message_type: 'text',
          });

        if (error) {
          console.error('[Supabase] saveMessage error:', error);
        }
      } catch (err) {
        console.error('[Supabase] saveMessage unexpected error:', err);
      }
    },

    async getUserHistory(
      lineUserId: string,
      limit = 10
    ): Promise<Array<{ direction: 'in' | 'out'; content: string; createdAt: number }>> {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('direction, content, created_at')
          .eq('line_user_id', lineUserId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('[Supabase] getUserHistory error:', error);
          return [];
        }

        return (data ?? [])
          .reverse()
          .map((row: Record<string, unknown>) => ({
            direction: row.direction as 'in' | 'out',
            content: row.content as string,
            createdAt: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
          }));
      } catch (err) {
        console.error('[Supabase] getUserHistory unexpected error:', err);
        return [];
      }
    },

    async getWeeklyStats(lineUserId: string): Promise<{ totalSessions: number; streakDays: number }> {
      try {
        const { data, error } = await supabase
          .from('bot_users')
          .select('total_sessions, streak_days')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (error) {
          console.error('[Supabase] getWeeklyStats error:', error);
          return { totalSessions: 0, streakDays: 0 };
        }

        return {
          totalSessions: (data?.total_sessions as number) ?? 0,
          streakDays: (data?.streak_days as number) ?? 0,
        };
      } catch (err) {
        console.error('[Supabase] getWeeklyStats unexpected error:', err);
        return { totalSessions: 0, streakDays: 0 };
      }
    },

    async getAllUsers(): Promise<DbUser[]> {
      try {
        const { data, error } = await supabase.from('bot_users').select('*');
        if (error) {
          console.error('[Supabase] getAllUsers error:', error);
          return [];
        }
        return (data ?? []).map((row: Record<string, unknown>) => dbUserFromRow(row));
      } catch (err) {
        console.error('[Supabase] getAllUsers unexpected error:', err);
        return [];
      }
    },

    async getAllSessions(): Promise<DbSession[]> {
      try {
        const { data, error } = await supabase.from('ruler_sessions').select('*');
        if (error) {
          console.error('[Supabase] getAllSessions error:', error);
          return [];
        }
        return (data ?? []).map((row: Record<string, unknown>) => dbSessionFromRow(row));
      } catch (err) {
        console.error('[Supabase] getAllSessions unexpected error:', err);
        return [];
      }
    },
  };
}
