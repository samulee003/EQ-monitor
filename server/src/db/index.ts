import { memoryAdapter } from './memoryAdapter.js';
import { createSupabaseAdapter } from './supabaseAdapter.js';
import type { RulerData } from '../types.js';
import type { DbSession, DbUser } from './memoryAdapter.js';

export type { DbSession, DbUser };

export interface DatabaseAdapter {
  getOrCreateUser(lineUserId: string, displayName?: string): Promise<DbUser>;
  createSession(lineUserId: string, data?: RulerData): Promise<DbSession>;
  updateSession(sessionId: string, updates: Partial<DbSession>): Promise<void>;
  completeSession(sessionId: string, data: RulerData): Promise<void>;
  saveMessage(lineUserId: string, direction: 'in' | 'out', content: string, step?: string): Promise<void>;
  getUserHistory(lineUserId: string, limit?: number): Promise<Array<{ direction: 'in' | 'out'; content: string; createdAt: number }>>;
  getWeeklyStats(lineUserId: string): Promise<{ totalSessions: number; streakDays: number }>;
  getAllUsers(): Promise<DbUser[]>;
  getAllSessions(): Promise<DbSession[]>;
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export const adapterName: 'supabase' | 'memory' =
  SUPABASE_URL && SUPABASE_SERVICE_KEY ? 'supabase' : 'memory';

export const db: DatabaseAdapter =
  adapterName === 'supabase'
    ? createSupabaseAdapter(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : memoryAdapter;

console.log(`[DB] Adapter: ${adapterName}`);
