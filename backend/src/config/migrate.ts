// src/config/migrate.ts
// Ejecutar con: npm run db:migrate
import pool from './database';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

const SQL_TABLES = `

-- ─── Usuarios ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  role             ENUM('student','teacher','moderator','admin') NOT NULL DEFAULT 'student',
  avatar_url       VARCHAR(255) NULL DEFAULT NULL,
  program_type     ENUM('tecnologo','ingenieria') NULL DEFAULT NULL,
  semester         TINYINT UNSIGNED NULL DEFAULT NULL,
  career_id        INT UNSIGNED NULL DEFAULT NULL,
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
  (1, 'Ingeniería en Sistemas'),
  (2, 'Ingeniería Electrónica'),
  (3, 'Administración de Empresas'),
  (4, 'Contaduría Pública');

INSERT IGNORE INTO subjects (id, name, semester, career_id) VALUES
  -- Ingeniería en Sistemas (semestres 1-6 tecnólogo, 7-10 ingeniería)
  (1,  'Cálculo I',              1, 1),
  (2,  'Fundamentos de Progr.',  1, 1),
  (3,  'Álgebra Lineal',         2, 1),
  (4,  'Estructura de Datos',    3, 1),
  (5,  'Bases de Datos',         4, 1),
  (6,  'Redes de Computadores',  5, 1),
  (7,  'Proyecto de Software I', 5, 1),
  (8,  'Proyecto de Software II',6, 1),
  (9,  'Arquitectura de Software',7, 1),
  (10, 'Inteligencia Artificial', 8, 1),
  (11, 'Seguridad Informática',   9, 1),
  (12, 'Computación en la Nube', 10, 1),

  -- Ingeniería Electrónica
  (13, 'Circuitos Eléctricos I',     1, 2),
  (14, 'Electrónica Analógica',      2, 2),
  (15, 'Electrónica Digital',        3, 2),
  (16, 'Microcontroladores',         4, 2),
  (17, 'Señales y Sistemas',         5, 2),
  (18, 'Comunicaciones',             6, 2),

  -- Administración de Empresas
  (19, 'Introducción a la Administración', 1, 3),
  (20, 'Contabilidad Básica',              2, 3),
  (21, 'Mercadeo',                         3, 3),
  (22, 'Recursos Humanos',                 4, 3),
  (23, 'Emprendimiento',                   5, 3),

  -- Contaduría Pública
  (24, 'Contabilidad Financiera I', 1, 4),
  (25, 'Auditoría Financiera',      2, 4),
  (26, 'Tributación',               3, 4),
  (27, 'Costos',                    4, 4),
  (28, 'Control Interno',           5, 4);
`;

const ALTER_QUERIES = [
  `ALTER TABLE users MODIFY COLUMN role ENUM('student','teacher','moderator','admin') NOT NULL DEFAULT 'student'`,
  `ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL DEFAULT NULL`,
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
  `ALTER TABLE users ADD COLUMN program_type ENUM('tecnologo','ingenieria') NULL DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE`,
];

