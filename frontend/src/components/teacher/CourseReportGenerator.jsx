// src/components/teacher/CourseReportGenerator.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teacherService } from '../../services/teacher.service';

export default function CourseReportGenerator({ subjects = [], selectedCourseId, onReportGenerated }) {
  const { token } = useAuth();
  const [courseId, setCourseId] = useState(selectedCourseId || (subjects[0]?.id || ''));
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerateReport = async (e) => {
    e?.preventDefault();

    const targetCourse = courseId || selectedCourseId;
    if (!targetCourse) {
      alert('Por favor selecciona una asignatura para generar el reporte PDF.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('⏳ Solicitando reporte a MS-PDF...');
      await teacherService.requestCourseReport(token, targetCourse);
      setStatusMessage('✅ Reporte PDF del curso descargado exitosamente');
      if (onReportGenerated) onReportGenerated();
    } catch (err) {
      setStatusMessage('');
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('denegado')) {
        alert('❌ No tienes permisos sobre este curso');
      } else {
        alert('Error al generar el reporte analítico del curso: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--color-info-bg)',
        border: '1px solid var(--color-info-border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px' }}>📊</span>
        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px' }}>Generador de Reportes Analíticos del Curso</h4>
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Genera y descarga un reporte PDF certificado (vía MS-PDF) con el consolidado de apuntes, aportes verificados e interacción en el foro.
      </p>

      <form onSubmit={handleGenerateReport} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {subjects.length > 0 && !selectedCourseId && (
          <select
            className="form-input"
            style={{ flex: '1 1 200px' }}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Selecciona asignatura...</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} (Semestre {sub.semester})
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={loading}
          className="primary-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            fontSize: '13px',
            background: 'var(--color-success)',
            color: 'var(--text-inverse)',
          }}
        >
          {loading ? '⏳ Generando PDF...' : '📄 Descargar Reporte PDF del Curso'}
        </button>
      </form>

      {statusMessage && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: statusMessage.includes('✅') ? 'var(--color-success-text)' : 'var(--color-info-text)', fontWeight: '500' }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}
