# -------- Builder：負責安裝 devDeps + build TS + Prisma --------
FROM node:20-alpine AS builder

# 在 build 階段強制開發模式，確保 devDependencies（typescript、tsx 等）會被裝
ENV NODE_ENV=development

WORKDIR /app

# 先複製 package 檔 & prisma
COPY package*.json ./
COPY prisma ./prisma/

# ⭐ 一定要把 dev 也裝進來，才會有 tsc
RUN npm install --include=dev

# 再複製其他原始碼
COPY . .

# 產生 Prisma Client（其實 build script 也會跑一次，重複沒關係）
RUN npx prisma generate

# 編譯 TypeScript（package.json: "build": "prisma generate && tsc"）
RUN npm run build


# -------- Runtime：真正跑服務的容器，只帶 prod 依賴 --------
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# 只裝 production 依賴
COPY package*.json ./
RUN npm install --omit=dev

# 從 builder 拿 build 好的檔案
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Zeabur 會注入 PORT 環境變數，預設你程式聽 3000 即可
EXPOSE 3000

CMD ["npm", "start"]
