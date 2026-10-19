// src/components/teacher/NoteVerifyButton.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacherPermissions } from '../../composables/useTeacherPermissions';
import { teacherService } from '../../services/teacher.service';

export default function NoteVerifyButton({ note, onVerified, style = {} }) {
  const { token } = useAuth();
  const { canVerify } = useTeacherPermissions();
  const [loading, setLoading] = useState(false);

  if (!canVerify(note)) {
    return null; // Ocultar totalmente si no posee permisos o si ya está verificado
  }

  const handleVerify = async () => {
    if (!window.confirm(`¿Deseas verificar el apunte "${note.title}" como recurso oficial del curso?`)) {
      return;
    }
    try {
      setLoading(true);
      await teacherService.verifyNote(token, note.id);
      if (onVerified) onVerified(note.id);
    } catch (err) {
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('denegado')) {
        alert('❌ No tienes permisos sobre este curso');
      } else {
        alert('Error al verificar apunte: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="btn-outline"
      style={{
        width: '100%',
        padding: '7px 12px',
        ...style,
      }}
      title="Marcar apunte como verificado / recurso oficial"
    >
      {loading ? '⏳ Verificando...' : '🎓 Verificar Apunte'}
    </button>
  );
}
