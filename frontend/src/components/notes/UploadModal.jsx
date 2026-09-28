// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: MODAL DE SUBIDA DE APUNTES MULTIMEDIA
// Responsable: Integrante 2 (Apuntes, Archivos & Subidas)
// Restricción: Estudiantes solo pueden seleccionar materias de su propio semestre.
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';

export default function UploadModal({ subjects = [], onClose, onNoteUploaded }) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Identificar si aplica la restricción de semestre para estudiantes:
  const isStudent = (user?.role || '').toLowerCase() === 'student';
  const hasAcademicProfile =
    Boolean(user?.program_type || user?.programType) &&
    user?.semester !== null &&
    user?.semester !== undefined &&
    user?.semester !== '';

  const isRestrictedStudent = isStudent && hasAcademicProfile;
  const studentSemester = isRestrictedStudent ? Number(user.semester) : null;

  // Filtrar materias: si es estudiante con perfil, SOLO materias de su semestre exacto
  const filteredSubjects = useMemo(() => {
    if (isRestrictedStudent) {
      return (subjects || []).filter((sub) => Number(sub.semester) === studentSemester);
    }
    return subjects || [];
  }, [subjects, isRestrictedStudent, studentSemester]);

  const hasNoSubjectsForSemester = isRestrictedStudent && filteredSubjects.length === 0;

  const selectedSubject = filteredSubjects.find((subject) => String(subject.id) === String(subjectId));

  // Sincronizar la materia seleccionada con las materias permitidas
  useEffect(() => {
    const isCurrentValid = filteredSubjects.some((s) => String(s.id) === String(subjectId));
    if (!isCurrentValid) {
      setSubjectId(filteredSubjects[0]?.id || '');
    }
  }, [filteredSubjects, subjectId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validación de tipo de archivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Formato no válido. Solo se permiten archivos PDF, JPG o PNG.');
      setFile(null);
      return;
    }

    // Validación de tamaño (Máx 100 MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido de 100 MB.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasNoSubjectsForSemester) {
      setError(`No hay materias registradas para tu semestre (${studentSemester}°). Contacta al administrador.`);
      return;
    }

    if (!title || !subjectId || !file) {
      setError('Por favor completa todos los campos requeridos y selecciona un archivo.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await notesService.uploadNote(token, {
        title: title.trim(),
        description: description ? description.trim() : undefined,
        subjectId,
        careerId: selectedSubject?.career_id || selectedSubject?.careerId || user?.career_id || user?.careerId,
        semester: selectedSubject?.semester || user?.semester || user?.semestre,
        file,
      });

      if (typeof onNoteUploaded === 'function') {
        onNoteUploaded();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error al subir el apunte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>📤 Subir Nuevo Apunte</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-danger-text)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Título del apunte *</label>
            <input
              type="text"
              placeholder="Ej. Resumen Primer Parcial - Estructuras de Datos"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Materia * {isRestrictedStudent && (
                <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600' }}>
                  (Solo materias de tu semestre actual: {studentSemester}°)
                </span>
              )}
            </label>

            {hasNoSubjectsForSemester ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  fontSize: '13px',
                  lineHeight: '1.4',
                }}
              >
                ⚠️ No hay materias registradas para tu semestre ({studentSemester}°) — contacta al administrador.
              </div>
            ) : (
              <select
                className="form-input"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                <option value="">Selecciona una materia...</option>
                {filteredSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} (Semestre {sub.semester})
                  </option>
                ))}
              </select>
            )}

            {selectedSubject && (
              <small style={{ display: 'block', marginTop: '5px', color: 'var(--text-secondary)' }}>
                Carrera: {selectedSubject.career_name || selectedSubject.career?.name || 'Asignada'} · Semestre {selectedSubject.semester}
              </small>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Descripción u observaciones</label>
            <textarea
              placeholder="Añade detalles sobre el contenido de este apunte..."
              className="form-input"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Archivo adjunto (PDF, JPG, PNG — Máx 100MB) *</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ color: 'var(--text-primary)', fontSize: '13px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || hasNoSubjectsForSemester}
              className="primary-btn"
              style={{
                flex: 2,
                opacity: (loading || hasNoSubjectsForSemester) ? 0.6 : 1,
                cursor: (loading || hasNoSubjectsForSemester) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Subiendo y Notificando...' : 'Publicar Apunte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
