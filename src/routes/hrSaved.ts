import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

/**
 * GET /api/hr-saved
 * 查詢已儲存紀錄
 * Query params:
 *   - step: 可選，篩選特定步驟
 *   - limit: 可選，限制筆數（預設 20）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const step = req.query.step as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    // 驗證 step（如果提供）
    if (step && !['job_intake', 'sourcing', 'screening', 'interview'].includes(step)) {
      return res.status(400).json({ error: '無效的 step 值' });
    }

    // 建立查詢條件
    const where: any = {};
    if (step) {
      where.step = step;
    }

    // 支援 userId 篩選（用於 session 追蹤）
    const userId = req.query.user_id as string | undefined;
    if (userId) {
      where.userId = userId;
    }

    console.log(`[HR Saved] 查詢條件: step=${step || 'all'}, limit=${limit}`);

    // 查詢資料庫
    const artifacts = await prisma.hrSavedArtifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // 格式化回傳資料
    const items = artifacts.map((artifact) => ({
      id: artifact.id,
      step: artifact.step,
      input_preview: artifact.inputText.substring(0, 100) + (artifact.inputText.length > 100 ? '...' : ''),
      created_at: artifact.createdAt.toISOString(),
      result: artifact.resultJson, // 包含完整結果
    }));

    res.json({ items });
  } catch (error) {
    console.error('[HR Saved] 錯誤:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '查詢失敗',
    });
  }
});

export default router;

