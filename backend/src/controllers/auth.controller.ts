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
    if (typeof password !== 'string') {
      res.status(400).json({ message: 'La contraseña debe ser una cadena de texto válida' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }
    if (password.length > 72) {
      res.status(400).json({ message: 'La contraseña no puede exceder los 72 caracteres' });
      return;
    }

    // En el registro público todas las cuentas se crean como 'student'.
    // Exigir validación académica obligatoria en todo registro público:
    if (!programType || semester === undefined || semester === null || semester === '') {
      res.status(400).json({
        message: "El tipo de programa ('tecnologo' o 'ingenieria') y el semestre son requeridos",
      });
      return;
    }

    if (!isValidSemesterForProgram(programType, semester)) {
      res.status(400).json({
        message: getSemesterRangeErrorMessage(programType),
      });
      return;
    }

    // Forzar rol 'student' en registro público para evitar escalada de privilegios
    const user = await service.register(
      name,
      email,
      password,
      'student',
      programType,
      Number(semester)
    );

    const responsePayload: Record<string, any> = {
      message: 'Registro exitoso',
      user,
    };

    if (role && role !== 'student') {
      responsePayload.roleNotice =
        'El registro público solo crea cuentas de estudiante. Para solicitar rol docente, contacta a un administrador.';
    }

    res.status(201).json(responsePayload);
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