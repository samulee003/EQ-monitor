import { describe, it, expect } from 'vitest';
import { triggerActionTool } from './triggerAction.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const execute = (triggerActionTool as any).execute.bind(triggerActionTool);

describe('triggerActionTool', () => {
  it('回傳觸發的動作名稱與預設訊息', async () => {
    const result = await execute({ action: 'start_breathing' });

    expect(result).toMatchObject({
      action_triggered: 'start_breathing',
      reason: '',
      message: expect.stringContaining('start_breathing'),
    });
  });

  it('包含 reason 時原樣回傳', async () => {
    const result = await execute({
      action: 'open_sos',
      reason: '使用者需要緊急支援',
    });

    expect(result).toMatchObject({
      action_triggered: 'open_sos',
      reason: '使用者需要緊急支援',
    });
  });
});
