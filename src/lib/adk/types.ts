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
