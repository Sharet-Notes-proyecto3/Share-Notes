const PDFDocument = require('pdfkit');
const logger = require('./logger');

function generatePDF(data, callback, errorCallback) {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      callback(pdfData);
    });

    // Agregar contenido al PDF
    doc.fontSize(20).text('Reporte de Apuntes - ShareNotes', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Usuario: ${data.username || 'N/A'}`);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Resumen de Actividad:', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    if (data.notes && data.notes.length > 0) {
      data.notes.forEach((note, index) => {
        doc.text(`${index + 1}. Título: ${note.title}`);
        doc.text(`   Materia: ${note.subject}`);
        doc.text(`   Fecha: ${new Date(note.createdAt).toLocaleDateString()}`);
        doc.moveDown(0.5);
      });
    } else {
      doc.text('No se encontraron apuntes registrados.');
    }

    doc.end();
  } catch (error) {
    logger.error('Error generando PDF:', { error: error.message || error });
    errorCallback(error);
  }
}

module.exports = { generatePDF };
