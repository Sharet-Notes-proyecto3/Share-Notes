// src/utils/academicValidation.ts
import { ProgramType } from '../types';

export interface SemesterRange {
  min: number;
  max: number;
}

/**
 * Retorna el rango válido de semestres según el tipo de programa académico:
 * - Tecnólogo: semestres 1 a 6
 * - Ingeniería: semestres 7 a 10
 */
export function getSemesterRange(programType: ProgramType | string): SemesterRange {
  if (programType === 'tecnologo') {
    return { min: 1, max: 6 };
  }
  if (programType === 'ingenieria') {
    return { min: 7, max: 10 };
  }
  throw new Error(`Tipo de programa inválido: ${programType}. Debe ser 'tecnologo' o 'ingenieria'.`);
}

/**
 * Valida si el semestre corresponde estrictamente al tipo de programa académico especificado.
 */
export function isValidSemesterForProgram(programType: any, semester: any): boolean {
  if (programType !== 'tecnologo' && programType !== 'ingenieria') {
    return false;
  }

  const numSemester = Number(semester);
  if (!Number.isInteger(numSemester)) {
    return false;
  }

  const range = getSemesterRange(programType as ProgramType);
  return numSemester >= range.min && numSemester <= range.max;
}

/**
 * Retorna un mensaje amigable y explicativo del rango de semestres permitido.
 */
export function getSemesterRangeErrorMessage(programType: any): string {
  if (programType === 'tecnologo') {
    return 'Para Tecnólogo el semestre debe estar entre 1 y 6.';
  }
  if (programType === 'ingenieria') {
    return 'Para Ingeniería el semestre debe estar entre 7 y 10.';
  }
  return "El tipo de programa debe ser 'tecnologo' (semestres 1 a 6) o 'ingenieria' (semestres 7 a 10).";
}
