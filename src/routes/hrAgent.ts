import { Router, Request, Response } from 'express';
import { getPrompt } from '../services/prompts';
import { generateText } from '../services/llmClient';
import { cleanStrongMarkers } from '../utils/cleanMarkers';

const router = Router();

interface HrAgentRequest {
  step: 'job_intake' | 'sourcing' | 'screening' | 'interview';
  input: string;
  mode?: 'normal' | 'retry';
}

/**
 * POST /api/hr-agent
 * 四個功能的 LLM 產生 API
 */
router.post('/', async (req: Request, res: Response) => {
  console.log(`[HR Agent] 收到請求: ${req.method} ${req.path}`);
  try {
    const { step, input, mode = 'normal' }: HrAgentRequest = req.body;

    // 驗證輸入
    if (!step || !input) {
      return res.status(400).json({ error: '缺少必要參數：step 和 input' });
    }

    if (!['job_intake', 'sourcing', 'screening', 'interview'].includes(step)) {
      return res.status(400).json({ error: '無效的 step 值' });
    }

    // 決定 temperature（retry 模式時稍微提高以產生不同版本）
    const temperature = mode === 'retry' ? 0.9 : 0.7;

    // 取得對應的 Prompt
    const prompt = getPrompt(step, input, mode === 'retry');

    console.log(`[HR Agent] 步驟: ${step}, 模式: ${mode}, 輸入長度: ${input.length}`);

    // 呼叫 LLM（現在返回自然語言，不需要解析 JSON）
    const rawResponse = await generateText(prompt, temperature);

    // 清理 LLM 可能輸出的奇怪標記（如 _STRONGSTART_、_STRONGEND_ 等）
    // 這個清理函數會處理所有四個功能（job_intake, sourcing, screening, interview）
    const cleanedResponse = cleanStrongMarkers(rawResponse);
    
    // 記錄清理前後的差異（僅在開發環境）
    if (process.env.NODE_ENV === 'development' && rawResponse !== cleanedResponse) {
      console.log(`[HR Agent] 已清理 ${step} 功能輸出中的標記`);
    }

    // 返回清理後的自然語言結果
    res.json({ result: cleanedResponse });
  } catch (error) {
    console.error('[HR Agent] 錯誤:', error);
    if (error instanceof Error) {
      console.error('[HR Agent] 錯誤訊息:', error.message);
      console.error('[HR Agent] 錯誤堆疊:', error.stack);
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : 'LLM 呼叫失敗',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
  }
});

export default router;

