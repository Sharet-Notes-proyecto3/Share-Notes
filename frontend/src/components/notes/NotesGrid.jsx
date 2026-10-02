// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: VISTA PRINCIPAL Y GRID DE APUNTES
// Responsable: Integrante 2 (Apuntes, Búsqueda, QR, Visor y Reportes PDF)
// Restricción: Estudiantes con perfil configurado solo visualizan y buscan
//              apuntes de materias correspondientes a su semestre registrado.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { notesService } from '../../services/notes.service';
import { teacherService } from '../../services/teacher.service';
import { useAuth } from '../../context/AuthContext';
import { useFilteredSubjects } from '../../hooks/useFilteredSubjects';
import NoteCard from './NoteCard';
import UploadModal from './UploadModal';
import QRModal from './QRModal';
import PreviewModal from './PreviewModal';

export default function NotesGrid() {
  const { token, isTeacher } = useAuth();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [teacherCoursesLoaded, setTeacherCoursesLoaded] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Modales
  const [showUpload, setShowUpload] = useState(false);
  const [selectedNoteForQR, setSelectedNoteForQR] = useState(null);
  const [selectedNoteForPreview, setSelectedNoteForPreview] = useState(null);

  const [selectedSemester, setSelectedSemester] = useState('');

  // Restricción académica mediante hook compartido
  const {
    filteredSubjects,
    isRestrictedStudent,
    studentSemester,
    programTypeLabel,
  } = useFilteredSubjects(subjects);

  // Si la materia seleccionada previamente no pertenece a las materias permitidas, resetear
  useEffect(() => {
    if (selectedSubject && isRestrictedStudent) {
      const isValid = filteredSubjects.some((s) => String(s.id) === String(selectedSubject));
      if (!isValid) {
        setSelectedSubject('');
      }
    } else if (selectedSubject && isTeacher && teacherCoursesLoaded) {
      const isValid = teacherCourses.some((s) => String(s.id) === String(selectedSubject));
      if (!isValid) {
        setSelectedSubject('');
      }
    }
  }, [filteredSubjects, selectedSubject, isRestrictedStudent, isTeacher, teacherCoursesLoaded, teacherCourses]);

  // Cargar materias asignadas si el usuario es docente
  useEffect(() => {
    if (!token || !isTeacher) return;
    let isMounted = true;
    teacherService
      .getTeacherCourses(token)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res.data || [];
          setTeacherCourses(list);
          setTeacherCoursesLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Error al cargar materias asignadas del docente:', err);
        if (isMounted) {
          setTeacherCourses([]);
          setTeacherCoursesLoaded(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [token, isTeacher]);

  const refreshNotes = useCallback(async () => {
    if (!token) return;
    // Si es docente y ya cargaron sus materias pero no tiene ninguna asignada, no consulta y muestra vacío
    if (isTeacher && teacherCoursesLoaded && teacherCourses.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Para estudiantes restringidos, la consulta enfoca su semestre
      // Para docentes, no se envía semester (el backend filtra en tiempo real por teacher_courses)
      const effectiveSemester = isRestrictedStudent
        ? studentSemester
        : isTeacher
        ? ''
        : selectedSemester;
      const notesRes = await notesService.getNotes(token, selectedSubject, searchTerm, effectiveSemester, '');
      setNotes(Array.isArray(notesRes) ? notesRes : notesRes.data || []);
    } catch (err) {
      console.error('Error al cargar apuntes:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedSubject, searchTerm, selectedSemester, isRestrictedStudent, studentSemester, isTeacher, teacherCoursesLoaded, teacherCourses.length]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    notesService.getSubjects(token)
      .then((subjectsRes) => {
        if (isMounted) {
          const availableSubjects = Array.isArray(subjectsRes) ? subjectsRes : subjectsRes.data || [];
          setSubjects(availableSubjects);
        }
      })
      .catch((err) => console.error('Error al cargar materias:', err));
    return () => { isMounted = false; };
  }, [token]);

  // Cargar apuntes cuando cambie el filtro de materias o término de búsqueda
  useEffect(() => {
    if (!token) return;
    const timeoutId = window.setTimeout(refreshNotes, searchTerm ? 250 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshNotes, searchTerm, selectedSubject, selectedSemester, token]);

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

      {/* Banner de advertencia si el docente no tiene materias asignadas */}
      {isTeacher && teacherCoursesLoaded && teacherCourses.length === 0 && (
        <div
          style={{
            marginBottom: '20px',
            background: 'var(--color-danger-bg, #fee2e2)',
            border: '1px solid var(--color-danger-border, #fca5a5)',
            color: 'var(--color-danger-text, #991b1b)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '24px' }}>⚠️</div>
          <div>
            <strong style={{ display: 'block', fontSize: '15px' }}>No tienes materias asignadas</strong>
            <span style={{ fontSize: '13px' }}>
              Actualmente tu cuenta de docente no tiene asignaturas asignadas en el sistema. Comunícate con un administrador para que configure tus materias.
            </span>
          </div>
        </div>
      )}

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

        {/* Selector de Materias: docentes solo ven sus asignadas */}
        {isTeacher ? (
          <select
            className="form-input"
            style={{ flex: '1 1 200px' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={teacherCourses.length === 0}
          >
            <option value="">
              {teacherCourses.length === 0
                ? 'Sin materias asignadas'
                : teacherCourses.length === 1
                ? 'Materia asignada'
                : `Todas mis materias asignadas (${teacherCourses.length})`}
            </option>
            {teacherCourses.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} {sub.semester ? `(Semestre ${sub.semester})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="form-input"
            style={{ flex: '1 1 200px' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">
              {isRestrictedStudent ? `Todas las materias (Semestre ${studentSemester}°)` : 'Todas las materias'}
            </option>
            {filteredSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} (Semestre {sub.semester})
              </option>
            ))}
          </select>
        )}

        {isTeacher ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(79, 70, 229, 0.12)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: '#818cf8',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
            title="Materias asignadas a tu cuenta de docente"
          >
            <span>👨‍🏫 Asignadas: {teacherCourses.length} materia{teacherCourses.length === 1 ? '' : 's'}</span>
          </div>
        ) : isRestrictedStudent ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
            title={`Restringido a tu semestre académico (${programTypeLabel})`}
          >
            <span>🎓 Mostrando: Semestre {studentSemester}° ({programTypeLabel})</span>
          </div>
        ) : (
          <select
            className="form-input"
            style={{ flex: '1 1 160px' }}
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Todos los semestres</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
              <option key={sem} value={sem}>
                Semestre {sem}
              </option>
            ))}
          </select>
        )}

        {(searchTerm || selectedSubject || (!isRestrictedStudent && selectedSemester)) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSubject('');
              if (!isRestrictedStudent) {
                setSelectedSemester('');
              }
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
            {isTeacher && teacherCourses.length === 0
              ? 'No tienes materias asignadas actualmente. Comunícate con un administrador para que configure tus asignaturas.'
              : isRestrictedStudent
              ? `Aún no hay apuntes disponibles para tu semestre actual (${studentSemester}°). ¡Sé el primero en subir uno!`
              : 'Sé el primero en subir un apunte para esta materia.'}
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
          onNoteUploaded={refreshNotes}
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
