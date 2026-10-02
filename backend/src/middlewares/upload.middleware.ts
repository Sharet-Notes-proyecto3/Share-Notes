// src/middlewares/upload.middleware.ts
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import fs from 'fs';

const ALLOWED_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25');
const UPLOAD_DIR  = process.env.UPLOAD_DIR || 'uploads';

// Crear directorio si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

/**
 * Valida los magic bytes (firmas binarias) de los primeros bytes del archivo en disco.
 * Soporta exclusivamente:
 * - PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
 * - PNG: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
 * - JPEG: 0xFF 0xD8 0xFF
 *
 * @param filePath Ruta al archivo en disco guardado por Multer
 * @returns true si el archivo coincide con una firma permitida, false en caso contrario
 */
export const validateMagicBytes = (filePath: string): boolean => {
  let fd: number | null = null;
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    const bytesRead = fs.readSync(fd, buffer, 0, 8, 0);

    if (bytesRead < 3) {
      return false;
    }

    // 1. PDF: %PDF- (5 bytes: 0x25, 0x50, 0x44, 0x46, 0x2D)
    if (
      bytesRead >= 5 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d
    ) {
      return true;
    }

    // 2. PNG: \x89PNG\r\n\x1a\n (8 bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    if (
      bytesRead >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // 3. JPEG: 0xFF, 0xD8, 0xFF (3 bytes)
    if (
      bytesRead >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // Ignorar error al cerrar descriptor
      }
    }
  }
};

