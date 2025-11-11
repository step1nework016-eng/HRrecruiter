# -------- Builder：build TS + Prisma --------
FROM node:20-alpine AS builder

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

ENV NODE_ENV=production
WORKDIR /app

# 複製 package.json 和 prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# 安裝 production 依賴（包含 @prisma/client）
RUN npm install --omit=dev

# ⭐ 關鍵：安裝 prisma CLI 來生成客戶端（臨時安裝，生成後可移除）
RUN npm install prisma --save-dev

# 生成 Prisma 客戶端（必須在 runtime 階段生成，因為它依賴於當前的 node_modules 結構）
RUN npx prisma generate

# 移除 prisma CLI（可選，減少映像大小）
RUN npm uninstall prisma

# 複製編譯後的代碼
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]

