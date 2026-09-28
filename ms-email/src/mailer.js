const nodemailer = require('nodemailer');
const logger = require('./logger');

// Crear el transporter reutilizable
// Usa Ethereal (servicio de pruebas gratuito) por defecto,
// o configura SMTP real mediante variables de entorno.
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Si hay configuración SMTP real en las variables de entorno, usarla
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info(`Transporter configurado con SMTP real: ${process.env.SMTP_HOST}`);
    return transporter;
  }

  // Si no hay configuración, crear cuenta de prueba con Ethereal
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  logger.info('Transporter configurado con Ethereal (modo pruebas)', { etherealUser: testAccount.user });
  return transporter;
}

/**
 * Envía un correo de notificación cuando se sube un nuevo apunte.
 * @param {object} data - Datos de la notificación
 * @param {string} data.to - Email del destinatario
 * @param {string} data.uploaderName - Nombre de quien subió el apunte
 * @param {string} data.noteTitle - Título del apunte
 * @param {string} data.subjectName - Nombre de la materia
 */
async function sendNoteNotification(data) {
  const transport = await getTransporter();

  const mailOptions = {
    from: `"ShareNotes 📚" <${process.env.SMTP_USER || 'noreply@sharenotes.com'}>`,
    to: data.to,
    subject: `📝 Nuevo apunte subido: ${data.noteTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📚 ShareNotes</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Plataforma de Apuntes Universitarios</p>
        </div>

        <!-- Body -->
        <div style="padding: 35px 40px;">
          <h2 style="color: #333; margin-top: 0;">¡Nuevo apunte disponible!</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            <strong>${data.uploaderName}</strong> acaba de subir un nuevo apunte que podría interesarte:
          </p>

          <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 18px 22px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #333; font-weight: 600; font-size: 16px;">${data.noteTitle}</p>
            <p style="margin: 0; color: #666; font-size: 14px;">📖 Materia: <strong>${data.subjectName || 'Sin especificar'}</strong></p>
          </div>

          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Ingresa a ShareNotes para descargarlo y empezar a estudiar. 🚀
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px 40px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Este correo fue generado automáticamente por el microservicio de notificaciones de ShareNotes.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transport.sendMail(mailOptions);

  // Si es Ethereal, mostrar la URL de previsualización
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    previewUrl: previewUrl || null,
  };
}

module.exports = { sendNoteNotification, getTransporter };
