import pdf from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * 解析檔案內容為文字
 * @param buffer 檔案 Buffer
 * @param mimetype 檔案類型
 * @returns 解析後的文字
 */
export async function parseFile(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    // 處理 PDF
    if (mimetype === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text;
    }
    
    // 處理 Word (.docx)
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    // 處理純文字
    if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
      return buffer.toString('utf-8');
    }

    throw new Error('不支援的檔案格式。請上傳 PDF, Word (.docx) 或純文字檔。');
  } catch (error) {
    console.error('檔案解析失敗:', error);
    throw new Error('檔案解析失敗，請確認檔案是否損毀或加密。');
  }
}

