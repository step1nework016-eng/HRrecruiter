import { Router, Request, Response } from 'express';
import { getPrompt } from '../services/prompts';
import { generateText } from '../services/llmClient';

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
    // 使用最簡單直接的方式：匹配任何包含這些關鍵字的標記
    let cleanedResponse = rawResponse;
    // 多次清理確保所有變體都被移除
    cleanedResponse = cleanedResponse.replace(/_+STRONGSTART_+/gi, '');
    cleanedResponse = cleanedResponse.replace(/_+STRONGEND_+/gi, '');
    cleanedResponse = cleanedResponse.replace(/_+STRONG_START_+/gi, '');
    cleanedResponse = cleanedResponse.replace(/_+STRONG_END_+/gi, '');
    cleanedResponse = cleanedResponse.replace(/_+STRONG\s*START_+/gi, '');
    cleanedResponse = cleanedResponse.replace(/_+STRONG\s*END_+/gi, '');
    cleanedResponse = cleanedResponse.replace(/[_\s]*STRONG[_\s]*START[_\s]*/gi, '');
    cleanedResponse = cleanedResponse.replace(/[_\s]*STRONG[_\s]*END[_\s]*/gi, '');
    cleanedResponse = cleanedResponse.replace(/[_\s]*STRONGSTART[_\s]*/gi, '');
    cleanedResponse = cleanedResponse.replace(/[_\s]*STRONGEND[_\s]*/gi, '');
    // 最後用最寬鬆的模式：匹配任何包含 STRONGSTART 或 STRONGEND 的標記
    cleanedResponse = cleanedResponse.replace(/STRONGSTART/gi, '');
    cleanedResponse = cleanedResponse.replace(/STRONGEND/gi, '');

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

