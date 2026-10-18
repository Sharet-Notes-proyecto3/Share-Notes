// src/config/database.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? '',
  database: process.env.DB_NAME     || 'sharenotes',
  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit:         0,
  timezone: '+00:00',
});

/**
 * Verifica la conexión con el servidor MySQL aplicando una política de reintentos
 * con espaciado de 2 segundos antes de terminar el proceso en caso de fallo crítico.
 */
async function verifyConnectionWithRetry(maxRetries = 5, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await pool.getConnection();
      logger.info('✅  MySQL conectado correctamente');
      conn.release();
      return;
    } catch (err: any) {
      logger.error(`❌  Intento ${attempt}/${maxRetries} - Error al conectar MySQL: ${err.message}`);
      if (attempt < maxRetries) {
        logger.info(`Reintentando conexión a MySQL en ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        logger.error('FATAL: No fue posible conectar con MySQL tras 5 intentos. Abortando proceso.');
        process.exit(1);
      }
    }
  }
}

// En entorno de test no bloqueamos el runner de Jest
if (process.env.NODE_ENV !== 'test') {
  verifyConnectionWithRetry();
}

export default pool;
