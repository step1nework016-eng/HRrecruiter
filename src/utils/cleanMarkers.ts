/**
 * 清理 LLM 輸出中的奇怪標記（如 _STRONGSTART_、_STRONGEND_ 等）
 * 這個函數會移除所有變體的標記
 */
export function cleanStrongMarkers(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // 使用最直接的方式：匹配任何包含 STRONGSTART 或 STRONGEND 的標記
  // 多次清理確保所有變體都被移除
  
  // 模式1: 匹配 _STRONGSTART_ 或 _STRONGEND_（任意數量的底線，包括多個底線）
  // 例如：_STRONGSTART_、_STRONGSTART__、__STRONGSTART__ 等
  cleaned = cleaned.replace(/_+STRONGSTART_+/gi, '');
  cleaned = cleaned.replace(/_+STRONGEND_+/gi, '');
  
  // 模式2: 匹配 _STRONG_START_ 或 _STRONG_END_（中間有底線）
  cleaned = cleaned.replace(/_+STRONG_START_+/gi, '');
  cleaned = cleaned.replace(/_+STRONG_END_+/gi, '');
  
  // 模式3: 匹配 _STRONG START_ 或 _STRONG END_（中間有空格）
  cleaned = cleaned.replace(/_+STRONG\s+START_+/gi, '');
  cleaned = cleaned.replace(/_+STRONG\s+END_+/gi, '');
  
  // 模式4: 匹配任意數量的底線/空格 + STRONG + 任意字符 + START/END + 任意數量的底線/空格
  cleaned = cleaned.replace(/[_\s]*STRONG[_\s]*START[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*STRONG[_\s]*END[_\s]*/gi, '');
  
  // 模式5: 匹配任意數量的底線/空格 + STRONGSTART/STRONGEND + 任意數量的底線/空格
  cleaned = cleaned.replace(/[_\s]*STRONGSTART[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*STRONGEND[_\s]*/gi, '');
  
  // 模式6: 最寬鬆的模式，直接移除關鍵字（確保不會遺漏）
  // 這會移除任何包含 STRONGSTART 或 STRONGEND 的文字，不管前後有什麼
  cleaned = cleaned.replace(/STRONGSTART/gi, '');
  cleaned = cleaned.replace(/STRONGEND/gi, '');
  
  // 模式7: 額外清理，確保移除任何殘留的底線組合
  // 例如：如果標記被部分移除後留下的底線
  cleaned = cleaned.replace(/_{2,}/g, ''); // 移除多個連續的底線
  
  return cleaned;
}

