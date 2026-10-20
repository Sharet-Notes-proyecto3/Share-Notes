// frontend/src/components/admin/TeacherCourseAssignment.jsx
// Panel para que el Administrador asigne y gestione materias y semestres a los docentes
// Permite seleccionar el docente, definir su semestre y vincular sus asignaturas académicas

import { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/admin.service';

export default function TeacherCourseAssignment({ token, onAssignmentUpdated }) {
  // Lista de docentes y catálogo académico
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [careers, setCareers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Docente actualmente seleccionado para asignar
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [teacherSemester, setTeacherSemester] = useState('');
  const [assignedSubjectIds, setAssignedSubjectIds] = useState([]);

  // Filtros de navegación
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all'); // 'all' | 'unassigned' | 'assigned'
  const [filterCareerId, setFilterCareerId] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Estados de acción
  const [saving, setSaving] = useState(false);

  // Carga inicial de datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [catalogData, assignData] = await Promise.all([
        adminService.getCatalog(token),
        adminService.getTeacherAssignments(token),
      ]);

      const cList = catalogData.careers || [];
      const sList = catalogData.subjects || [];
      setCareers(cList);
      setAllSubjects(sList);

      const tList = assignData.teachers || [];
      const aList = assignData.assignments || [];
      setTeachers(tList);
      setAssignments(aList);

      if (cList.length > 0 && !filterCareerId) {
        setFilterCareerId(String(cList[0].id));
      }
    } catch (err) {
      console.error('Error al cargar datos de asignación docente:', err);
      setError(err.message || 'No se pudieron cargar los datos de asignación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Mapa de conteo de asignaturas por docente
  const teacherAssignmentsMap = useMemo(() => {
    const map = {};
    assignments.forEach((a) => {
      if (!map[a.teacher_id]) {
        map[a.teacher_id] = [];
      }
      map[a.teacher_id].push(a);
    });
    return map;
  }, [assignments]);

  // Métricas rápidas
  const stats = useMemo(() => {
    const total = teachers.length;
    let unassigned = 0;
    let assigned = 0;

    teachers.forEach((t) => {
      const count = (teacherAssignmentsMap[t.id] || []).length;
      if (count === 0) unassigned++;
      else assigned++;
    });

    return { total, unassigned, assigned };
  }, [teachers, teacherAssignmentsMap]);

  // Lista filtrada de docentes
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase());

      const count = (teacherAssignmentsMap[t.id] || []).length;
      if (teacherFilter === 'unassigned') {
        return matchesSearch && count === 0;
      }
      if (teacherFilter === 'assigned') {
        return matchesSearch && count > 0;
      }
      return matchesSearch;
    });
  }, [teachers, teacherSearch, teacherFilter, teacherAssignmentsMap]);

  // Datos del docente seleccionado actualmente
  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  // Semestres disponibles en la carrera del catálogo
  const availableSemesters = useMemo(() => {
    if (!filterCareerId) return [];
    const subjectsInCareer = allSubjects.filter(
      (s) => String(s.career_id || s.careerId) === String(filterCareerId)
    );
    return Array.from(
      new Set(subjectsInCareer.map((s) => Number(s.semester)).filter((sem) => !isNaN(sem) && sem > 0))
    ).sort((a, b) => a - b);
  }, [filterCareerId, allSubjects]);

  // Materias visibles en el panel de selección según carrera y semestre filtrado
  const visibleSubjects = useMemo(() => {
    if (!filterCareerId) return [];
    return allSubjects.filter((s) => {
      const matchCareer = String(s.career_id || s.careerId) === String(filterCareerId);
      if (!filterSemester) return matchCareer;
      return matchCareer && Number(s.semester) === Number(filterSemester);
    });
  }, [filterCareerId, filterSemester, allSubjects]);

  // Seleccionar un docente y precargar sus materias y semestre actuales
  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacherId(teacher.id);
    setTeacherSemester(teacher.semester !== null && teacher.semester !== undefined ? String(teacher.semester) : '');
    setError('');
    setSuccess('');

    try {
      const res = await adminService.getTeacherCourses(token, teacher.id);
      const courses = res.courses || [];
      const ids = courses.map((c) => c.id);
      setAssignedSubjectIds(ids);

      // Si el docente tiene un semestre en el catálogo de cursos pero no en users, tomarlo como sugerencia
      if ((!teacher.semester || teacher.semester === '') && courses.length > 0) {
        setTeacherSemester(String(courses[0].semester));
        if (courses[0].career_id) {
          setFilterCareerId(String(courses[0].career_id));
        }
        setFilterSemester(String(courses[0].semester));
      }
    } catch {
      // Fallback a los datos en caché local si la consulta falla
      const currentList = teacherAssignmentsMap[teacher.id] || [];
      setAssignedSubjectIds(currentList.map((a) => a.subject_id));
    }
  };

  // Toggle de materia individual
  const handleToggleSubject = (subjectId) => {
    setAssignedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  // Asignar todas las materias del semestre filtrado
  const handleSelectAllInVisible = () => {
    const visibleIds = visibleSubjects.map((s) => s.id);
    const allSelected = visibleIds.every((id) => assignedSubjectIds.includes(id));

    if (allSelected) {
      setAssignedSubjectIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setAssignedSubjectIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Remover materia desde el resumen
  const handleRemoveAssigned = (subjectId) => {
    setAssignedSubjectIds((prev) => prev.filter((id) => id !== subjectId));
  };

  // Guardar asignación
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTeacherId) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const parsedSemester = teacherSemester ? Number(teacherSemester) : null;
      await adminService.updateTeacherCourses(
        token,
        selectedTeacherId,
        assignedSubjectIds,
        parsedSemester
      );

      setSuccess(
        `¡Materias y semestre actualizados exitosamente para el docente ${selectedTeacher?.name || ''}!`
      );

      // Recargar datos y sincronizar con padre
      await loadData();
      if (onAssignmentUpdated) {
        onAssignmentUpdated();
      }
    } catch (err) {
      console.error('Error al guardar asignación de materias:', err);
      setError(err.message || 'No se pudieron guardar las materias del docente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Encabezado y Explicación */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '22px 24px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '20px' }}>
            👨‍🏫 Asignación de Materias y Semestre a Docentes
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '650px' }}>
            Configura las asignaturas académicas y el semestre para cada docente. Esto habilitará de inmediato la
            visualización de apuntes y verificación técnica en su cuenta de docente.
          </p>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--background-secondary, rgba(0,0,0,0.03))',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              minWidth: '85px',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Docentes</div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--color-success-bg, #ecfdf5)',
              border: '1px solid var(--color-success-border, #a7f3d0)',
              textAlign: 'center',
              minWidth: '85px',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-success-text, #065f46)' }}>
              {stats.assigned}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-success-text, #065f46)' }}>Configurados</div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: stats.unassigned > 0 ? 'var(--color-danger-bg, #fef2f2)' : 'var(--background-secondary, rgba(0,0,0,0.03))',
              border: stats.unassigned > 0 ? '1px solid var(--color-danger-border, #fecaca)' : '1px solid var(--border-color)',
              textAlign: 'center',
              minWidth: '95px',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: stats.unassigned > 0 ? 'var(--color-danger-text, #991b1b)' : 'var(--text-secondary)',
              }}
            >
              {stats.unassigned}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: stats.unassigned > 0 ? 'var(--color-danger-text, #991b1b)' : 'var(--text-secondary)',
              }}
            >
              Sin Materias ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Globales de Estado */}
      {error && (
        <div
          style={{
            background: 'var(--color-danger-bg, #fee2e2)',
            border: '1px solid var(--color-danger-border, #fca5a5)',
            color: 'var(--color-danger-text, #991b1b)',
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
            background: 'var(--color-success-bg, #d1fae5)',
            border: '1px solid var(--color-success-border, #6ee7b7)',
            color: 'var(--color-success-text, #065f46)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
          }}
        >
          🎉 {success}
        </div>
      )}

      {/* Layout Principal: Lista de Docentes (Izquierda) + Editor de Asignación (Derecha) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 360px) minmax(400px, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Columna Izquierda: Directorio de Docentes */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-primary)' }}>
              📋 Directorio de Docentes
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Selecciona un docente para ver o actualizar sus materias.
            </p>
          </div>

          {/* Buscador */}
          <input
            type="text"
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--background-secondary, transparent)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              marginBottom: '10px',
              boxSizing: 'border-box',
            }}
          />

          {/* Filtros rápidos de estado */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setTeacherFilter('all')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                background: teacherFilter === 'all' ? 'var(--primary-color)' : 'var(--background-secondary, #f3f4f6)',
                color: teacherFilter === 'all' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
              }}
            >
              Todos ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setTeacherFilter('unassigned')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                background: teacherFilter === 'unassigned' ? 'var(--color-danger-text, #b91c1c)' : 'var(--background-secondary, #f3f4f6)',
                color: teacherFilter === 'unassigned' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Sin materias ({stats.unassigned})
            </button>
            <button
              type="button"
              onClick={() => setTeacherFilter('assigned')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                background: teacherFilter === 'assigned' ? 'var(--color-success-text, #059669)' : 'var(--background-secondary, #f3f4f6)',
                color: teacherFilter === 'assigned' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Asignados ({stats.assigned})
            </button>
          </div>

          {/* Lista de Docentes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                ⏳ Cargando docentes...
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No se encontraron docentes con los filtros aplicados.
              </div>
            ) : (
              filteredTeachers.map((t) => {
                const assignedList = teacherAssignmentsMap[t.id] || [];
                const isSelected = t.id === selectedTeacherId;
                const hasNoCourses = assignedList.length === 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTeacher(t)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected
                        ? '2px solid var(--primary-color)'
                        : hasNoCourses
                        ? '1px solid var(--color-danger-border, #fca5a5)'
                        : '1px solid var(--border-color)',
                      background: isSelected
                        ? 'var(--primary-bg, rgba(14, 165, 233, 0.08))'
                        : hasNoCourses
                        ? 'var(--color-danger-bg, #fff5f5)'
                        : 'var(--card-bg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {t.name}
                      </strong>
                      {hasNoCourses ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#fee2e2',
                            color: '#991b1b',
                          }}
                        >
                          ⚠️ Sin materias
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#d1fae5',
                            color: '#065f46',
                          }}
                        >
                          {assignedList.length} {assignedList.length === 1 ? 'materia' : 'materias'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {t.email}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {t.semester ? (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'var(--background-secondary, #e5e7eb)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Semestre {t.semester}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Semestre: N/A
                        </span>
                      )}

                      <span style={{ fontSize: '11px', color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)', marginLeft: 'auto', fontWeight: '600' }}>
                        {isSelected ? '● Editando' : 'Configurar →'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Panel de Configuración y Asignación */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '22px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {!selectedTeacher ? (
            <div
              style={{
                padding: '80px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>👈</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '17px' }}>
                Selecciona un Docente del Directorio
              </h3>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '380px', marginInline: 'auto' }}>
                Haz clic en cualquier docente de la lista para gestionar sus materias asignadas y configurar su semestre.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* Tarjeta del Docente Activo */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--background-secondary, rgba(0,0,0,0.03))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase' }}>
                    Docente Seleccionado
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {selectedTeacher.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedTeacher.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTeacherId(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cambiar docente
                </button>
              </div>

              {/* Advertencia si no tiene materias asignadas actualmente */}
              {assignedSubjectIds.length === 0 && (
                <div
                  style={{
                    marginBottom: '20px',
                    background: 'var(--color-danger-bg, #fee2e2)',
                    border: '1px solid var(--color-danger-border, #fca5a5)',
                    color: 'var(--color-danger-text, #991b1b)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong>Cuenta sin materias configuradas:</strong>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>
                      Actualmente este docente ve la alerta <em>"No tienes materias asignadas"</em> y no puede interactuar con apuntes ni foros. Selecciona al menos una materia para habilitar su acceso.
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 1: Configurar Semestre del Docente */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  1. Semestre Académico Asignado al Docente
                </label>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Indica el semestre lectivo principal o nivel curricular asignado al docente.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={teacherSemester}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeacherSemester(val);
                      if (val) setFilterSemester(val);
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--background-secondary, transparent)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">-- Sin semestre asignado / General --</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                      <option key={sem} value={sem}>
                        Semestre {sem}
                      </option>
                    ))}
                  </select>

                  {teacherSemester && (
                    <button
                      type="button"
                      onClick={() => setTeacherSemester('')}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Paso 2: Filtro y Selección de Materias en Cascada */}
              <div
                style={{
                  background: 'var(--background-secondary, rgba(0,0,0,0.02))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    2. Catálogo de Materias Disponibles
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Filtra por carrera y semestre para marcar las materias que impartirá el docente.
                  </p>
                </div>

                {/* Filtros Carrera y Semestre */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      Carrera Académica
                    </label>
                    <select
                      value={filterCareerId}
                      onChange={(e) => setFilterCareerId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    >
                      {careers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      Filtrar por Semestre
                    </label>
                    <select
                      value={filterSemester}
                      onChange={(e) => setFilterSemester(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    >
                      <option value="">Todas las materias de la carrera</option>
                      {availableSemesters.map((sem) => (
                        <option key={sem} value={sem}>
                          Semestre {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Encabezado de materias visibles y botón de selección masiva */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Materias Disponibles ({visibleSubjects.length})
                  </span>

                  {visibleSubjects.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllInVisible}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-color)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        padding: 0,
                      }}
                    >
                      {visibleSubjects.every((s) => assignedSubjectIds.includes(s.id))
                        ? 'Desmarcar todas las visibles'
                        : `Seleccionar todas ${filterSemester ? `de Semestre ${filterSemester}` : 'las visibles'}`}
                    </button>
                  )}
                </div>

                {/* Lista de Checkboxes de Materias */}
                {visibleSubjects.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    No se encontraron materias registradas para este filtro.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '8px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      padding: '2px',
                    }}
                  >
                    {visibleSubjects.map((s) => {
                      const isChecked = assignedSubjectIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                            background: isChecked ? 'var(--primary-bg, rgba(14, 165, 233, 0.1))' : 'var(--card-bg)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSubject(s.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              Semestre {s.semester}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Paso 3: Resumen de Materias que Quedarán Asignadas */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    3. Resumen de Materias que Tendrá el Docente ({assignedSubjectIds.length})
                  </label>
                  {assignedSubjectIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssignedSubjectIds([])}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger-text, #dc2626)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Vaciar todas
                    </button>
                  )}
                </div>

                {assignedSubjectIds.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '6px 0' }}>
                    Ninguna materia seleccionada actualmente.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {assignedSubjectIds.map((sid) => {
                      const found = allSubjects.find((s) => s.id === sid);
                      return (
                        <span
                          key={sid}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--primary-bg, rgba(14, 165, 233, 0.12))',
                            border: '1px solid var(--primary-color)',
                            color: 'var(--text-primary)',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          <span>{found ? found.name : `Materia #${sid}`}</span>
                          {found?.semester && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: 'var(--card-bg)',
                                padding: '1px 5px',
                                borderRadius: '10px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              Sem {found.semester}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAssigned(sid)}
                            title="Quitar materia"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-danger-text, #ef4444)',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              padding: 0,
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón de Guardado */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: 'var(--primary-contrast, #ffffff)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? '⏳ Guardando Asignación...' : `💾 Guardar Asignación para ${selectedTeacher.name}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
