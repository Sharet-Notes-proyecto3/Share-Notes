# 👥 Guía de Distribución de Clases y Módulos del Frontend (4 Integrantes)

Para el desarrollo colaborativo sin conflictos, el frontend de **ShareNotes** ha sido dividido en **4 capas/módulos independientes**. Cada integrante es dueño de su respectivo servicio HTTP y sus componentes visuales.

---

## 📋 Mapeo General de Integrantes

| Integrante | Módulo / Responsabilidad | Carpeta de Componentes | Servicio HTTP Asociado | Endpoints de Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Integrante 1** | 🔐 **Autenticación, Sesión y Perfil** | `src/components/auth/` | `src/services/auth.service.js` | `/api/auth/login`<br>`/api/auth/register`<br>`/api/auth/profile` |
| **Integrante 2** | 📚 **Apuntes, Archivos, QR y Reportes PDF** | `src/components/notes/` | `src/services/notes.service.js` | `/api/notes`<br>`/api/notes/subjects`<br>`/api/notes/report`<br>`/api/notes/:id/qr` |
| **Integrante 3** | 💬 **Foro Académico, Hilos y Votaciones** | `src/components/forum/` | `src/services/forum.service.js` | `/api/forum/threads`<br>`/api/forum/threads/:id`<br>`/api/forum/threads/:id/replies`<br>`/api/forum/replies/:id/vote` |
| **Integrante 4** | 🛡️ **Panel de Administración, Roles y API Base** | `src/components/admin/` | `src/services/admin.service.js`<br>`src/services/api.js` | `/api/admin/users`<br>`/api/admin/users/:id/toggle`<br>`/api/admin/users/:id/role`<br>`/api/admin/reports` |

---

## 🛠️ Detalle de Archivos por Integrante

### 🧑‍💻 Integrante 1 — Autenticación, Sesión y Perfil
- **Archivos a modificar:**
  - `src/services/auth.service.js`: Contiene las llamadas `login`, `register` y `getProfile`.
  - `src/context/AuthContext.jsx`: Maneja el token en `localStorage`, roles (`isAdmin`, `isModerator`, `isTeacher`, `isStudent`) y la sesión activa.
  - `src/components/auth/AuthModal.jsx`: Pantalla interactiva de Login / Registro con validaciones de correo y contraseña (mínimo 8 caracteres).
  - `src/components/auth/UserMenu.jsx`: Menú superior con avatar del usuario, insignia del rol y botón de cierre de sesión.

---

### 🧑‍💻 Integrante 2 — Apuntes, Carga Multimedia, Códigos QR y PDF
- **Archivos a modificar:**
  - `src/services/notes.service.js`: Conexión con `getNotes`, `getSubjects`, `uploadNote`, `downloadNotesReport` y `getNoteQR`.
  - `src/components/notes/NotesGrid.jsx`: Grid principal con barra de búsqueda en tiempo real, filtro por materia y botones de acción.
  - `src/components/notes/NoteCard.jsx`: Tarjeta del apunte con enlace de descarga directa y botón para abrir el código QR.
  - `src/components/notes/UploadModal.jsx`: Modal multipart con validación de tipo (`.pdf`, `.jpg`, `.png`) y límite de 100MB.
  - `src/components/notes/QRModal.jsx`: Modal para visualizar y escanear el código QR en dispositivos móviles.

---

### 🧑‍💻 Integrante 3 — Foro de Discusión y Votaciones
- **Archivos a modificar:**
  - `src/services/forum.service.js`: Conexión con `getThreads`, `getThreadDetails`, `createThread`, `addReply` y `voteReply`.
  - `src/components/forum/ForumView.jsx`: Vista general del foro con selector de materias y botón de nuevo debate.
  - `src/components/forum/ThreadCard.jsx`: Tarjeta del debate con visualización desplegable de respuestas, caja para responder y botón de "Útil".
  - `src/components/forum/NewThreadModal.jsx`: Modal para publicar una nueva duda o tema académico.

---

### 🧑‍💻 Integrante 4 — Administración, Moderación y Cliente Base
- **Archivos a modificar:**
  - `src/services/api.js`: Cliente HTTP centralizado que inyecta automáticamente el token JWT y maneja respuestas binarias y JSON.
  - `src/services/admin.service.js`: Conexión con `getUsers`, `toggleUserStatus`, `changeUserRole`, `getReports` y `resolveReport`.
  - `src/components/admin/AdminView.jsx`: Tablero con métricas clave (usuarios activos, reportes pendientes) y selector de pestañas.
  - `src/components/admin/UsersTable.jsx`: Tabla interactiva con cambio dinámico de rol en vivo y suspensión/reactivación.
  - `src/components/admin/ReportsTable.jsx`: Bandeja de moderación para resolver o descartar reportes de contenido.

---

## 🚀 ¿Cómo probar los cambios localmente?
1. En la raíz del proyecto, ejecuta:
   ```powershell
   .\start-all.ps1
   ```
2. Abre tu navegador en **http://localhost:5173**
3. Cada integrante puede hacer cambios en su carpeta respectiva y Vite actualizará la pantalla automáticamente (HMR).
