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
    // 使用 gemini-2.5-flash（根據您的配額儀表板，此模型可用）
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API 錯誤詳情:', error);
    if (error instanceof Error) {
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
      
      // 處理模型找不到的錯誤
      if (error.message.includes('404') || error.message.includes('not found')) {
        // 嘗試使用備用模型（根據您的配額，這些模型可用）
        console.log('⚠️  主要模型不可用，嘗試使用備用模型...');
        const fallbackModels = ['gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
        
        for (const fallbackModelName of fallbackModels) {
          try {
            console.log(`嘗試備用模型: ${fallbackModelName}`);
            const fallbackModel = genAI.getGenerativeModel({ 
              model: fallbackModelName,
              generationConfig: {
                temperature,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
              },
            });
            const result = await fallbackModel.generateContent(prompt);
            const response = await result.response;
            console.log(`✅ 備用模型 ${fallbackModelName} 成功`);
            return response.text();
          } catch (fallbackError) {
            console.warn(`備用模型 ${fallbackModelName} 失敗，嘗試下一個...`);
            continue;
          }
        }
        throw new Error('所有 Gemini 模型都不可用。請檢查您的 API Key 和模型可用性。');
      }
      
      // 處理配額錯誤
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota exceeded')) {
        throw new Error('API 配額已用盡，請檢查您的 Google AI Studio 配額設定，或稍後再試。');
      }
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
    // 使用 gemini-2.5-flash（根據您的配額儀表板，此模型可用）
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

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
      
      // 處理模型找不到的錯誤
      if (error.message.includes('404') || error.message.includes('not found')) {
        // 嘗試使用備用模型（根據您的配額，這些模型可用）
        console.log('⚠️  主要模型不可用，嘗試使用備用模型...');
        const fallbackModels = ['gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
        
        for (const fallbackModelName of fallbackModels) {
          try {
            console.log(`嘗試備用模型: ${fallbackModelName}`);
            const fallbackModel = genAI.getGenerativeModel({ 
              model: fallbackModelName,
              generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
              },
            });
            // 重新組合提示詞並調用
            let fullPrompt = '';
            if (systemPrompt) {
              fullPrompt += `${systemPrompt}\n\n`;
            }
            messages.forEach((msg) => {
              if (msg.role === 'user') {
                fullPrompt += `使用者：${msg.content}\n\n`;
              } else if (msg.role === 'assistant') {
                fullPrompt += `助理：${msg.content}\n\n`;
              }
            });
            fullPrompt += '助理：';
            
            const result = await fallbackModel.generateContent(fullPrompt);
            const response = await result.response;
            console.log(`✅ 備用模型 ${fallbackModelName} 成功`);
            return response.text();
          } catch (fallbackError) {
            console.warn(`備用模型 ${fallbackModelName} 失敗，嘗試下一個...`);
            continue;
          }
        }
        throw new Error('所有 Gemini 模型都不可用。請檢查您的 API Key 和模型可用性。');
      }
      
      // 處理配額錯誤
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota exceeded')) {
        throw new Error('API 配額已用盡，請檢查您的 Google AI Studio 配額設定，或稍後再試。');
      }
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

