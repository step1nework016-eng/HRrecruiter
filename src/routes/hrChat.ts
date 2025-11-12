import { Router, Request, Response } from 'express';
import { generateChat, generateChatStream } from '../services/llmClient';
import { CHAT_SYSTEM_PROMPT } from '../services/prompts';
import { cleanStrongMarkers } from '../utils/cleanMarkers';

const router = Router();

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream?: boolean; // 是否使用流式輸出
}

/**
 * POST /api/hr-chat
 * 和 AI 對話（支援流式輸出）
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, stream = false }: ChatRequest = req.body;

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

    console.log(`[HR Chat] 收到 ${messages.length} 則訊息，流式輸出: ${stream}`);

    // 如果啟用流式輸出
    if (stream) {
      // 設定 SSE 標頭
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        await generateChatStream(messages, CHAT_SYSTEM_PROMPT, (chunk) => {
          // 清理每個文字塊後再發送
          const cleanedChunk = cleanStrongMarkers(chunk);
          res.write(`data: ${JSON.stringify({ chunk: cleanedChunk })}\n\n`);
        });

        // 發送結束標記
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'LLM 對話失敗' })}\n\n`);
        res.end();
      }
      return;
    }

    // 非流式輸出（原有邏輯）
    const reply = await generateChat(messages, CHAT_SYSTEM_PROMPT);
    
    // 清理 LLM 可能輸出的奇怪標記
    const cleanedReply = cleanStrongMarkers(reply);
    
    res.json({ reply: cleanedReply });
  } catch (error) {
    console.error('[HR Chat] 錯誤:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'LLM 對話失敗',
    });
  }
});

export default router;

