// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: MODAL DE SUBIDA DE APUNTES MULTIMEDIA
// Responsable: Integrante 2 (Apuntes, Archivos & Subidas)
// =============================================================================

import { useState } from 'react';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';

export default function UploadModal({ subjects, onClose, onNoteUploaded }) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedSubject = subjects.find((subject) => String(subject.id) === String(subjectId));

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
    if (!title || !subjectId || !file) {
      setError('Por favor completa todos los campos requeridos y selecciona un archivo.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await notesService.uploadNote(token, {
        title,
        description,
        subjectId,
        careerId: selectedSubject?.career_id || selectedSubject?.careerId || user?.career_id || user?.careerId,
        semester: selectedSubject?.semester || user?.semester || user?.semestre,
        file,
      });

      onNoteUploaded();
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
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Materia *</label>
            <select
              className="form-input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Selecciona una materia...</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} (Semestre {sub.semester})
                </option>
              ))}
            </select>
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
              disabled={loading}
              className="primary-btn"
              style={{ flex: 2 }}
            >
              {loading ? 'Subiendo y Notificando...' : 'Publicar Apunte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
