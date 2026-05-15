import { LlmAgent } from 'npm:@google/adk';
import type { BaseLlm } from 'npm:@google/adk';
import { createEmergencyStabilizationSkill } from './skills/emergencyStabilization.ts';
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
 * 依知心四式提供溫暖陪伴、脈絡整理與下一步行動。
 *
 * @param model - Gemini model instance (with apiKey) or model name string
 */
export function createEmotionCoachAgent(model: BaseLlm | string) {
  return new LlmAgent({
    name: 'EmotionCoachAgent',
    model,
    description: '今心 APP 的主動 AI 情緒教練，依知心四式提供陪伴、洞察與下一步。',
    globalInstruction: buildEmotionCoachGlobalInstruction(),
    instruction: buildEmotionCoachInstruction(),
    tools: [rulerDataTool, saveRulerLogTool, getEmotionTrendTool, triggerActionTool],
    subAgents: [createEmergencyStabilizationSkill(model)],
  });
}
