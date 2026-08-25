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
  const { token } = useAuth();
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notesRes, subjectsRes] = await Promise.all([
        notesService.getNotes(token, selectedSubject, searchTerm),
        notesService.getSubjects(token),
      ]);
      setNotes(notesRes.data || notesRes || []);
      setSubjects(subjectsRes.data || subjectsRes || []);
    } catch (err) {
      console.error('Error al cargar apuntes:', err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedSubject, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [notesRes, subjectsRes] = await Promise.all([
          notesService.getNotes(token, selectedSubject, searchTerm),
          notesService.getSubjects(token),
        ]);
        if (isMounted) {
          setNotes(notesRes.data || notesRes || []);
          setSubjects(subjectsRes.data || subjectsRes || []);
        }
      } catch (err) {
        console.error('Error al cargar apuntes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [token, selectedSubject, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
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

  return (
    <div style={{ padding: '24px' }}>
      {/* Header y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '24px' }}>📚 Repositorio de Apuntes</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary, #94a3b8)', fontSize: '14px' }}>
            Explora, visualiza, descarga y comparte material de estudio universitario
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
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
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
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
      </div>

      {/* Grid de Apuntes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary, #94a3b8)' }}>
          ⏳ Cargando apuntes de la plataforma...
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--sidebar-bg, #1e293b)', borderRadius: '12px', border: '1px dashed var(--border-color, #334155)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ color: '#fff', margin: '0 0 6px' }}>No se encontraron apuntes</h3>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', margin: 0 }}>
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
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {showUpload && (
        <UploadModal
          subjects={subjects}
          onClose={() => setShowUpload(false)}
          onNoteUploaded={loadData}
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
