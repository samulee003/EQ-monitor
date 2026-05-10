import type { CoachMessage } from './types';

const CHAT_STORAGE_KEY = 'imxin_coach_chat_v1';

export function loadChatHistory(): CoachMessage[] | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CoachMessage[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveChatHistory(messages: CoachMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore quota errors
  }
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_STORAGE_KEY);
}
