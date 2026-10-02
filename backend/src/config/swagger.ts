// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShareNotes API',
      version: '1.0.0',
      description:
        'API REST para la plataforma universitaria de intercambio de apuntes y comunidad académica — ShareNotes.\n\n' +
        '**Instrucciones de Autenticación:**\n' +
        '1. Registra un usuario en `POST /auth/register` o inicia sesión en `POST /auth/login`\n' +
        '2. Copia el `token` JWT recibido\n' +
        '3. Haz clic en **Authorize 🔒** (arriba a la derecha)\n' +
        '4. Ingresa `Bearer <tu_token>` y confirma.\n\n' +
        'Todas las rutas protegidas por RBAC y ABAC validarán el token automáticamente.',
    },
    servers: [{ url: '/api', description: 'Servidor API ShareNotes' }],
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
          required: ['name', 'email', 'password', 'programType', 'semester'],
          properties: {
            name:        { type: 'string', example: 'Paula Ayala' },
            email:       { type: 'string', example: 'paula@uniputumayo.edu.co' },
            password:    { type: 'string', minLength: 8, example: 'MiPass123' },
            role:        { type: 'string', enum: ['student'], example: 'student', description: 'El registro público asigna automáticamente el rol student. Las cuentas docentes o administrativas son gestionadas por un administrador.' },
            programType: { type: 'string', enum: ['tecnologo', 'ingenieria'], example: 'tecnologo', description: 'Requerido (tecnologo: semestres 1-6, ingenieria: semestres 7-10)' },
            semester:    { type: 'integer', minimum: 1, maximum: 10, example: 3, description: 'Semestre acorde al tipo de programa' },
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
                role:  { type: 'string',  enum: ['student', 'teacher', 'moderator', 'admin'] },
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
            description:   { type: 'string',  example: 'Resumen de integrales y series' },
            original_name: { type: 'string',  example: 'calculo_p2.pdf' },
            mimetype:      { type: 'string',  example: 'application/pdf' },
            file_size:     { type: 'integer', example: 204800 },
            subject_name:  { type: 'string',  example: 'Cálculo I' },
            semester:      { type: 'integer', example: 1 },
            career_name:   { type: 'string',  example: 'Ingeniería en Sistemas' },
            uploader_name: { type: 'string',  example: 'Paula Ayala' },
            verified:      { type: 'boolean', example: true },
            verified_by:   { type: 'integer', nullable: true, example: 3 },
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
            body:      { type: 'string',  example: '¿Cómo se declara un doble puntero en C?' },
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
            targetType: { type: 'string', enum: ['note', 'thread', 'reply'], example: 'note' },
            targetId:   { type: 'integer', example: 3 },
            reason:     { type: 'string',  example: 'Contenido inapropiado o spam' },
          },
        },

        // ── Admin & Catalog ─────────────────────────────────────────────
        SanctionBody: {
          type: 'object',
          required: ['userId', 'type', 'reason'],
          properties: {
            userId:    { type: 'integer', example: 5 },
            type:      { type: 'string', enum: ['warning', 'temp_ban', 'perm_ban'] },
            reason:    { type: 'string', example: 'Subió contenido inapropiado reiteradamente' },
            expiresAt: { type: 'string', format: 'date-time', example: '2026-06-01T00:00:00Z' },
          },
        },
        CareerBody: {
          type: 'object',
          required: ['name'],
          properties: {
            name:        { type: 'string', example: 'Ingeniería en Sistemas' },
            description: { type: 'string', example: 'Facultad de Ingeniería' },
          },
        },
        SubjectBody: {
          type: 'object',
          required: ['name', 'semester', 'careerId'],
          properties: {
            name:     { type: 'string', example: 'Estructuras de Datos' },
            semester: { type: 'integer', minimum: 1, maximum: 10, example: 3 },
            careerId: { type: 'integer', example: 1 },
          },
        },
        ChangeRoleBody: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['student', 'teacher', 'moderator', 'admin'], example: 'teacher' },
          },
        },
        CourseReportBody: {
          type: 'object',
          required: ['subjectId'],
          properties: {
            subjectId: { type: 'integer', example: 1 },
          },
        },
        ModerateStatusBody: {
          type: 'object',
          required: ['moderationStatus'],
          properties: {
            moderationStatus: { type: 'string', enum: ['visible', 'hidden', 'blocked'], example: 'hidden' },
            reason: { type: 'string', example: 'Contenido desactualizado o que infringe normas comunitarias' },
          },
        },
        RestrictUserBody: {
          type: 'object',
          properties: {
            days: { type: 'integer', minimum: 1, example: 7 },
            restrictedUntil: { type: 'string', format: 'date-time', example: '2026-10-15T00:00:00.000Z' },
            reason: { type: 'string', example: 'Infracción reiterada de normas de convivencia en foros' },
          },
        },
        PermissionsResponse: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['student', 'teacher', 'moderator', 'admin'], example: 'student' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['notes:upload', 'notes:download', 'notes:search', 'reports:create'],
            },
          },
        },

        CreateStaffUserBody: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string', example: 'Prof. Carlos Delgado' },
            email: { type: 'string', example: 'carlos.delgado@uniputumayo.edu.co' },
            password: { type: 'string', minLength: 8, maxLength: 72, example: 'Docente2026!' },
            role: { type: 'string', enum: ['teacher', 'moderator'], example: 'teacher' },
            subjectIds: {
              type: 'array',
              items: { type: 'integer' },
              example: [1, 2],
              description: 'IDs de las materias asignadas (solo para docente)',
            },
          },
        },
        UpdateTeacherCoursesBody: {
          type: 'object',
          required: ['subjectIds'],
          properties: {
            subjectIds: {
              type: 'array',
              items: { type: 'integer' },
              example: [1, 2, 5],
              description: 'Lista de IDs de materias asignadas al docente',
            },
          },
        },

        // ── Común ───────────────────────────────────────────────────────
        MessageResponse: {
          type: 'object',
          properties: {
            message:       { type: 'string', example: 'Operación exitosa' },
            correlationId: { type: 'string', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message:       { type: 'string', example: 'Descripción detallada del error' },
            correlationId: { type: 'string', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          },
        },
      },
    },

    // ── PATHS ──────────────────────────────────────────────────────────────────
    paths: {
      // ════════════════════════════════════════════════════════════════════════
      // 1. AUTENTICACIÓN
      // ════════════════════════════════════════════════════════════════════════
      '/auth/register': {
        post: {
          tags: ['1. Autenticación'],
          summary: 'Registrar nuevo usuario',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
          },
          responses: {
            201: { description: 'Registro exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
            400: { description: 'Campos requeridos faltantes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            409: { description: 'Email ya registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['1. Autenticación'],
          summary: 'Iniciar sesión — devuelve el token JWT',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
          },
          responses: {
            200: { description: 'Login exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            400: { description: 'Credenciales incompletas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'Credenciales incorrectas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            403: { description: 'Cuenta suspendida', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/profile': {
        get: {
          tags: ['1. Autenticación'],
          summary: 'Ver perfil del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Perfil del usuario' },
            401: { description: 'Token inválido o ausente', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/profile/related-topic': {
        get: {
          tags: ['1. Autenticación'],
          summary: 'Obtener artículo de Wikipedia relacionado con un tema (API Externa)',
          parameters: [
            {
              name: 'tema',
              in: 'query',
              schema: { type: 'string' },
              example: 'desarrollo de software',
              description: 'Tema o carrera para buscar en Wikipedia',
            },
          ],
          responses: {
            200: { description: 'Artículo encontrado' },
            400: { description: 'Parámetro de búsqueda inválido' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // 2. APUNTES
      // ════════════════════════════════════════════════════════════════════════
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
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/notes': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Listar apuntes con filtros opcionales',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'subjectId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por materia' },
            { name: 'semester',  in: 'query', schema: { type: 'integer' }, description: 'Filtrar por semestre (1-10)' },
            { name: 'careerId',  in: 'query', schema: { type: 'integer' }, description: 'Filtrar por carrera' },
            { name: 'search',    in: 'query', schema: { type: 'string'  }, description: 'Buscar por título o descripción' },
          ],
          responses: {
            200: {
              description: 'Lista de apuntes encontrados',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } },
            },
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        post: {
          tags: ['2. Apuntes'],
          summary: 'Subir un nuevo apunte (PDF, JPG o PNG — máx. 25 MB)',
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
                    description: { type: 'string', example: 'Resumen detallado de integrales' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Apunte subido correctamente', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
            400: { description: 'Archivo no válido o campos faltantes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            404: { description: 'Materia no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/notes/report': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Generar reporte PDF de mis propios apuntes vía microservicio MS-PDF',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Archivo PDF con el reporte compilado',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            503: { description: 'Microservicio MS-PDF no disponible temporalmente', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/notes/microservices/status': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Consultar estado de conectividad con los microservicios (MS-PDF y MS-Email)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Estado de disponibilidad de los microservicios',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Estado de los microservicios' },
                      services: {
                        type: 'object',
                        properties: {
                          'ms-pdf': { type: 'string', example: '🟢 Activo' },
                          'ms-email': { type: 'string', example: '🟢 Activo' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/notes/{id}/download': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Descargar archivo de un apunte',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Archivo descargado exitosamente con Content-Disposition' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            404: { description: 'Apunte o archivo no encontrado' },
          },
        },
      },
      '/notes/{id}/qr': {
        get: {
          tags: ['2. Apuntes'],
          summary: 'Generar código QR para compartir y descargar un apunte',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: {
              description: 'Código QR generado en formato Data URL Base64',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      qrCodeDataUrl: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgo...' },
                      downloadUrl:   { type: 'string', example: 'http://localhost:3000/api/notes/1/download' },
                      noteTitle:     { type: 'string', example: 'Apuntes de Cálculo' },
                    },
                  },
                },
              },
            },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            404: { description: 'Apunte no encontrado' },
          },
        },
      },
      '/notes/{id}/verify': {
        put: {
          tags: ['2. Apuntes', '5. Panel Docente'],
          summary: 'Verificar apunte como recurso oficial (docente asignado o admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: {
              description: 'Apunte verificado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message:    { type: 'string', example: 'Apunte verificado como recurso oficial exitosamente' },
                      noteId:     { type: 'integer', example: 1 },
                      verified:   { type: 'boolean', example: true },
                      verifiedBy: { type: 'integer', example: 2 },
                    },
                  },
                },
              },
            },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere ser docente asignado a la materia o admin' },
            404: { description: 'Apunte no encontrado' },
          },
        },
      },
      '/notes/{id}': {
        delete: {
          tags: ['2. Apuntes'],
          summary: 'Eliminar apunte (dueño del apunte, moderador o admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Apunte eliminado correctamente' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Sin permiso para eliminar este apunte' },
            404: { description: 'Apunte no encontrado' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // 3. FORO ACADÉMICO
      // ════════════════════════════════════════════════════════════════════════
      '/forum': {
        get: {
          tags: ['3. Foro'],
          summary: 'Listar hilos de discusión',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'subjectId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por materia' },
          ],
          responses: {
            200: { description: 'Lista de hilos de discusión' },
            401: { description: 'No autenticado' },
          },
        },
        post: {
          tags: ['3. Foro'],
          summary: 'Crear un nuevo hilo de discusión',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ThreadBody' } } },
          },
          responses: {
            201: { description: 'Hilo creado exitosamente' },
            400: { description: 'Campos requeridos faltantes' },
            401: { description: 'No autenticado' },
            403: { description: 'Usuario restringido temporalmente en el foro' },
            404: { description: 'Materia no encontrada' },
          },
        },
      },
      '/forum/report': {
        post: {
          tags: ['3. Foro'],
          summary: 'Reportar o denunciar contenido inapropiado (apunte, hilo o respuesta)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportBody' } } },
          },
          responses: {
            201: { description: 'Denuncia registrada exitosamente' },
            400: { description: 'Campos requeridos faltantes' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/forum/{id}': {
        get: {
          tags: ['3. Foro'],
          summary: 'Ver un hilo con todas sus respuestas',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Detalle del hilo y respuestas' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            404: { description: 'Hilo no encontrado' },
          },
        },
      },
      '/forum/{id}/reply': {
        post: {
          tags: ['3. Foro'],
          summary: 'Publicar una respuesta en un hilo de discusión',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReplyBody' } } },
          },
          responses: {
            201: { description: 'Respuesta publicada exitosamente' },
            400: { description: 'Texto de respuesta requerido' },
            401: { description: 'No autenticado' },
            403: { description: 'Hilo cerrado por el docente o usuario restringido' },
            404: { description: 'Hilo no encontrado' },
          },
        },
      },
      '/forum/answers/{id}/mark-solution': {
        put: {
          tags: ['3. Foro', '5. Panel Docente'],
          summary: 'Marcar respuesta como solución verificada por docente (docente asignado o admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Respuesta marcada como solución exitosamente' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Solo el docente asignado o admin puede certificar soluciones' },
            404: { description: 'Respuesta no encontrada' },
          },
        },
      },
      '/forum/posts/{id}/close': {
        post: {
          tags: ['3. Foro', '5. Panel Docente'],
          summary: 'Cerrar hilo de debate (docente asignado o admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Hilo de discusión cerrado exitosamente' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Solo el docente asignado o admin puede cerrar hilos' },
            404: { description: 'Hilo no encontrado' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // 4. PANEL DOCENTE
      // ════════════════════════════════════════════════════════════════════════
      '/teacher/courses': {
        get: {
          tags: ['5. Panel Docente'],
          summary: 'Listar materias asignadas al docente autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de materias asignadas' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol teacher o admin' },
          },
        },
      },
      '/reports/pdf/course': {
        post: {
          tags: ['5. Panel Docente'],
          summary: 'Generar reporte PDF analítico del curso asignado vía MS-PDF',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CourseReportBody' } } },
          },
          responses: {
            200: {
              description: 'Reporte analítico generado en PDF',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            400: { description: 'ID de asignatura requerido' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: no es docente asignado a esta materia' },
            404: { description: 'Asignatura no encontrada' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // 5. MODERACIÓN DE CONTENIDOS Y DENUNCIAS
      // ════════════════════════════════════════════════════════════════════════
      '/reports': {
        get: {
          tags: ['6. Moderación'],
          summary: 'Listar denuncias recibidas con filtros (moderador o admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'resolved', 'dismissed'] } },
          ],
          responses: {
            200: { description: 'Lista de denuncias' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol moderator o admin' },
          },
        },
      },
      '/reports/{id}/resolve': {
        put: {
          tags: ['6. Moderación'],
          summary: 'Marcar denuncia como atendida/resuelta',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Denuncia marcada como atendida exitosamente' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol moderator o admin' },
            404: { description: 'Denuncia no encontrada' },
          },
        },
      },
      '/reports/{id}/dismiss': {
        put: {
          tags: ['6. Moderación'],
          summary: 'Descartar denuncia sin acción posterior',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Denuncia descartada exitosamente' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol moderator o admin' },
            404: { description: 'Denuncia no encontrada' },
          },
        },
      },
      '/notes/{id}/moderate-status': {
        put: {
          tags: ['6. Moderación'],
          summary: 'Cambiar estado de moderación de apunte (visible, hidden, blocked)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ModerateStatusBody' } } },
          },
          responses: {
            200: { description: 'Estado de moderación del apunte actualizado' },
            400: { description: 'moderationStatus debe ser visible, hidden o blocked' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere permiso notes:moderate_status' },
            404: { description: 'Apunte no encontrado' },
          },
        },
      },
      '/forum/posts/{id}/moderate': {
        delete: {
          tags: ['6. Moderación'],
          summary: 'Eliminar publicación o hilo infractor del foro por moderación',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Publicación eliminada por moderación' },
            400: { description: 'ID inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol moderator o admin' },
            404: { description: 'Publicación no encontrada' },
          },
        },
      },
      '/users/{id}/restrict': {
        put: {
          tags: ['6. Moderación'],
          summary: 'Aplicar restricción temporal de participación en el foro a un usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: false,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RestrictUserBody' } } },
          },
          responses: {
            200: { description: 'Restricción aplicada al usuario exitosamente' },
            400: { description: 'ID de usuario o parámetros de restricción inválidos' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere permiso users:restrict' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      '/moderation/logs': {
        get: {
          tags: ['6. Moderación'],
          summary: 'Consultar logs e historial de auditoría de moderación',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Historial de registros de moderación' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol moderator o admin' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // 6. ADMINISTRACIÓN Y CONTROL
      // ════════════════════════════════════════════════════════════════════════
      '/admin/users': {
        get: {
          tags: ['4. Administración'],
          summary: 'Listar todos los usuarios registrados',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista completa de usuarios' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol admin' },
          },
        },
        post: {
          tags: ['4. Administración'],
          summary: 'Crear cuenta de personal (docente o moderador) (requiere users:create)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStaffUserBody' } } },
          },
          responses: {
            201: { description: 'Cuenta de personal creada exitosamente' },
            400: { description: 'Datos inválidos o materias inexistentes' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere permiso users:create' },
            409: { description: 'El correo electrónico ya está registrado' },
          },
        },
      },
      '/admin/users/{id}/toggle': {
        patch: {
          tags: ['4. Administración'],
          summary: 'Suspender o reactivar usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Estado del usuario modificado exitosamente' },
            400: { description: 'No puedes suspenderte a ti mismo' },
            401: { description: 'No autenticado' },
            403: { description: 'No puedes suspender otro administrador' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      '/admin/users/{id}/role': {
        patch: {
          tags: ['4. Administración'],
          summary: 'Cambiar rol de usuario en vivo (Fuente única de verdad)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangeRoleBody' } } },
          },
          responses: {
            200: { description: 'Rol actualizado exitosamente' },
            400: { description: 'Rol inválido o intento de auto-degradación' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere rol admin' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      '/admin/users/{id}/courses': {
        patch: {
          tags: ['4. Administración'],
          summary: 'Asignar o actualizar materias a un docente (requiere users:assign_courses)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTeacherCoursesBody' } } },
          },
          responses: {
            200: { description: 'Materias asignadas actualizadas exitosamente' },
            400: { description: 'Datos inválidos o el usuario no es docente' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere permiso users:assign_courses' },
            404: { description: 'Docente no encontrado' },
          },
        },
      },
      '/admin/reports': {
        get: {
          tags: ['4. Administración'],
          summary: 'Listar reportes administrativos (query: ?status=pending)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'resolved', 'dismissed', 'reviewed'] } },
          ],
          responses: {
            200: { description: 'Lista de reportes' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
          },
        },
      },
      '/admin/reports/{id}': {
        patch: {
          tags: ['4. Administración'],
          summary: 'Resolver reporte administrativo (resolved | dismissed)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: { status: { type: 'string', enum: ['resolved', 'dismissed', 'reviewed'] } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Reporte resuelto exitosamente' },
            400: { description: 'Estado inválido' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Reporte no encontrado' },
          },
        },
      },
      '/admin/notes/{id}': {
        delete: {
          tags: ['4. Administración'],
          summary: 'Eliminar apunte con privilegios de administrador',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Apunte eliminado exitosamente' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Apunte no encontrado' },
          },
        },
      },
      '/admin/threads/{id}': {
        delete: {
          tags: ['4. Administración'],
          summary: 'Eliminar hilo del foro como administrador',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Hilo eliminado exitosamente' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Hilo no encontrado' },
          },
        },
      },
      '/admin/replies/{id}': {
        delete: {
          tags: ['4. Administración'],
          summary: 'Eliminar respuesta del foro como administrador',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Respuesta eliminada' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Respuesta no encontrada' },
          },
        },
      },
      '/admin/sanctions': {
        get: {
          tags: ['4. Administración'],
          summary: 'Listar sanciones aplicadas (query: ?userId=5)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por usuario sancionado' },
          ],
          responses: {
            200: { description: 'Lista de sanciones' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
          },
        },
        post: {
          tags: ['4. Administración'],
          summary: 'Aplicar sanción disciplinaria a un usuario',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SanctionBody' } } },
          },
          responses: {
            201: { description: 'Sanción aplicada exitosamente' },
            400: { description: 'Campos requeridos faltantes' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      '/admin/qr': {
        get: {
          tags: ['4. Administración'],
          summary: 'Generar código QR institucional de la plataforma',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Código QR en base64',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { qr: { type: 'string', description: 'Data URL base64 del QR' } },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
          },
        },
      },

      // ── Catálogo Académico (/admin/catalog/*) ─────────────────────────
      '/admin/catalog': {
        get: {
          tags: ['7. Catálogo Académico'],
          summary: 'Obtener catálogo académico completo (carreras y materias)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Catálogo con carreras y materias asociadas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      careers:  { type: 'array', items: { type: 'object' } },
                      subjects: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
          },
        },
      },
      '/admin/catalog/careers': {
        post: {
          tags: ['7. Catálogo Académico'],
          summary: 'Crear una nueva carrera profesional',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CareerBody' } } },
          },
          responses: {
            201: { description: 'Carrera creada exitosamente' },
            400: { description: 'El nombre de la carrera es requerido' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
          },
        },
      },
      '/admin/catalog/subjects': {
        post: {
          tags: ['7. Catálogo Académico'],
          summary: 'Crear una nueva asignatura académica',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SubjectBody' } } },
          },
          responses: {
            201: { description: 'Materia creada exitosamente' },
            400: { description: 'Campos requeridos faltantes o semestre fuera de rango' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Carrera no encontrada' },
          },
        },
      },
      '/admin/catalog/subjects/{id}': {
        delete: {
          tags: ['7. Catálogo Académico'],
          summary: 'Eliminar una materia académica',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Materia eliminada exitosamente' },
            400: { description: 'ID inválido o materia con apuntes/foros activos' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Materia no encontrada' },
          },
        },
      },
      '/admin/catalog/careers/{id}': {
        delete: {
          tags: ['7. Catálogo Académico'],
          summary: 'Eliminar una carrera profesional',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Carrera eliminada exitosamente' },
            400: { description: 'ID inválido o carrera con materias asociadas' },
            401: { description: 'No autenticado' },
            403: { description: 'Se requiere rol admin' },
            404: { description: 'Carrera no encontrada' },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // 8. SISTEMA DE ROLES Y PERMISOS UNIFICADO
      // ════════════════════════════════════════════════════════════════════════
      '/roles/my-permissions': {
        get: {
          tags: ['8. Sistema de Roles'],
          summary: 'Consultar rol y permisos efectivos del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Permisos del usuario autenticado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/PermissionsResponse' } } },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/roles/users': {
        get: {
          tags: ['8. Sistema de Roles'],
          summary: 'Listar usuarios registrados con sus roles asignados (requiere users:view_list)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de usuarios y sus roles' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere permiso users:view_list' },
          },
        },
      },
      '/roles/{id}': {
        patch: {
          tags: ['8. Sistema de Roles'],
          summary: 'Asignar o actualizar rol de un usuario (requiere users:assign_roles)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangeRoleBody' } } },
          },
          responses: {
            200: { description: 'Rol actualizado exitosamente' },
            400: { description: 'Rol inválido o intento de autodegradación' },
            401: { description: 'No autenticado' },
            403: { description: 'Acceso denegado: se requiere permiso users:assign_roles' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
