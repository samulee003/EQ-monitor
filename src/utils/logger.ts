/**
 * Logger - 結構化日誌系統
 * 
 * 統一管理所有日誌輸出，生產環境自動抑制非錯誤日誌。
 * 未來可擴展為發送到 Sentry / LogRocket 等服務。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV || false;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
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

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
