// src/components/teacher/NoteVerifyButton.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacherPermissions } from '../../composables/useTeacherPermissions';
import { teacherService } from '../../services/teacher.service';

export default function NoteVerifyButton({ note, onVerified }) {
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
      style={{
        background: 'var(--color-success-bg)',
        border: '1px solid var(--color-success-border)',
        color: 'var(--color-success-text)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        transition: 'all 0.2s ease',
      }}
      title="Marcar apunte como verificado / recurso oficial"
    >
      {loading ? '⏳ Verificando...' : '🎓 Verificar Apunte'}
    </button>
  );
}
