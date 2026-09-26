// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: VISTA PRINCIPAL Y GRID DE APUNTES
// Responsable: Integrante 2 (Apuntes, Búsqueda, QR, Visor y Reportes PDF)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';
import NoteCard from './NoteCard';
import UploadModal from './UploadModal';
import QRModal from './QRModal';
import PreviewModal from './PreviewModal';

export default function NotesGrid() {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Modales
  const [showUpload, setShowUpload] = useState(false);
  const [selectedNoteForQR, setSelectedNoteForQR] = useState(null);
  const [selectedNoteForPreview, setSelectedNoteForPreview] = useState(null);

  const careerId = user?.career_id || user?.careerId || user?.career?.id || '';
  const semester = user?.semester || user?.semestre || '';

  const refreshNotes = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const notesRes = await notesService.getNotes(token, selectedSubject, searchTerm, semester, careerId);
      setNotes(Array.isArray(notesRes) ? notesRes : notesRes.data || []);
    } catch (err) {
      console.error('Error al cargar apuntes:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedSubject, searchTerm, semester, careerId]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    notesService.getSubjects(token)
      .then((subjectsRes) => {
        if (isMounted) {
          const availableSubjects = Array.isArray(subjectsRes) ? subjectsRes : subjectsRes.data || [];
          setSubjects(availableSubjects.filter((subject) => {
            const sameCareer = !careerId || String(subject.career_id || subject.careerId || '') === String(careerId);
            const sameSemester = !semester || String(subject.semester || '') === String(semester);
            return sameCareer && sameSemester;
          }));
        }
      })
      .catch((err) => console.error('Error al cargar materias:', err));
    return () => { isMounted = false; };
  }, [token, careerId, semester]);

  // Cargar apuntes cuando cambie el filtro de materias o término de búsqueda
  useEffect(() => {
    if (!token) return;
    const timeoutId = window.setTimeout(refreshNotes, searchTerm ? 250 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshNotes, searchTerm, token]);

  const handleSearch = (e) => {
    e.preventDefault();
    refreshNotes();
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      await notesService.downloadNotesReport(token);
    } catch (err) {
      alert('Error al generar el reporte PDF: ' + err.message);
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el apunte "${note.title}"?`)) {
      return;
    }
    try {
      await notesService.deleteNote(token, note.id);
      refreshNotes();
    } catch (err) {
      alert('Error al eliminar el apunte: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '24px' }}>📚 Repositorio de Apuntes</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Explora, visualiza, descarga y comparte material de estudio universitario
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <>
              <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                {downloadingReport ? '⏳ Generando PDF...' : '📑 Reporte PDF (MS-PDF)'}
              </button>

              <button
                onClick={() => setShowUpload(true)}
                className="primary-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px' }}
              >
                ➕ Subir Apunte
              </button>
          </>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Buscar por título o contenido..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>
            🔍
          </button>
        </form>

        <select
          className="form-input"
          style={{ flex: '1 1 200px' }}
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Todas las materias</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name} (Semestre {sub.semester})
            </option>
          ))}
        </select>

        {(searchTerm || selectedSubject) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSubject('');
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🧹 Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {!loading && (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: '500' }}>
          📄 Mostrando <strong style={{ color: 'var(--text-primary)' }}>{notes.length}</strong> {notes.length === 1 ? 'apunte' : 'apuntes'}
          {selectedSubject ? ' para la materia seleccionada' : ''}
          {searchTerm ? ` que coinciden con "${searchTerm}"` : ''}
        </div>
      )}

      {/* Grid de Apuntes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          ⏳ Cargando apuntes de la plataforma...
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px' }}>No se encontraron apuntes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Sé el primero en subir un apunte para esta materia.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpenQR={(n) => setSelectedNoteForQR(n)}
              onOpenPreview={(n) => setSelectedNoteForPreview(n)}
              onDeleteNote={handleDeleteNote}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {showUpload && (
        <UploadModal
          subjects={subjects}
          onClose={() => setShowUpload(false)}
          onNoteUploaded={fetchNotesOnly}
        />
      )}

      {selectedNoteForQR && (
        <QRModal
          note={selectedNoteForQR}
          onClose={() => setSelectedNoteForQR(null)}
        />
      )}

      {selectedNoteForPreview && (
        <PreviewModal
          note={selectedNoteForPreview}
          onClose={() => setSelectedNoteForPreview(null)}
        />
      )}
    </div>
  );
}
