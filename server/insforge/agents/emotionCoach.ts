import { LlmAgent } from 'npm:@google/adk';
import type { BaseLlm } from 'npm:@google/adk';
import { createMetaMomentSkill } from './skills/metaMoment.ts';
import {
  rulerDataTool,
  saveRulerLogTool,
  getEmotionTrendTool,
  triggerActionTool,
} from './tools/index.ts';
import {
  buildEmotionCoachGlobalInstruction,
  buildEmotionCoachInstruction,
} from '../../src/agents/soulInstruction.ts';

/**
 * EmotionCoachAgent — 今心情緒教練主代理
 *
 * 基於 RULER 框架（Recognize, Understand, Label, Express, Regulate）
 * 與 Marc Brackett 的情緒智力理論，提供溫暖陪伴與情緒調節指導。
 *
 * @param model - Gemini model instance (with apiKey) or model name string
 */
export function createEmotionCoachAgent(model: BaseLlm | string) {
  return new LlmAgent({
    name: 'EmotionCoachAgent',
    model,
    description: '今心 APP 的主動 AI 情緒教練，基於 RULER 框架提供陪伴、洞察與下一步。',
    globalInstruction: buildEmotionCoachGlobalInstruction(),
    instruction: buildEmotionCoachInstruction(),
    tools: [rulerDataTool, saveRulerLogTool, getEmotionTrendTool, triggerActionTool],
    subAgents: [createMetaMomentSkill(model)],
  });
}
