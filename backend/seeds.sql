-- =============================================================================
-- SHARENOTES: SCRIPT DE DATOS DE PRUEBA (SEEDS)
-- Base de datos: sharenotes
-- Compatible con MySQL 8.0+, 8.4+ y MariaDB (Sin advertencias de obsolescencia ni errores de columnas)
-- Contraseña para TODOS los usuarios de prueba: password123
-- =============================================================================

USE sharenotes;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. CARRERAS
INSERT IGNORE INTO careers (id, name) VALUES
  (1, 'Ingeniería en Sistemas'),
  (2, 'Ingeniería Electrónica'),
  (3, 'Administración de Empresas');

-- 2. ASIGNATURAS (MATERIAS)
INSERT IGNORE INTO subjects (id, name, semester, career_id) VALUES
  (1, 'Cálculo I',              1, 1),
  (2, 'Fundamentos de Progr.',  1, 1),
  (3, 'Álgebra Lineal',         2, 1),
  (4, 'Estructura de Datos',    3, 1),
  (5, 'Bases de Datos',         4, 1),
  (6, 'Redes de Computadores',  5, 1),
  (7, 'Proyecto de Software I', 5, 1),
  (8, 'Proyecto de Software II',6, 1);

-- 3. USUARIOS (Contraseña de todos: password123)
-- Hash bcrypt correspondiente: $2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm
INSERT IGNORE INTO users (id, name, email, password_hash, role, career_id, semester, is_active) VALUES
  -- Administrador del sistema
  (1, 'Administrador General', 'admin@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'admin', 1, 10, 1),
  
  -- Docentes con materias asignadas
  (2, 'Prof. Carlos Mendoza',   'teacher@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'teacher', 1, NULL, 1),
  (5, 'Dra. Elena Gómez',       'elena.docente@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'teacher', 1, NULL, 1),
  
  -- Moderador de contenido y denuncias
  (3, 'Moderadora Ana Silva',   'moderator@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'moderator', 1, 8, 1),
  
  -- Estudiantes regulares
  (4, 'Juan Pérez (Estudiante)', 'student@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'student', 1, 3, 1),
  (6, 'María Camila Torres',    'maria.estudiante@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'student', 1, 1, 1),
  (7, 'Andrés Felipe Ramos',    'andres.estudiante@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'student', 1, 4, 1),
  
  -- Usuario sancionado para pruebas de restricción
  (8, 'Usuario Sancionado',     'spam.user@sharenotes.edu', '$2b$10$4VRzsmFzlJvbj.7WpDC21.zxmNJBmK7UALMMMA73WWkmntI96ijzm', 'student', 1, 1, 1);

-- 4. ASIGNACIÓN DOCENTE - CURSOS
INSERT IGNORE INTO teacher_courses (teacher_id, subject_id) VALUES
  (2, 1), -- Carlos -> Cálculo I
  (2, 2), -- Carlos -> Fundamentos de Progr.
  (2, 3), -- Carlos -> Álgebra Lineal
  (2, 4), -- Carlos -> Estructura de Datos
  (5, 5), -- Elena  -> Bases de Datos
  (5, 6); -- Elena  -> Redes de Computadores

-- 5. HILOS DEL FORO (FORUM_THREADS)
INSERT IGNORE INTO forum_threads (id, title, body, subject_id, author_id, is_closed, is_active) VALUES
  (1, '¿Cómo balancear un Árbol AVL paso a paso?', 'Tengo dudas al aplicar la rotación doble izquierda-derecha cuando se inserta un nodo en el subárbol izquierdo.', 4, 4, 0, 1),
  (2, 'Duda en demostración por definición delta-épsilon', 'No entiendo cómo acotar el delta en la función f(x) = x^2 cuando x tiende a 3.', 1, 6, 1, 1),
  (3, 'Venta de cuentas de streaming y tareas', 'Escríbanme al WhatsApp 3001234567 para resolverles los exámenes a bajo costo.', 2, 8, 0, 1);

-- 6. RESPUESTAS DEL FORO (FORUM_REPLIES)
-- Nota: se omiten columnas no presentes en todas las versiones del esquema como upvotes
INSERT IGNORE INTO forum_replies (id, body, thread_id, author_id, is_solution, is_active) VALUES
  (1, 'Para la rotación doble LR: primero haces una rotación simple izquierda sobre el hijo izquierdo, y luego una rotación simple derecha sobre la raíz del desbalance.', 1, 2, 1, 1),
  (2, '¡Muchas gracias profesor Carlos! Con ese orden ya me cuadran los factores de equilibrio (-2 y +1).', 1, 4, 0, 1),
  (3, 'En el caso de x^2, asumes primero un delta <= 1 para limitar el entorno de x alrededor de 3: |x-3| < 1 implica 2 < x < 4, y luego |x+3| < 7.', 2, 2, 1, 1);

-- 7. REPORTES DE CONTENIDO (REPORTS)
INSERT IGNORE INTO reports (id, reporter_id, target_type, target_id, reason, status, resolved_by, resolved_at) VALUES
  -- Reporte pendiente para moderación (en el hilo de spam #3)
  (1, 4, 'thread', 3, 'Publicidad no autorizada y ofrecimiento de fraude académico.', 'pending', NULL, NULL),
  -- Reporte resuelto previamente
  (2, 6, 'thread', 3, 'Usuario promocionando enlaces sospechosos.', 'resolved', 3, NOW());

-- 8. SANCIONES (SANCTIONS)
INSERT IGNORE INTO sanctions (id, user_id, admin_id, type, reason, expires_at) VALUES
  (1, 8, 1, 'temp_ban', 'Publicar spam repetitivo y ofrecimiento de resolución fraudulenta de exámenes.', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- 9. LOGS DE AUDITORÍA (AUDIT_LOGS)
INSERT IGNORE INTO audit_logs (id, user_id, user_role, action, target_resource, target_id, details, created_at) VALUES
  (1, 2, 'teacher', 'MARK_SOLUTION', 'forum_reply', 1, '{"threadId": 1, "replyId": 1}', NOW()),
  (2, 3, 'moderator', 'RESOLVE_REPORT', 'report', 2, '{"action": "dismiss", "targetType": "thread", "targetId": 3}', NOW());

SET FOREIGN_KEY_CHECKS = 1;
