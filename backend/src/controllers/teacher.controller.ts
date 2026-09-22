// src/controllers/teacher.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TeacherService } from '../services/teacher.service';

const service = new TeacherService();

export const verifyNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ message: 'ID de apunte inválido' });
      return;
    }
    const result = await service.verifyNote(noteId, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const markSolution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const replyId = parseInt(req.params.id);
    if (isNaN(replyId)) {
      res.status(400).json({ message: 'ID de respuesta inválido' });
      return;
    }
    const result = await service.markAnswerSolution(replyId, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const closeThread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const threadId = parseInt(req.params.id);
    if (isNaN(threadId)) {
      res.status(400).json({ message: 'ID de hilo inválido' });
      return;
    }
    const result = await service.closeThread(threadId, req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const generateCourseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subjectIdRaw = req.body?.subjectId || req.query?.subjectId;
    const subjectId = parseInt(subjectIdRaw);

    if (!subjectId || isNaN(subjectId)) {
      res.status(400).json({ message: 'El ID de la asignatura (subjectId) es requerido' });
      return;
    }

    const pdfBuffer = await service.generateCourseReport(subjectId, req.user!.userId, req.user!.role);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-curso-${subjectId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

export const getMyCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courses = await service.getTeacherCourses(req.user!.userId, req.user!.role);
    res.json(courses);
  } catch (err) {
    next(err);
  }
};
