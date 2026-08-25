// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShareNotes API',
      version: '1.0.0',
      description:
        'API REST para la plataforma de intercambio de apuntes universitarios — UniPutumayo.\n\n' +
        '**Cómo autenticarse:**\n' +
        '1. Registra un usuario en `POST /auth/register`\n' +
        '2. Inicia sesión en `POST /auth/login` y copia el `token`\n' +
        '3. Haz clic en el botón **Authorize 🔒** (arriba a la derecha)\n' +
        '4. Escribe `Bearer <tu_token>` y confirma\n\n' +
        'A partir de ese momento todas las rutas protegidas funcionarán.',
    },
    servers: [{ url: '/api', description: 'Servidor local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {

        // ── Auth ────────────────────────────────────────────────────────
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Paula Ayala' },
            email:    { type: 'string', example: 'paula@uniputumayo.edu.co' },
            password: { type: 'string', minLength: 8, example: 'MiPass123' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', example: 'paula@uniputumayo.edu.co' },
            password: { type: 'string', example: 'MiPass123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id:    { type: 'integer', example: 1 },
                name:  { type: 'string',  example: 'Paula Ayala' },
                email: { type: 'string',  example: 'paula@uniputumayo.edu.co' },
                role:  { type: 'string',  enum: ['student', 'admin'] },
              },
            },
          },
        },

        // ── Notes ───────────────────────────────────────────────────────
        Note: {
          type: 'object',
          properties: {
            id:            { type: 'integer', example: 1 },
            title:         { type: 'string',  example: 'Apuntes de Cálculo - Parcial 2' },
            description:   { type: 'string',  example: 'Resumen de integrales' },
            original_name: { type: 'string',  example: 'calculo_p2.pdf' },
            mimetype:      { type: 'string',  example: 'application/pdf' },
            file_size:     { type: 'integer', example: 204800 },
            subject_name:  { type: 'string',  example: 'Cálculo I' },
            semester:      { type: 'integer', example: 1 },
            career_name:   { type: 'string',  example: 'Ingeniería en Sistemas' },
            uploader_name: { type: 'string',  example: 'Paula Ayala' },
            created_at:    { type: 'string',  format: 'date-time' },
          },
        },
        Subject: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            name:        { type: 'string',  example: 'Cálculo I' },
            semester:    { type: 'integer', example: 1 },
            career_name: { type: 'string',  example: 'Ingeniería en Sistemas' },
          },
        },

        // ── Forum ───────────────────────────────────────────────────────
        ThreadBody: {
          type: 'object',
          required: ['title', 'body', 'subjectId'],
          properties: {
            title:     { type: 'string',  example: 'Duda sobre punteros en C' },
            body:      { type: 'string',  example: '¿Cómo se declara un doble puntero?' },
            subjectId: { type: 'integer', example: 4 },
          },
        },
        ReplyBody: {
          type: 'object',
          required: ['body'],
          properties: {
            body: { type: 'string', example: 'Un doble puntero se declara como int **p;' },
          },
        },
        ReportBody: {
          type: 'object',
          required: ['targetType', 'targetId', 'reason'],
          properties: {
            targetType: { type: 'string', enum: ['note', 'thread', 'reply'] },
            targetId:   { type: 'integer', example: 3 },
            reason:     { type: 'string',  example: 'El contenido es ofensivo' },
          },
        },

        // ── Admin ───────────────────────────────────────────────────────
        SanctionBody: {
          type: 'object',
          required: ['userId', 'type', 'reason'],
          properties: {
            userId:    { type: 'integer', example: 5 },
            type:      { type: 'string', enum: ['warning', 'temp_ban', 'perm_ban'] },
            reason:    { type: 'string', example: 'Subió contenido irrelevante' },
            expiresAt: { type: 'string', format: 'date-time', example: '2026-06-01T00:00:00Z' },
          },
        },

        // ── Común ───────────────────────────────────────────────────────
        MessageResponse: {
          type: 'object',
          properties: { message: { type: 'string', example: 'Operación exitosa' } },
        },
        ErrorResponse: {
          type: 'object',
          properties: { message: { type: 'string', example: 'Descripción del error' } },
        },
      },
    },

    // ── PATHS ──────────────────────────────────────────────────────────────────
    paths: {

      // ── /auth/register ────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['1. Autenticación'],
          summary: 'Registrar nuevo estudiante',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
          },
          responses: {
            201: { description: 'Registro exitoso',      content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
            409: { description: 'Email ya registrado',   content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse'  } } } },
          },
        },
      },

      // ── /auth/login ───────────────────────────────────────────────────
      '/auth/login': {
        post: {
          tags: ['1. Autenticación'],
          summary: 'Iniciar sesión — devuelve el JWT',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
          },
          responses: {
            200: { description: 'Login exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            401: { description: 'Credenciales incorrectas' },
            403: { description: 'Cuenta suspendida' },
          },
        },
      },

      // ── /auth/profile ─────────────────────────────────────────────────
      '/auth/profile': {
        get: {
          tags: ['1. Autenticación'],
          summary: 'Ver perfil del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Perfil del usuario' },
            401: { description: 'Token inválido o ausente' },
          },
        },
      },

      // ── /notes/subjects ───────────────────────────────────────────────
      '/notes/subjects': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Listar todas las materias disponibles',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de materias',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Subject' } } } },
            },
          },
        },
      },

      // ── /notes ────────────────────────────────────────────────────────
      '/notes': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Listar apuntes con filtros opcionales',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'subjectId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por materia' },
            { name: 'semester',  in: 'query', schema: { type: 'integer' }, description: 'Filtrar por semestre (1-8)' },
            { name: 'careerId',  in: 'query', schema: { type: 'integer' }, description: 'Filtrar por carrera' },
            { name: 'search',    in: 'query', schema: { type: 'string'  }, description: 'Buscar por título o descripción' },
          ],
          responses: {
            200: { description: 'Lista de apuntes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } } },
          },
        },
        post: {
          tags: ['2. Apuntes'],
          summary: 'Subir un apunte (PDF, JPG o PNG — máx. 100 MB)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'title', 'subjectId'],
                  properties: {
                    file:        { type: 'string', format: 'binary', description: 'Archivo PDF, JPG o PNG' },
                    title:       { type: 'string', example: 'Apuntes de Cálculo - Parcial 2' },
                    subjectId:   { type: 'integer', example: 1 },
                    description: { type: 'string', example: 'Resumen del tema 3' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Apunte subido correctamente' },
            400: { description: 'Archivo no válido o campos faltantes' },
          },
        },
      },

      // ── /notes/{id}/download ──────────────────────────────────────────
      '/notes/{id}/download': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Descargar archivo de un apunte',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Archivo descargado' },
            404: { description: 'Apunte no encontrado' },
          },
        },
      },

      // ── /notes/{id} ───────────────────────────────────────────────────
      '/notes/{id}': {
        delete: {
          tags: ['2. Apuntes'],
          summary: 'Eliminar apunte (solo el dueño o un admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Apunte eliminado' },
            403: { description: 'Sin permiso' },
            404: { description: 'No encontrado' },
          },
        },
      },

      // ── /forum ────────────────────────────────────────────────────────
      '/forum': {
        get: {
          tags: ['3. Foro'],
          summary: 'Listar hilos de discusión',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'subjectId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por materia' },
          ],
          responses: { 200: { description: 'Lista de hilos' } },
        },
        post: {
          tags: ['3. Foro'],
          summary: 'Crear un hilo de discusión',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ThreadBody' } } },
          },
          responses: {
            201: { description: 'Hilo creado' },
            404: { description: 'Materia no encontrada' },
          },
        },
      },

      // ── /forum/report ─────────────────────────────────────────────────
      '/forum/report': {
        post: {
          tags: ['3. Foro'],
          summary: 'Reportar contenido inapropiado (apunte, hilo o respuesta)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportBody' } } },
          },
          responses: { 201: { description: 'Reporte enviado' } },
        },
      },

      // ── /forum/{id} ───────────────────────────────────────────────────
      '/forum/{id}': {
        get: {
          tags: ['3. Foro'],
          summary: 'Ver un hilo con todas sus respuestas',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Hilo con respuestas' },
            404: { description: 'Hilo no encontrado' },
          },
        },
      },

      // ── /forum/{id}/reply ─────────────────────────────────────────────
      '/forum/{id}/reply': {
        post: {
          tags: ['3. Foro'],
          summary: 'Responder a un hilo',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReplyBody' } } },
          },
          responses: {
            201: { description: 'Respuesta publicada' },
            404: { description: 'Hilo no encontrado' },
          },
        },
      },

      // ── /admin/users ──────────────────────────────────────────────────
      '/admin/users': {
        get: {
          tags: ['4. Administración'],
          summary: 'Listar todos los usuarios',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Lista de usuarios' } },
        },
      },

      // ── /admin/users/{id}/toggle ──────────────────────────────────────
      '/admin/users/{id}/toggle': {
        patch: {
          tags: ['4. Administración'],
          summary: 'Suspender o reactivar un usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Estado cambiado' },
            403: { description: 'No se puede suspender a un admin' },
          },
        },
      },

      // ── /admin/reports ────────────────────────────────────────────────
      '/admin/reports': {
        get: {
          tags: ['4. Administración'],
          summary: 'Listar reportes',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'reviewed', 'dismissed'] } },
          ],
          responses: { 200: { description: 'Lista de reportes' } },
        },
      },

      // ── /admin/reports/{id} ───────────────────────────────────────────
      '/admin/reports/{id}': {
        patch: {
          tags: ['4. Administración'],
          summary: 'Resolver un reporte (revisado o descartado)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', enum: ['reviewed', 'dismissed'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Reporte resuelto' } },
        },
      },

      // ── /admin/notes/{id} ─────────────────────────────────────────────
      '/admin/notes/{id}': {
        delete: {
          tags: ['4. Administración'],
          summary: 'Eliminar apunte como administrador',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Apunte eliminado' } },
        },
      },

      // ── /admin/threads/{id} ───────────────────────────────────────────
      '/admin/threads/{id}': {
        delete: {
          tags: ['4. Administración'],
          summary: 'Eliminar hilo del foro como administrador',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Hilo eliminado' } },
        },
      },

      // ── /admin/replies/{id} ───────────────────────────────────────────
      '/admin/replies/{id}': {
        delete: {
          tags: ['4. Administración'],
          summary: 'Eliminar respuesta del foro como administrador',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Respuesta eliminada' } },
        },
      },

      // ── /admin/sanctions ─────────────────────────────────────────────
      '/admin/sanctions': {
        get: {
          tags: ['4. Administración'],
          summary: 'Listar sanciones (query: ?userId=5)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por usuario' },
          ],
          responses: { 200: { description: 'Lista de sanciones' } },
        },
        post: {
          tags: ['4. Administración'],
          summary: 'Aplicar sanción a un usuario',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SanctionBody' } } },
          },
          responses: {
            201: { description: 'Sanción aplicada' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },

      // ── /admin/qr ─────────────────────────────────────────────────────
      '/admin/qr': {
        get: {
          tags: ['4. Administración'],
          summary: 'Generar código QR de acceso a la plataforma',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'QR en formato base64',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { qr: { type: 'string', description: 'Data URL base64 del QR' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
