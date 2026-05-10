export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  metadata?: {
    skillInvoked?: string;
    step?: number;
    emotions?: string[];
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
  metadata?: {
    emotions_detected?: string[];
    suggested_intensity?: number;
  };
}
