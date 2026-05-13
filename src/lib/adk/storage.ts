import type { CoachMessage } from './types';

const CHAT_STORAGE_KEY = 'imxin_coach_chat_v1';

function chatStorageKey(userId?: string | null): string {
  return userId ? `${CHAT_STORAGE_KEY}_${userId}` : CHAT_STORAGE_KEY;
}

export function loadChatHistory(userId?: string | null): CoachMessage[] | null {
  try {
    const raw = localStorage.getItem(chatStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CoachMessage[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveChatHistory(messages: CoachMessage[], userId?: string | null): void {
  try {
    localStorage.setItem(chatStorageKey(userId), JSON.stringify(messages));
  } catch {
    // Ignore quota errors
  }
}

export function clearChatHistory(userId?: string | null): void {
  localStorage.removeItem(chatStorageKey(userId));
}
