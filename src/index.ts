import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import hrAgentRouter from './routes/hrAgent';
import hrChatRouter from './routes/hrChat';
import hrSaveRouter from './routes/hrSave';
import hrSavedRouter from './routes/hrSaved';

// 載入環境變數
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors({
  origin: '*', // TODO: 生產環境請改為特定網域，例如 ['http://localhost:3000', 'https://yourdomain.com']
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由（必須在靜態檔案之前）
app.use('/api/hr-agent', hrAgentRouter);
app.use('/api/hr-chat', hrChatRouter);
app.use('/api/hr-save', hrSaveRouter);
app.use('/api/hr-saved', hrSavedRouter);

// 提供靜態檔案（前端）
// 在編譯後，__dirname 會是 dist/，所以 public 在 ../public
const publicPath = path.join(__dirname, '../public');
console.log(`📁 靜態檔案路徑: ${publicPath}`);
app.use(express.static(publicPath));

// SPA 路由：所有非 API 路由都回傳 index.html（必須在錯誤處理之前）
app.get('*', (req, res, next) => {
  // 跳過 API 路由
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 錯誤處理中間件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('未處理的錯誤:', err);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

// 404 處理（API 路由）
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: '找不到指定的 API 路由' });
});

// 啟動伺服器（監聽 0.0.0.0 以支援容器部署）
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 伺服器已啟動在 http://0.0.0.0:${PORT}`);
  console.log(`📝 API 端點:`);
  console.log(`   POST /api/hr-agent - 四個功能的 LLM 產生`);
  console.log(`   POST /api/hr-chat - 與 AI 對話`);
  console.log(`   POST /api/hr-save - 儲存結果`);
  console.log(`   GET  /api/hr-saved - 查詢已儲存紀錄`);
  console.log(`\n⚠️  請確認已設定以下環境變數:`);
  console.log(`   - DATABASE_URL`);
  console.log(`   - GEMINI_API_KEY`);
});

