// src/controllers/note.controller.ts
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { NoteService } from '../services/note.service';
import { checkMicroservicesHealth } from '../utils/microservicesClient';
import logger from '../utils/logger';

const service = new NoteService();

/**
 * Función auxiliar para limpiar archivos temporales de Multer en caso de error
 */
const removeUploadedFile = (file?: Express.Multer.File, correlationId?: string) => {
  if (file?.path) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.info(`Archivo huérfano de Multer eliminado de disco: ${file.path}`, {
          correlationId,
          filePath: file.path,
        });
      }
    } catch (unlinkErr: any) {
      logger.error('Error al eliminar archivo huérfano de Multer:', {
        correlationId,
        filePath: file.path,
        error: unlinkErr?.message,
      });
    }
  }
};

export const uploadNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No se adjuntó ningún archivo', correlationId: req.correlationId });
      return;
    }

    const { title, description, subjectId } = req.body;

    // Validación de campos requeridos
    if (!title || !subjectId) {
      removeUploadedFile(req.file, req.correlationId);
      res.status(400).json({ message: 'Título y materia son requeridos', correlationId: req.correlationId });
      return;
    }

    const parsedSubjectId = parseInt(subjectId);
    if (isNaN(parsedSubjectId)) {
      removeUploadedFile(req.file, req.correlationId);
      res.status(400).json({ message: 'El ID de la materia debe ser un número válido', correlationId: req.correlationId });
      return;
    }

    // Insertar apunte en base de datos
    const result = await service.upload({
      title: title.trim(),
      description: description ? description.trim() : undefined,
      subjectId: parsedSubjectId,
      uploaderId: req.user!.userId,
      file: req.file,
    });

    // Disparar notificación por email con reintentos y trazabilidad
    service.notifyUpload({
      uploaderName: req.user!.email,
      noteTitle: title.trim(),
      subjectName: result.subjectName,
      notifyTo: req.user!.email,
      noteId: result.id,
      uploaderId: req.user!.userId,
      correlationId: req.correlationId,
    });

    res.status(201).json({ ...result, correlationId: req.correlationId });
  } catch (err) {
    // Si falla cualquier paso, eliminar inmediatamente el archivo huérfano de Multer
    removeUploadedFile(req.file, req.correlationId);
    next(err);
  }
};

export const listNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, semester, careerId, search } = req.query;
    const parseNum = (val: any) => {
      const n = parseInt(val);
      return isNaN(n) ? undefined : n;
    };
    const notes = await service.list(
      {
        subjectId: parseNum(subjectId),
        semester:  parseNum(semester),
        careerId:  parseNum(careerId),
        search:    search ? String(search).trim() : undefined,
      },
      req.user
    );
    res.json(notes);
  } catch (err) { next(err); }
};

export const downloadNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      res.status(400).json({ message: 'ID de apunte inválido', correlationId: req.correlationId });
      return;
    }
    const { filePath, originalName, mimetype } = await service.getFilePath(noteId);
    const absolutePath = path.resolve(filePath);
    const safeName = encodeURIComponent(originalName);
    const isAttachment = req.query.download === 'true';
    res.setHeader('Content-Disposition', `${isAttachment ? 'attachment' : 'inline'}; filename="${safeName}"`);
    res.setHeader('Content-Type', mimetype);
    res.sendFile(absolutePath);
  } catch (err) { next(err); }
};

/**
 * Genera el código QR para compartir un apunte específico
 */
export const generateNoteQR = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ message: 'ID de apunte inválido', correlationId: req.correlationId });
      return;
    }
    const result = await service.generateNoteQR(noteId);
    res.json({ ...result, correlationId: req.correlationId });
  } catch (err) { next(err); }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.delete(
      parseInt(req.params.id),
      req.user!.userId,
      req.user!.role
    );
    res.json({ ...result, correlationId: req.correlationId });
  } catch (err) { next(err); }
};

export const listSubjects = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await service.getSubjects();
    res.json(subjects);
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────────
// Generar reporte PDF vía Microservicio MS-PDF
// ──────────────────────────────────────────────────
export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfBuffer = await service.requestPdfReport(req.user!.userId, req.correlationId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-apuntes.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────────
// Health check de microservicios
// ──────────────────────────────────────────────────
export const microservicesStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await checkMicroservicesHealth(req.correlationId);
    res.json({
      message: 'Estado de los microservicios',
      correlationId: req.correlationId,
      services: {
        'ms-pdf': status.msPdf ? '🟢 Activo' : '🔴 Inactivo',
        'ms-email': status.msEmail ? '🟢 Activo' : '🔴 Inactivo',
      },
    });
  } catch (err) { next(err); }
};
