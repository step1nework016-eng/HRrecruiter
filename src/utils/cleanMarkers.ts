/**
 * 最終清理函數：徹底移除 STRONGSTART / STRONGEND 及所有變體（含 escape）
 * 此函數必須在所有清理 pipeline 的最後調用，不得被其他 replace/sanitize 之後再改寫
 */
export function finalScrub(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // 處理 HTML 轉義後的標記（&lt;、&gt;、&amp; 等）
  // 移除 HTML 實體中的標記
  cleaned = cleaned.replace(/&lt;\/?[^&gt;]*STRONG(START|END)[^&lt;&gt;]*&gt;/gi, '');
  cleaned = cleaned.replace(/&amp;[^;]*STRONG(START|END)[^;]*;/gi, '');
  cleaned = cleaned.replace(/&#[0-9]+;.*?STRONG(START|END).*?&#[0-9]+;/gi, '');
  
  // 處理 HTML 標籤內的標記
  cleaned = cleaned.replace(/<[^>]*STRONG(START|END)[^<]*>/gi, '');
  
  // 處理所有未轉義的標記變體
  // 最寬鬆的模式：直接移除關鍵字（優先執行）
  cleaned = cleaned.replace(/STRONGSTART/gi, '');
  cleaned = cleaned.replace(/STRONGEND/gi, '');
  
  // 匹配各種底線組合
  cleaned = cleaned.replace(/_+STRONGSTART_+/gi, '');
  cleaned = cleaned.replace(/_+STRONGEND_+/gi, '');
  cleaned = cleaned.replace(/_+STRONG_START_+/gi, '');
  cleaned = cleaned.replace(/_+STRONG_END_+/gi, '');
  cleaned = cleaned.replace(/_+STRONG\s+START_+/gi, '');
  cleaned = cleaned.replace(/_+STRONG\s+END_+/gi, '');
  
  // 匹配任意數量的底線/空格組合
  cleaned = cleaned.replace(/[_\s]*STRONG[_\s]*START[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*STRONG[_\s]*END[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*STRONGSTART[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*STRONGEND[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*STRONG[_\s]*(START|END)[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*(START|END)[_\s]*STRONG[_\s]*/gi, '');
  
  // 匹配組合變體
  cleaned = cleaned.replace(/STRONG(START|END)/gi, '');
  cleaned = cleaned.replace(/(START|END)STRONG/gi, '');
  
  // 移除殘留的多個連續底線
  cleaned = cleaned.replace(/_{2,}/g, '');
  
  // 模式 X: 核彈級正則表達式，匹配所有可能的組合
  cleaned = cleaned.replace(/[_*\s]*STRONG[_\s]*(START|END)[_*\s]*/gi, '');
  cleaned = cleaned.replace(/[_*\s]*(START|END)[_\s]*STRONG[_*\s]*/gi, '');

  // 最終檢查：如果還有標記，再次清理（確保不會遺漏）
  if (cleaned.includes('STRONGSTART') || cleaned.includes('STRONGEND')) {
    cleaned = cleaned.replace(/STRONGSTART/gi, '');
    cleaned = cleaned.replace(/STRONGEND/gi, '');
    cleaned = cleaned.replace(/_{2,}/g, '');
  }
  
  return cleaned;
}

/**
 * 清理 LLM 輸出中的奇怪標記（如 _STRONGSTART_、_STRONGEND_ 等）
 * 這個函數會移除所有變體的標記
 * @deprecated 請使用 finalScrub 作為最終清理步驟
 */
export function cleanStrongMarkers(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  const originalLength = cleaned.length;
  
  // 使用最直接的方式：匹配任何包含 STRONGSTART 或 STRONGEND 的標記
  // 多次清理確保所有變體都被移除
  // 注意：先執行最寬鬆的模式，確保所有標記都被移除
  
  // 模式0: 最寬鬆的模式，直接移除關鍵字（優先執行，確保不會遺漏）
  // 這會移除任何包含 STRONGSTART 或 STRONGEND 的文字，不管前後有什麼
  cleaned = cleaned.replace(/STRONGSTART/gi, '');
  cleaned = cleaned.replace(/STRONGEND/gi, '');
  
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
  
  // 模式6: 再次執行最寬鬆的模式（確保沒有遺漏）
  cleaned = cleaned.replace(/STRONGSTART/gi, '');
  cleaned = cleaned.replace(/STRONGEND/gi, '');
  
  // 模式7: 額外清理，確保移除任何殘留的底線組合
  // 例如：如果標記被部分移除後留下的底線
  cleaned = cleaned.replace(/_{2,}/g, ''); // 移除多個連續的底線
  
  // 模式8: 最終檢查，使用更寬鬆的正則表達式匹配任何包含 STRONG 和 START/END 的組合
  cleaned = cleaned.replace(/[_\s]*STRONG[_\s]*(START|END)[_\s]*/gi, '');
  cleaned = cleaned.replace(/[_\s]*(START|END)[_\s]*STRONG[_\s]*/gi, '');
  
  // 模式9: 最後一次徹底清理
  cleaned = cleaned.replace(/STRONG(START|END)/gi, '');
  cleaned = cleaned.replace(/(START|END)STRONG/gi, '');
  cleaned = cleaned.replace(/_{2,}/g, ''); // 再次移除多個連續的底線
  
  // 記錄清理結果（僅在開發環境）
  if (process.env.NODE_ENV === 'development' && cleaned.length !== originalLength) {
    console.log(`[Clean Markers] 已清理 ${originalLength - cleaned.length} 個字符的標記`);
  }
  
  // 最終檢查：如果還有標記，再次清理（確保不會遺漏）
  if (cleaned.includes('STRONGSTART') || cleaned.includes('STRONGEND')) {
    console.warn('[Clean Markers] 警告：清理後仍發現標記，將再次清理');
    cleaned = cleaned.replace(/STRONGSTART/gi, '');
    cleaned = cleaned.replace(/STRONGEND/gi, '');
    cleaned = cleaned.replace(/_{2,}/g, '');
  }
  
  return cleaned;
}

