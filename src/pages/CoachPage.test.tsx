import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachPage from './CoachPage';
import * as client from '../lib/adk/client';
import { saveChatHistory } from '../lib/adk/storage';

vi.mock('../services/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user_local_001' } }),
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
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('應該顯示預設歡迎訊息', () => {
    render(<CoachPage />);
    expect(screen.getByText('你好，我是今心教練。我在這裡陪伴你，無論你現在的感受是什麼，都可以跟我說說。')).toBeInTheDocument();
  });

  it('應該顯示歡迎卡片與建議提示', () => {
    render(<CoachPage />);
    expect(screen.getByText('歡迎來到今心教練')).toBeInTheDocument();
    expect(screen.getByText('我今天有點煩，想找人聊聊')).toBeInTheDocument();
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

  it('應該顯示打字指示器在載入中', async () => {
    vi.spyOn(client, 'sendMessage').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ response: '好' }), 100))
    );

    render(<CoachPage />);

    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '測試' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(screen.getByText('教練正在思考...')).toBeInTheDocument();
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

  it('點擊「幫我啟動 Meta-Moment」應該開啟 SOS 覆蓋層', () => {
    render(<CoachPage />);

    fireEvent.click(screen.getByText('幫我啟動 Meta-Moment'));
    expect(screen.getByRole('heading', { name: /Meta-Moment 緊急協助/ })).toBeInTheDocument();
  });

  it('Agent 回傳 open_sos action 時開啟 Meta-Moment 覆蓋層', async () => {
    vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '我陪你一起穩下來。',
      action: 'open_sos',
      actionReason: '偵測到你需要緊急協助',
    });

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我快撐不住了' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Meta-Moment 緊急協助/ })).toBeInTheDocument();
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
});
