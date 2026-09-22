// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: GESTIÓN DEL CATÁLOGO ACADÉMICO (NUEVO)
// Responsable: Integrante 4 (Jhonatan Muchavisoy — Panel de Administración & Catálogo)
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function AcademicCatalog() {
  const { token } = useAuth();
  const [careers, setCareers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formularios
  const [newCareerName, setNewCareerName] = useState('');
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    semester: '1',
    careerId: '',
  });

  // Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCareerFilter, setSelectedCareerFilter] = useState('');

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getCatalog(token);
      const careersList = data.careers || [];
      const subjectsList = data.subjects || [];

      setCareers(careersList);
      setSubjects(subjectsList);

      if (careersList.length > 0 && !subjectForm.careerId) {
        setSubjectForm((prev) => ({ ...prev, careerId: careersList[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar catálogo académico:', err);
      setError(err.message || 'No se pudo cargar el catálogo académico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCatalog();
    }
  }, [token]);

  const handleCreateCareer = async (e) => {
    e.preventDefault();
    if (!newCareerName.trim()) return;

    try {
      setError('');
      setSuccess('');
      const res = await adminService.createCareer(token, newCareerName.trim());
      setSuccess(res.message || 'Carrera creada exitosamente');
      setNewCareerName('');
      await loadCatalog();
    } catch (err) {
      setError(err.message || 'No se pudo crear la carrera.');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.careerId) return;

    try {
      setError('');
      setSuccess('');
      const res = await adminService.createSubject(token, {
        name: subjectForm.name.trim(),
        semester: parseInt(subjectForm.semester),
        careerId: parseInt(subjectForm.careerId),
      });
      setSuccess(res.message || 'Materia creada exitosamente');
      setSubjectForm((prev) => ({ ...prev, name: '' }));
      await loadCatalog();
    } catch (err) {
      setError(err.message || 'No se pudo crear la materia.');
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`¿Estás seguro de eliminar la materia "${subjectName}"?`)) return;

    try {
      setError('');
      setSuccess('');
      const res = await adminService.deleteSubject(token, subjectId);
      setSuccess(res.message || 'Materia eliminada');
      await loadCatalog();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la materia.');
    }
  };

  const handleDeleteCareer = async (careerId, careerName) => {
    if (!window.confirm(`¿Estás seguro de eliminar la carrera "${careerName}" y todas sus materias asociadas?`)) return;

    try {
      setError('');
      setSuccess('');
      const res = await adminService.deleteCareer(token, careerId);
      setSuccess(res.message || 'Carrera eliminada');
      await loadCatalog();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la carrera.');
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.career_name && s.career_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCareer = !selectedCareerFilter || String(s.career_id) === String(selectedCareerFilter);
      return matchesSearch && matchesCareer;
    });
  }, [subjects, searchTerm, selectedCareerFilter]);

  // Agrupar por semestres
  const subjectsBySemester = useMemo(() => {
    const grouped = {};
    for (let i = 1; i <= 10; i++) grouped[i] = [];
    filteredSubjects.forEach((s) => {
      const sem = s.semester || 1;
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(s);
    });
    return grouped;
  }, [filteredSubjects]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary, #94a3b8)' }}>
        ⏳ Cargando catálogo académico...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Mensajes de Estado */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#86efac',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
          }}
        >
          ✅ {success}
        </div>
      )}

      {/* Grid de Formularios de Creación */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Formulario 1: Nueva Carrera */}
        <div
          style={{
            background: 'var(--sidebar-bg, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎓 Registrar Nueva Carrera
          </h3>
          <form onSubmit={handleCreateCareer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                Nombre de la Carrera (Ej: Tecnológico o Ingeniería)
              </label>
              <input
                type="text"
                placeholder="Ej: Ingeniería de Software"
                value={newCareerName}
                onChange={(e) => setNewCareerName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-color, #3b82f6)',
                color: '#fff',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              + Añadir Carrera
            </button>
          </form>
        </div>

        {/* Formulario 2: Nueva Materia */}
        <div
          style={{
            background: 'var(--sidebar-bg, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📖 Asignar Nueva Materia
          </h3>
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Nombre de la Materia</label>
              <input
                type="text"
                placeholder="Ej: Estructura de Datos"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Semestre (1° - 10°)</label>
                <select
                  value={subjectForm.semester}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Semestre {i + 1}°
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Carrera</label>
                <select
                  value={subjectForm.careerId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, careerId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                >
                  {careers.length === 0 ? (
                    <option value="">Crea una carrera primero</option>
                  ) : (
                    careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={careers.length === 0}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: careers.length > 0 ? '#10b981' : '#475569',
                color: '#fff',
                fontWeight: '600',
                fontSize: '13px',
                cursor: careers.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              + Registrar Materia
            </button>
          </form>
        </div>
      </div>

      {/* Buscador y Filtro del Catálogo */}
      <div
        style={{
          background: 'var(--sidebar-bg, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar materia o carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              fontSize: '13px',
            }}
          />
          <select
            value={selectedCareerFilter}
            onChange={(e) => setSelectedCareerFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              fontSize: '13px',
            }}
          >
            <option value="">Todas las carreras</option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Total Materias: <strong style={{ color: '#60a5fa' }}>{filteredSubjects.length}</strong> | Total Carreras:{' '}
          <strong style={{ color: '#86efac' }}>{careers.length}</strong>
        </div>
      </div>

      {/* Listado de Carreras Registradas */}
      {careers.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Carreras activas:</span>
          {careers.map((c) => (
            <span
              key={c.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#93c5fd',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              🎓 {c.name}
              <button
                onClick={() => handleDeleteCareer(c.id, c.name)}
                title="Eliminar carrera"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '12px',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Malla por Semestres */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {[...Array(10)].map((_, index) => {
          const semNum = index + 1;
          const semSubjects = subjectsBySemester[semNum] || [];

          return (
            <div
              key={semNum}
              style={{
                background: 'var(--sidebar-bg, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: '8px',
                }}
              >
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>📌 Semestre {semNum}°</h4>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: semSubjects.length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: semSubjects.length > 0 ? '#86efac' : '#94a3b8',
                    fontWeight: '600',
                  }}
                >
                  {semSubjects.length} materias
                </span>
              </div>

              {semSubjects.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '8px 0' }}>
                  Sin materias asignadas.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {semSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{sub.name}</div>
                        {sub.career_name && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub.career_name}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: 'none',
                          color: '#fca5a5',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
