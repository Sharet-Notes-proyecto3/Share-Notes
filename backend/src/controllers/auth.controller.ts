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
    const user = await service.register(name, email, password, role || 'student');
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
