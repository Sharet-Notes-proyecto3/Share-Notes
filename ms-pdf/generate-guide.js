const fs = require('fs');
const path = require('path');
const PDFDocument = require('./node_modules/pdfkit');

const outputPath = path.join(__dirname, '..', 'Guia_Implementacion_ShareNotes_4_Integrantes.pdf');

// Creamos el documento con márgenes controlados
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  autoFirstPage: false,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Paleta de colores sobria y profesional
const PRIMARY = '#1e3a8a';     // Azul institucional
const SECONDARY = '#0284c7';   // Celeste
const TEXT_DARK = '#0f172a';   // Texto principal
const TEXT_MUTED = '#475569';  // Texto secundario
const BG_CARD = '#f8fafc';
const BORDER_CARD = '#cbd5e1';

const ACCENT_ANNA = '#6d28d9';       // Púrpura
const ACCENT_MUCHAVISOY = '#0284c7';  // Azul
const ACCENT_CAMILA = '#059669';      // Esmeralda
const ACCENT_ANDRES = '#dc2626';      // Carmesí

function addPageWithHeader(sectionCategory) {
  doc.addPage();
  
  // Línea decorativa superior
  doc.rect(45, 30, 505, 3).fill(PRIMARY);
  
  // Tag superior
  doc.fontSize(8).font('Helvetica-Bold').fillColor(SECONDARY)
     .text(sectionCategory.toUpperCase(), 45, 38, { align: 'right', width: 505 });
  
  doc.y = 52;
}

function drawFooter(pageNumber, totalPages = 4) {
  doc.save();
  doc.rect(45, 785, 505, 0.5).fill('#cbd5e1');
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED)
     .text('ShareNotes v1.0 — Guia de Distribucion de Modulos (Software 3)', 45, 792, { lineBreak: false });
  doc.text(`Pagina ${pageNumber} de ${totalPages}`, 45, 792, { align: 'right', width: 505, lineBreak: false });
  doc.restore();
}

function drawSectionHeading(numberStr, titleStr, color = PRIMARY) {
  const y = doc.y + 4;
  doc.rect(45, y, 4, 16).fill(color);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(color)
     .text(`   ${numberStr}. ${titleStr}`, 52, y + 1);
  doc.y = y + 22;
}

function drawChecklist(items, accentColor, title = 'CHECKLIST DE VALIDACION Y ENTREGA:') {
  const startY = doc.y + 2;
  const boxHeight = 16 + items.length * 13;
  
  doc.rect(45, startY, 505, boxHeight).fill('#f8fafc');
  doc.rect(45, startY, 505, boxHeight).stroke(accentColor);
  
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(accentColor)
     .text(title, 55, startY + 8);
  
  let itemY = startY + 22;
  items.forEach((it) => {
    doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK)
       .text(`[ ] ${it}`, 55, itemY);
    itemY += 13;
  });
  
  doc.y = startY + boxHeight + 8;
}

// ═════════════════════════════════════════════════════════════════════════════
// PÁGINA 1: PORTADA Y ESTRATEGIA DE EQUIPO
// ═════════════════════════════════════════════════════════════════════════════
addPageWithHeader('PROYECTO DE SOFTWARE 3 — INGENIERIA DE SISTEMAS');

// Banner de título
const bY = doc.y;
doc.rect(45, bY, 505, 80).fill('#f1f5f9');
doc.rect(45, bY, 505, 80).stroke('#cbd5e1');

doc.fontSize(18).font('Helvetica-Bold').fillColor(PRIMARY)
   .text('GUIA MAESTRA DE IMPLEMENTACION MODULAR', 60, bY + 14);
doc.fontSize(11).font('Helvetica-Bold').fillColor(SECONDARY)
   .text('Plataforma Web Universitaria ShareNotes — 4 Integrantes', 60, bY + 36);
doc.fontSize(8.5).font('Helvetica').fillColor(TEXT_MUTED)
   .text('Desarrollo colaborativo independiente sin conflictos de codigo • Alcance 100% Funcional', 60, bY + 54);

doc.y = bY + 92;

