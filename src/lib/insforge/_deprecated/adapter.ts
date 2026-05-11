import { insforge } from '../client';
import type { RulerLogRow, RulerDraftRow } from '../types';

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
    return insforge.auth.getCurrentUser();
  }

  async createLog(data: Omit<RulerLogRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    return insforge.database.from('ruler_logs').insert([{ ...data }]);
  }

  async getLogs(limit = 50) {
    return insforge.database.from('ruler_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  }

  async getLogById(id: string) {
    return insforge.database.from('ruler_logs').select('*').eq('id', id).single();
  }

  async deleteLog(id: string) {
    return insforge.database.from('ruler_logs').delete().eq('id', id);
  }

  async getDraft() {
    return insforge.database.from('ruler_drafts').select('*').single();
  }

  async upsertDraft(data: Partial<Omit<RulerDraftRow, 'id' | 'user_id'>>) {
    return insforge.database.from('ruler_drafts').upsert([{ ...data }]);
  }

  async deleteDraft() {
    return insforge.database.from('ruler_drafts').delete();
  }

  async getAchievements() {
    return insforge.database.from('achievement_records').select('*').order('unlocked_at', { ascending: false });
  }

  async unlockAchievement(achievementKey: string) {
    return insforge.database.from('achievement_records').insert([{ achievement_key: achievementKey }]);
  }

  async markAchievementViewed(id: string) {
    return insforge.database.from('achievement_records').update({ viewed: true }).eq('id', id);
  }

  async getStreak() {
    return insforge.database.from('streaks').select('*').single();
  }

  async getProfile() {
    return insforge.database.from('profiles').select('*').single();
  }

  async updateProfile(data: Partial<Record<string, unknown>>) {
    return insforge.database.from('profiles').update({ ...data, updated_at: new Date().toISOString() });
  }
}

export const insforgeAdapter = new InsForgeAdapter();
