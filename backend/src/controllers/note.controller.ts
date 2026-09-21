// src/controllers/note.controller.ts
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { NoteService } from '../services/note.service';
import { checkMicroservicesHealth } from '../utils/microservicesClient';

const service = new NoteService();

export const uploadNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No se adjuntó ningún archivo' });
      return;
    }
    const { title, description, subjectId } = req.body;
    if (!title || !subjectId) {
      res.status(400).json({ message: 'Título y materia son requeridos' });
      return;
    }
    const result = await service.upload({
      title,
      description,
      subjectId: parseInt(subjectId),
      uploaderId: req.user!.userId,
      file: req.file,
    });

    // Disparar notificación por email de forma asíncrona (fire-and-forget).
    // No bloqueamos la respuesta al usuario.
    service.notifyUpload({
      uploaderName: req.user!.email,
      noteTitle: title,
      subjectName: `Materia ID: ${subjectId}`,
      notifyTo: req.user!.email,  // Notifica al propio uploader como confirmación
    });

    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, semester, careerId, search } = req.query;
    const parseNum = (val: any) => {
      const n = parseInt(val);
      return isNaN(n) ? undefined : n;
    };
    const notes = await service.list({
      subjectId: parseNum(subjectId),
      semester:  parseNum(semester),
      careerId:  parseNum(careerId),
      search:    search ? String(search).trim() : undefined,
    });
    res.json(notes);
  } catch (err) { next(err); }
};

export const downloadNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      res.status(400).json({ message: 'ID de apunte inválido' });
      return;
    }
    const { filePath, originalName, mimetype } = await service.getFilePath(noteId);
    const absolutePath = path.resolve(filePath);
    const safeName = encodeURIComponent(originalName);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Type', mimetype);
    res.sendFile(absolutePath);
  } catch (err) { next(err); }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.delete(
      parseInt(req.params.id),
      req.user!.userId,
      req.user!.role
    );
    res.json(result);
  } catch (err) { next(err); }
};

export const listSubjects = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await service.getSubjects();
    res.json(subjects);
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────────
// Nuevo: Generar reporte PDF vía Microservicio MS-PDF
// ──────────────────────────────────────────────────
export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfBuffer = await service.requestPdfReport(req.user!.userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-apuntes.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────────
// Nuevo: Health check de microservicios
// ──────────────────────────────────────────────────
export const microservicesStatus = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await checkMicroservicesHealth();
    res.json({
      message: 'Estado de los microservicios',
      services: {
        'ms-pdf': status.msPdf ? '🟢 Activo' : '🔴 Inactivo',
        'ms-email': status.msEmail ? '🟢 Activo' : '🔴 Inactivo',
      },
    });
  } catch (err) { next(err); }
};
