// src/controllers/moderator.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ModeratorService } from '../services/moderator.service';
import { computeRestrictedUntil } from '../services/moderation.policy';

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

export const getReportById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      res.status(400).json({ message: 'ID de reporte inválido' });
      return;
    }
    const report = await service.getReportDetail(reportId);
    res.json(report);
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

export const moderateDeleteReply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const replyId = parseInt(req.params.id);
    const { reason } = req.body || {};

    if (isNaN(replyId)) {
      res.status(400).json({ message: 'ID de respuesta inválido' });
      return;
    }

    const result = await service.moderateDeleteReply(replyId, req.user!.userId, req.user!.role, reason);
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

    // Regla centralizada en moderation.policy (fecha explícita o días, por defecto 7).
    const untilDate = computeRestrictedUntil({ restrictedUntil, days });

    const result = await service.restrictUser(userId, untilDate, req.user!.userId, req.user!.role, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const liftUserRestriction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body || {};

    if (isNaN(userId)) {
      res.status(400).json({ message: 'ID de usuario inválido' });
      return;
    }

    const result = await service.liftUserRestriction(userId, req.user!.userId, req.user!.role, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getModerationStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await service.getModerationStats();
    res.json(stats);
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
