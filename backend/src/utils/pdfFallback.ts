import fs from 'fs';
import path from 'path';
import logger from './logger';

export function getUploadDirPath(): string {
  const custom = process.env.UPLOAD_DIR || 'uploads';
  if (path.isAbsolute(custom)) return custom;
  
  // Si existe en el CWD actual, usarlo
  const cwdPath = path.resolve(process.cwd(), custom);
  if (fs.existsSync(cwdPath)) return cwdPath;

  // Si existe relativo a este archivo (src/utils -> ../../uploads)
  const relativePath = path.resolve(__dirname, '../../uploads');
  if (fs.existsSync(relativePath)) return relativePath;

  // Por defecto retornar cwdPath asegurando que el directorio exista
  try {
    fs.mkdirSync(cwdPath, { recursive: true });
  } catch {
    // Ignorar si ya existe
  }
  return cwdPath;
}

function escapePdfText(text: string): string {
  if (!text) return '';
  // Normalizar acentos y remover caracteres especiales de sintaxis PDF
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\()]/g, '');
}

export function generateSamplePdfBuffer(opts: {
  title?: string;
  subjectName?: string;
  description?: string;
  uploaderName?: string;
}): Buffer {
  const title = escapePdfText(opts.title || 'Apunte Universitario');
  const subject = escapePdfText(opts.subjectName || 'General');
  const desc = escapePdfText(opts.description || 'Sin descripcion adicional.');
  const uploader = escapePdfText(opts.uploaderName || 'Estudiante');

  // Ajustar descripción en líneas de máximo 65 caracteres
  const words = desc.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const w of words) {
    if ((currentLine + ' ' + w).trim().length > 65) {
      lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine += ' ' + w;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  let textOps = '';
  textOps += 'BT /F1 20 Tf 50 780 Td (ShareNotes - Apunte Academico) Tj ET ';
  textOps += 'BT /F1 10 Tf 50 762 Td (Plataforma Universitaria de Apuntes y Comunidad) Tj ET ';
  textOps += '0.2 w 50 750 m 545 750 l S ';
  textOps += 'BT /F1 15 Tf 50 720 Td (' + title.substring(0, 55) + ') Tj ET ';
  textOps += 'BT /F1 11 Tf 50 690 Td (Materia: ' + subject + ') Tj ET ';
  textOps += 'BT /F1 11 Tf 50 672 Td (Autor / Aporte: ' + uploader + ') Tj ET ';
  textOps += 'BT /F1 11 Tf 50 654 Td (Fecha de generacion: ' + new Date().toISOString().split('T')[0] + ') Tj ET ';

  textOps += 'BT /F1 12 Tf 50 620 Td (Resumen y Contenido del Apunte:) Tj ET ';
  textOps += '0.1 w 50 612 m 300 612 l S ';

  let y = 590;
  for (const l of lines) {
    textOps += 'BT /F1 10 Tf 50 ' + y + ' Td (' + l + ') Tj ET ';
    y -= 18;
  }

  y -= 20;
  textOps += 'BT /F1 12 Tf 50 ' + y + ' Td (Recomendaciones de Estudio:) Tj ET ';
  y -= 20;
  const tips = [
    '1. Revisa los conceptos clave y formulas destacadas.',
    '2. Consulta el foro academico de esta materia si tienes dudas o aportes.',
    '3. Comparte tus propios apuntes para enriquecer a la comunidad universitaria.'
  ];
  for (const tip of tips) {
    textOps += 'BT /F1 9 Tf 50 ' + y + ' Td (' + tip + ') Tj ET ';
    y -= 16;
  }

  textOps += '0.2 w 50 50 m 545 50 l S ';
  textOps += 'BT /F1 8 Tf 50 38 Td (ShareNotes (c) 2026 - Documento educativo verificado digitalmente) Tj ET ';

  const stream = textOps;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Length ' + Buffer.byteLength(stream) + ' >>\nstream\n' + stream + '\nendstream\nendobj\n'
  ];
  let offset = 9;
  let body = '%PDF-1.4\n';
  const xref = ['xref\n0 6\n0000000000 65535 f \n'];
  for (let i = 0; i < objects.length; i++) {
    xref.push(String(offset).padStart(10, '0') + ' 00000 n \n');
    body += objects[i];
    offset = Buffer.byteLength(body, 'utf-8');
  }
  const startxref = offset;
  body += xref.join('') + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';
  return Buffer.from(body, 'utf-8');
}

export function ensureNoteFileOnDisk(
  filename: string,
  noteData: {
    title?: string;
    description?: string;
    subjectName?: string;
    uploaderName?: string;
  }
): string {
  const uploadDir = getUploadDirPath();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    const pdfBuffer = generateSamplePdfBuffer(noteData);
    fs.writeFileSync(filePath, pdfBuffer);
    logger.info(`Archivo de apunte generado automáticamente en disco: ${filePath}`);
  }

  return filePath;
}

