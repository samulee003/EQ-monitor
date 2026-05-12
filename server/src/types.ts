/**
 * 今心 Bot 核心類型定義
 */

export type RulerStep =
  | 'idle'
  | 'recognize'
  | 'understand'
  | 'label'
  | 'express'
  | 'regulate'
  | 'summary'
  | 'completed';

export interface UserSession {
  userId: string;
  step: RulerStep;
  createdAt: number;
  updatedAt: number;
  data: RulerData;
}

export interface RulerData {
  bodyPart?: string;
  emotionQuadrant?: 'red' | 'yellow' | 'blue' | 'green';
  emotionName?: string;
  emotionIntensity?: number;
  trigger?: string;
  need?: string;
  expressionText?: string;
  regulationTechnique?: 'breathing' | 'grounding54321' | 'mindfulness';
  postMood?: string;
}

export interface EmotionWord {
  name: string;
  quadrant: 'red' | 'yellow' | 'blue' | 'green';
  intensity: number;
  description?: string;
}

export interface BotResponse {
  text: string;
  quickReplies?: QuickReply[];
  imageUrl?: string;
}

export interface QuickReply {
  label: string;
  text: string;
  type: 'text' | 'action';
}
