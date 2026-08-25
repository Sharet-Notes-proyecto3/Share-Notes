// src/config/database.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'sharenotes',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '+00:00',
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL conectado correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('❌  Error al conectar MySQL:', err.message);
    process.exit(1);
  });

export default pool;
