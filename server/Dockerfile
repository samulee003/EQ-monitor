# 今心 ImXin Bot Server
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# 強制以 development 模式安裝，確保 devDependencies（TypeScript）包含在內
RUN NODE_ENV=development npm ci

COPY . .
RUN ./node_modules/.bin/tsc

# 移除 devDependencies，縮小映像
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "dist/index.js"]
