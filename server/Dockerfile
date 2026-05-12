# 今心 ImXin Bot Server — 單階段構建（避免多階段 Docker 快取衝突）
FROM node:22-alpine

WORKDIR /app

# 安裝所有依賴（含 devDependencies，build 需要 TypeScript）
COPY package*.json ./
RUN npm ci

# 複製源碼並編譯
COPY . .
RUN ./node_modules/.bin/tsc

# 移除 devDependencies，縮小映像體積
RUN npm prune --production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "dist/index.js"]
