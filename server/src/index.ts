import './env.js';
import express, { Request, Response } from 'express';
import {
  middleware,
  WebhookEvent,
  TextMessage,
  Client,
  validateSignature,
} from '@line/bot-sdk';
import { processMessage } from './rulerBot.js';
import { adapterName } from './db/index.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import { getMetrics } from './utils/metrics.js';
import { getActiveSessionCount } from './rulerBot.js';
import { dashboardRoutes } from './api/dashboard.js';
import coachRoutes from './routes/coach.js';



// ═══════════════════════════════════════════════════════════════
// 環境變量檢查
// ═══════════════════════════════════════════════════════════════

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
const PORT = parseInt(process.env.PORT || '3000', 10);

if (!CHANNEL_ACCESS_TOKEN || !CHANNEL_SECRET) {
  logger.warn(
    'LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET not set. ' +
      'Bot will start in demo mode (no actual LINE messaging). ' +
      'Set these in .env to enable full functionality.'
  );
}

// ═══════════════════════════════════════════════════════════════
// LINE Client（條件初始化）
// ═══════════════════════════════════════════════════════════════

const lineClient = CHANNEL_ACCESS_TOKEN
  ? new Client({ channelAccessToken: CHANNEL_ACCESS_TOKEN })
  : null;

// ═══════════════════════════════════════════════════════════════
// Express App
// ═══════════════════════════════════════════════════════════════

const app = express();

// ── 全局中間件（順序：rate limit -> request log -> body parser -> routes -> error handler）
app.use(rateLimiter);
app.use(requestLogger);
// 注意：全局 JSON 解析器需排除 /webhook，該路徑使用獨立的 rawBody 解析器
app.use((req, res, next) => {
  if (req.path === '/webhook') {
    next();
    return;
  }
  express.json()(req, res, next);
});

// 健康檢查
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: '今心 ImXin Bot Server',
    version: '1.0.0',
    mode: CHANNEL_ACCESS_TOKEN ? 'live' : 'demo',
  });
});

app.get('/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const metrics = getMetrics();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    uptimeHuman: formatUptime(process.uptime()),
    memory: {
      rss: formatBytes(mem.rss),
      heapTotal: formatBytes(mem.heapTotal),
      heapUsed: formatBytes(mem.heapUsed),
      external: formatBytes(mem.external || 0),
    },
    sessionCount: getActiveSessionCount(),
    requestCount: metrics.totalRequests,
    adapter: adapterName,
    version: '1.0.0',
  });
});

app.get('/metrics', (_req: Request, res: Response) => {
  res.json(getMetrics());
});

// 儀表盤 API（供 PWA 調用）
app.get('/api/dashboard/:lineUserId/summary', asyncHandler(dashboardRoutes.getSummary));
app.get('/api/dashboard/:lineUserId/weekly-report', asyncHandler(dashboardRoutes.getWeeklyReport));

// AI Coach API（ADK Agent）
app.use('/api/coach', coachRoutes);

// ═══════════════════════════════════════════════════════════════
// LINE Webhook
// ═══════════════════════════════════════════════════════════════

// 擴展 Request 類型以支持 rawBody
interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

