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

COPY package*.json ./
# 安裝 production 依賴（包含 @prisma/client）
RUN npm install --omit=dev

# 複製 prisma schema
COPY prisma ./prisma/

# ⭐ 關鍵：從 builder 階段複製生成的 Prisma 客戶端
# Prisma 客戶端生成在 node_modules/.prisma/client 和 node_modules/@prisma/client 中
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# 複製編譯後的代碼
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]

