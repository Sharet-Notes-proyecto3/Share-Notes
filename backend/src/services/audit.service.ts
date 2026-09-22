// src/services/audit.service.ts
import pool from '../config/database';

interface AuditData {
  userId: number;
  userRole: string;
  action: string;
  targetResource: string;
  targetId?: number;
  details?: Record<string, any>;
}

/**
 * Registra una acción en la tabla audit_logs.
 * Incluye un reintento en caso de fallo transitorio (conexión DB, deadlock).
 */
export async function logAuditAction(data: AuditData): Promise<void> {
  const detailsJson = data.details ? JSON.stringify(data.details) : null;
  const params = [
    data.userId,
    data.userRole,
    data.action,
    data.targetResource,
    data.targetId || null,
    detailsJson,
  ];

  const query = `INSERT INTO audit_logs (user_id, user_role, action, target_resource, target_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`;

  // Primer intento
  try {
    await pool.query(query, params);
    return;
  } catch (error: any) {
    console.warn(
      `⚠️ audit_log: fallo en primer intento para acción "${data.action}" ` +
      `(user ${data.userId}, ${data.targetResource} #${data.targetId}):`,
      error.code || error.message
    );
  }

  // Reintento con backoff de 500ms
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    await pool.query(query, params);
    console.info(`✅ audit_log: reintento exitoso para acción "${data.action}"`);
  } catch (retryError: any) {
    // Si falla el reintento, registrar con máximo detalle pero NO bloquear la operación original
    console.error(
      `❌ audit_log: FALLO DEFINITIVO para acción "${data.action}" ` +
      `(user ${data.userId}, rol ${data.userRole}, ${data.targetResource} #${data.targetId}). ` +
      `Este evento de auditoría se ha PERDIDO. Error: ${retryError.code || retryError.message}`
    );
  }
}
