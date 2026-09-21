// src/config/migrate.ts
// Ejecutar con: npm run db:migrate
import pool from './database';

const SQL_TABLES = `

-- ─── Usuarios ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Carreras ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS careers (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
);

-- ─── Materias ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(120) NOT NULL,
  semester  TINYINT UNSIGNED NOT NULL,
  career_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
);

-- ─── Apuntes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  filename     VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype     VARCHAR(80)  NOT NULL,
  file_size    INT UNSIGNED NOT NULL,
  subject_id   INT UNSIGNED NOT NULL,
  uploader_id  INT UNSIGNED NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id)  REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploader_id) REFERENCES users(id)    ON DELETE CASCADE
);

-- ─── Hilos del foro ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_threads (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  body       TEXT NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  author_id  INT UNSIGNED NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id)  REFERENCES users(id)    ON DELETE CASCADE
);

-- ─── Respuestas del foro ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_replies (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  body      TEXT NOT NULL,
  thread_id INT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NOT NULL,
  upvotes   INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)         ON DELETE CASCADE
);

-- ─── Reportes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id   INT UNSIGNED NOT NULL,
  target_type   ENUM('note','thread','reply') NOT NULL,
  target_id     INT UNSIGNED NOT NULL,
  reason        TEXT NOT NULL,
  status        ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Sanciones ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sanctions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  admin_id     INT UNSIGNED NOT NULL,
  type         ENUM('warning','temp_ban','perm_ban') NOT NULL,
  reason       TEXT NOT NULL,
  expires_at   TIMESTAMP NULL DEFAULT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Datos iniciales ──────────────────────────────────────────────────────────
INSERT IGNORE INTO careers (name) VALUES
  ('Ingeniería en Sistemas');

INSERT IGNORE INTO subjects (name, semester, career_id) VALUES
  ('Cálculo I',             1, 1),
  ('Fundamentos de Progr.', 1, 1),
  ('Álgebra Lineal',        2, 1),
  ('Estructura de Datos',   3, 1),
  ('Bases de Datos',        4, 1),
  ('Redes de Computadores', 5, 1),
  ('Proyecto de Software I',5, 1),
  ('Proyecto de Software II',6,1);
`;

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄  Ejecutando migraciones...');
    // Dividir por ; para ejecutar cada instrucción por separado
    const statements = SQL_TABLES
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✅  Migración completada. Tablas creadas y datos iniciales insertados.');
  } catch (err) {
    console.error('❌  Error en migración:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