drawSectionHeading('1', 'Filosofia de Trabajo: Cero Conflictos en Git', PRIMARY);
doc.fontSize(9).font('Helvetica').fillColor(TEXT_DARK).text(
  'Para asegurar un avance fluido sin colisiones de codigo ("merge conflicts"), el frontend de ShareNotes ' +
  'se organizo en 4 capas verticales autonomas. Cada integrante es dueno exclusivo de su carpeta de componentes ' +
  'y de su respectivo servicio HTTP, consumiendo contratos de datos ya establecidos.',
  { lineGap: 2 }
);

doc.moveDown(0.5);

// Tabla de Módulos
const tY = doc.y;
doc.rect(45, tY, 505, 18).fill(PRIMARY);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#ffffff');
doc.text('INTEGRANTE', 55, tY + 5);
doc.text('RESPONSABILIDAD / MODULO', 150, tY + 5);
doc.text('CARPETA DE COMPONENTES', 320, tY + 5);
doc.text('SERVICIO HTTP', 440, tY + 5);

const rows = [
  ['Anna 1', 'Autenticacion, Sesion y Perfil', 'src/components/auth/', 'auth.service.js'],
  ['Muchavisoy 2', 'Apuntes, Visor In-App, QR y PDF', 'src/components/notes/', 'notes.service.js'],
  ['Camila 3', 'Foro Academico, Respuestas y Votos', 'src/components/forum/', 'forum.service.js'],
  ['Andres 4', 'Administracion, Sanciones y API', 'src/components/admin/', 'admin.service.js / api.js'],
];

let rowY = tY + 18;
rows.forEach((r, idx) => {
  const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
  doc.rect(45, rowY, 505, 18).fill(bg);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_DARK).text(r[0], 55, rowY + 5);
  doc.font('Helvetica').fillColor(TEXT_DARK).text(r[1], 150, rowY + 5);
  doc.font('Courier').fontSize(7.5).fillColor(SECONDARY).text(r[2], 320, rowY + 6);
  doc.text(r[3], 440, rowY + 6);
  rowY += 18;
});

doc.y = rowY + 12;

drawSectionHeading('2', 'Reglas de Oro del Equipo', SECONDARY);
doc.fontSize(8.5).font('Helvetica').fillColor(TEXT_DARK)
   .text('1. Prohibido editar archivos en la carpeta de otro integrante.', { indent: 10, lineGap: 2 })
   .text('2. El cliente HTTP (src/services/api.js) esta centralizado: inyecta JWT y maneja Blobs automaticamente.', { indent: 10, lineGap: 2 })
   .text('3. Todos consumen el estado del usuario via: const { user, token } = useAuth();', { indent: 10, lineGap: 2 })
   .text('4. Ramas de Git obligatorias: feature/anna-auth, feature/muchavisoy-notes, feature/camila-forum, feature/andres-admin.', { indent: 10, lineGap: 2 });

doc.moveDown(0.5);

drawSectionHeading('3', 'Diagnostico de Ajustes Necesarios para el 100%', ACCENT_ANDRES);
doc.fontSize(8.5).font('Helvetica').fillColor(TEXT_DARK)
   .text('• Visor de Apuntes: Requiere descarga protegida con JWT convertida a Blob (URL.createObjectURL). Asignado a Muchavisoy 2.', { lineGap: 2 })
   .text('• Codigo QR de Apuntes: Debe generar dinamicamente la URL hacia el backend para descarga movil. Asignado a Muchavisoy 2.', { lineGap: 2 })
   .text('• Modal de Reportes: Requiere interfaz interactiva para enviar motivo de reporte a POST /api/forum/report. Asignado a Camila 3.', { lineGap: 2 })
   .text('• Sanciones y Salud de Microservicios: Conectar endpoints de sanciones y monitoreo en vivo en el AdminView. Asignado a Andres 4.', { lineGap: 2 });

drawFooter(1);

// ═════════════════════════════════════════════════════════════════════════════
// PÁGINA 2: ANNA 1 & MUCHAVISOY 2
// ═════════════════════════════════════════════════════════════════════════════
addPageWithHeader('ESPECIFICACION TECNICA — INTEGRANTES 1 Y 2');

