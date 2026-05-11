/**
 * Logger — 結構化日誌系統
 *
 * 統一管理所有日誌輸出，生產環境自動抑制 debug/info。
 * 未來可擴展為發送到 Winston / Pino / Sentry 等服務。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDev: boolean;
  private history: LogEntry[] = [];
  private readonly maxHistory = 100;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // 保留最近 100 條日誌（用於調試面板）
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // 生產環境只輸出 warn 和 error
    if (!this.isDev && level !== 'warn' && level !== 'error') {
      return;
    }

    const prefix = `[今心 ${level.toUpperCase()}]`;
    if (context) {
      console[level](prefix, message, context);
    } else {
      console[level](prefix, message);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  /** 獲取最近日誌（用於調試面板） */
  getHistory(): LogEntry[] {
    return [...this.history];
  }

  /** 清空日誌歷史 */
  clearHistory() {
    this.history = [];
  }
}

export const logger = new Logger();
