// src/components/teacher/CloseThreadButton.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacherPermissions } from '../../composables/useTeacherPermissions';
import { teacherService } from '../../services/teacher.service';

export default function CloseThreadButton({ thread, onClosed }) {
  const { token } = useAuth();
  const { canModerateThread } = useTeacherPermissions();
  const [loading, setLoading] = useState(false);

  if (!canModerateThread(thread)) {
    return null; // Ocultar totalmente si no posee permisos o si ya está cerrado
  }

  const handleCloseThread = async () => {
    if (!window.confirm(`¿Deseas cerrar el hilo de discusión "${thread.title}"? No se permitirán más respuestas.`)) {
      return;
    }

    try {
      setLoading(true);
      await teacherService.closeThread(token, thread.id);
      if (onClosed) onClosed(thread.id);
    } catch (err) {
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('denegado')) {
        alert('❌ No tienes permisos sobre este curso');
      } else {
        alert('Error al cerrar hilo: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCloseThread}
      disabled={loading}
      className="btn-outline"
      style={{
        padding: '4px 10px',
        fontSize: '12px',
      }}
      title="Cerrar hilo de discusión en la materia asignada"
    >
      {loading ? '⏳ Cerrando...' : '🔒 Cerrar Hilo'}
    </button>
  );
}
