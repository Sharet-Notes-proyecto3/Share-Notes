// src/components/teacher/MarkSolutionButton.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacherPermissions } from '../../composables/useTeacherPermissions';
import { teacherService } from '../../services/teacher.service';

export default function MarkSolutionButton({ thread, reply, onMarked }) {
  const { token } = useAuth();
  const { canMarkSolution } = useTeacherPermissions();
  const [loading, setLoading] = useState(false);

  if (!canMarkSolution(thread, reply)) {
    return null; // Ocultar totalmente si no aplica
  }

  const handleMarkSolution = async () => {
    try {
      setLoading(true);
      await teacherService.markSolution(token, reply.id);
      if (onMarked) onMarked(reply.id);
    } catch (err) {
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('denegado')) {
        alert('❌ No tienes permisos sobre este curso');
      } else {
        alert('Error al marcar solución: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMarkSolution}
      disabled={loading}
      style={{
        background: 'var(--secondary-bg)',
        border: '1px solid var(--secondary-border)',
        borderRadius: '6px',
        color: 'var(--secondary-color)',
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      title="Certificar respuesta como solución oficial verificada por docente"
    >
      {loading ? '⏳ Certificando...' : '⭐ Solución Docente'}
    </button>
  );
}
