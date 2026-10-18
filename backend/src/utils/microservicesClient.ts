// src/utils/microservicesClient.ts
// Cliente centralizado para comunicación backend-to-backend con los microservicios.
// Implementa timeouts, autenticación mutua con X-Internal-Secret, trazabilidad con X-Correlation-ID,
// reintentos con backoff y logging estructurado mediante Winston.

import logger from './logger';

const MS_PDF_URL = process.env.MS_PDF_URL || 'http://localhost:4001';
const MS_EMAIL_URL = process.env.MS_EMAIL_URL || 'http://localhost:4002';
const MS_TIMEOUT = parseInt(process.env.MS_TIMEOUT || '10000'); // 10 segundos por defecto

// Validación segura de secreto interno: sin valor hardcodeado en producción
const isProduction = process.env.NODE_ENV === 'production';
let internalSecret = process.env.INTERNAL_SERVICE_SECRET;
if (!internalSecret) {
  if (isProduction) {
    logger.error('FATAL: INTERNAL_SERVICE_SECRET no está definida en entorno de producción');
    throw new Error('FATAL: INTERNAL_SERVICE_SECRET no está definida en entorno de producción');
  } else {
    logger.warn('⚠️ INTERNAL_SERVICE_SECRET no está definida en desarrollo. Usando fallback inseguro.');
    internalSecret = 'insecure-dev-secret';
  }
}
const INTERNAL_SERVICE_SECRET = internalSecret;

/**
 * Función auxiliar para pausar la ejecución (backoff)
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wrapper de fetch con timeout incorporado.
 * Si el microservicio no responde dentro del tiempo límite, se aborta la petición.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────
// MS-PDF: Generación de reportes PDF
// ─────────────────────────────────────────────────────────

export interface PdfRequestData {
  username: string;
  notes: Array<{
    title: string;
    subject: string;
    createdAt: string | Date;
  }>;
}

/**
 * Solicita al microservicio MS-PDF la generación de un reporte.
 * Envía obligatoriamente las cabeceras X-Internal-Secret y X-Correlation-ID para autenticación y trazabilidad.
 * Retorna el Buffer del PDF o null si el servicio no está disponible.
 */
export async function generatePdfReport(
  data: PdfRequestData,
  correlationId: string,
): Promise<Buffer | null> {
  try {
    logger.info(`Solicitando generación de PDF a ${MS_PDF_URL}/generate`, {
      correlationId,
      targetService: 'ms-pdf',
      username: data.username,
      totalNotes: data.notes?.length || 0,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Secret': INTERNAL_SERVICE_SECRET,
      'X-Correlation-ID': correlationId,
    };

    const response = await fetchWithTimeout(
      `${MS_PDF_URL}/generate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      },
      MS_TIMEOUT,
    );

    if (!response.ok) {
      logger.error(`MS-PDF respondió con estado HTTP ${response.status}`, {
        correlationId,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    logger.info(`PDF generado exitosamente (${arrayBuffer.byteLength} bytes)`, {
      correlationId,
      bytes: arrayBuffer.byteLength,
    });
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error(`Timeout en llamada a MS-PDF tras ${MS_TIMEOUT}ms`, {
        correlationId,
        timeoutMs: MS_TIMEOUT,
      });
    } else {
      logger.error(`MS-PDF no disponible: ${error.message}`, {
        correlationId,
        error: error.message,
      });
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// MS-Email: Notificaciones por correo con Reintentos y Backoff
// ─────────────────────────────────────────────────────────

export interface EmailNotificationData {
  to: string;
  uploaderName: string;
  noteTitle: string;
  subjectName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  attempts: number;
  error?: string;
}

/**
 * Solicita al microservicio MS-Email el envío de una notificación.
 * Incluye obligatoriamente cabeceras X-Internal-Secret y X-Correlation-ID y política de reintentos
 * con retroceso exponencial (backoff) antes de declarar el envío como fallido.
 */
export async function sendEmailNotification(
  data: EmailNotificationData,
  correlationId: string,
  maxRetries: number = 2,
): Promise<EmailResult> {
  let lastErrorMessage = '';
  const totalAttempts = maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      logger.info(
        `Intento ${attempt}/${totalAttempts}: Enviando email a ${MS_EMAIL_URL}/notify`,
        {
          correlationId,
          recipient: data.to,
          noteTitle: data.noteTitle,
          attempt,
        },
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SERVICE_SECRET,
        'X-Correlation-ID': correlationId,
      };

      const response = await fetchWithTimeout(
        `${MS_EMAIL_URL}/notify`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        },
        MS_TIMEOUT,
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        lastErrorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
        logger.warn(`Intento ${attempt} falló: MS-Email respondió ${response.status}`, {
          correlationId,
          status: response.status,
          attempt,
          errorMessage: lastErrorMessage,
        });
      } else {
        const result = (await response.json()) as any;
        logger.info(`Email enviado exitosamente a ${data.to}`, {
          correlationId,
          messageId: result.messageId,
          previewUrl: result.previewUrl || null,
          attempts: attempt,
        });

        return {
          success: true,
          messageId: result.messageId,
          previewUrl: result.previewUrl,
          attempts: attempt,
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        lastErrorMessage = `Timeout al contactar MS-Email (${MS_TIMEOUT}ms)`;
        logger.warn(`Intento ${attempt} abortado por Timeout`, {
          correlationId,
          attempt,
        });
      } else {
        lastErrorMessage = error.message || 'Error de red con MS-Email';
        logger.warn(`Intento ${attempt} error de conexión: ${lastErrorMessage}`, {
          correlationId,
          attempt,
          error: lastErrorMessage,
        });
      }
    }

    // Si aún quedan reintentos disponibles, esperar con backoff progresivo (500ms, 1000ms...)
    if (attempt < totalAttempts) {
      const backoffMs = attempt * 500;
      logger.info(`Esperando ${backoffMs}ms antes del reintento...`, {
        correlationId,
        backoffMs,
      });
      await wait(backoffMs);
    }
  }

  logger.error(
    `Todos los ${totalAttempts} intentos de envío de email fallaron: ${lastErrorMessage}`,
    {
      correlationId,
      totalAttempts,
      error: lastErrorMessage,
    },
  );

  return {
    success: false,
    attempts: totalAttempts,
    error: lastErrorMessage,
  };
}

// ─────────────────────────────────────────────────────────
// Health Checks
// ─────────────────────────────────────────────────────────

export async function checkMicroservicesHealth(correlationId: string): Promise<{
  msPdf: boolean;
  msEmail: boolean;
}> {
  const checkHealth = async (url: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {
        'X-Internal-Secret': INTERNAL_SERVICE_SECRET,
        'X-Correlation-ID': correlationId,
      };

      const res = await fetchWithTimeout(
        `${url}/health`,
        {
          method: 'GET',
          headers,
        },
        3000,
      );
      return res.ok;
    } catch {
      return false;
    }
  };

  const [msPdf, msEmail] = await Promise.all([
    checkHealth(MS_PDF_URL),
    checkHealth(MS_EMAIL_URL),
  ]);

  logger.info('Chequeo de salud de microservicios completado', {
    correlationId,
    msPdf,
    msEmail,
  });

  return { msPdf, msEmail };
}
