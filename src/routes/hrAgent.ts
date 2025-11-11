import { Router, Request, Response } from 'express';
import { getPrompt } from '../services/prompts';
import { generateText, tryParseJSON } from '../services/llmClient';

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

    // 呼叫 LLM
    const rawResponse = await generateText(prompt, temperature);

    // 嘗試解析為 JSON（如果失敗則返回原始文字）
    let result: any;
    try {
      result = tryParseJSON(rawResponse);
    } catch {
      // 如果無法解析為 JSON，直接使用原始文字
      result = rawResponse;
    }

    // 回傳結果
    res.json({ result });
  } catch (error) {
    console.error('[HR Agent] 錯誤:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'LLM 呼叫失敗',
    });
  }
});

export default router;

