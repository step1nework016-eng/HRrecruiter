import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseFile } from '../services/fileParser';

const router = Router();

// 設定 Multer (使用記憶體儲存，不存到硬碟)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制 10MB
  },
});

/**
 * POST /api/parse
 * 上傳並解析檔案
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上傳檔案' });
    }

    const text = await parseFile(req.file.buffer, req.file.mimetype);
    
    res.json({ 
      text: text.trim(),
      filename: req.file.originalname 
    });
  } catch (error) {
    console.error('檔案處理錯誤:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '檔案處理失敗' 
    });
  }
});

export default router;

