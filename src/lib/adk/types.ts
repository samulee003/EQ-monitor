export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  metadata?: {
    skillInvoked?: string;
    step?: number;
    emotions?: string[];
    action?: string;
    actionReason?: string;
    intent?: string;
  };
}

export type CoachMicroActionStatus =
  | 'active'
  | 'completed'
  | 'partial'
  | 'skipped'
  | 'expired';

export interface CoachMicroAction {
  id: string;
  title: string;
  category: string;
  status: CoachMicroActionStatus;
  due_at: string;
  created_at: string;
  goal_key?: string;
  task_key?: string;
  report_text?: string;
}

export interface CoachMicroActionProposal {
  key: string;
  goalKey: 'sleep_anxiety' | 'parent_repair' | 'daily_care';
  category: string;
  title: string;
  dueHours: number;
}

export interface CoachGamificationSummary {
  total_xp: number;
  coin_balance: number;
  lifetime_coins: number;
  total_reported: number;
  completed_count: number;
  partial_count: number;
  skipped_count: number;
  current_review_streak: number;
  longest_review_streak: number;
  last_review_date: string | null;
  level?: {
    level: number;
    title: string;
    currentXp: number;
    nextLevelXp?: number | null;
  };
}

export interface CoachRequest {
  message: string;
  userId: string;
  sessionId: string;
}

export interface CoachResponse {
  response: string;
  skillInvoked?: string;
  step?: number;
  action?: string;
  actionReason?: string;
  intent?: string;
  microActionProposal?: CoachMicroActionProposal | null;
  activeMicroAction?: CoachMicroAction | null;
  gamification?: CoachGamificationSummary | null;
  toolResult?: Record<string, unknown> | null;
  metadata?: {
    emotions_detected?: string[];
    suggested_intensity?: number;
  };
}

/** Agent 觸發的前端動作類型 */
export type CoachAction =
  | 'start_breathing'
  | 'start_checkin'
  | 'open_sos'
  | 'show_history'
  | 'show_growth';
