# -------- Builder：build TS + Prisma --------
FROM node:20-alpine AS builder

# 安裝 OpenSSL 開發庫（Prisma 需要）
RUN apk add --no-cache openssl openssl-dev libc6-compat

ENV NODE_ENV=development
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --include=dev
COPY . .

RUN npx prisma generate
RUN npm run build


# -------- Runtime：只帶 production 依賴 --------
FROM node:20-alpine

# 安裝 OpenSSL 開發庫（Prisma 需要）
RUN apk add --no-cache openssl openssl-dev libc6-compat

ENV NODE_ENV=production
WORKDIR /app

# 複製 package.json 和 prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# 安裝 production 依賴（包含 @prisma/client）
RUN npm install --omit=dev

# ⭐ 關鍵：安裝 prisma CLI 來生成客戶端
# 保留 prisma CLI（不移除），因為之後可能需要運行 migration
RUN npm install prisma --save-dev

# 生成 Prisma 客戶端（必須在 runtime 階段生成，因為它依賴於當前的 node_modules 結構）
# 注意：prisma generate 不需要 DATABASE_URL，只需要 schema 文件
RUN npx prisma generate

# 複製編譯後的代碼（必須在生成 Prisma 客戶端之後）
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

# 修改：在啟動時執行 db push，確保 Schema 同步
# 使用 sh -c 來執行多個指令
CMD ["sh", "-c", "prisma db push --skip-generate && node dist/index.js"]
