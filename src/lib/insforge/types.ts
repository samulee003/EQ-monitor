export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  language: 'zh-TW' | 'zh-CN';
  theme_preference: 'dark' | 'light' | 'system';
  privacy_enabled: boolean;
  notification_settings: Record<string, unknown>;
  onboarding_completed: boolean;
  user_role: string;
  created_at: string;
  updated_at: string;
}

export interface RulerLogRow {
  id: string;
  user_id: string;
  emotions: Array<{ id: string; name: string; quadrant: string; energy: number; pleasantness: number }>;
  intensity: number;
  body_scan: { location: string; sensation: string } | null;
  understanding: { trigger: string; message: string; what: string; who: string; where: string; need: string | null; interactionCycle?: { myReaction: string; childReaction: string; reflection: string } } | null;
  expressing: { expression: string; prompt: string; mode: string } | null;
  regulating: { selectedStrategies: string[] } | null;
  physical_context: { sleepHours?: number; activityLevel?: string } | null;
  post_mood: string | null;
  is_full_flow: boolean;
  created_at: string;
}

export interface RulerDraftRow {
  id: string;
  user_id: string;
  step: string;
  selected_quadrants: string[];
  selected_emotions: Array<{ id: string; name: string; quadrant: string }>;
  emotion_intensity: number | null;
  body_scan: any;
  understanding: any;
  expressing: any;
  regulating: any;
  is_full_flow: boolean;
  post_regulation_mood: string | null;
  updated_at: string;
}

export interface AchievementRecordRow {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  viewed: boolean;
}

export interface StreakRow {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  checkin_count: number;
  weekly_count: number;
  monthly_count: number;
  updated_at: string;
}
