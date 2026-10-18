# ShareNotes — Backend API

Backend REST para la plataforma de intercambio de apuntes universitarios.  
**Stack:** Node.js · TypeScript · Express · MySQL · JWT

---

## Requisitos previos

- Node.js 18 o superior
- MySQL 8 o MariaDB 10.6+
- npm 9+

---

## Instalación paso a paso

### 1. Clonar e instalar dependencias
```bash
cd sharenotes-backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```
Editar `.env` con los datos reales:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sharenotes
JWT_SECRET=un_secreto_muy_largo_y_seguro_aqui
```

### 3. Crear la base de datos en MySQL
```sql
CREATE DATABASE sharenotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Ejecutar migraciones (crea todas las tablas)
```bash
npm run db:migrate
```

### 5. Arrancar en modo desarrollo
```bash
npm run dev
```

El servidor queda disponible en `http://localhost:3000/api`

### Verificar que funciona
```bash
curl http://localhost:3000/api/health
```

### Perfil de usuario

El nombre y la URL de la foto de perfil se guardan en la base de datos. Las
fotos JPG, PNG y WEBP (máximo 5 MB) se guardan en
`UPLOAD_DIR/profile-photos` y se sirven desde `/uploads/profile-photos`.
En producción, configura `UPLOAD_DIR` en almacenamiento persistente compartido
para que la foto siga disponible tras reinicios y sea visible para todos los
clientes conectados a este backend. Los archivos subidos no se incluyen en Git.
La migración crea al moderador de prueba con el nombre `Moderador`.

---

## Estructura del proyecto

```
src/
├── config/
│   ├── database.ts       # Pool de conexiones MySQL
│   └── migrate.ts        # Script de creación de tablas
├── controllers/
│   ├── auth.controller.ts
│   ├── note.controller.ts
│   ├── forum.controller.ts
│   └── admin.controller.ts
├── middlewares/
│   ├── auth.middleware.ts    # Verificación JWT + guards de rol
│   ├── error.middleware.ts   # Manejo global de errores
│   └── upload.middleware.ts  # Multer (subida de archivos)
├── routes/
│   ├── auth.routes.ts
│   ├── note.routes.ts
│   ├── forum.routes.ts
│   └── admin.routes.ts
├── services/
│   ├── auth.service.ts       # bcrypt, JWT, login/registro
│   ├── note.service.ts       # Gestión de archivos
│   ├── forum.service.ts      # Hilos y respuestas
│   └── admin.service.ts      # Panel de control, QR
├── types/
│   └── index.ts              # Tipos TypeScript globales
└── index.ts                  # Punto de entrada Express
```

---

## Endpoints de la API

### Autenticación `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | No | Registrar nuevo estudiante |
| POST | `/login` | No | Iniciar sesión, devuelve JWT |
| GET | `/profile` | Sí | Ver perfil del usuario autenticado |
| PATCH | `/profile` | Sí | Actualizar el nombre del usuario autenticado |
| POST | `/profile/photo` | Sí | Subir o reemplazar foto (`photo`, JPG/PNG/WEBP, máx. 5 MB) |
| DELETE | `/profile/photo` | Sí | Quitar la foto del usuario autenticado |

**Registro** `POST /api/auth/register`
```json
{
  "name": "Juan Pérez",
  "email": "juan@uniputumayo.edu.co",
  "password": "miPassword123"
}
```

**Login** `POST /api/auth/login`
```json
{ "email": "juan@uniputumayo.edu.co", "password": "miPassword123" }
```
Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": { "id": 1, "name": "Juan Pérez", "email": "...", "role": "student" }
}
```

---

### Apuntes `/api/notes`
> Todas las rutas requieren: `Authorization: Bearer <token>`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/subjects` | Listar todas las materias |
| GET | `/` | Listar apuntes (con filtros) |
| POST | `/` | Subir un apunte |
| GET | `/:id/download` | Descargar archivo |
| DELETE | `/:id` | Eliminar apunte (dueño o admin) |

**Filtros disponibles** `GET /api/notes?semester=3&search=calculo`
- `subjectId` — filtrar por materia
- `semester` — filtrar por semestre
- `careerId` — filtrar por carrera
- `search` — búsqueda por título o descripción

**Subir apunte** `POST /api/notes` (form-data)
```
file        → archivo PDF, JPG o PNG (máx. 10 MB)
title       → "Apuntes de Cálculo - Tema 3"
subjectId   → 1
description → "Resumen del parcial" (opcional)
```

---

### Foro `/api/forum`
> Todas las rutas requieren: `Authorization: Bearer <token>`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar hilos (`?subjectId=1`) |
| POST | `/` | Crear hilo |
| GET | `/:id` | Ver hilo con respuestas |
| POST | `/:id/reply` | Responder a un hilo |
| POST | `/report` | Reportar contenido |

**Crear hilo** `POST /api/forum`
```json
{ "title": "Duda sobre punteros", "body": "¿Cómo funciona...?", "subjectId": 4 }
```

**Reportar** `POST /api/forum/report`
```json
{ "targetType": "thread", "targetId": 5, "reason": "Contenido ofensivo" }
```
`targetType` puede ser: `note`, `thread`, `reply`

---

### Administración `/api/admin`
> Requiere token con `role: "admin"`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users` | Listar todos los usuarios |
| PATCH | `/users/:id/toggle` | Suspender / reactivar usuario |
| GET | `/reports` | Listar reportes (`?status=pending`) |
| PATCH | `/reports/:id` | Resolver reporte |
| DELETE | `/notes/:id` | Eliminar apunte |
| DELETE | `/threads/:id` | Eliminar hilo del foro |
| DELETE | `/replies/:id` | Eliminar respuesta del foro |
| GET | `/sanctions` | Listar sanciones (`?userId=5`) |
| POST | `/sanctions` | Aplicar sanción |
| GET | `/qr` | Generar QR de la plataforma |

**Aplicar sanción** `POST /api/admin/sanctions`
```json
{
  "userId": 3,
  "type": "temp_ban",
  "reason": "Subió contenido irrelevante",
  "expiresAt": "2026-05-01T00:00:00Z"
}
```
Tipos de sanción: `warning` · `temp_ban` · `perm_ban`

**Crear primer admin** (directamente en MySQL):
```sql
UPDATE users SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';
```

---

## Seguridad implementada

- Contraseñas hasheadas con **bcrypt** (salt rounds: 12)
- Tokens **JWT** con expiración configurable
- **Helmet** — cabeceras HTTP seguras
- **CORS** configurado por entorno
- **Rate limiting** — 100 req/15min global, 10 req/15min en login
- Rutas protegidas por rol (`student` / `admin`)
- Validación de tipo y tamaño de archivos (multer)
- Soft delete — nada se borra físicamente de la DB

---

## Distribución de tareas (equipo)

| Integrante | Rol | Lo que usa de este backend |
|---|---|---|
| Paula Ayala | Frontend | Consume todos los endpoints con fetch/axios |
| Yhan Moreno | Backend | Este repositorio es su responsabilidad principal |
| Jhonatan Muchavisoy | BD y Seguridad | `migrate.ts`, `database.ts`, middlewares de auth |
| Ana Solarte | Docs y Pruebas | README, probar endpoints con Postman/Insomnia |
