import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.doc', '.ppt', '.txt', '.png', '.jpg', '.jpeg'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.vbs', '.msi', '.dll', '.scr', '.jar', '.com', '.pif'];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Check dangerous executable extensions
    if (DISALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Executable or script files are strictly prohibited for academic security reasons.'));
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Invalid file extension "${ext}". Allowed types: PDF, DOCX, PPTX, TXT, PNG, JPG.`));
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid MIME type "${file.mimetype}". Only academic documents and images are permitted.`));
    }

    cb(null, true);
  },
});
