export type UserRole = 'student' | 'teacher' | 'moderator' | 'admin';

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}

// Extender Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

