// src/controllers/preferences.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PreferencesService } from '../services/preferences.service';

const service = new PreferencesService();

export const getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.get(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const value = req.body?.emailNotifications;
    if (typeof value !== 'boolean') {
      res.status(400).json({
        message: 'El campo emailNotifications debe ser verdadero o falso',
        correlationId: req.correlationId,
      });
      return;
    }
    const result = await service.update(req.user!.userId, value);
    res.json({ ...result, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};