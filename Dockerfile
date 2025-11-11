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

# ⭐ 關鍵：跳過 postinstall（因為 builder 階段已經跑過）
ENV npm_config_ignore_scripts=true

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]

