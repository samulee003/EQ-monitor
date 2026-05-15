import { LlmAgent } from '@google/adk';
import type { BaseLlm } from '@google/adk';
import { createEmergencyStabilizationSkill } from './skills/emergencyStabilization.js';
import {
  rulerDataTool,
  saveRulerLogTool,
  getEmotionTrendTool,
  triggerActionTool,
} from './tools/index.js';
import {
  buildEmotionCoachGlobalInstruction,
  buildEmotionCoachInstruction,
} from './soulInstruction.js';

export function createEmotionCoachAgent(model: BaseLlm | string) {
  return new LlmAgent({
    name: 'EmotionCoachAgent',
    model,
    description: '今心 APP 的主動 AI 情緒教練，依今心四步提供陪伴、洞察與下一步。',
    globalInstruction: buildEmotionCoachGlobalInstruction(),
    instruction: buildEmotionCoachInstruction(),
    tools: [rulerDataTool, saveRulerLogTool, getEmotionTrendTool, triggerActionTool],
    subAgents: [createEmergencyStabilizationSkill(model)],
  });
}
