// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import {
  isValidSemesterForProgram,
  getSemesterRangeErrorMessage,
} from '../utils/academicValidation';

const service = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, programType, semester } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres' });
      return;
    }

    const assignedRole = role || 'student';

    // Validación de negocio para estudiantes:
    if (assignedRole === 'student') {
      if (!programType || semester === undefined || semester === null || semester === '') {
        res.status(400).json({
          message: "Para estudiantes, el tipo de programa ('tecnologo' o 'ingenieria') y el semestre son requeridos",
        });
        return;
      }

      if (!isValidSemesterForProgram(programType, semester)) {
        res.status(400).json({
          message: getSemesterRangeErrorMessage(programType),
        });
        return;
      }
    } else if (programType && semester !== undefined && semester !== null && semester !== '') {
      // Para otros roles (teacher, moderator, admin), validar consistencia si se proveen
      if (!isValidSemesterForProgram(programType, semester)) {
        res.status(400).json({
          message: getSemesterRangeErrorMessage(programType),
        });
        return;
      }
    }

    // Forzar rol 'student' en registro público para evitar escalada de privilegios
    const user = await service.register(
      name,
      email,
      password,
      'student',
      programType || null,
      semester !== undefined && semester !== null && semester !== '' ? Number(semester) : null
    );
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

export const getRelatedTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tema = (req.query.tema as string) || '';
    const result = await service.getRelatedTopic(tema);
    res.json(result);
  } catch (err) { next(err); }
};

export const getCareers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const careers = await service.getCareers();
    res.json(careers);
  } catch (err) { next(err); }
};

export const updateAcademicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { careerId, semester, programType } = req.body;

    if (programType && semester) {
      if (!isValidSemesterForProgram(programType, semester)) {
        res.status(400).json({
          message: getSemesterRangeErrorMessage(programType),
        });
        return;
      }
    }

    if (!careerId && !semester && !programType) {
      res.status(400).json({ message: 'Se requieren datos académicos para actualizar el perfil' });
      return;
    }

    const profile = await service.updateAcademicProfile(
      req.user!.userId,
      careerId ? Number(careerId) : null,
      semester ? Number(semester) : null,
      programType || null
    );
    res.json(profile);
  } catch (err) { next(err); }
};