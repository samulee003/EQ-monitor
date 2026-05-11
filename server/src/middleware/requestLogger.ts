/**
 * Request Logger — 請求日誌中間件
 *
 * 記錄每個請求的方法、路徑、狀態碼和耗時。
 * 同時更新指標計數器。
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { recordRequest, recordError } from '../utils/metrics.js';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  recordRequest();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (status >= 400) {
      recordError();
    }

    const logData = {
      method: req.method,
      path: req.path,
      status,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (status >= 500) {
      logger.error('HTTP request failed', logData);
    } else if (status >= 400) {
      logger.warn('HTTP request warning', logData);
    } else {
      logger.debug('HTTP request', logData);
    }
  });

  next();
}
