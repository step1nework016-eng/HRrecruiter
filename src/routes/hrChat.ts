import { Router, Request, Response } from 'express';
import { generateChat } from '../services/llmClient';
import { CHAT_SYSTEM_PROMPT } from '../services/prompts';

const router = Router();

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * POST /api/hr-chat
 * 和 AI 對話
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages }: ChatRequest = req.body;

    // 驗證輸入
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 必須是非空陣列' });
    }

    // 驗證訊息格式
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: '每個訊息必須包含 role 和 content' });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: 'role 必須是 "user" 或 "assistant"' });
      }
    }

    console.log(`[HR Chat] 收到 ${messages.length} 則訊息`);

    // 呼叫 LLM（帶上系統提示詞）
    const reply = await generateChat(messages, CHAT_SYSTEM_PROMPT);

    // 回傳結果
    res.json({ reply });
  } catch (error) {
    console.error('[HR Chat] 錯誤:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'LLM 對話失敗',
    });
  }
});

export default router;

