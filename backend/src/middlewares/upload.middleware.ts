// src/middlewares/upload.middleware.ts
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import fs from 'fs';

const ALLOWED_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');
export const PROFILE_PHOTO_DIR = path.join(UPLOAD_DIR, 'profile-photos');
const PROFILE_PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Crear directorio si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(PROFILE_PHOTO_DIR)) {
  fs.mkdirSync(PROFILE_PHOTO_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF, JPG y PNG.'));
  }
};

export const uploadNote = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
  },
}).single('file');

const profilePhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PROFILE_PHOTO_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${PROFILE_PHOTO_EXTENSIONS[file.mimetype]}`);
  },
});

export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: (_req, file, cb) => {
    if (PROFILE_PHOTO_EXTENSIONS[file.mimetype]) {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo');
