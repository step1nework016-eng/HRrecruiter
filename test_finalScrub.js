/**
 * 最小測試案例：驗證 finalScrub 函數
 * 測試所有 STRONGSTART / STRONGEND 變體（含 escape）
 * 
 * 執行方式: node test_finalScrub.js
 */

// 後端版本的 finalScrub（TypeScript 邏輯轉為 JavaScript）
function finalScrub(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // 處理 HTML 轉義後的標記（&lt;、&gt;、&amp; 等）
  cleaned = cleaned.replace(/&lt;\/?[^&gt;]*STRONG(START|END)[^&lt;&gt;]*&gt;/gi, '');
  cleaned = cleaned.replace(/&amp;[^;]*STRONG(START|END)[^;]*;/gi, '');
  cleaned = cleaned.replace(/&#[0-9]+;.*?STRONG(START|END).*?&#[0-9]+;/gi, '');
  
  // 處理 HTML 標籤內的標記
  cleaned = cleaned.replace(/<[^>]*STRONG(START|END)[^<]*>/gi, '');
  
  // 處理所有未轉義的標記變體
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
  
  // 最終檢查
  if (cleaned.includes('STRONGSTART') || cleaned.includes('STRONGEND')) {
    cleaned = cleaned.replace(/STRONGSTART/gi, '');
    cleaned = cleaned.replace(/STRONGEND/gi, '');
    cleaned = cleaned.replace(/_{2,}/g, '');
  }
  
  return cleaned;
}

// 測試案例
const testCases = [
  {
    name: '基本標記',
    input: '_STRONGSTART_年齡層_STRONGEND_',
    expected: '年齡層'
  },
  {
    name: '多個底線',
    input: '__STRONGSTART__專業背景__STRONGEND__',
    expected: '專業背景'
  },
  {
    name: '帶空格',
    input: '_STRONG START_個人特質_STRONG END_',
    expected: '個人特質'
  },
  {
    name: 'HTML 轉義',
    input: '&lt;div&gt;_STRONGSTART_內容_STRONGEND_&lt;/div&gt;',
    expected: '&lt;div&gt;內容&lt;/div&gt;'
  },
  {
    name: 'HTML 實體',
    input: '&amp;STRONGSTART&amp;測試&amp;STRONGEND&amp;',
    expected: '測試'
  },
  {
    name: 'HTML 標籤內',
    input: '<strong>_STRONGSTART_文字_STRONGEND_</strong>',
    expected: '<strong>文字</strong>'
  },
  {
    name: '混合內容',
    input: '這是_STRONGSTART_年齡層_STRONGEND_：25-35歲，_STRONGSTART_專業背景_STRONGEND_：影音剪輯',
    expected: '這是年齡層：25-35歲，專業背景：影音剪輯'
  },
  {
    name: '無標記內容',
    input: '這是正常的文字內容，沒有任何標記',
    expected: '這是正常的文字內容，沒有任何標記'
  },
  {
    name: '空字串',
    input: '',
    expected: ''
  },
  {
    name: '只有標記',
    input: '_STRONGSTART__STRONGEND_',
    expected: ''
  }
];

// 執行測試
console.log('開始測試 finalScrub 函數...\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = finalScrub(test.input);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ 測試 ${index + 1}: ${test.name}`);
  } else {
    failed++;
    console.error(`✗ 測試 ${index + 1}: ${test.name}`);
    console.error(`  輸入:    ${JSON.stringify(test.input)}`);
    console.error(`  預期:    ${JSON.stringify(test.expected)}`);
    console.error(`  實際:    ${JSON.stringify(result)}`);
  }
});

console.log(`\n測試結果: ${passed} 通過, ${failed} 失敗`);

if (failed === 0) {
  console.log('✅ 所有測試通過！');
  process.exit(0);
} else {
  console.log('❌ 部分測試失敗！');
  process.exit(1);
}