// 中間件：解析 LINE 請求體（保留原始 body 用於簽名驗證）
app.use(
  '/webhook',
  express.json({
    verify: (req: RequestWithRawBody, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.post(
  '/webhook',
  asyncHandler(async (req: RequestWithRawBody, res: Response) => {
    // 立即回應 200（LINE 要求 1 秒內回應）
    res.status(200).send('OK');

    // 驗證簽名（僅在生產環境）
    const signature = req.get('x-line-signature') || '';
    if (CHANNEL_SECRET && signature && req.rawBody) {
      const isValid = validateSignature(
        req.rawBody,
        CHANNEL_SECRET,
        signature
      );
      if (!isValid) {
        logger.warn('Invalid LINE signature');
        return;
      }
    }

    const events: WebhookEvent[] = req.body.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleTextMessage(event);
      }

      // 處理加入好友事件
      if (event.type === 'follow') {
        await handleFollow(event);
      }
    }
  })
);

// ═══════════════════════════════════════════════════════════════
// 消息處理器
// ═══════════════════════════════════════════════════════════════

async function handleTextMessage(event: WebhookEvent): Promise<void> {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId || 'anonymous';
  const text = event.message.text;

  logger.debug(`Message received`, { userId, text: text.substring(0, 50) });

  // 使用 RULER Bot 處理消息
  const response = await processMessage(userId, text);

  // 回覆用戶
  if (lineClient && 'replyToken' in event && event.replyToken) {
    try {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: response.text,
        quickReply: response.quickReplies
          ? {
              items: response.quickReplies.map((qr) => ({
                type: 'action' as const,
                action: {
                  type: 'message' as const,
                  label: qr.label,
                  text: qr.text,
                },
              })),
            }
          : undefined,
      } as TextMessage);
    } catch (err) {
      logger.error('LINE reply error', {
        userId,
        error: (err as Error).message,
      });
    }
  } else {
    // Demo mode: 打印到控制台
    logger.info(`[BOT REPLY] ${response.text.substring(0, 80)}...`);
    if (response.quickReplies) {
      logger.info(
        `[QUICK REPLIES] ${response.quickReplies.map((q) => q.label).join(', ')}`
      );
    }
  }
}

async function handleFollow(event: WebhookEvent): Promise<void> {
  const userId = event.source.userId || 'anonymous';
  logger.info(`User followed`, { userId });

  const welcomeText = `歡迎來到今心 🌿

我是你的 AI 情緒陪伴夥伴。

當你感到情緒湧上來的時候，
不需要勉強自己「想開一點」。

我會陪你一起：
• 覺察身體的感受
• 為情緒精確命名
• 找到內在的真實需求
• 用安全的方式表達和調節

隨時跟我說話，或輸入「幫助」看看怎麼使用。

照顧好自己的心，其他的慢慢來。`;

  // FollowEvent 有 replyToken
  if (lineClient && 'replyToken' in event && event.replyToken) {
    try {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: welcomeText,
      });
    } catch (err) {
      logger.error('LINE welcome error', {
        userId,
        error: (err as Error).message,
      });
    }
  } else {
    logger.info(`[WELCOME] ${welcomeText.substring(0, 80)}...`);
  }
}

// ═══════════════════════════════════════════════════════════════
// 全局錯誤處理（必須在最後註冊）
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 導出 app 與 server 供測試使用
// ═══════════════════════════════════════════════════════════════
export { app, server };

// ═══════════════════════════════════════════════════════════════
// AI Proxy Route
// ═══════════════════════════════════════════════════════════════
app.post('/api/ai', async (req: Request, res: Response) => {
  try {
    const apiUrl = process.env.ZEABUR_AI_API_URL;
    const apiKey = process.env.ZEABUR_AI_API_KEY;
    if (!apiUrl || !apiKey) {
      res.status(500).json({ error: 'AI service not configured' });
      return;
    }
    const proxyRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });
    let data;
    try {
      data = await proxyRes.json();
    } catch {
      data = {};
    }
    res.status(proxyRes.ok ? 200 : proxyRes.status).json(data);
  } catch (err) {
    logger.error('AI proxy error', { error: (err as Error).message });
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// 啟動服務與優雅關閉
// ═══════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════╗
║  今心 ImXin Bot Server                                   ║
║  版本: 1.0.0                                             ║
║  端口: ${PORT.toString().padEnd(47)}║
║  模式: ${(CHANNEL_ACCESS_TOKEN ? 'live' : 'demo').padEnd(47)}║
║  數據庫: ${adapterName.padEnd(45)}║
╠══════════════════════════════════════════════════════════╣
║  端點:                                                   ║
║    GET  /        — 服務狀態                              ║
║    GET  /health  — 健康檢查（含內存、會話數）            ║
║    GET  /metrics — 運行指標                              ║
║    POST /webhook — LINE Bot Webhook                      ║
║    POST /api/coach — AI Coach Agent (ADK)                ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// 優雅關閉
function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');
    // 這裡可以清理其他資源（數據庫連接池、定時器等）
    process.exit(0);
  });

  // 強制關閉超時
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ═══════════════════════════════════════════════════════════════
// 工具函數
// ═══════════════════════════════════════════════════════════════

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
