/**
 * Rate Limiter — 簡易速率限制中間件
 *
 * 每 IP 每分鐘最多 60 次請求。
 * 基於內存 Map 實現，適合單機部署。
 * 未來可替換為 Redis 方案。
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 分鐘
const MAX_REQUESTS = 60;

function getClientIp(req: Request): string {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIp(req);
  const now = Date.now();

  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', { ip, path: req.path });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    });
    return;
  }

  entry.count++;
  next();
}

/** 定期清理過期條目，防止內存泄漏 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(ip);
    }
  }
}

// 每 10 分鐘清理一次過期條目
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);
