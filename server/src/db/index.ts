import { memoryAdapter } from './memoryAdapter.js';
import { createSupabaseAdapter } from './supabaseAdapter.js';
import { createInsforgeAdapter } from './insforgeAdapter.js';
import type { RulerData } from '../types.js';
import type { AgentRulerLog, DbSession, DbUser, LineBindingCode } from './memoryAdapter.js';

export type { AgentRulerLog, DbSession, DbUser, LineBindingCode };

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
  createLineBindingCode?(lineUserId: string): Promise<LineBindingCode>;
  claimLineBindingCode?(code: string, appUserId: string): Promise<LineBindingCode | null>;
  getAgentLogs?(appUserId: string): Promise<AgentRulerLog[]>;
}

const DATABASE_URL = process.env.DATABASE_URL || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// 優先順序：InsForge PostgreSQL（DATABASE_URL 指向 insforge.app）→ Supabase → Memory
function resolveAdapterName(): 'insforge' | 'supabase' | 'memory' {
  if (DATABASE_URL && DATABASE_URL.includes('insforge.app')) return 'insforge';
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) return 'supabase';
  return 'memory';
}

export const adapterName: 'insforge' | 'supabase' | 'memory' = resolveAdapterName();

export const db: DatabaseAdapter =
  adapterName === 'insforge'
    ? createInsforgeAdapter(DATABASE_URL)
    : adapterName === 'supabase'
      ? createSupabaseAdapter(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      : memoryAdapter;

console.log(`[DB] Adapter: ${adapterName}`);