drawSectionHeading('A', 'INTEGRANTE 1: Anna — Autenticacion, Sesion y Perfil', ACCENT_ANNA);
doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_MUTED)
   .text('ARCHIVOS: src/services/auth.service.js  |  src/context/AuthContext.jsx  |  src/components/auth/*');
doc.moveDown(0.3);

const tasksAnna = [
  'AuthModal.jsx: Validacion de correo institucional y contrasena (minimo 8 caracteres) con indicador visual de fortaleza (Debil, Regular, Buena, Excelente). Alternancia fluida entre Login y Registro.',
  'AuthContext.jsx: Persistencia del token JWT en localStorage, decodificacion de roles (isAdmin, isTeacher, isModerator, isStudent) y estado reactivo de sesion.',
  'UserMenu.jsx: Avatar superior con iniciales del usuario, insignia de rol academico con colores distintivos e integracion con API de Wikipedia para busqueda de temas tecnicos.',
  'NUEVO — ProfileModal.jsx: Componente modal accesible desde "Ver mi perfil" en UserMenu. Muestra tarjeta del estudiante con nombre, correo, ID, rol, institucion y estado de cuenta.',
  'Manejo de Expiracion: Limpieza limpia del token y redireccion al formulario de inicio de sesion cuando el token expire tras 24 horas.',
];

doc.fontSize(8.5).font('Helvetica-Bold').fillColor(ACCENT_ANNA).text('Tareas y Componentes Asignados:');
tasksAnna.forEach(t => {
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK).text(`• ${t}`, { indent: 10, lineGap: 2 });
});

doc.moveDown(0.3);
drawChecklist([
  'Login y Registro validan campos obligatorios y bloquean entradas invalidas.',
  'El boton "Ver mi perfil" en UserMenu abre el nuevo ProfileModal.',
  'El menu consulta articulos reales de Wikipedia segun el tema academico ingresado.',
], ACCENT_ANNA, 'CHECKLIST DE ENTREGA — ANNA 1:');

doc.moveDown(0.6);

drawSectionHeading('B', 'INTEGRANTE 2: Muchavisoy — Apuntes, Visor In-App, QR y PDF', ACCENT_MUCHAVISOY);
doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_MUTED)
   .text('ARCHIVOS: src/services/notes.service.js  |  src/components/notes/*');
doc.moveDown(0.3);

const tasksMuchavisoy = [
  'NotesGrid.jsx: Cuadricula reactiva de apuntes con filtro por materia, buscador por titulo en tiempo real y boton para generar reporte consolidado PDF via microservicio MS-PDF.',
  'NoteCard.jsx: Tarjeta interactiva con insignia de formato (PDF / Imagen), boton de previsualizacion in-app, boton de descarga directa y boton para abrir codigo QR.',
  'UploadModal.jsx: Formulario multipart/form-data con validacion estricta de extensiones (.pdf, .jpg, .png) y limite de tamano seguro.',
  'PreviewModal.jsx (Punto Critico): Visor in-app de PDFs e imagenes. Debe solicitar el archivo protegido con token mediante api.get("/notes/:id/download") y crear un Object URL en memoria.',
  'QRModal.jsx: Generador de codigo QR que apunta a la URL publica de descarga del apunte para que cualquier companero lo escanee con su telefono celular.',
  'Accion de Borrado: Boton de eliminacion en NoteCard para que el autor del apunte o un admin puedan dar de baja el archivo (DELETE /api/notes/:id).',
];

doc.fontSize(8.5).font('Helvetica-Bold').fillColor(ACCENT_MUCHAVISOY).text('Tareas y Componentes Asignados:');
tasksMuchavisoy.forEach(t => {
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK).text(`• ${t}`, { indent: 10, lineGap: 2 });
});

doc.moveDown(0.3);
drawChecklist([
  'PreviewModal carga correctamente el PDF o imagen usando Blobs protegidos.',
  'El codigo QR generado permite la descarga directa al escanearlo desde un movil.',
  'El reporte PDF consolidado se descarga exitosamente desde el microservicio MS-PDF.',
], ACCENT_MUCHAVISOY, 'CHECKLIST DE ENTREGA — MUCHAVISOY 2:');

