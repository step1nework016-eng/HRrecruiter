import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

interface SaveRequest {
  step: 'job_intake' | 'sourcing' | 'screening' | 'interview';
  input: string;
  result: any; // 可能是 JSON 物件或字串
}

/**
 * POST /api/hr-save
 * 儲存本次分析 / 產出結果
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { step, input, result }: SaveRequest = req.body;

    // 驗證輸入
    if (!step || input === undefined || result === undefined) {
      return res.status(400).json({ error: '缺少必要參數：step、input 和 result' });
    }

    if (!['job_intake', 'sourcing', 'screening', 'interview'].includes(step)) {
      return res.status(400).json({ error: '無效的 step 值' });
    }

    // 取得 user_id（目前使用環境變數的預設值，未來可從 Header 或 body 取得）
    const userId = req.body.user_id || process.env.DEFAULT_USER_ID || 'default_user';

    console.log(`[HR Save] 儲存步驟: ${step}, 使用者: ${userId}`);

    // 儲存到資料庫
    const artifact = await prisma.hrSavedArtifact.create({
      data: {
        userId,
        step,
        inputText: input,
        resultJson: result, // Prisma 會自動處理 JSON
      },
    });

    // 回傳 ID
    res.json({ id: artifact.id });
  } catch (error) {
    console.error('[HR Save] 錯誤:', error);
    
    // 如果是資料庫表不存在的錯誤，返回更友好的訊息
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.warn('[HR Save] 資料庫表不存在，請執行 migration: npx prisma db push');
      return res.status(500).json({
        error: '資料庫表不存在，請執行 migration',
        details: '請在伺服器上執行: npx prisma db push 或 npx prisma migrate deploy'
      });
    }
    
    res.status(500).json({
      error: error instanceof Error ? error.message : '儲存失敗',
    });
  }
});

export default router;

