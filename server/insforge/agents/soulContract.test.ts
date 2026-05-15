import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildProductionCoachSystemPrompt } from '../../src/agents/soulInstruction.js';

const repoRoot = resolve(__dirname, '../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('阿念教練 soul 契約', () => {
  it('AI 端應該有 soul.md 作為阿念教練人格與邊界規格', () => {
    const soul = readProjectFile('server/insforge/agents/soul.md');

    expect(soul).toContain('阿念教練 Soul');
    expect(soul).toContain('主動但不打擾');
    expect(soul).toContain('慢慢看懂使用者的節奏');
    expect(soul).toContain('同理 → 觀察 → 下一步');
    expect(soul).toContain('不做診斷');
    expect(soul).toContain('緊急安定');
    for (const phrase of [
      'RULER 啟發',
      'ACT-informed',
      'IFS-informed',
      'Dan Siegel-informed',
      'mindsight',
      '可承受範圍',
      '不宣稱與 Yale',
    ]) {
      expect(soul).toContain(phrase);
    }
  });

  it('生產 coach prompt 應該同步 soul 的核心原則', () => {
    const promptSource = readProjectFile('server/insforge/functions/coach-simple.ts');
    const productionPrompt = buildProductionCoachSystemPrompt();

    expect(promptSource).not.toContain("from './_shared/soulInstruction.ts'");
    expect(promptSource).not.toContain("from '../../src/agents/soulInstruction.ts'");
    expect(promptSource).toContain('function buildProductionCoachSystemPrompt()');
    expect(promptSource).toContain('const SYSTEM_PROMPT = buildProductionCoachSystemPrompt();');
    expect(promptSource).not.toContain('const SYSTEM_PROMPT = `你是「今心教練」');
    expect(promptSource).toContain('你是「阿念教練」');

    for (const phrase of [
      'server/insforge/agents/soul.md',
      '主動但不打擾',
      '慢慢看懂使用者的節奏',
      '同理 → 觀察 → 下一步',
      '不是客服、不是占卜、不是診斷工具',
      'REST fallback',
      'trigger_action',
      '不可提及工具名稱',
      '不可把工具結果原樣貼給使用者',
      'RULER 啟發',
      'ACT-informed',
      'IFS-informed',
      'Dan Siegel-informed',
      'mindsight',
      '可承受範圍',
      '不宣稱與 Yale',
    ]) {
      expect(productionPrompt).toContain(phrase);
      expect(promptSource).toContain(phrase);
    }
  });

  it('ADK agent 應該用 instruction 與 globalInstruction 接上 soul 契約', () => {
    const edgeAgentSource = readProjectFile('server/insforge/agents/emotionCoach.ts');
    const nodeAgentSource = readProjectFile('server/src/agents/emotionCoach.ts');

    for (const source of [edgeAgentSource, nodeAgentSource]) {
      expect(source).toContain('import { LlmAgent }');
      expect(source).toContain('buildEmotionCoachInstruction()');
      expect(source).toContain('globalInstruction: buildEmotionCoachGlobalInstruction()');
      expect(source).toContain('tools: [rulerDataTool, saveRulerLogTool, getEmotionTrendTool, triggerActionTool]');
      expect(source).toContain('subAgents: [createEmergencyStabilizationSkill(model)]');
    }
  });
});
