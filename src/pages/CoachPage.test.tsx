import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CoachPage from './CoachPage';
import * as client from '../lib/adk/client';
import { saveChatHistory } from '../lib/adk/storage';

const authMock = vi.hoisted(() => ({
  user: { id: 'user_local_001' } as { id: string } | null,
}));

vi.mock('../services/AuthContext', () => ({
  useAuth: () => ({ user: authMock.user }),
}));

const appStoreMock = vi.hoisted(() => ({
  setView: vi.fn(),
}));

vi.mock('../stores/appStore', () => ({
  useAppStore: { getState: () => appStoreMock },
}));

describe('CoachPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.user = { id: 'user_local_001' };
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('應該顯示阿念教練預設開場訊息', () => {
    render(<CoachPage />);
    expect(screen.getByText('先說一句就好')).toBeInTheDocument();
    expect(screen.getByText('不用整理完整。我會陪你把現在的感受，變成一個比較能承受的小下一步。')).toBeInTheDocument();
  });

  it('Coach 頁面應顯示 Beta 內測標籤與使用上限提示', () => {
    render(<CoachPage />);

    expect(screen.getAllByLabelText('Beta 內測版').length).toBeGreaterThan(0);
    expect(screen.getByText('內測中')).toBeInTheDocument();
  });

  it('Coach 首屏應該短到可以立刻開始，不顯示大段功能說明', () => {
    render(<CoachPage />);

    expect(screen.getByRole('button', { name: '我現在很煩' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '先做呼吸' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '開始 7 日陪跑' })).toBeInTheDocument();
    expect(screen.queryByText('主動提下一步')).not.toBeInTheDocument();
    expect(screen.queryByText('串起 LINE 與 APP')).not.toBeInTheDocument();
    expect(screen.queryByText('越來越懂你')).not.toBeInTheDocument();
    expect(screen.queryByText(/你不需要先想好怎麼說/)).not.toBeInTheDocument();
  });

  it('應該顯示阿念教練畫面骨架與快速回覆', () => {
    render(<CoachPage />);

    expect(screen.getByRole('region', { name: '阿念教練畫布' })).toBeInTheDocument();
    expect(screen.getByText(/^今日，/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '先做呼吸' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '先做呼吸' }));
    expect(screen.getByText('跟著阿念一起呼吸')).toBeInTheDocument();
  });

  it('Coach 頁底部導覽使用一般使用者看得懂的中文標籤', () => {
    render(<CoachPage />);

    expect(screen.getByRole('navigation', { name: 'Coach 頁面導覽' })).toBeInTheDocument();
    expect(screen.getByText('今日心情')).toBeInTheDocument();
    expect(screen.getByText('記錄回顧')).toBeInTheDocument();
    expect(screen.getByText('教練')).toBeInTheDocument();
    expect(screen.getByText('成長看板')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '回到今日心情' })).toBeInTheDocument();
    expect(screen.queryByText('安定室')).not.toBeInTheDocument();
  });

  it('Coach 空狀態應該提供三個低負擔開始入口', () => {
    render(<CoachPage />);

    expect(screen.getByRole('button', { name: '我現在很煩' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '先做呼吸' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '開始 7 日陪跑' })).toBeInTheDocument();
  });

  it('Coach 首屏應該讓使用者知道也能透過 LINE 對話', () => {
    render(<CoachPage />);

    expect(screen.getByText('也可以用 LINE 對話')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /加入 LINE 官方帳號 @980pqrhn/ })).toBeInTheDocument();
    expect(screen.getByText('加入後輸入「綁定」，再回來貼上 6 位碼。')).toBeInTheDocument();
  });

  it('Coach 首屏提供簡短 7 日小陪跑入口', () => {
    render(<CoachPage />);

    fireEvent.click(screen.getByRole('button', { name: '開始 7 日陪跑' }));
    expect(screen.getByText('我想開始 7 日小陪跑：每天做一個照顧自己的小動作')).toBeInTheDocument();
  });

  it('未登入使用者啟動 Coach 時不應呼叫 API，並提示先登入', () => {
    authMock.user = null;
    const sendMessageSpy = vi.spyOn(client, 'sendMessage');

    render(<CoachPage />);

    fireEvent.click(screen.getByRole('button', { name: '開始 7 日陪跑' }));

    expect(sendMessageSpy).not.toHaveBeenCalled();
    expect(screen.getByText('請先登入或註冊帳號，再使用阿念教練與 7 日小陪跑')).toBeInTheDocument();
    expect(screen.queryByText('我想開始 7 日小陪跑：每天做一個照顧自己的小動作')).not.toBeInTheDocument();
  });

  it('送出訊息後應該呼叫 API 並顯示回應', async () => {
    const sendMessageSpy = vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '我聽見你了',
    });

    render(<CoachPage />);

    const input = screen.getByLabelText('輸入訊息');
    fireEvent.change(input, { target: { value: '你好' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: '你好' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('我聽見你了')).toBeInTheDocument();
    });
  });

  it('API 回傳小行動提案時顯示卡片，確認後送出設定訊息', async () => {
    const sendMessageSpy = vi.spyOn(client, 'sendMessage')
      .mockResolvedValueOnce({
        response: '我先幫你提一個小行動。',
        intent: 'propose_micro_action',
        microActionProposal: {
          key: 'daily-water',
          goalKey: 'daily_care',
          category: 'daily_care',
          title: '喝一杯水，然後看窗外十秒',
          dueHours: 24,
        },
      })
      .mockResolvedValueOnce({ response: '已設為今天的小行動。' });

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我想做一點點就好' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(await screen.findByText('喝一杯水，然後看窗外十秒')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '設為今天的小行動' }));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: '設為今天的小行動：喝一杯水，然後看窗外十秒' })
      );
    });
  });

  it('API 回傳進行中的小行動時顯示卡片，回報有做到會送出自然語句', async () => {
    const sendMessageSpy = vi.spyOn(client, 'sendMessage')
      .mockResolvedValueOnce({
        response: '回來看一眼就好。',
        activeMicroAction: {
          id: 'action-1',
          title: '睡前把手機放遠一點',
          category: 'sleep',
          status: 'active',
          due_at: '2026-05-16T12:00:00.000Z',
          created_at: '2026-05-15T12:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({ response: '我記下來了。' });

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我回來了' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(await screen.findByText('睡前把手機放遠一點')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '有做到' }));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: '小行動回報：有做到' })
      );
    });
  });

  it('API 回傳個人陪跑摘要時顯示進度，且不出現懲罰語言', async () => {
    const { container } = render(<CoachPage />);
    vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '我有看到你回來了。',
      gamification: {
        total_xp: 180,
        coin_balance: 9,
        lifetime_coins: 18,
        total_reported: 6,
        completed_count: 3,
        partial_count: 2,
        skipped_count: 1,
        current_review_streak: 3,
        longest_review_streak: 5,
        last_review_date: '2026-05-15',
        level: {
          level: 2,
          title: '回來看一眼',
          currentXp: 80,
          nextLevelXp: 150,
        },
      },
    });

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '今天有做一點' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(await screen.findByText('Lv.2 回來看一眼')).toBeInTheDocument();
    expect(screen.getByText('80 / 150 XP')).toBeInTheDocument();
    expect(screen.getByText('9 金幣')).toBeInTheDocument();
    expect(screen.getByText('復盤連續 3 天')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/失敗|扣分|降級/);
  });

  it('應該顯示打字指示器在載入中', async () => {
    vi.spyOn(client, 'sendMessage').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ response: '好' }), 100))
    );

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '測試' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(screen.getByText('阿念正在整理...')).toBeInTheDocument();
  });

  it('API 錯誤時應該顯示錯誤訊息與重試按鈕', async () => {
    vi.spyOn(client, 'sendMessage').mockRejectedValue(new Error('Coach API error: 500'));

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '錯誤測試' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(screen.getByText('伺服器暫時忙碌，請稍後再試')).toBeInTheDocument();
    });

    expect(screen.getByText('再試一次')).toBeInTheDocument();
  });

  it('超時時應該顯示超時訊息', async () => {
    vi.spyOn(client, 'sendMessage').mockRejectedValue(new Error('timeout'));

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '超時測試' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(screen.getByText('連線有點慢，請稍後再試')).toBeInTheDocument();
    });
  });

  it('網路錯誤時應該顯示網路錯誤訊息', async () => {
    vi.spyOn(client, 'sendMessage').mockRejectedValue(new TypeError('Failed to fetch'));

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '網路測試' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(screen.getByText('網路連線不穩定，請檢查後再試一次')).toBeInTheDocument();
    });
  });

  it('點擊重試應該重新發送訊息', async () => {
    const sendMessageSpy = vi.spyOn(client, 'sendMessage')
      .mockRejectedValueOnce(new Error('Coach API error: 500'))
      .mockResolvedValueOnce({ response: '重試成功' });

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '重試測試' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(screen.getByText('再試一次')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('再試一次'));

    await waitFor(() => {
      expect(screen.getByText('重試成功')).toBeInTheDocument();
    });

    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
  });

  it('應該從 localStorage 載入歷史訊息', () => {
    const history = [
      { id: '1', role: 'model' as const, content: '歡迎', timestamp: new Date().toISOString() },
      { id: '2', role: 'user' as const, content: '你好', timestamp: new Date().toISOString() },
    ];
    saveChatHistory(history, 'user_local_001');

    render(<CoachPage />);
    expect(screen.getByText('你好')).toBeInTheDocument();
  });

  it('點擊 SOS 按鈕應該開啟 SOS 覆蓋層', () => {
    render(<CoachPage />);

    fireEvent.click(screen.getByLabelText('SOS 緊急協助'));
    expect(screen.getByRole('heading', { name: /緊急安定練習/ })).toBeInTheDocument();
    expect(screen.getByText(/今心不是緊急救援服務/)).toBeInTheDocument();
    expect(screen.getByText(/119 或 110/)).toBeInTheDocument();
    expect(screen.getByText('安心專線 1925')).toBeInTheDocument();
    expect(screen.getByText('生命線 1909')).toBeInTheDocument();
  });

  it('Agent 回傳 open_sos action 時開啟緊急安定練習覆蓋層', async () => {
    vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '我陪你一起穩下來。',
      action: 'open_sos',
      actionReason: '偵測到你需要緊急協助',
    });

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我快撐不住了' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /緊急安定練習/ })).toBeInTheDocument();
    });
  });

  it('Agent 回傳 show_growth action 時切到成長頁', async () => {
    vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '我幫你打開成長趨勢。',
      action: 'show_growth',
    });

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我最近有進步嗎' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(appStoreMock.setView).toHaveBeenCalledWith('growth');
    });
  });

  it('可以提交 LINE Bot 綁定碼', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ lineUserId: 'U123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    saveChatHistory([
      { id: '1', role: 'model', content: '歡迎', timestamp: new Date().toISOString() },
      { id: '2', role: 'user', content: '你好', timestamp: new Date().toISOString() },
    ], 'user_local_001');
    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('LINE 綁定碼'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByText('綁定'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/line-binding/claim'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'ABC123', appUserId: 'user_local_001' }),
        })
      );
    });
    expect(await screen.findByText('已綁定 LINE Bot：U123')).toBeInTheDocument();
  });

  it('未登入使用者提交 LINE Bot 綁定碼時不應送出請求', () => {
    authMock.user = null;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('LINE 綁定碼'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByText('綁定'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('請先登入或註冊帳號，再綁定 LINE Bot')).toBeInTheDocument();
  });

  it('LINE Bot 綁定區顯示官方帳號與加好友入口', () => {
    saveChatHistory([
      { id: '1', role: 'model', content: '歡迎', timestamp: new Date().toISOString() },
      { id: '2', role: 'user', content: '你好', timestamp: new Date().toISOString() },
    ], 'user_local_001');
    render(<CoachPage />);

    const panel = screen.getByTestId('line-binding-panel');
    expect(within(panel).getByText('LINE 官方帳號')).toBeInTheDocument();
    expect(within(panel).getByText('鋅鋰師拔麻的小小額葉養成手札')).toBeInTheDocument();
    expect(within(panel).getByText('@980pqrhn')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: '先加入 LINE 官方帳號' })).toHaveAttribute(
      'href',
      'https://line.me/R/ti/p/@980pqrhn'
    );
  });

  it('送出 LINE Bot 綁定碼時應該鎖定按鈕並顯示綁定中', async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal('fetch', fetchMock);

    saveChatHistory([
      { id: '1', role: 'model', content: '歡迎', timestamp: new Date().toISOString() },
      { id: '2', role: 'user', content: '你好', timestamp: new Date().toISOString() },
    ], 'user_local_001');
    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('LINE 綁定碼'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByRole('button', { name: '綁定' }));

    expect(screen.getByRole('button', { name: '綁定中...' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '綁定中...' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch({
      ok: true,
      json: async () => ({ lineUserId: 'U123' }),
    } as Response);

    expect(await screen.findByText('已綁定 LINE Bot：U123')).toBeInTheDocument();
  });

  it('LINE Bot 綁定失敗時顯示後端原因', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: '',
      text: async () => JSON.stringify({ error: 'Binding code not found or expired' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    saveChatHistory([
      { id: '1', role: 'model', content: '歡迎', timestamp: new Date().toISOString() },
      { id: '2', role: 'user', content: '你好', timestamp: new Date().toISOString() },
    ], 'user_local_001');
    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('LINE 綁定碼'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByText('綁定'));

    expect(await screen.findByText('綁定失敗：API 錯誤: Binding code not found or expired')).toBeInTheDocument();
  });

  it('Coach 回覆不應該顯示工具名稱或工具結果痕跡', async () => {
    vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '[工具 save_ruler_log 結果]\n{"success":true}\n我已經幫你記下來了，可以先喝一口水。',
    });

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我很焦慮 7 分' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(await screen.findByText('我已經幫你記下來了，可以先喝一口水。')).toBeInTheDocument();
    expect(screen.queryByText(/save_ruler_log/)).not.toBeInTheDocument();
    expect(screen.queryByText(/工具/)).not.toBeInTheDocument();
  });

  it('右上角不應該顯示無功能的個人設定按鈕', () => {
    render(<CoachPage />);

    expect(screen.queryByRole('button', { name: '個人設定' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '今心' })).toBeInTheDocument();
  });

  it('Coach 樣式應提供深色模式覆寫，避免頁面停留在淺色底', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/pages/CoachPage.module.css'), 'utf8');

    expect(css).toContain(':global([data-theme="dark"]) .coachPage');
    expect(css).toContain(':global([data-theme="dark"]) .agentIntro');
    expect(css).toContain(':global([data-theme="dark"]) .inputDock');
  });
});
