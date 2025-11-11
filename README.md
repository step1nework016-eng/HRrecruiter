# 招募顧問 AI 智能體 - 全端專案

這是「招募顧問 AI 智能體」專案，採用 **Monorepo** 架構，前後端放在同一個專案中。

- **前端**: HTML + JavaScript (RWD)
- **後端**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **LLM**: Google Gemini API

## 技術棧

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **LLM**: Google Gemini API

## 專案結構

```
.
├── public/              # 前端靜態檔案
│   └── index.html       # 前端頁面（v2.html）
├── src/
│   ├── routes/          # API 路由
│   │   ├── hrAgent.ts   # POST /api/hr-agent
│   │   ├── hrChat.ts    # POST /api/hr-chat
│   │   ├── hrSave.ts    # POST /api/hr-save
│   │   └── hrSaved.ts   # GET /api/hr-saved
│   ├── services/         # 業務邏輯
│   │   ├── llmClient.ts # Gemini API 客戶端
│   │   └── prompts.ts   # Prompt 模板
│   ├── db/              # 資料庫
│   │   └── index.ts     # Prisma 客戶端
│   └── index.ts         # 伺服器入口（同時提供 API 和前端）
├── prisma/
│   └── schema.prisma    # 資料庫 Schema
├── package.json
├── tsconfig.json
├── Dockerfile           # Docker 部署用
├── zeabur.json          # Zeabur 部署設定
└── .env.example
```

## 安裝與設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 並建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入以下資訊：

```env
# 伺服器設定
PORT=3000

# 資料庫連線（PostgreSQL）
DATABASE_URL="postgresql://user:password@localhost:5432/hr_agent?schema=public"

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# 預設使用者 ID
DEFAULT_USER_ID=default_user
```

### 3. 設定資料庫

#### 建立 PostgreSQL 資料庫

```bash
# 使用 psql 或任何 PostgreSQL 客戶端
createdb hr_agent
```

#### 執行 Prisma Migration

```bash
# 產生 Prisma Client
npm run db:generate

# 推送 Schema 到資料庫（建立資料表）
npm run db:push

# 或使用 Migration（推薦用於生產環境）
npm run db:migrate
```

### 4. 啟動伺服器

#### 開發模式（自動重載）

```bash
npm run dev
```

#### 生產模式

```bash
# 編譯 TypeScript
npm run build

# 啟動伺服器
npm start
```

伺服器預設會在 `http://localhost:3000` 啟動。

## API 端點

### 1. POST /api/hr-agent

四個功能的 LLM 產生 API。

**Request Body:**
```json
{
  "step": "job_intake",  // 或 "sourcing" / "screening" / "interview"
  "input": "職缺說明或履歷內容...",
  "mode": "normal"       // 或 "retry"
}
```

**Response:**
```json
{
  "result": { ... }  // JSON 物件或字串
}
```

### 2. POST /api/hr-chat

與 AI 自由對話。

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "reply": "AI 回覆內容"
}
```

### 3. POST /api/hr-save

儲存本次分析 / 產出結果。

**Request Body:**
```json
{
  "step": "screening",
  "input": "原始輸入文字",
  "result": { ... }  // LLM 的回應內容
}
```

**Response:**
```json
{
  "id": "uuid"
}
```

### 4. GET /api/hr-saved

查詢已儲存紀錄。

**Query Parameters:**
- `step` (可選): 篩選特定步驟
- `limit` (可選): 限制筆數（預設 20）

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "step": "screening",
      "input_preview": "前100字...",
      "created_at": "2024-01-01T00:00:00.000Z",
      "result": { ... }
    }
  ]
}
```

## 資料庫 Schema

### hr_saved_artifacts

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | String | 使用者 ID（目前使用預設值） |
| step | String | 步驟類型（job_intake / sourcing / screening / interview） |
| input_text | Text | 原始輸入文字 |
| result_json | JSONB | LLM 回傳的結果 |
| created_at | Timestamp | 建立時間 |

## 開發工具

### Prisma Studio

可視化資料庫管理工具：

```bash
npm run db:studio
```

會在 `http://localhost:5555` 開啟。

## 注意事項

1. **CORS 設定**: 目前設定為允許所有來源（`origin: '*'`），生產環境請改為特定網域。
2. **API Key 安全**: 請勿將 `.env` 檔案提交到版本控制系統。
3. **資料庫連線**: 確保 PostgreSQL 服務正在運行，且連線字串正確。
4. **Gemini API**: 請確認 API Key 有效且有足夠的配額。

## 故障排除

### 資料庫連線失敗

- 確認 PostgreSQL 服務正在運行
- 檢查 `DATABASE_URL` 是否正確
- 確認資料庫 `hr_agent` 已建立

### LLM API 錯誤

- 確認 `GEMINI_API_KEY` 已正確設定
- 檢查 API Key 是否有效
- 查看控制台錯誤訊息

### TypeScript 編譯錯誤

- 執行 `npm run db:generate` 重新產生 Prisma Client
- 確認 `tsconfig.json` 設定正確

## 部署

### 快速部署到 Zeabur

詳細步驟請見 [QUICK_START.md](./QUICK_START.md) 或 [DEPLOY.md](./DEPLOY.md)

**簡要步驟：**
1. 推送到 GitHub
2. 在 Zeabur 連結 GitHub repository
3. 設定環境變數（`GEMINI_API_KEY`, `DATABASE_URL`）
4. 新增 PostgreSQL 服務
5. 執行 `npx prisma db push`

### 部署架構

- **Monorepo**: 前後端在同一專案
- **單一服務**: Express 同時提供 API 和前端靜態檔案
- **自動部署**: Zeabur 會自動從 GitHub 部署

## 授權

MIT License

