import { insforge } from './client';
import type { RulerLogRow, RulerDraftRow, AchievementRecordRow, StreakRow } from './types';

export class InsForgeAdapter {
  async signUp(email: string, password: string) {
    return insforge.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return insforge.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return insforge.auth.signOut();
  }

  getUser() {
    return insforge.auth.getUser();
  }

  async createLog(data: Omit<RulerLogRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    return insforge.db.from('ruler_logs').insert([{ ...data }]);
  }

  async getLogs(limit = 50) {
    return insforge.db.from('ruler_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  }

  async getLogById(id: string) {
    return insforge.db.from('ruler_logs').select('*').eq('id', id).single();
  }

  async deleteLog(id: string) {
    return insforge.db.from('ruler_logs').delete().eq('id', id);
  }

  async getDraft() {
    return insforge.db.from('ruler_drafts').select('*').single();
  }

  async upsertDraft(data: Partial<Omit<RulerDraftRow, 'id' | 'user_id'>>) {
    return insforge.db.from('ruler_drafts').upsert([{ ...data }]);
  }

  async deleteDraft() {
    return insforge.db.from('ruler_drafts').delete();
  }

  async getAchievements() {
    return insforge.db.from('achievement_records').select('*').order('unlocked_at', { ascending: false });
  }

  async unlockAchievement(achievementKey: string) {
    return insforge.db.from('achievement_records').insert([{ achievement_key: achievementKey }]);
  }

  async markAchievementViewed(id: string) {
    return insforge.db.from('achievement_records').update({ viewed: true }).eq('id', id);
  }

  async getStreak() {
    return insforge.db.from('streaks').select('*').single();
  }

  async getProfile() {
    return insforge.db.from('profiles').select('*').single();
  }

  async updateProfile(data: Partial<Record<string, unknown>>) {
    return insforge.db.from('profiles').update({ ...data, updated_at: new Date().toISOString() });
  }
}

export const insforgeAdapter = new InsForgeAdapter();
