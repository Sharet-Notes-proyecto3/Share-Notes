// src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';

const service = new AdminService();

export const listUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listUsers()); } catch (err) { next(err); }
};

export const toggleUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.toggleUserStatus(parseInt(req.params.id), req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
};

export const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.changeUserRole(parseInt(req.params.id), req.body.role, req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
};

export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.listReports(req.query.status as string | undefined);
    res.json(result);
  } catch (err) { next(err); }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['reviewed', 'dismissed'].includes(status)) {
      res.status(400).json({ message: 'Estado inválido. Use: reviewed | dismissed' });
      return;
    }
    const result = await service.resolveReport(parseInt(req.params.id), status);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.deleteNote(parseInt(req.params.id), req.user!.userId)); } catch (err) { next(err); }
};

export const deleteThread = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.deleteThread(parseInt(req.params.id), req.user!.userId)); } catch (err) { next(err); }
};

export const deleteReply = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.deleteReply(parseInt(req.params.id), req.user!.userId)); } catch (err) { next(err); }
};

export const applySanction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type, reason, expiresAt } = req.body;
    if (!userId || !type || !reason) {
      res.status(400).json({ message: 'userId, type y reason son requeridos' });
      return;
    }
    const result = await service.applySanction({
      userId: parseInt(userId),
      adminId: req.user!.userId,
      type,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listSanctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    res.json(await service.listSanctions(userId));
  } catch (err) { next(err); }
};

export const generateQR = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const qr = await service.generateQR();
    res.json({ qr }); // Base64 data URL listo para mostrar en el frontend
  } catch (err) { next(err); }
};

export const getCatalog = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getCatalog()); } catch (err) { next(err); }
};

export const createCareer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.createCareer(req.body.name);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, semester, careerId } = req.body;
    const result = await service.createSubject({
      name,
      semester: parseInt(semester),
      careerId: parseInt(careerId),
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.deleteSubject(parseInt(req.params.id), req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
};

export const deleteCareer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.deleteCareer(parseInt(req.params.id), req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
};

