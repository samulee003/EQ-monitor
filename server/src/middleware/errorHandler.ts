/**
 * Error Handler — 全局錯誤處理中間件
 *
 * 捕獲所有未處理的異步錯誤，返回標準化響應。
 * 生產環境絕不暴露堆棧或敏感信息。
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export function createApiError(
  status: number,
  code: string,
  message: string
): ApiError {
  return { status, code, message };
}

export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== 'production';

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = '伺服器內部錯誤，請稍後再試';

  if ('status' in err && typeof err.status === 'number') {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err.message) {
    // 對於非 ApiError，生產環境使用通用消息
    message = isDev ? err.message : message;
  }

  // 屏蔽敏感錯誤信息
  const sensitivePatterns = [
    /connection string/i,
    /password/i,
    /secret/i,
    /token/i,
    /private[_\s]?key/i,
  ];

  if (
    !isDev &&
    sensitivePatterns.some((p) => p.test(message) || p.test(err.message || ''))
  ) {
    message = '伺服器內部錯誤，請稍後再試';
    code = 'INTERNAL_ERROR';
  }

  logger.error('Unhandled error', {
    status,
    code,
    message: err.message || 'Unknown error',
    stack: isDev ? (err as Error).stack : undefined,
  });

  res.status(status).json({
    error: {
      code,
      message,
      ...(isDev && 'stack' in err ? { stack: err.stack } : {}),
    },
  });
}

/** 捕獲異步路由中的錯誤 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
