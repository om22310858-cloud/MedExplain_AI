import multer from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Unsupported file format. Please upload a PDF document or a JPEG/PNG image.'
      )
    );
  }
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 1,
  },
  fileFilter,
});
