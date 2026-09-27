import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Handler]', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File size exceeds 25MB limit. Please upload a smaller document.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
    return;
  }

  if (err.message && (err.message.includes('strictly prohibited') || err.message.includes('Invalid file extension') || err.message.includes('Invalid MIME type'))) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.',
  });
}
