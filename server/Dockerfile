# ═══════════════════════════════════════════════════════════════
# 今心 ImXin Bot Server — 多階段 Docker 構建
# 技術棧: Node.js 22, TypeScript, ESM, Express
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────
# Stage 1: Builder — 編譯 TypeScript
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# 安裝構建依賴（package-lock.json 確保可複現構建）
COPY package*.json ./
RUN npm ci

# 複製源碼並構建
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production — 最小運行時鏡像
# ─────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# 安裝生產依賴（排除 devDependencies）
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 從 builder 階段複製編譯產物
COPY --from=builder /app/dist ./dist

# 暴露服務端口（默認 3000，可被 PORT 環境變量覆蓋）
EXPOSE 3000

# 健康檢查：調用 /health 端點
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

# 啟動命令
CMD ["node", "dist/index.js"]
