// src/controllers/moderator.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ModeratorService } from '../services/moderator.service';

const service = new ModeratorService();

export const listReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query;
    const reports = await service.listReports(status ? String(status) : undefined);
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      res.status(400).json({ message: 'ID de reporte inválido' });
      return;
    }
    const result = await service.resolveReport(reportId, 'resolved', req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const dismissReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      res.status(400).json({ message: 'ID de reporte inválido' });
      return;
    }
    const result = await service.resolveReport(reportId, 'dismissed', req.user!.userId, req.user!.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const moderateNoteStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    const { moderationStatus, reason } = req.body || {};

    if (isNaN(noteId)) {
      res.status(400).json({ message: 'ID de apunte inválido' });
      return;
    }
    if (!['visible', 'hidden', 'blocked'].includes(moderationStatus)) {
      res.status(400).json({ message: 'moderationStatus debe ser visible, hidden o blocked' });
      return;
    }

    const result = await service.moderateNoteStatus(noteId, moderationStatus, req.user!.userId, req.user!.role, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const moderateDeletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const threadId = parseInt(req.params.id);
    const { reason } = req.body || {};

    if (isNaN(threadId)) {
      res.status(400).json({ message: 'ID de publicación inválido' });
      return;
    }

    const result = await service.moderateDeletePost(threadId, req.user!.userId, req.user!.role, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const restrictUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { restrictedUntil, days, reason } = req.body || {};

    if (isNaN(userId)) {
      res.status(400).json({ message: 'ID de usuario inválido' });
      return;
    }

    let untilDate: Date;
    if (restrictedUntil) {
      untilDate = new Date(restrictedUntil);
    } else if (days && !isNaN(parseInt(days))) {
      untilDate = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);
    } else {
      // Por defecto 7 días de restricción
      untilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    if (isNaN(untilDate.getTime()) || untilDate <= new Date()) {
      res.status(400).json({ message: 'La fecha de restricción debe ser una fecha futura válida' });
      return;
    }

    const result = await service.restrictUser(userId, untilDate, req.user!.userId, req.user!.role, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getModerationLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query;
    const logs = await service.getModerationLogs(userId ? parseInt(String(userId)) : undefined);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
