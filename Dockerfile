# 使用 Node.js 官方映像檔
FROM node:20-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./
COPY prisma ./prisma/

# 安裝依賴（使用 npm install 因為可能沒有 package-lock.json）
RUN npm install

# 複製所有檔案
COPY . .

# 產生 Prisma Client
RUN npx prisma generate

# 編譯 TypeScript
RUN npm run build

# 生產環境映像檔
FROM node:20-alpine

WORKDIR /app

# 複製必要的檔案
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# 暴露端口（Zeabur 會自動設定 PORT 環境變數）
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "start"]