drawFooter(2);

// ═════════════════════════════════════════════════════════════════════════════
// PÁGINA 3: CAMILA 3 & ANDRES 4
// ═════════════════════════════════════════════════════════════════════════════
addPageWithHeader('ESPECIFICACION TECNICA — INTEGRANTES 3 Y 4');

drawSectionHeading('C', 'INTEGRANTE 3: Camila — Foro Academico, Respuestas y Reportes', ACCENT_CAMILA);
doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_MUTED)
   .text('ARCHIVOS: src/services/forum.service.js  |  src/components/forum/*');
doc.moveDown(0.3);

const tasksCamila = [
  'ForumView.jsx: Tablero general de dudas academicas con selector de materia, contador de respuestas y boton para crear nuevo debate.',
  'ThreadCard.jsx: Despliegue de respuestas, caja de texto para responder, boton de "Util" con votacion reactiva y boton de "Reportar Contenido".',
  'NewThreadModal.jsx: Modal para redactar y publicar preguntas vinculadas a una materia especifica.',
  'NUEVO — ReportModal.jsx: Modal dedicado a la moderacion donde el estudiante puede reportar un debate o comentario indebido indicando el motivo (Spam, Fuera de tema, Lenguaje ofensivo).',
  'Feedback de Votacion: Contador reactivo de respuestas utiles con bloqueo de voto repetido para premiar aportes academicos valiosos.',
  'Buscador de Debates: Barra de busqueda rapida para encontrar preguntas por palabras clave.',
];

doc.fontSize(8.5).font('Helvetica-Bold').fillColor(ACCENT_CAMILA).text('Tareas y Componentes Asignados:');
tasksCamila.forEach(t => {
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK).text(`• ${t}`, { indent: 10, lineGap: 2 });
});

doc.moveDown(0.3);
drawChecklist([
  'Se pueden crear hilos de discusion y responder preguntas en tiempo real.',
  'El boton "Reportar" abre ReportModal y envia los datos a POST /api/forum/report.',
  'El boton "Util" actualiza el contador de votos de forma visual e inmediata.',
], ACCENT_CAMILA, 'CHECKLIST DE ENTREGA — CAMILA 3:');

doc.moveDown(0.6);

drawSectionHeading('D', 'INTEGRANTE 4: Andres — Panel Admin, Sanciones, Salud y API Base', ACCENT_ANDRES);
doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_MUTED)
   .text('ARCHIVOS: src/services/admin.service.js  |  src/services/api.js  |  src/components/admin/*');
doc.moveDown(0.3);

const tasksAndres = [
  'api.js: Cliente HTTP estandarizado con inyeccion de cabeceras Authorization: Bearer, parseo de Blobs para descargas binarias y captura uniforme de errores.',
  'AdminView.jsx: Tablero administrativo con metricas clave (usuarios activos, reportes pendientes) y proteccion de acceso por rol (isAdmin / isModerator).',
  'UsersTable.jsx: Tabla de usuarios con cambio dinamico de rol (student, teacher, moderator, admin) y accion para suspender o reactivar cuentas.',
  'ReportsTable.jsx: Bandeja de moderacion para revisar o descartar reportes y boton de eliminacion directa de apuntes o comentarios reportados.',
  'NUEVO — SanctionsModal.jsx: Modal para aplicar sanciones formales a usuarios (advertencia, suspension temporal, expulsion permanente) conectando con POST /api/admin/sanctions.',
  'NUEVO — MicroservicesCard.jsx: Widget de monitoreo en vivo que consulta GET /api/notes/microservices/status y muestra el estado de MS-PDF (3002) y MS-Email (3001).',
];

doc.fontSize(8.5).font('Helvetica-Bold').fillColor(ACCENT_ANDRES).text('Tareas y Componentes Asignados:');
tasksAndres.forEach(t => {
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK).text(`• ${t}`, { indent: 10, lineGap: 2 });
});

