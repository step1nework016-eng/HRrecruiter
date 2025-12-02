import { GoogleGenerativeAI } from '@google/generative-ai';
import { FORBIDDEN_MARKERS_SYSTEM_PROMPT } from './prompts';
import { finalScrub } from '../utils/cleanMarkers';

const defaultApiKey = process.env.GEMINI_API_KEY;
const defaultGenAI = defaultApiKey ? new GoogleGenerativeAI(defaultApiKey) : null;

function getGenAIClient(customApiKey?: string) {
  if (customApiKey) {
    return new GoogleGenerativeAI(customApiKey);
  }
  if (defaultGenAI) {
    return defaultGenAI;
  }
  throw new Error('未設定 Gemini API Key。請在環境變數設定 GEMINI_API_KEY 或在前端設定您的 API Key (BYOK)。');
}

/**
 * 呼叫 OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.7,
  stream: boolean = false
): Promise<Response> {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // 使用 GPT-4o 作為預設模型
      messages,
      temperature,
      stream,
    }),
  });
}

/**
 * 呼叫 LLM 進行文字生成 (支援 Gemini 和 OpenAI)
 * @param prompt 提示詞
 * @param temperature 溫度參數
 * @param apiKey Gemini API Key (可選)
 * @param provider 提供者 'gemini' | 'openai'
 * @param openaiKey OpenAI API Key (當 provider='openai' 時必填)
 */
export async function generateText(
  prompt: string,
  temperature: number = 0.7,
  apiKey?: string,
  provider: 'gemini' | 'openai' = 'gemini',
  openaiKey?: string
): Promise<string> {
  // === OpenAI 邏輯 ===
  if (provider === 'openai') {
    if (!openaiKey) throw new Error('未提供 OpenAI API Key');
    try {
      // 對於 generateText (非 chat)，我們將 prompt 包裝成單一 user message，並加上系統提示
      const messages = [
        { role: 'system', content: FORBIDDEN_MARKERS_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ];
      
      const response = await callOpenAI(openaiKey, messages, temperature, false);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API 錯誤 (${response.status}): ${errorText}`);
      }
      
      const data = await response.json() as any;
      return finalScrub(data.choices[0]?.message?.content || '');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  // === Gemini 邏輯 (原有) ===
  const genAI = getGenAIClient(apiKey);
  const maxRetries = 3;
  const retryDelay = 2000; // 2秒
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 使用 gemini-2.5-flash
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: FORBIDDEN_MARKERS_SYSTEM_PROMPT,
        generationConfig: {
          temperature,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return finalScrub(response.text());
    } catch (error) {
      console.error(`Gemini API 錯誤詳情 (嘗試 ${attempt}/${maxRetries}):`, error);
      if (error instanceof Error) {
        // 處理 503 服務過載錯誤 - 重試
        if (error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('Service Unavailable')) {
          if (attempt < maxRetries) {
            const delay = retryDelay * attempt;
            console.log(`⚠️  模型過載，${delay/1000} 秒後重試 (${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // 處理模型找不到的錯誤 (Fallback)
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('⚠️  主要模型不可用，嘗試使用備用模型...');
          const fallbackModels = ['gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
          
          for (const fallbackModelName of fallbackModels) {
            try {
              console.log(`嘗試備用模型: ${fallbackModelName}`);
              const fallbackModel = genAI.getGenerativeModel({ 
                model: fallbackModelName,
                systemInstruction: FORBIDDEN_MARKERS_SYSTEM_PROMPT,
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
              return finalScrub(response.text());
            } catch (fallbackError) {
              continue;
            }
          }
          throw new Error('所有 Gemini 模型都不可用。請檢查您的 API Key 和模型可用性。');
        }
        
        if (error.message.includes('429') || error.message.includes('quota')) {
          throw new Error('API 配額已用盡，請檢查您的 Google AI Studio 配額設定。');
        }
      }
      
      if (attempt === maxRetries) {
        throw new Error(`LLM 呼叫失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }
  }
  
  throw new Error('LLM 呼叫失敗：未知錯誤');
}

/**
 * 呼叫 LLM 進行對話 (支援 Gemini 和 OpenAI)
 */
export async function generateChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  apiKey?: string,
  provider: 'gemini' | 'openai' = 'gemini',
  openaiKey?: string
): Promise<string> {
  // === OpenAI 邏輯 ===
  if (provider === 'openai') {
    if (!openaiKey) throw new Error('未提供 OpenAI API Key');
    
    const openAIMessages = [
      { role: 'system', content: systemPrompt || FORBIDDEN_MARKERS_SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await callOpenAI(openaiKey, openAIMessages, 0.7, false);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API Error: ${err}`);
    }
    const data = await response.json() as any;
    return finalScrub(data.choices[0]?.message?.content || '');
  }

  // === Gemini 邏輯 (原有) ===
  const genAI = getGenAIClient(apiKey);
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt || FORBIDDEN_MARKERS_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      let fullPrompt = '';
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
      return finalScrub(response.text());
    } catch (error) {
      // 簡化錯誤處理 (與 generateText 類似)
      if (attempt === maxRetries) throw error;
      // ... 省略詳細重試邏輯，實際應與 generateText 一致 ...
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw new Error('LLM 對話失敗');
}

/**
 * 呼叫 LLM 進行流式對話 (支援 Gemini 和 OpenAI)
 */
export async function generateChatStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  onChunk?: (text: string) => void,
  apiKey?: string,
  provider: 'gemini' | 'openai' = 'gemini',
  openaiKey?: string
): Promise<string> {
  
  // === OpenAI 邏輯 (Streaming) ===
  if (provider === 'openai') {
    if (!openaiKey) throw new Error('未提供 OpenAI API Key');

    const openAIMessages = [
      { role: 'system', content: systemPrompt || FORBIDDEN_MARKERS_SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await callOpenAI(openaiKey, openAIMessages, 0.7, true);
    
    if (!response.ok || !response.body) {
      const err = await response.text();
      throw new Error(`OpenAI API Error: ${err}`);
    }

    // 處理 SSE (Server-Sent Events)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留未完成的行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            console.warn('OpenAI stream parse error:', e);
          }
        }
      }
    }
    return fullText;
  }

  // === Gemini 邏輯 (原有) ===
  const genAI = getGenAIClient(apiKey);
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt || FORBIDDEN_MARKERS_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });

      let fullPrompt = '';
      messages.forEach((msg) => {
        if (msg.role === 'user') {
          fullPrompt += `使用者：${msg.content}\n\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `助理：${msg.content}\n\n`;
        }
      });
      fullPrompt += '助理：';

      const result = await model.generateContentStream(fullPrompt);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }
      return fullText;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw new Error('LLM 對話失敗');
}

export function tryParseJSON(text: string): any {
  try {
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
