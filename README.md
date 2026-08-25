## Integrantes:
- Ana Milena Zuñiga
- Aura Camila Arteaga Castillo
- Jhonatan Mauricio Muchavisoy Jajoy
-Andres Botina
##


# 📚 ShareNotes — Plataforma Universitaria de Apuntes & Comunidad

![CI Status](https://img.shields.io/github/actions/workflow/status/Sharet-Notes-proyecto3/Share-Notes/ci.yml?branch=main&label=CI%20Pipeline)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange)

**ShareNotes** es una plataforma colaborativa integral para estudiantes y docentes universitarios diseñada para compartir apuntes, interactuar en foros de estudio por materias, generar reportes PDF y recibir notificaciones automáticas por correo electrónico.

---

## 🏛️ Arquitectura del Sistema (Monorepo)

El repositorio está estructurado en módulos desacoplados y microservicios:

```text
Share-Notes/
├── .github/workflows/       # Pipeline de Integración Continua (GitHub Actions)
├── backend/                 # API REST Principal (Express + TypeScript + MySQL)
│   ├── src/
│   │   ├── config/          # Conexión MySQL, migraciones y Swagger
│   │   ├── controllers/     # Controladores de Auth, Notes, Forum, Admin, Reports
│   │   ├── middlewares/     # Auth JWT, validación de roles, upload multer, errores
│   │   ├── routes/          # Rutas REST de la API
│   │   ├── services/        # Lógica de negocio y llamadas a microservicios
│   │   └── __tests__/       # 44 pruebas unitarias (Jest + ts-jest)
│   └── .env.example         # Plantilla de variables de entorno
├── frontend/                # Aplicación Web SPA (React + Vite + Tailwind/CSS)
│   ├── src/
│   │   ├── components/      # Foro interactivo, Panel de administración, etc.
│   │   ├── App.jsx          # Vistas principales, autenticación, visor de apuntes
│   │   └── index.css        # Sistema de estilos y animaciones
│   └── vite.config.js
├── ms-pdf/                  # Microservicio de Generación de Reportes PDF (Port 4001)
│   └── src/index.js         # Endpoint /generate-report con PDFKit
├── ms-email/                # Microservicio de Notificaciones por Correo (Port 4002)
│   ├── src/index.js         # Endpoint /notify con Nodemailer + plantillas HTML
│   └── .env.example         # Configuración SMTP
└── start-all.ps1            # Script de inicio rápido de todos los servicios en Windows
```

---

## ✨ Funcionalidades Principales

1. **🔐 Autenticación & Control de Acceso (RBAC):**
   - Registro e inicio de sesión con JWT y contraseñas hasheadas (`bcryptjs`).
   - 4 niveles de roles: `Estudiante`, `Docente`, `Moderador` y `Administrador`.
2. **📝 Gestión de Apuntes & Códigos QR:**
   - Carga y visualización de archivos PDF e imágenes (JPG/PNG).
   - Generación automática de código QR único por apunte para compartir rápidamente en móviles.
   - Búsqueda en tiempo real por materia, título o autor.
3. **💬 Foro de Preguntas y Discusión:**
   - Creación de hilos de discusión por materias.
   - Respuestas anidadas y sistema de votación de utilidad ("voto útil").
4. **🛡️ Panel de Administración y Moderación:**
   - Lista y filtrado de usuarios con capacidad de suspender/reactivar y cambiar roles en vivo.
   - Gestión y resolución de reportes de contenido.
5. **🔌 Microservicios Asíncronos:**
   - **MS-PDF (4001):** Exportación de reportes resumidos de apuntes y actividad.
   - **MS-Email (4002):** Envío automático de correos con formato HTML al publicar nuevo contenido.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Requisitos Previos
- **Node.js** v20 o superior
- **MySQL Server** (ej. mediante XAMPP, Docker o servicio local en el puerto `3306`)

---

### 2. Configurar Variables de Entorno

Copia los archivos de ejemplo y configura tus credenciales locales:

```bash
# En backend
cp backend/.env.example backend/.env

# En ms-email
cp ms-email/.env.example ms-email/.env
```

---

### 3. Migrar la Base de Datos

Asegúrate de que tu servicio MySQL esté corriendo y ejecuta la migración para crear las tablas necesarias:

```bash
cd backend
npm install
npm run db:migrate
```

---

### 4. Iniciar Todos los Servicios

#### Opción A: Script de un solo comando (Recomendado en Windows)
En la raíz del proyecto ejecuta:
```powershell
.\start-all.ps1
```

#### Opción B: Iniciar manualmente en terminales separadas

- **Terminal 1 — Backend (Puerto 3000):**
  ```bash
  cd backend
  npm install
  npm run dev
  ```

- **Terminal 2 — Frontend (Puerto 5173):**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

- **Terminal 3 — Microservicio PDF (Puerto 4001):**
  ```bash
  cd ms-pdf
  npm install
  npm run dev
  ```

- **Terminal 4 — Microservicio Email (Puerto 4002):**
  ```bash
  cd ms-email
  npm install
  npm run dev
  ```

---

## 📖 Documentación Interactiva de la API (Swagger UI)

Con el backend en ejecución, accede a la especificación completa e interactiva de endpoints:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 🧪 Pruebas Unitarias y Calidad (CI/CD)

El proyecto incluye una suite de **44 pruebas unitarias** con Jest que validan controladores, modelos, validaciones y lógica de negocio.

Para ejecutar las pruebas localmente:
```bash
cd backend
npm test
```

Cada `push` o `pull request` en la rama `main` dispara automáticamente el pipeline de **GitHub Actions** (`ci.yml`), verificando:
- ✅ Compilación estricta de TypeScript (`npx tsc --noEmit`)
- 🧪 Ejecución y pase de pruebas unitarias (`npm test`)
- 🔌 Verificación del arranque de los microservicios (`ms-email`, `ms-pdf`)
- ⚛️ Compilación y build del frontend (`npm run build`)
