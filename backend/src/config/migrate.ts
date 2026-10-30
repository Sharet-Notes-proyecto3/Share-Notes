// src/config/migrate.ts
// Ejecutar con: npm run db:migrate
import pool from './database';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import { ensureNoteFileOnDisk } from '../utils/pdfFallback';

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
        (34, 'Prof. Laura Martínez',     'laura.martinez@sharenotes.edu', ?, 'teacher', 3, NULL, NULL, 1),
        (35, 'Ing. Andrés Castillo',     'andres.castillo@sharenotes.edu', ?, 'teacher', 4, NULL, NULL, 1),
        -- Moderadores
        (3, 'Moderadora Ana Silva',      'moderator@sharenotes.edu', ?, 'moderator', 1, 8, NULL, 1),
        (36, 'Moderador Luis Peña',      'luis.pena@sharenotes.edu', ?, 'moderator', 3, 6, NULL, 1),
        -- Estudiantes Tecnólogo (semestres 1-6) - Carrera Sistemas
        (4,  'Estudiante Juan Pérez',    'student@sharenotes.edu', ?, 'student', 1, 3, 'ingenieria', 1),
        (7,  'María Camila Torres',      'maria.estudiante@sharenotes.edu', ?, 'student', 1, 1, 'tecnologo', 1),
        (8,  'Andrés Felipe Ramos',      'andres.estudiante@sharenotes.edu', ?, 'student', 1, 4, 'tecnologo', 1),
        (9,  'Lucía Fernanda Díaz',      'lucia.diaz@sharenotes.edu', ?, 'student', 1, 2, 'tecnologo', 1),
        (10, 'Diego Alejandro Mora',     'diego.mora@sharenotes.edu', ?, 'student', 1, 5, 'tecnologo', 1),
        (11, 'Sofía Andrea Castro',      'sofia.castro@sharenotes.edu', ?, 'student', 1, 6, 'tecnologo', 1),
        (20, 'Camila Ortiz',             'camila.ortiz@sharenotes.edu', ?, 'student', 1, 1, 'tecnologo', 1),
        (21, 'Sebastián Rueda',          'sebastian.rueda@sharenotes.edu', ?, 'student', 1, 2, 'tecnologo', 1),
        (22, 'Valeria Mendoza',          'valeria.mendoza@sharenotes.edu', ?, 'student', 1, 3, 'tecnologo', 1),
        (23, 'Nicolás Gómez',            'nicolas.gomez@sharenotes.edu', ?, 'student', 1, 4, 'tecnologo', 1),
        (24, 'Karen López',              'karen.lopez@sharenotes.edu', ?, 'student', 1, 5, 'tecnologo', 1),
        (25, 'Julián Castro',            'julian.castro@sharenotes.edu', ?, 'student', 1, 6, 'tecnologo', 1),
        -- Estudiantes Ingeniería (semestres 7-10) - Carrera Sistemas
        (12, 'Carlos Eduardo Ruiz',      'carlos.ruiz@sharenotes.edu', ?, 'student', 1, 7, 'ingenieria', 1),
        (13, 'Valentina Muñoz',          'valentina.munoz@sharenotes.edu', ?, 'student', 1, 8, 'ingenieria', 1),
        (14, 'Mateo González',           'mateo.gonzalez@sharenotes.edu', ?, 'student', 1, 9, 'ingenieria', 1),
        (15, 'Isabela Herrera',          'isabela.herrera@sharenotes.edu', ?, 'student', 1, 10, 'ingenieria', 1),
        (26, 'Santiago Pérez',           'santiago.perez@sharenotes.edu', ?, 'student', 1, 7, 'ingenieria', 1),
        (27, 'Daniela Ramírez',          'daniela.ramirez@sharenotes.edu', ?, 'student', 1, 8, 'ingenieria', 1),
        (28, 'Alejandro Silva',          'alejandro.silva@sharenotes.edu', ?, 'student', 1, 9, 'ingenieria', 1),
        (29, 'Mariana Torres',           'mariana.torres@sharenotes.edu', ?, 'student', 1, 10, 'ingenieria', 1),
        -- Estudiantes Otras carreras
        (16, 'Pedro Ramírez',            'pedro.ramirez@sharenotes.edu', ?, 'student', 2, 3, NULL, 1),
        (17, 'Andrea Rojas',             'andrea.rojas@sharenotes.edu', ?, 'student', 3, 2, NULL, 1),
        (18, 'Felipe Sánchez',           'felipe.sanchez@sharenotes.edu', ?, 'student', 4, 4, NULL, 1),
        (30, 'Diana Cortés',             'diana.cortes@sharenotes.edu', ?, 'student', 2, 1, NULL, 1),
        (31, 'Oscar Méndez',             'oscar.mendez@sharenotes.edu', ?, 'student', 3, 3, NULL, 1),
        (32, 'Paola Duarte',             'paola.duarte@sharenotes.edu', ?, 'student', 4, 2, NULL, 1),
        (33, 'Hernán Vega',              'hernan.vega@sharenotes.edu', ?, 'student', 2, 5, NULL, 1),
        -- Estudiantes adicionales semestres bajos y altos
        (38, 'Luisa Fernanda Rincón',    'luisa.rincon@sharenotes.edu', ?, 'student', 1, 2, 'tecnologo', 1),
        (39, 'Miguel Ángel Prado',       'miguel.prado@sharenotes.edu', ?, 'student', 1, 3, 'tecnologo', 1),
        (40, 'Carolina Vega',            'carolina.vega@sharenotes.edu', ?, 'student', 1, 4, 'tecnologo', 1),
        -- Usuario sancionado temporal (estudiante inactivo)
        (19, 'Usuario Sancionado',       'spam.user@sharenotes.edu', ?, 'student', 1, 1, 'tecnologo', 0),
        -- Usuario sancionado permanente
        (37, 'Usuario Expulsado',        'expulsado@sharenotes.edu', ?, 'student', 1, 5, 'tecnologo', 0)`,
      [
        // Admin (1) + Docentes (2, 5, 6, 34, 35)
        passHash, passHash, passHash, passHash, passHash, passHash,
        // Moderadores (3, 36)
        passHash, passHash,
        // Estudiantes Tecnólogo sem 1-6 (4, 7, 8, 9, 10, 11, 20, 21, 22, 23, 24, 25)
        passHash, passHash, passHash, passHash, passHash, passHash,
        passHash, passHash, passHash, passHash, passHash, passHash,
        // Estudiantes Ingeniería sem 7-10 (12, 13, 14, 15, 26, 27, 28, 29)
        passHash, passHash, passHash, passHash,
        passHash, passHash, passHash, passHash,
        // Otras carreras (16, 17, 18, 30, 31, 32, 33)
        passHash, passHash, passHash,
        passHash, passHash, passHash, passHash,
        // Estudiantes adicionales (38, 39, 40)
        passHash, passHash, passHash,
        // Inactivos/sancionados (19, 37)
        passHash, passHash,
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
        -- Carlos Mendoza: materias de Sistemas (1-4)
        (2, 1), (2, 2), (2, 3), (2, 4),
        -- Elena Gómez: Bases de Datos, Redes, IA y Seguridad (5,6,10,11)
        (5, 5), (5, 6), (5, 10), (5, 11),
        -- Ricardo Torres: Electrónica (13,14,15)
        (6, 13), (6, 14), (6, 15),
        -- Laura Martínez: Administración (19,20,21,22,23)
        (34, 19), (34, 20), (34, 21), (34, 22), (34, 23),
        -- Andrés Castillo: Contaduría (24,25,26,27,28)
        (35, 24), (35, 25), (35, 26), (35, 27), (35, 28),
        -- Ricardo Torres también: Señales y Sistemas, Comunicaciones (17,18)
        (6, 17), (6, 18)`,
    );

    // ── Apuntes de prueba (archivos de ejemplo, sin archivo físico real) ──
    await conn.query(
      `INSERT IGNORE INTO notes (id, title, description, filename, original_name, mimetype, file_size, subject_id, uploader_id, verified, moderation_status, is_active) VALUES
        -- Sistemas - Cálculo I
        (1,  'Apunte de Cálculo I - Límites y Derivadas',  'Resumen completo de límites, continuidad y derivadas.', 'calc1_limites.pdf', 'Calculo_I_Limites.pdf', 'application/pdf', 1024000, 1, 4,  FALSE, 'visible', TRUE),
        (9,  'Cálculo I - Integrales Definidas',           'Ejercicios resueltos de integrales definidas e indefinidas.', 'calc1_integrales.pdf', 'Calculo_I_Integrales.pdf', 'application/pdf', 1152000, 1, 7,  FALSE, 'visible', TRUE),
        -- Sistemas - Fundamentos de Programación
        (2,  'Fundamentos de Programación - Bucles y Condicionales', 'Ejercicios resueltos de bucles for, while y condicionales if/else.', 'prog1_bucles.pdf', 'Fundamentos_Progr_Bucles.pdf', 'application/pdf', 2048000, 2, 7,  FALSE, 'visible', TRUE),
        (10, 'Fundamentos de Programación - Arreglos y Funciones',   'Manejo de arreglos unidimensionales y bidimensionales.', 'prog1_arreglos.pdf', 'Fundamentos_Progr_Arreglos.pdf', 'application/pdf', 1792000, 2, 20, FALSE, 'visible', TRUE),
        -- Sistemas - Álgebra Lineal
        (11, 'Álgebra Lineal - Matrices y Determinantes', 'Operaciones con matrices, determinantes e inversas.', 'algebra_matrices.pdf', 'Algebra_Lineal_Matrices.pdf', 'application/pdf', 1408000, 3, 21, FALSE, 'visible', TRUE),
        -- Sistemas - Estructura de Datos
        (3,  'Estructura de Datos - Árboles Binarios',    'Teoría y código de árboles binarios y búsqueda.', 'eds_arboles.pdf', 'Estructura_Datos_Arboles.pdf', 'application/pdf', 1536000, 4, 8,  FALSE, 'visible', TRUE),
        (12, 'Estructura de Datos - Listas Enlazadas',    'Implementación de listas simples y doblemente enlazadas.', 'eds_listas.pdf', 'Estructura_Datos_Listas.pdf', 'application/pdf', 1344000, 4, 22, FALSE, 'visible', TRUE),
        -- Sistemas - Bases de Datos
        (4,  'Bases de Datos - Consultas SQL Avanzadas',  'JOINs, subconsultas y funciones de agregado.', 'bd_sql.pdf', 'Bases_Datos_SQL_Avanzado.pdf', 'application/pdf', 1280000, 5, 4,  FALSE, 'visible', TRUE),
        (13, 'Bases de Datos - Modelado ER y Normalización', 'Diagramas entidad-relación y formas normales.', 'bd_er.pdf', 'Bases_Datos_Modelado_ER.pdf', 'application/pdf', 1664000, 5, 23, FALSE, 'visible', TRUE),
        -- Sistemas - Redes de Computadores
        (5,  'Redes de Computadores - Modelo OSI',        'Explicación de las 7 capas del modelo OSI con ejemplos.', 'redes_osi.pdf', 'Redes_Modelo_OSI.pdf', 'application/pdf', 896000, 6, 10, TRUE,  'visible', TRUE),
        (14, 'Redes de Computadores - Direccionamiento IP','Clases de direcciones IP, subnetting y supernetting.', 'redes_ip.pdf', 'Redes_Direccionamiento_IP.pdf', 'application/pdf', 1088000, 6, 24, FALSE, 'visible', TRUE),
        -- Sistemas - Proyecto de Software I
        (6,  'Proyecto de Software I - Documentación de Requisitos', 'Plantilla para levantamiento de requisitos de software.', 'ps1_requisitos.pdf', 'Proyecto_Software_I_Requisitos.pdf', 'application/pdf', 512000, 7, 11, FALSE, 'visible', TRUE),
        (15, 'Proyecto de Software I - Casos de Uso',     'Diagramas de casos de uso y especificaciones.', 'ps1_casos_uso.pdf', 'Proyecto_Software_I_CasosUso.pdf', 'application/pdf', 704000, 7, 25, FALSE, 'visible', TRUE),
        -- Sistemas - Proyecto de Software II
        (16, 'Proyecto de Software II - Arquitectura',    'Patrones de arquitectura de software y diagramas de componentes.', 'ps2_arquitectura.pdf', 'Proyecto_Software_II_Arquitectura.pdf', 'application/pdf', 1920000, 8, 12, TRUE,  'visible', TRUE),
        -- Sistemas - Arquitectura de Software
        (17, 'Arquitectura de Software - Microservicios', 'Diseño de sistemas basados en microservicios y contenedores.', 'arq_ms.pdf', 'Arquitectura_Microservicios.pdf', 'application/pdf', 2048000, 9, 13, TRUE,  'visible', TRUE),
        -- Sistemas - Inteligencia Artificial
        (18, 'Inteligencia Artificial - Búsqueda Informada', 'Algoritmos A*, voraz y búsqueda en anchura/profundidad.', 'ia_busqueda.pdf', 'IA_Busqueda_Informada.pdf', 'application/pdf', 1792000, 10, 14, FALSE, 'visible', TRUE),
        -- Sistemas - Seguridad Informática
        (19, 'Seguridad Informática - Criptografía',      'Cifrado simétrico, asimétrico y firmas digitales.', 'seg_cripto.pdf', 'Seguridad_Criptografia.pdf', 'application/pdf', 1536000, 11, 15, FALSE, 'visible', TRUE),
        -- Sistemas - Computación en la Nube
        (20, 'Computación en la Nube - AWS y Azure',      'Servicios principales de nube pública y despliegue.', 'nube_aws.pdf', 'Nube_AWS_Azure.pdf', 'application/pdf', 1856000, 12, 26, FALSE, 'visible', TRUE),
        -- Electrónica - Circuitos Eléctricos I
        (7,  'Circuitos Eléctricos I - Leyes de Kirchhoff', 'Aplicación de las leyes de Kirchhoff en circuitos en serie y paralelo.', 'ce1_kirchhoff.pdf', 'Circuitos_Kirchhoff.pdf', 'application/pdf', 768000, 13, 16, FALSE, 'visible', TRUE),
        (21, 'Circuitos Eléctricos I - Análisis Nodal',    'Método de análisis nodal y de mallas en circuitos DC.', 'ce1_nodal.pdf', 'Circuitos_Analisis_Nodal.pdf', 'application/pdf', 832000, 13, 30, FALSE, 'visible', TRUE),
        -- Electrónica - Electrónica Analógica
        (22, 'Electrónica Analógica - Amplificadores',    'Amplificadores operacionales y sus configuraciones.', 'ea_amplificadores.pdf', 'Electronica_Analogica_Amplificadores.pdf', 'application/pdf', 1472000, 14, 31, FALSE, 'visible', TRUE),
        -- Administración - Mercadeo
        (23, 'Mercadeo - Plan de Marketing',              'Pasos para elaborar un plan de marketing estratégico.', 'mer_plan.pdf', 'Mercadeo_Plan_Marketing.pdf', 'application/pdf', 1216000, 21, 32, FALSE, 'visible', TRUE),
        -- Contaduría - Contabilidad Financiera I
        (8,  'Contabilidad Financiera I - Balance General', 'Ejercicios de balance general y estado de resultados.', 'cf1_balance.pdf', 'Contabilidad_Balance.pdf', 'application/pdf', 640000, 24, 17, FALSE, 'visible', TRUE),
        (24, 'Contabilidad Financiera I - Estado de Resultados', 'Elaboración del estado de resultados y cálculo de utilidad.', 'cf1_resultados.pdf', 'Contabilidad_Estado_Resultados.pdf', 'application/pdf', 704000, 24, 33, FALSE, 'visible', TRUE),
        (25, 'Auditoría Financiera - Muestreo Estadístico', 'Técnicas de muestreo para procesos de auditoría.', 'aud_muestreo.pdf', 'Auditoria_Muestreo.pdf', 'application/pdf', 896000, 25, 38, FALSE, 'visible', TRUE)`,
    );

    // Asegurar archivos físicos en disco para todas las notas semilla
    try {
      const [allNotes]: any = await conn.query('SELECT filename, title, description FROM notes');
      for (const n of allNotes) {
        if (n.filename) {
          ensureNoteFileOnDisk(n.filename, { title: n.title, description: n.description });
        }
      }
    } catch (fileErr) {
      logger.warn('Aviso: No se pudieron precrear todos los archivos físicos de notas en disco:', fileErr);
    }

    // ── Hilos del foro de prueba ──
    await conn.query(
      `INSERT IGNORE INTO forum_threads (id, title, body, subject_id, author_id, is_closed, is_active) VALUES
        (1,  '¿Cómo balancear un Árbol AVL paso a paso?',  'Tengo dudas al aplicar la rotación doble izquierda-derecha cuando se inserta un nodo en el subárbol izquierdo.', 4, 4,  0, 1),
        (2,  'Duda en demostración por definición delta-épsilon', 'No entiendo cómo acotar el delta en la función f(x) = x^2 cuando x tiende a 3.', 1, 7,  1, 1),
        (3,  'Venta de cuentas de streaming y tareas',     'Escríbanme al WhatsApp 3001234567 para resolverles los exámenes a bajo costo.', 2, 19, 0, 1),
        (4,  'Proyecto final de Bases de Datos',           'Alguien tiene ideas para el proyecto final de modelado ER?', 5, 8,  0, 1),
        (5,  'Examen parcial de Redes - Temas importantes','¿Qué temas cayeron en el parcial pasado de redes? Alguien tiene el temario?', 6, 10, 0, 1),
        (6,  'Duda con Arduino en Electrónica Digital',    'No logro hacer que el led parpadee con el Arduino Uno. Ayuda por favor.', 15, 16, 0, 1),
        (7,  'Ayuda con consultas SQL JOIN múltiples',     'No logro hacer un JOIN de más de tres tablas en MySQL. Alguien me explica?', 5, 20, 0, 1),
        (8,  'Proyecto de Software I - ¿Qué lenguaje usar?','Para el proyecto final, ¿recomiendan Python o Java?', 7, 21, 0, 1),
        (9,  'Redes - Configuración de routers Cisco',     'Alguien tiene experiencia configurando routers Cisco Packet Tracer?', 6, 22, 0, 1),
        (10, 'Contabilidad - Cuentas por cobrar',          '¿Cómo se registran las cuentas por cobrar dudosas en el balance?', 24, 32, 0, 1),
        (11, 'Inteligencia Artificial - Redes Neuronales', '¿Cómo funcionan las redes neuronales convolucionales desde cero?', 10, 26, 0, 1),
        (12, 'Álgebra Lineal - Espacios vectorales',       'No entiendo el concepto de base y dimensión de un espacio vectorial.', 3, 27, 0, 1),
        (13, 'Seguridad Informática - Phishing',           '¿Cómo identificar un correo de phishing y protegerse?', 11, 28, 0, 1),
        (14, 'Electrónica Digital - Puertas lógicas',      'Dudas con la simplificación de expresiones booleanas usando mapas de Karnaugh.', 15, 39, 0, 1),
        (15, 'Mercadeo - Segmentación de mercado',         '¿Cuáles son los criterios para segmentar un mercado objetivo?', 21, 40, 0, 1)`,
    );

    // ── Respuestas del foro ──
    await conn.query(
      `INSERT IGNORE INTO forum_replies (id, body, thread_id, author_id, upvotes, is_solution, is_active) VALUES
        (1,  'Para la rotación doble LR: primero haces una rotación simple izquierda sobre el hijo izquierdo, y luego una rotación simple derecha sobre la raíz del desbalance.', 1, 2,  5, 1, 1),
        (2,  '¡Muchas gracias profesor Carlos! Con ese orden ya me cuadran los factores de equilibrio (-2 y +1).', 1, 4,  2, 0, 1),
        (3,  'En el caso de x^2, asumes primero un delta <= 1 para limitar el entorno de x alrededor de 3: |x-3| < 1 implica 2 < x < 4, y luego |x+3| < 7.', 2, 2,  3, 1, 1),
        (4,  'Te recomiendo hacer un diagrama ER primero con las entidades principales: Estudiante, Curso, Inscripción, Profesor.', 4, 5,  1, 0, 1),
        (5,  'Los temas principales fueron: Modelo OSI, direccionamiento IP y subnetting, y protocolos TCP/UDP.', 5, 6,  2, 0, 1),
        (6,  'Revisa que tengas seleccionada la placa correcta en el IDE de Arduino y el puerto COM adecuado.', 6, 2,  4, 0, 1),
        (7,  'Primero haz el JOIN entre las dos tablas principales, luego ve agregando las restantes una por una con alias.', 7, 5,  3, 1, 1),
        (8,  'Te recomiendo Python por su facilidad y las librerías disponibles para desarrollo rápido.', 8, 34, 4,  1, 1),
        (9,  'En Packet Tracer usa el comando enable, luego configure terminal y ve configurando interfaz por interfaz.', 9, 6,  2, 0, 1),
        (10, 'Se crea una cuenta de contrapartida llamada "Duda por cobrar" dentro del activo.', 10, 35, 2, 1, 1),
        (11, 'Una red neuronal convolucional tiene capas convolucionales, de pooling y totalmente conectadas.', 11, 2,  4, 0, 1),
        (12, 'Una base es un conjunto de vectores linealmente independientes que generan el espacio.', 12, 5,  3, 1, 1),
        (13, 'Revisa el remitente, no hagas clic en enlaces sospechosos y verifica la URL antes de ingresar datos.', 13, 36, 2, 0, 1),
        (14, 'Usa el mapa de Karnaugh agrupando en potencias de 2 (2, 4, 8, 16) para simplificar la expresión.', 14, 2,  1, 0, 1),
        (15, 'Los criterios principales son geográfico, demográfico, psicológico y conductual.', 15, 34, 2, 0, 1),
        (16, '¡Excelente aporte! Me sirvió mucho para entender los JOINs.', 7, 20,  1, 0, 1),
        (17, 'Gracias profesor, ya voy a empezar con Python entonces.', 8, 21,  1, 0, 1),
        (18, '¿Alguien tiene un ejemplo de diagrama ER ya hecho para compartir?', 4, 22,  0, 0, 1),
        (19, 'Yo uso Wireshark para analizar el tráfico de red en mis prácticas.', 5, 23,  0, 0, 1),
        (20, 'Las redes neuronales son fascinantes, recomiendo empezar con TensorFlow o PyTorch.', 11, 24,  1, 0, 1)`,
    );

    // ── Reportes de contenido ──
    await conn.query(
      `INSERT IGNORE INTO reports (id, reporter_id, target_type, target_id, reason, status, resolved_by, resolved_at) VALUES
        (1,  4,  'thread', 3,  'Publicidad no autorizada y ofrecimiento de fraude académico.', 'pending',      NULL,       NULL),
        (2,  6,  'thread', 3,  'Usuario promocionando enlaces sospechosos.',                 'resolved',     3,          NOW()),
        (3,  12, 'note',   1,  'El apunte tiene errores en los ejemplos de derivadas.',     'pending',      NULL,       NULL),
        (4,  20, 'thread', 8,  'El autor pide que le hagan el proyecto completo a cambio de dinero.', 'pending', NULL,       NULL),
        (5,  21, 'note',   4,  'El archivo no se puede abrir, parece estar corrupto.',      'pending',      NULL,       NULL),
        (6,  22, 'reply',  7,  'Respuesta con lenguaje ofensivo hacia otro estudiante.',    'reviewed',     36,         NOW()),
        (7,  23, 'thread', 3,  'Reporte duplicado sobre usuario spam.',                    'dismissed',    36,         NOW()),
        (8,  26, 'note',   5,  'Contenido incompleto, faltan varios capítulos del temario.', 'pending',      NULL,       NULL)`,
    );

    // ── Sanciones ──
    await conn.query(
      `INSERT IGNORE INTO sanctions (id, user_id, admin_id, type, reason, expires_at) VALUES
        (1,  19, 1, 'temp_ban',  'Publicar spam repetitivo y ofrecimiento de resolución fraudulenta de exámenes.', DATE_ADD(NOW(), INTERVAL 7 DAY)),
        (2,  37, 1, 'perm_ban',  'Reincidencia en publicaciones de fraude académico y spam masivo.', NULL),
        (3,  8,  36, 'warning',   'Publicar contenido inapropiado en un hilo del foro.', NULL)`,
    );

    // ── Auditoría (Audit Logs) ──
    await conn.query(
      `INSERT IGNORE INTO audit_logs (id, user_id, user_role, action, target_resource, target_id, details, created_at) VALUES
        (1,  2,  'teacher', 'MARK_SOLUTION',   'forum_reply', 1,  '{"threadId": 1, "replyId": 1}', NOW()),
        (2,  3,  'moderator', 'RESOLVE_REPORT', 'report',     2,  '{"action": "dismiss", "targetType": "thread", "targetId": 3}', NOW()),
        (3,  1,  'admin',    'UPDATE_USER_ROLE', 'user',      36, '{"previousRole": "student", "newRole": "moderator"}', NOW()),
        (4,  36, 'moderator', 'MODERATE_DELETE_NOTE', 'note',  5,  '{"reason": "Contenido inapropiado", "noteTitle": "Redes de Computadores - Modelo OSI"}', NOW()),
        (5,  2,  'teacher',    'VERIFY_NOTE',     'note',      5,  '{"noteTitle": "Redes de Computadores - Modelo OSI"}', NOW()),
        (6,  1,  'admin',     'SUSPEND_USER',     'user',      19, '{"reason": "Spam repetitivo", "duration": "7 days"}', NOW())`,
    );

    logger.info('✅  Migración completada exitosamente.');
    logger.info(
      '👥  Usuarios semilla de prueba creados (Contraseña para todos: password123):',
    );
    logger.info('    - Admin:          admin@sharenotes.edu');
    logger.info('    - Docentes:       teacher@sharenotes.edu, elena.docente@sharenotes.edu, ricardo@sharenotes.edu, laura.martinez@sharenotes.edu, andres.castillo@sharenotes.edu');
    logger.info('    - Moderadores:    moderator@sharenotes.edu, luis.pena@sharenotes.edu');
    logger.info('    - Estudiantes (29 activos): student@sharenotes.edu, maria.estudiante@sharenotes.edu, andres.estudiante@sharenotes.edu, lucia.diaz@sharenotes.edu, diego.mora@sharenotes.edu, sofia.castro@sharenotes.edu, carlos.ruiz@sharenotes.edu, valentina.munoz@sharenotes.edu, mateo.gonzalez@sharenotes.edu, isabela.herrera@sharenotes.edu, pedro.ramirez@sharenotes.edu, andrea.rojas@sharenotes.edu, felipe.sanchez@sharenotes.edu, camila.ortiz@sharenotes.edu, sebastian.rueda@sharenotes.edu, valeria.mendoza@sharenotes.edu, nicolas.gomez@sharenotes.edu, karen.lopez@sharenotes.edu, julian.castro@sharenotes.edu, santiago.perez@sharenotes.edu, daniela.ramirez@sharenotes.edu, alejandro.silva@sharenotes.edu, mariana.torres@sharenotes.edu, diana.cortes@sharenotes.edu, oscar.mendez@sharenotes.edu, paola.duarte@sharenotes.edu, hernan.vega@sharenotes.edu, luisa.rincon@sharenotes.edu, miguel.prado@sharenotes.edu, carolina.vega@sharenotes.edu');
    logger.info('    - Estudiantes inactivos: spam.user@sharenotes.edu (temp_ban 7 días), expulsado@sharenotes.edu (perm_ban)');
    logger.info('    - Apuntes de ejemplo: 25 apuntes en 16 materias distintas');
    logger.info('    - Hilos de foro: 15 debates con 20 respuestas');
    logger.info('    - Reportes: 8 reportes (4 pendientes, 1 resuelto, 1 reviewed, 1 dismissed, 1 más)');
    logger.info('    - Sanciones: 3 (1 temp_ban, 1 perm_ban, 1 warning)');
    logger.info('    - Logs de auditoría: 6 registros');
  } catch (err) {
    logger.error('❌  Error en migración:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();