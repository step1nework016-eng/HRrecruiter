# -------- Builder：build TS + Prisma --------
FROM node:20-alpine AS builder

# 安裝 OpenSSL 開發庫（Prisma 需要）
RUN apk add --no-cache openssl openssl-dev libc6-compat

ENV NODE_ENV=development
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# 安裝所有依賴（包含 devDependencies 以進行編譯）
RUN npm install --include=dev
COPY . .

# 生成 Prisma Client
RUN npx prisma generate
# 編譯 TS
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

# 安裝 production 依賴（包含 @prisma/client, multer, pdf-parse, mammoth 等）
# 注意：pdf-parse 可能需要開發依賴中的某些編譯工具，但通常純 JS 依賴即可
RUN npm install --omit=dev

# ⭐ 關鍵：安裝 prisma CLI 來生成客戶端
# 保留 prisma CLI（不移除），因為之後可能需要運行 migration
RUN npm install prisma --save-dev

# 生成 Prisma 客戶端
RUN npx prisma generate

# 複製編譯後的代碼
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

# 啟動命令：先同步 DB Schema 再啟動 Server
CMD ["sh", "-c", "prisma db push --skip-generate && node dist/index.js"]