async function migrate() {
  const conn = await pool.getConnection();
  try {
    logger.info(
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
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, career_id, semester, program_type, is_active) VALUES
        -- Admin
        (1, 'Administrador General', 'admin@sharenotes.edu', ?, 'admin', 1, 10, NULL, 1),
        -- Docentes
        (2, 'Profesor Carlos Mendoza',   'teacher@sharenotes.edu', ?, 'teacher', 1, NULL, NULL, 1),
        (5, 'Dra. Elena Gómez',          'elena.docente@sharenotes.edu', ?, 'teacher', 1, NULL, NULL, 1),
        (6, 'Ing. Ricardo Torres',       'ricardo@sharenotes.edu', ?, 'teacher', 2, NULL, NULL, 1),
        -- Moderador
        (3, 'Moderadora Ana Silva',      'moderator@sharenotes.edu', ?, 'moderator', 1, 8, NULL, 1),
        -- Estudiantes Tecnólogo (semestres 1-6)
        (4,  'Estudiante Juan Pérez',    'student@sharenotes.edu', ?, 'student', 1, 3, 'ingenieria', 1),
        (7,  'María Camila Torres',      'maria.estudiante@sharenotes.edu', ?, 'student', 1, 1, 'tecnologo', 1),
        (8,  'Andrés Felipe Ramos',      'andres.estudiante@sharenotes.edu', ?, 'student', 1, 4, 'tecnologo', 1),
        (9,  'Lucía Fernanda Díaz',      'lucia.diaz@sharenotes.edu', ?, 'student', 1, 2, 'tecnologo', 1),
        (10, 'Diego Alejandro Mora',     'diego.mora@sharenotes.edu', ?, 'student', 1, 5, 'tecnologo', 1),
        (11, 'Sofía Andrea Castro',      'sofia.castro@sharenotes.edu', ?, 'student', 1, 6, 'tecnologo', 1),
        -- Estudiantes Ingeniería (semestres 7-10)
        (12, 'Carlos Eduardo Ruiz',      'carlos.ruiz@sharenotes.edu', ?, 'student', 1, 7, 'ingenieria', 1),
        (13, 'Valentina Muñoz',          'valentina.munoz@sharenotes.edu', ?, 'student', 1, 8, 'ingenieria', 1),
        (14, 'Mateo González',           'mateo.gonzalez@sharenotes.edu', ?, 'student', 1, 9, 'ingenieria', 1),
        (15, 'Isabela Herrera',          'isabela.herrera@sharenotes.edu', ?, 'student', 1, 10, 'ingenieria', 1),
        -- Estudiantes de otras carreras
        (16, 'Pedro Ramírez',            'pedro.ramirez@sharenotes.edu', ?, 'student', 2, 3, NULL, 1),
        (17, 'Andrea Rojas',             'andrea.rojas@sharenotes.edu', ?, 'student', 3, 2, NULL, 1),
        (18, 'Felipe Sánchez',           'felipe.sanchez@sharenotes.edu', ?, 'student', 4, 4, NULL, 1),
        -- Usuario sancionado (estudiante inactivo)
        (19, 'Usuario Sancionado', 'spam.user@sharenotes.edu', '$2b$10$n9OE/.t0saPweRXGDojq4OT/k.we86C4pjtKTDt7vDqDAdcy1eEMi', 'student', 1, 1, 'tecnologo', 0)`,
      [
        passHash, passHash, passHash, passHash,  // admin + 3 docentes + moderador
        passHash, passHash, passHash, passHash, passHash, passHash,  // 6 estudiantes tecnólogo
        passHash, passHash, passHash, passHash,  // 4 estudiantes ingeniería
        passHash, passHash, passHash, passHash,  // 3 otras carreras + 1 sancionado
      ],
    );
    await conn.query(
      `UPDATE users
       SET name = 'Moderador'
       WHERE id = 3 AND email = 'moderator@sharenotes.edu'
         AND name IN ('Moderadora Ana', 'Moderadora Ana Silva')`
    );

    // Asignar docentes a materias
    await conn.query(
      `INSERT IGNORE INTO teacher_courses (teacher_id, subject_id) VALUES
        -- Carlos Mendoza: materias de Sistemas
        (2, 1), (2, 2), (2, 3), (2, 4),
        -- Elena Gómez: Bases de Datos y Redes
        (5, 5), (5, 6),
        -- Ricardo Torres: Electrónica
        (6, 13), (6, 14), (6, 15),
        -- Elena Gómez también: IA y Seguridad
        (5, 10), (5, 11)`,
    );

    // ── Apuntes de prueba (archivos de ejemplo, sin archivo físico real) ──
    await conn.query(
      `INSERT IGNORE INTO notes (id, title, description, filename, original_name, mimetype, file_size, subject_id, uploader_id, verified, moderation_status, is_active) VALUES
        (1, 'Apunte de Cálculo I - Límites y Derivadas', 'Resumen completo de límites, continuidad y derivadas.', 'calc1_limites.pdf', 'Calculo_I_Limites.pdf', 'application/pdf', 1024000, 1, 4, FALSE, 'visible', TRUE),
        (2, 'Fundamentos de Programación - Bucles y Condicionales', 'Ejercicios resueltos de bucles for, while y condicionales if/else.', 'prog1_bucles.pdf', 'Fundamentos_Progr_Bucles.pdf', 'application/pdf', 2048000, 2, 7, FALSE, 'visible', TRUE),
        (3, 'Estructura de Datos - Árboles Binarios', 'Teoría y código de árboles binarios y búsqueda.', 'eds_arboles.pdf', 'Estructura_Datos_Arboles.pdf', 'application/pdf', 1536000, 4, 8, FALSE, 'visible', TRUE),
        (4, 'Bases de Datos - Consultas SQL Avanzadas', 'JOINs, subconsultas y funciones de agregado.', 'bd_sql.pdf', 'Bases_Datos_SQL_Avanzado.pdf', 'application/pdf', 1280000, 5, 4, FALSE, 'visible', TRUE),
        (5, 'Redes de Computadores - Modelo OSI', 'Explicación de las 7 capas del modelo OSI con ejemplos.', 'redes_osi.pdf', 'Redes_Modelo_OSI.pdf', 'application/pdf', 896000, 6, 10, TRUE, 'visible', TRUE),
        (6, 'Proyecto de Software I - Documentación de Requisitos', 'Plantilla para levantamiento de requisitos de software.', 'ps1_requisitos.pdf', 'Proyecto_Software_I_Requisitos.pdf', 'application/pdf', 512000, 7, 11, FALSE, 'visible', TRUE),
        (7, 'Circuitos Eléctricos I - Leyes de Kirchhoff', 'Aplicación de las leyes de Kirchhoff en circuitos en serie y paralelo.', 'ce1_kirchhoff.pdf', 'Circuitos_Kirchhoff.pdf', 'application/pdf', 768000, 13, 16, FALSE, 'visible', TRUE),
        (8, 'Contabilidad Financiera I - Balance General', 'Ejercicios de balance general y estado de resultados.', 'cf1_balance.pdf', 'Contabilidad_Balance.pdf', 'application/pdf', 640000, 24, 17, FALSE, 'visible', TRUE)`,
    );

    // ── Hilos del foro de prueba ──
    await conn.query(
      `INSERT IGNORE INTO forum_threads (id, title, body, subject_id, author_id, is_closed, is_active) VALUES
        (1, '¿Cómo balancear un Árbol AVL paso a paso?', 'Tengo dudas al aplicar la rotación doble izquierda-derecha cuando se inserta un nodo en el subárbol izquierdo.', 4, 4, 0, 1),
        (2, 'Duda en demostración por definición delta-épsilon', 'No entiendo cómo acotar el delta en la función f(x) = x^2 cuando x tiende a 3.', 1, 7, 1, 1),
        (3, 'Venta de cuentas de streaming y tareas', 'Escríbanme al WhatsApp 3001234567 para resolverles los exámenes a bajo costo.', 2, 19, 0, 1),
        (4, 'Proyecto final de Bases de Datos', 'Alguien tiene ideas para el proyecto final de modelado ER?', 5, 8, 0, 1),
        (5, 'Examen parcial de Redes - Temas importantes', '¿Qué temas cayeron en el parcial pasado de redes? Alguien tiene el temario?', 6, 10, 0, 1),
        (6, 'Duda con Arduino en Electrónica Digital', 'No logro hacer que el led parpadee con el Arduino Uno. Ayuda por favor.', 15, 16, 0, 1)`,
    );

    // ── Respuestas del foro ──
    await conn.query(
      `INSERT IGNORE INTO forum_replies (id, body, thread_id, author_id, upvotes, is_solution, is_active) VALUES
        (1, 'Para la rotación doble LR: primero haces una rotación simple izquierda sobre el hijo izquierdo, y luego una rotación simple derecha sobre la raíz del desbalance.', 1, 2, 5, 1, 1),
        (2, '¡Muchas gracias profesor Carlos! Con ese orden ya me cuadran los factores de equilibrio (-2 y +1).', 1, 4, 2, 0, 1),
        (3, 'En el caso de x^2, asumes primero un delta <= 1 para limitar el entorno de x alrededor de 3: |x-3| < 1 implica 2 < x < 4, y luego |x+3| < 7.', 2, 2, 3, 1, 1),
        (4, 'Te recomiendo hacer un diagrama ER primero con las entidades principales: Estudiante, Curso, Inscripción, Profesor.', 4, 5, 1, 0, 1),
        (5, 'Los temas principales fueron: Modelo OSI, direccionamiento IP y subnetting, y protocolos TCP/UDP.', 5, 6, 2, 0, 1),
        (6, 'Revisa que tengas seleccionada la placa correcta en el IDE de Arduino y el puerto COM adecuado.', 6, 2, 4, 0, 1)`,
    );

    // ── Reportes de contenido ──
    await conn.query(
      `INSERT IGNORE INTO reports (id, reporter_id, target_type, target_id, reason, status, resolved_by, resolved_at) VALUES
        (1, 4, 'thread', 3, 'Publicidad no autorizada y ofrecimiento de fraude académico.', 'pending', NULL, NULL),
        (2, 6, 'thread', 3, 'Usuario promocionando enlaces sospechosos.', 'resolved', 3, NOW()),
        (3, 12, 'note', 1, 'El apunte tiene errores en los ejemplos de derivadas.', 'pending', NULL, NULL)`,
    );

    // ── Sanciones ──
    await conn.query(
      `INSERT IGNORE INTO sanctions (id, user_id, admin_id, type, reason, expires_at) VALUES
        (1, 19, 1, 'temp_ban', 'Publicar spam repetitivo y ofrecimiento de resolución fraudulenta de exámenes.', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    );

    logger.info('✅  Migración completada exitosamente.');
    logger.info(
      '👥  Usuarios semilla de prueba creados (Contraseña para todos: password123):',
    );
    logger.info('    - Admin:     admin@sharenotes.edu');
    logger.info('    - Docente:   teacher@sharenotes.edu');
    logger.info('    - Docente 2: elena.docente@sharenotes.edu');
    logger.info('    - Docente 3: ricardo@sharenotes.edu');
    logger.info('    - Moderador: moderator@sharenotes.edu');
    logger.info('    - Estudiantes: student@sharenotes.edu, maria.estudiante@sharenotes.edu, andres.estudiante@sharenotes.edu, lucia.diaz@sharenotes.edu, diego.mora@sharenotes.edu, sofia.castro@sharenotes.edu, carlos.ruiz@sharenotes.edu, valentina.munoz@sharenotes.edu, mateo.gonzalez@sharenotes.edu, isabela.herrera@sharenotes.edu, pedro.ramirez@sharenotes.edu, andrea.rojas@sharenotes.edu, felipe.sanchez@sharenotes.edu');
    logger.info('    - Usuario sancionado: spam.user@sharenotes.edu (inactivo)');
    logger.info('    - Apuntes de ejemplo: 8 apuntes creados en distintas materias');
    logger.info('    - Hilos de foro: 6 debates con respuestas');
    logger.info('    - Reportes: 3 reportes (1 pendiente, 1 resuelto, 1 pendiente de nota)');
  } catch (err) {
    logger.error('❌  Error en migración:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
