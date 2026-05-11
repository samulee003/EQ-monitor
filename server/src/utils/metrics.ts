/**
 * Metrics — 簡易指標收集
 *
 * 累積運行時指標，供 /metrics 端點暴露。
 * 未來可替換為 Prometheus / StatsD 客戶端。
 */

export interface ServerMetrics {
  /** 累積 HTTP 請求數 */
  totalRequests: number;
  /** 累積 HTTP 錯誤數（4xx/5xx） */
  totalErrors: number;
  /** RULER 會話完成數 */
  rulerSessionsCompleted: number;
  /** RULER 會話超時數 */
  rulerSessionsTimedOut: number;
  /** 啟動時間戳 */
  startTime: number;
}

const metrics: ServerMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  rulerSessionsCompleted: 0,
  rulerSessionsTimedOut: 0,
  startTime: Date.now(),
};

export function recordRequest(): void {
  metrics.totalRequests++;
}

export function recordError(): void {
  metrics.totalErrors++;
}

export function recordRulerSessionCompleted(): void {
  metrics.rulerSessionsCompleted++;
}

export function recordRulerSessionTimedOut(): void {
  metrics.rulerSessionsTimedOut++;
}

export function getMetrics(): ServerMetrics {
  return { ...metrics };
}

export function resetMetrics(): void {
  metrics.totalRequests = 0;
  metrics.totalErrors = 0;
  metrics.rulerSessionsCompleted = 0;
  metrics.rulerSessionsTimedOut = 0;
  metrics.startTime = Date.now();
}
