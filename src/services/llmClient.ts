import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY 環境變數未設定');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * 呼叫 Gemini API 進行文字生成
 * @param prompt 提示詞
 * @param temperature 溫度參數（0-1，越高越隨機）
 * @returns AI 回覆的文字內容
 */
export async function generateText(
  prompt: string,
  temperature: number = 0.7
): Promise<string> {
  try {
    // 嘗試使用最新的模型名稱，如果失敗則回退到 gemini-pro
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // 使用較新的模型
        generationConfig: {
          temperature,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
    } catch (modelError) {
      console.warn('嘗試使用 gemini-1.5-flash 失敗，回退到 gemini-pro');
      model = genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API 錯誤詳情:', error);
    if (error instanceof Error) {
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
    }
    throw new Error(`LLM 呼叫失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 呼叫 Gemini API 進行對話（支援多輪對話）
 * @param messages 對話歷史 [{ role: 'user' | 'assistant', content: string }]
 * @param systemPrompt 系統提示詞（可選）
 * @returns AI 回覆的文字內容
 */
export async function generateChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string
): Promise<string> {
  try {
    // 嘗試使用最新的模型名稱，如果失敗則回退到 gemini-pro
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // 使用較新的模型
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
    } catch (modelError) {
      console.warn('嘗試使用 gemini-1.5-flash 失敗，回退到 gemini-pro');
      model = genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
    }

    // 組合完整提示詞
    let fullPrompt = '';
    if (systemPrompt) {
      fullPrompt += `${systemPrompt}\n\n`;
    }

    // 轉換訊息格式為 Gemini 可理解的格式
    messages.forEach((msg) => {
      if (msg.role === 'user') {
        fullPrompt += `使用者：${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `助理：${msg.content}\n\n`;
      }
    });

    fullPrompt += '助理：';

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API 錯誤詳情:', error);
    if (error instanceof Error) {
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
    }
    throw new Error(`LLM 對話失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 嘗試解析 JSON 字串，如果失敗則返回原始字串
 */
export function tryParseJSON(text: string): any {
  try {
    // 嘗試提取 JSON 區塊（如果被 markdown 包裝）
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    return JSON.parse(text);
  } catch {
    return text;
  }
}

