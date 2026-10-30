// src/services/moderation.policy.ts
//
// Reglas de negocio PURAS del rol MODERATOR.
// No acceden a la base de datos ni a Express, por lo que son directamente
// testeables de forma unitaria (sin mocks de infraestructura).
//
// El ModeratorService y el ModeratorController consumen estas funciones para
// mantener una única fuente de verdad en validaciones y transiciones.

import { AppError } from '../middlewares/error.middleware';

// ─── Estados de una denuncia ────────────────────────────────────────────────

export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Estados terminales: una denuncia cerrada no se vuelve a procesar. */
export const CLOSED_REPORT_STATUSES: readonly ReportStatus[] = ['resolved', 'dismissed'];

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === 'string' && (REPORT_STATUSES as readonly string[]).includes(value);
}

/**
 * Normaliza y valida el filtro de estado de la cola de denuncias.
 * @throws AppError 400 cuando el valor no pertenece al enum de la tabla `reports`.
 */
export function normalizeReportStatus(value: unknown): ReportStatus {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!isReportStatus(normalized)) {
    throw new AppError(
      400,
      `Estado de denuncia inválido: "${String(value)}". Valores permitidos: ${REPORT_STATUSES.join(', ')}`
    );
  }
  return normalized;
}

/**
 * Impide reprocesar una denuncia ya cerrada (doble resolución / condición de carrera).
 * @throws AppError 409
 */
export function assertReportIsOpen(status: ReportStatus): void {
  if (CLOSED_REPORT_STATUSES.includes(status)) {
    throw new AppError(
      409,
      `La denuncia ya fue cerrada con estado "${status}" y no puede volver a procesarse`
    );
  }
}

// ─── Estados de moderación de un apunte ─────────────────────────────────────

export const MODERATION_STATUSES = ['visible', 'hidden', 'blocked'] as const;
export type NoteModerationStatus = (typeof MODERATION_STATUSES)[number];

export function isModerationStatus(value: unknown): value is NoteModerationStatus {
  return typeof value === 'string' && (MODERATION_STATUSES as readonly string[]).includes(value);
}

/**
 * @throws AppError 400 cuando el estado no es visible | hidden | blocked.
 */
export function normalizeModerationStatus(value: unknown): NoteModerationStatus {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!isModerationStatus(normalized)) {
    throw new AppError(
      400,
      `moderationStatus debe ser uno de: ${MODERATION_STATUSES.join(', ')}`
    );
  }
  return normalized;
}

/** Un apunte oculto o bloqueado deja de ser visible/descargable para estudiantes. */
export function isNoteVisibleToStudents(status: unknown): boolean {
  return String(status ?? 'visible').toLowerCase() === 'visible';
}

// ─── Restricciones de usuarios ──────────────────────────────────────────────

export const DEFAULT_RESTRICTION_DAYS = 7;
export const MAX_RESTRICTION_DAYS = 365;

const ROLE_LEVEL: Record<string, number> = {
  student: 1,
  teacher: 2,
  moderator: 3,
  admin: 4,
};

/** Comprueba si una fecha de restricción sigue vigente. */
export function isRestrictionActive(
  restrictedUntil: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!restrictedUntil) return false;
  const date = restrictedUntil instanceof Date ? restrictedUntil : new Date(restrictedUntil);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > now.getTime();
}

/**
 * Calcula la fecha final de una restricción a partir de una fecha explícita
 * o de una cantidad de días. Centraliza la regla que antes vivía en el controlador.
 * @throws AppError 400 si la fecha es pasada/inválida o los días están fuera de rango.
 */
export function computeRestrictedUntil(input: {
  restrictedUntil?: unknown;
  days?: unknown;
  now?: Date;
}): Date {
  const now = input.now ?? new Date();
  const hasExplicitDate =
    input.restrictedUntil !== undefined &&
    input.restrictedUntil !== null &&
    input.restrictedUntil !== '';

  if (hasExplicitDate) {
    const parsed =
      input.restrictedUntil instanceof Date
        ? new Date(input.restrictedUntil.getTime())
        : new Date(String(input.restrictedUntil));

    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(400, 'La fecha de restricción no es válida');
    }
    if (parsed.getTime() <= now.getTime()) {
      throw new AppError(400, 'La fecha de restricción debe ser una fecha futura válida');
    }
    return parsed;
  }

  const rawDays =
    input.days === undefined || input.days === null || input.days === ''
      ? DEFAULT_RESTRICTION_DAYS
      : Number(input.days);

  if (
    !Number.isInteger(rawDays) ||
    rawDays < 1 ||
    rawDays > MAX_RESTRICTION_DAYS
  ) {
    throw new AppError(
      400,
      `Los días de restricción deben ser un entero entre 1 y ${MAX_RESTRICTION_DAYS}`
    );
  }

  return new Date(now.getTime() + rawDays * 24 * 60 * 60 * 1000);
}

/**
 * Valida una fecha ya calculada. Se usa en el servicio para que la regla no
 * dependa de que el controlador la haya validado.
 * @throws AppError 400
 */
export function assertFutureRestriction(until: Date, now: Date = new Date()): Date {
  if (!(until instanceof Date) || Number.isNaN(until.getTime())) {
    throw new AppError(400, 'La fecha de restricción no es válida');
  }
  if (until.getTime() <= now.getTime()) {
    throw new AppError(400, 'La fecha de restricción debe ser una fecha futura válida');
  }
  return until;
}

/**
 * Un moderador no puede sancionarse a sí mismo, ni a un admin, ni a alguien
 * de su mismo nivel o superior (evita que moderadores se bloqueen entre sí).
 * @throws AppError 403
 */
export function assertCanRestrictUser(params: {
  actorId: number;
  actorRole: string;
  targetId: number;
  targetRole: string;
}): void {
  if (params.actorId === params.targetId) {
    throw new AppError(403, 'No puedes aplicarte una restricción a ti mismo');
  }
  if (params.targetRole === 'admin') {
    throw new AppError(403, 'No puedes aplicar restricciones a un administrador');
  }

  const actorLevel = ROLE_LEVEL[params.actorRole] ?? 0;
  const targetLevel = ROLE_LEVEL[params.targetRole] ?? 0;

  if (actorLevel <= targetLevel) {
    throw new AppError(
      403,
      'No puedes restringir a un usuario con tu mismo rol o superior'
    );
  }
}

// ─── Métricas del panel de moderación ───────────────────────────────────────

export interface ReportStatusRow {
  status?: unknown;
  total?: unknown;
}

export interface ReportStats {
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  total: number;
}

/**
 * Agrupa el resultado de `SELECT status, COUNT(*) total FROM reports GROUP BY status`
 * en un objeto estable para el dashboard (siempre incluye todos los estados).
 */
export function buildModerationStats(rows: ReportStatusRow[]): ReportStats {
  const stats: ReportStats = {
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
    total: 0,
  };

  for (const row of rows ?? []) {
    const status = String(row.status ?? '').trim().toLowerCase();
    const total = Number(row.total ?? 0);

    if (!isReportStatus(status) || !Number.isFinite(total)) continue;

    stats[status] += total;
    stats.total += total;
  }

  return stats;
}
