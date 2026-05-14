import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildProductionCoachSystemPrompt } from '../../src/agents/soulInstruction.js';

const repoRoot = resolve(__dirname, '../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('今心教練 soul 契約', () => {
  it('AI 端應該有 soul.md 作為主動教練人格與邊界規格', () => {
    const soul = readProjectFile('server/insforge/agents/soul.md');

    expect(soul).toContain('今心教練 Soul');
    expect(soul).toContain('主動但不打擾');
    expect(soul).toContain('同理 → 觀察 → 下一步');
    expect(soul).toContain('不做診斷');
    expect(soul).toContain('Meta-Moment');
  });

  it('生產 coach prompt 應該同步 soul 的核心原則', () => {
    const promptSource = readProjectFile('server/insforge/functions/coach-simple.ts');
    const productionPrompt = buildProductionCoachSystemPrompt();

    expect(promptSource).not.toContain("from './_shared/soulInstruction.ts'");
    expect(promptSource).not.toContain("from '../../src/agents/soulInstruction.ts'");
    expect(promptSource).toContain('function buildProductionCoachSystemPrompt()');
    expect(promptSource).toContain('const SYSTEM_PROMPT = buildProductionCoachSystemPrompt();');
    expect(promptSource).not.toContain('const SYSTEM_PROMPT = `你是「今心教練」');

    for (const phrase of [
      'server/insforge/agents/soul.md',
      '主動但不打擾',
      '同理 → 觀察 → 下一步',
      '不是客服、不是占卜、不是診斷工具',
      'REST fallback',
      'trigger_action',
      '不可提及工具名稱',
      '不可把工具結果原樣貼給使用者',
    ]) {
      expect(productionPrompt).toContain(phrase);
      expect(promptSource).toContain(phrase);
    }
  });

  it('ADK agent 應該用 instruction 與 globalInstruction 接上 soul 契約', () => {
    const adkLlmAgentSource = readProjectFile('adk-js-adk-v1.0.0/core/src/agents/llm_agent.ts');
    const adkBaseAgentSource = readProjectFile('adk-js-adk-v1.0.0/core/src/agents/base_agent.ts');
    const edgeAgentSource = readProjectFile('server/insforge/agents/emotionCoach.ts');
    const nodeAgentSource = readProjectFile('server/src/agents/emotionCoach.ts');

    expect(adkLlmAgentSource).toContain('instruction?: string | InstructionProvider');
    expect(adkLlmAgentSource).toContain('globalInstruction?: string | InstructionProvider');
    expect(adkLlmAgentSource).toContain('tools?: ToolUnion[]');
    expect(adkBaseAgentSource).toContain('subAgents?: BaseAgent[]');

    for (const source of [edgeAgentSource, nodeAgentSource]) {
      expect(source).toContain('buildEmotionCoachInstruction()');
      expect(source).toContain('globalInstruction: buildEmotionCoachGlobalInstruction()');
      expect(source).toContain('tools: [rulerDataTool, saveRulerLogTool, getEmotionTrendTool, triggerActionTool]');
      expect(source).toContain('subAgents: [createMetaMomentSkill(model)]');
    }
  });
});
