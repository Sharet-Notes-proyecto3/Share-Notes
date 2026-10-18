// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const service = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres' });
      return;
    }
    // Forzar rol 'student' en registro público para evitar escalada de privilegios
    const user = await service.register(name, email, password, 'student');
    res.status(201).json({ message: 'Registro exitoso', user });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }
    const result = await service.login(email, password);
    res.json(result);
  } catch (err) { next(err); }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await service.getProfile(req.user!.userId);
    res.json(profile);
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 100) {
      res.status(400).json({ message: 'El nombre debe tener entre 1 y 100 caracteres' });
      return;
    }
    const profile = await service.updateProfileName(req.user!.userId, name);
    res.json(profile);
  } catch (err) { next(err); }
};

export const uploadProfilePhoto = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    res.status(400).json({ message: 'Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB' });
    return;
  }

  try {
    const profile = await service.updateProfilePhoto(req.user!.userId, req.file.filename);
    res.json(profile);
  } catch (err) { next(err); }
};

export const deleteProfilePhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await service.removeProfilePhoto(req.user!.userId);
    res.json(profile);
  } catch (err) { next(err); }
};

export const getRelatedTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tema = (req.query.tema as string) || '';
    const result = await service.getRelatedTopic(tema);
    res.json(result);
  } catch (err) { next(err); }
};
