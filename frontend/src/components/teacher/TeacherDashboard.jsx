// src/components/teacher/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notesService } from '../../services/notes.service';
import CourseReportGenerator from './CourseReportGenerator';
import NoteVerifyButton from './NoteVerifyButton';
import VerifiedBadge from './VerifiedBadge';

export default function TeacherDashboard({ courseIdProp }) {
  const { token, user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdProp || '');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    notesService
      .getSubjects(token)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setSubjects(list);
        if (!selectedCourseId && list.length > 0) {
          setSelectedCourseId(list[0].id);
        }
      })
      .catch((err) => console.error('Error al cargar materias:', err));
  }, [token, selectedCourseId]);

  useEffect(() => {
    if (!token || !selectedCourseId) return;
    let isMounted = true;
    setLoading(true);
    notesService
      .getNotes(token, selectedCourseId)
      .then((res) => {
        if (isMounted) setNotes(Array.isArray(res) ? res : res?.data || []);
      })
      .catch((err) => console.error('Error al cargar apuntes del curso:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, selectedCourseId]);

  const refreshNotes = () => {
    if (!selectedCourseId) return;
    notesService.getNotes(token, selectedCourseId).then((res) => {
      setNotes(Array.isArray(res) ? res : res?.data || []);
    });
  };

  const selectedSubjectObj = subjects.find((s) => Number(s.id) === Number(selectedCourseId));

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '24px' }}>👩‍🏫 Panel de Control Docente</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Bienvenido, <strong>{user?.name || 'Docente'}</strong>. Administra la certificación de recursos y métricas de tus asignaturas.
          </p>
        </div>

        {subjects.length > 0 && (
          <select
            className="form-input"
            style={{ minWidth: '240px' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                📖 {sub.name} (Semestre {sub.semester})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Generador de Reportes PDF */}
      <CourseReportGenerator subjects={subjects} selectedCourseId={selectedCourseId} />

      {/* Resumen del Curso */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '18px' }}>
          Gestión de Apuntes — {selectedSubjectObj ? selectedSubjectObj.name : 'Asignatura Seleccionada'}
        </h3>
        <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Examina los apuntes cargados por los estudiantes y marca como <strong>Recurso Verificado</strong> aquellos con valor pedagógico destacado.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>⏳ Cargando recursos del curso...</p>
        ) : notes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No hay apuntes registrados en esta asignatura.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    {note.verified ? <VerifiedBadge /> : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pendiente de verificación</span>}
                  </div>
                  <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '15px' }}>{note.title}</h4>
                  <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>{note.description || 'Sin descripción'}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>👤 Estudiante: {note.uploader_name || 'Compañero'}</div>
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  {!note.verified && <NoteVerifyButton note={note} onVerified={refreshNotes} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
