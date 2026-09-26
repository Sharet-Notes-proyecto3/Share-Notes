// src/config/migrate.ts
// Ejecutar con: npm run db:migrate
import pool from './database';
import bcrypt from 'bcryptjs';

const SQL_TABLES = `

-- ─── Usuarios ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  role             ENUM('student','teacher','moderator','admin') NOT NULL DEFAULT 'student',
  restricted_until TIMESTAMP NULL DEFAULT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

-- ─── Asignaciones Docente-Materia (TEACHER) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_courses (
  teacher_id INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (teacher_id, subject_id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ─── Apuntes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  filename          VARCHAR(255) NOT NULL,
  original_name     VARCHAR(255) NOT NULL,
  mimetype          VARCHAR(80)  NOT NULL,
  file_size         INT UNSIGNED NOT NULL,
  subject_id        INT UNSIGNED NOT NULL,
  uploader_id       INT UNSIGNED NOT NULL,
  verified          BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by       INT UNSIGNED NULL DEFAULT NULL,
  moderation_status ENUM('visible','hidden','blocked') NOT NULL DEFAULT 'visible',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id)  REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploader_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- ─── Hilos del foro ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_threads (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200) NOT NULL,
  body              TEXT NOT NULL,
  subject_id        INT UNSIGNED NOT NULL,
  author_id         INT UNSIGNED NOT NULL,
  is_closed         BOOLEAN NOT NULL DEFAULT FALSE,
  moderated_by      INT UNSIGNED NULL DEFAULT NULL,
  moderation_reason TEXT NULL DEFAULT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id)  ON DELETE SET NULL
);

-- ─── Respuestas del foro ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_replies (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  body              TEXT NOT NULL,
  thread_id         INT UNSIGNED NOT NULL,
  author_id         INT UNSIGNED NOT NULL,
  upvotes           INT UNSIGNED NOT NULL DEFAULT 0,
  is_solution       BOOLEAN NOT NULL DEFAULT FALSE,
  moderated_by      INT UNSIGNED NULL DEFAULT NULL,
  moderation_reason TEXT NULL DEFAULT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id)      ON DELETE SET NULL
);

-- ─── Reportes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id   INT UNSIGNED NOT NULL,
  target_type   ENUM('note','thread','reply','post','answer') NOT NULL,
  target_id     INT UNSIGNED NOT NULL,
  reason        TEXT NOT NULL,
  status        ENUM('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  resolved_by   INT UNSIGNED NULL DEFAULT NULL,
  resolved_at   TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
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

-- ─── Auditoría (Audit Logs) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  user_role       VARCHAR(50) NOT NULL,
  action          VARCHAR(100) NOT NULL,
  target_resource VARCHAR(100) NOT NULL,
  target_id       INT UNSIGNED NULL DEFAULT NULL,
  details         JSON NULL DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Datos iniciales ──────────────────────────────────────────────────────────
INSERT IGNORE INTO careers (id, name) VALUES
  (1, 'Ingeniería en Sistemas');

INSERT IGNORE INTO subjects (id, name, semester, career_id) VALUES
  (1, 'Cálculo I',             1, 1),
  (2, 'Fundamentos de Progr.', 1, 1),
  (3, 'Álgebra Lineal',        2, 1),
  (4, 'Estructura de Datos',   3, 1),
  (5, 'Bases de Datos',        4, 1),
  (6, 'Redes de Computadores', 5, 1),
  (7, 'Proyecto de Software I',5, 1),
  (8, 'Proyecto de Software II',6,1);
`;

const ALTER_QUERIES = [
  `ALTER TABLE users MODIFY COLUMN role ENUM('student','teacher','moderator','admin') NOT NULL DEFAULT 'student'`,
  `ALTER TABLE users ADD COLUMN restricted_until TIMESTAMP NULL DEFAULT NULL`,
  `ALTER TABLE notes ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE notes ADD COLUMN verified_by INT UNSIGNED NULL DEFAULT NULL`,
  `ALTER TABLE notes ADD COLUMN moderation_status ENUM('visible','hidden','blocked') NOT NULL DEFAULT 'visible'`,
  `ALTER TABLE forum_threads ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE forum_threads ADD COLUMN moderated_by INT UNSIGNED NULL DEFAULT NULL`,
  `ALTER TABLE forum_threads ADD COLUMN moderation_reason TEXT NULL DEFAULT NULL`,
  `ALTER TABLE forum_replies ADD COLUMN is_solution BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE forum_replies ADD COLUMN moderated_by INT UNSIGNED NULL DEFAULT NULL`,
  `ALTER TABLE forum_replies ADD COLUMN moderation_reason TEXT NULL DEFAULT NULL`,
  `ALTER TABLE reports MODIFY COLUMN target_type ENUM('note','thread','reply','post','answer') NOT NULL`,
  `ALTER TABLE reports MODIFY COLUMN status ENUM('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE reports ADD COLUMN resolved_by INT UNSIGNED NULL DEFAULT NULL`,
  `ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN career_id INT UNSIGNED NULL DEFAULT NULL`,
  `ALTER TABLE users ADD COLUMN semester TINYINT UNSIGNED NULL DEFAULT NULL`,
];

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log(
      '🔄  Ejecutando migraciones de base de datos para ShareNotes...',
    );

    // Dividir por ; para ejecutar cada instrucción por separado
    const statements = SQL_TABLES.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await conn.query(stmt);
    }

    // Intentar aplicar alter statements sin fallar si la columna ya existe
    for (const alterSql of ALTER_QUERIES) {
      try {
        await conn.query(alterSql);
      } catch (e) {
        // Ignorar si la columna/modificación ya existe en la tabla
      }
    }

    // Insertar usuarios semilla de desarrollo con contraseñas cifradas
    const passHash = await bcrypt.hash('password123', 10);
    await conn.query(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES
        (1, 'Administrador General', 'admin@sharenotes.edu', ?, 'admin'),
        (2, 'Profesor Carlos',       'teacher@sharenotes.edu', ?, 'teacher'),
        (3, 'Moderadora Ana',        'moderator@sharenotes.edu', ?, 'moderator'),
        (4, 'Estudiante Juan',       'student@sharenotes.edu', ?, 'student')`,
      [passHash, passHash, passHash, passHash],
    );

    // Asignar docente inicial a materias (1, 2, 3, 4)
    await conn.query(
      `INSERT IGNORE INTO teacher_courses (teacher_id, subject_id) VALUES
        (2, 1), (2, 2), (2, 3), (2, 4)`,
    );

    console.log('✅  Migración completada exitosamente.');
    console.log(
      '👥  Usuarios semilla de prueba creados (Contraseña para todos: password123):',
    );
    console.log('    - Admin:     admin@sharenotes.edu');
    console.log('    - Docente:   teacher@sharenotes.edu');
    console.log('    - Moderador: moderator@sharenotes.edu');
    console.log('    - Alumno:    student@sharenotes.edu');
  } catch (err) {
    console.error('❌  Error en migración:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
