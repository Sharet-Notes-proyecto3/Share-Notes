export type UserRole = 'student' | 'teacher' | 'moderator' | 'admin';
export type ProgramType = 'tecnologo' | 'ingenieria';

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  semester?: number | null;
  programType?: ProgramType | null;
  program_type?: ProgramType | null;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
  correlationId: string;
}

// Extender Request de Express para incluir el usuario autenticado y correlationId
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      correlationId: string;
    }
  }
}