doc.moveDown(0.3);
drawChecklist([
  'El administrador puede cambiar roles y suspender usuarios en vivo.',
  'El panel muestra el estado de salud de MS-PDF y MS-Email en tiempo real.',
  'Se pueden aplicar sanciones disciplinarias y eliminar contenido ofensivo.',
], ACCENT_ANDRES, 'CHECKLIST DE ENTREGA — ANDRES 4:');

drawFooter(3);

// ═════════════════════════════════════════════════════════════════════════════
// PÁGINA 4: PROTOCOLO DE PRUEBAS Y PUESTA EN PRODUCCIÓN
// ═════════════════════════════════════════════════════════════════════════════
addPageWithHeader('PROTOCOLO DE VALIDACION Y SUSTENTACION');

drawSectionHeading('4', 'Protocolo de Pruebas Integrales de Extremo a Extremo', PRIMARY);
doc.fontSize(8.5).font('Helvetica').fillColor(TEXT_DARK).text(
  'Para la entrega final o defensa ante el docente, ejecuten la siguiente secuencia de validacion ' +
  'para comprobar que todas las capas estan operativas al 100%:',
  { lineGap: 2 }
);

doc.moveDown(0.4);

const demoSteps = [
  {
    title: 'Paso 1: Lanzamiento Unificado del Ecosistema',
    desc: 'En la raiz del repositorio, ejecuten en PowerShell: .\\start-all.ps1. Se abriran 4 terminales independientes: Backend (3000), MS-PDF (3002), MS-Email (3001) y Frontend Vite (5173).',
  },
  {
    title: 'Paso 2: Validacion de Identidad y Perfil (Modulo Anna 1)',
    desc: 'Acceder a http://localhost:5173. Registrar un usuario con contrasena segura. Iniciar sesion, abrir el menu superior de usuario, probar la busqueda de articulos en Wikipedia y abrir "Ver mi perfil".',
  },
  {
    title: 'Paso 3: Validacion de Apuntes, Visor In-App y QR (Modulo Muchavisoy 2)',
    desc: 'Subir un apunte PDF academico. Comprobar que aparece en el grid. Abrir el visor interactivo (PreviewModal) para previsualizarlo sin salir de la app. Abrir el codigo QR y descargar el Reporte Consolidado PDF.',
  },
  {
    title: 'Paso 4: Validacion de Foro, Respuestas y Reportes (Modulo Camila 3)',
    desc: 'Ingresar a "Foro Academico". Publicar una duda sobre una materia. Responder a la pregunta, pulsar "Util" para registrar el voto y probar el modal de "Reportar Contenido" sobre un mensaje de prueba.',
  },
  {
    title: 'Paso 5: Validacion de Administracion, Microservicios y Sanciones (Modulo Andres 4)',
    desc: 'Iniciar sesion con la cuenta de Administrador. Entrar a "Administracion". Constatar que el monitor de microservicios reporte MS-PDF y MS-Email en verde, resolver el reporte pendiente y aplicar una sancion.',
  },
];

demoSteps.forEach(s => {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(PRIMARY).text(s.title);
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK).text(s.desc, { indent: 12, lineGap: 2 });
  doc.moveDown(0.3);
});

doc.moveDown(0.4);

// Caja final de Certificación
const fBoxY = doc.y;
doc.rect(45, fBoxY, 505, 50).fill('#f1f5f9');
doc.rect(45, fBoxY, 505, 50).stroke(PRIMARY);

doc.fontSize(9.5).font('Helvetica-Bold').fillColor(PRIMARY)
   .text('PROYECTO 100% INTEGRADO Y LISTO PARA PRODUCCION', 55, fBoxY + 10);
doc.fontSize(8).font('Helvetica').fillColor(TEXT_DARK)
   .text('Siguiendo esta distribucion estricta por carpetas, el equipo garantiza un flujo de trabajo sin colisiones en Git, ' +
         'cobertura total de los requerimientos de Software 3 y una arquitectura de microservicios profesional y defendible.',
         55, fBoxY + 24, { width: 485, lineGap: 2 });

drawFooter(4);

doc.end();

writeStream.on('finish', () => {
  console.log('PDF final generado con exito.');
});
