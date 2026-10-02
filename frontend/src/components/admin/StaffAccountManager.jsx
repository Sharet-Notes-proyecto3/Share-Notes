// frontend/src/components/admin/StaffAccountManager.jsx
// Panel para que el Administrador cree cuentas de Docente o Moderador
// con selección en cascada (Carrera -> Semestre -> Materias) y generación de credenciales

import { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/admin.service';

export default function StaffAccountManager({ token, onAccountCreated }) {
  // Estado del formulario básico
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('teacher'); // 'teacher' | 'moderator'

  // Catálogo académico para cascada
  const [careers, setCareers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Selección en cascada
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Estados de control de flujo
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState(null); // Guarda datos para la tarjeta de éxito
  const [copied, setCopied] = useState(false);

  // Cargar catálogo de carreras y materias
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        setError('');
        const data = await adminService.getCatalog(token);
        if (isMounted) {
          const cList = data.careers || [];
          const sList = data.subjects || [];
          setCareers(cList);
          setAllSubjects(sList);
          if (cList.length > 0) {
            setSelectedCareerId(String(cList[0].id));
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error al cargar catálogo de carreras y materias');
        }
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    }

    if (token) {
      loadCatalog();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Semestres disponibles según la carrera seleccionada
  const availableSemesters = useMemo(() => {
    if (!selectedCareerId) return [];
    const subjectsInCareer = allSubjects.filter(
      (s) => String(s.career_id || s.careerId) === String(selectedCareerId)
    );
    const uniqueSemesters = Array.from(
      new Set(subjectsInCareer.map((s) => Number(s.semester)).filter((sem) => !isNaN(sem) && sem > 0))
    ).sort((a, b) => a - b);
    return uniqueSemesters;
  }, [selectedCareerId, allSubjects]);

  // Actualizar semestre seleccionado por defecto al cambiar de carrera
  useEffect(() => {
    if (availableSemesters.length > 0) {
      if (!selectedSemester || !availableSemesters.includes(Number(selectedSemester))) {
        setSelectedSemester(String(availableSemesters[0]));
      }
    } else {
      setSelectedSemester('');
    }
  }, [availableSemesters, selectedSemester]);

  // Materias del nivel 3 (Carrera + Semestre actuales)
  const currentSemesterSubjects = useMemo(() => {
    if (!selectedCareerId || !selectedSemester) return [];
    return allSubjects.filter(
      (s) =>
        String(s.career_id || s.careerId) === String(selectedCareerId) &&
        Number(s.semester) === Number(selectedSemester)
    );
  }, [selectedCareerId, selectedSemester, allSubjects]);

  // Generador de contraseñas seguras aleatorias
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  // Toggle materia específica
  const handleToggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  // Seleccionar / deseleccionar todas las materias del semestre activo
  const handleSelectAllInSemester = () => {
    const idsInCurrent = currentSemesterSubjects.map((s) => s.id);
    const allSelected = idsInCurrent.every((id) => selectedSubjectIds.includes(id));
    if (allSelected) {
      setSelectedSubjectIds((prev) => prev.filter((id) => !idsInCurrent.includes(id)));
    } else {
      setSelectedSubjectIds((prev) => Array.from(new Set([...prev, ...idsInCurrent])));
    }
  };

  // Remover materia desde el resumen
  const handleRemoveSubject = (subjectId) => {
    setSelectedSubjectIds((prev) => prev.filter((id) => id !== subjectId));
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!name.trim() || name.trim().length < 2) {
      setError('El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Ingresa un correo electrónico institucional válido.');
      return;
    }

    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (role === 'teacher' && selectedSubjectIds.length === 0) {
      setError('Debes asignar al menos una materia al docente para su seguimiento académico.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        subjectIds: role === 'teacher' ? selectedSubjectIds : [],
      };

      const result = await adminService.createStaffAccount(token, payload);

      // Mapear nombres de materias asignadas para la tarjeta de éxito
      const assignedSubjectsDetails = selectedSubjectIds.map((sid) => {
        const found = allSubjects.find((s) => s.id === sid);
        return found ? found.name : `Materia #${sid}`;
      });

      setCreatedAccount({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        assignedSubjectsDetails,
        id: result?.id,
      });

      if (onAccountCreated) {
        onAccountCreated();
      }
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta de personal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copiar credenciales al portapapeles
  const handleCopyCredentials = () => {
    if (!createdAccount) return;
    const text = `Credenciales de Acceso - ShareNotes\n` +
      `Nombre: ${createdAccount.name}\n` +
      `Rol: ${createdAccount.role === 'teacher' ? 'Docente' : 'Moderador'}\n` +
      `Email: ${createdAccount.email}\n` +
      `Contraseña temporal: ${createdAccount.password}\n` +
      (createdAccount.role === 'teacher'
        ? `Materias Asignadas:\n - ${createdAccount.assignedSubjectsDetails.join('\n - ')}\n`
        : '') +
      `\nEnlace de acceso: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Reset para crear otra cuenta
  const handleReset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('teacher');
    setSelectedSubjectIds([]);
    setCreatedAccount(null);
    setError('');
  };

  // Tarjeta de éxito si la cuenta fue creada
  if (createdAccount) {
    return (
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: 'var(--card-shadow)',
          maxWidth: '680px',
          margin: '0 auto',
        }}
        className="animate-fade-in"
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '20px' }}>
            ¡Cuenta de {createdAccount.role === 'teacher' ? 'Docente' : 'Moderador'} Creada Exitosamente!
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Entrega estas credenciales al usuario para que pueda acceder inmediatamente al sistema.
          </p>
        </div>

        <div
          style={{
            background: 'var(--background-secondary, rgba(0,0,0,0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Rol: </strong>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                background:
                  createdAccount.role === 'teacher'
                    ? 'rgba(79, 70, 229, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                color:
                  createdAccount.role === 'teacher'
                    ? '#4f46e5'
                    : '#d97706',
              }}
            >
              {createdAccount.role === 'teacher' ? '👨‍🏫 Docente' : '🛡️ Moderador'}
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Nombre: </strong>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{createdAccount.name}</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Email: </strong>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{createdAccount.email}</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Contraseña: </strong>
            <span
              style={{
                color: 'var(--primary-color)',
                fontWeight: 'bold',
                background: 'rgba(0,0,0,0.05)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {createdAccount.password}
            </span>
          </div>

          {createdAccount.role === 'teacher' && (
            <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>
                Materias Asignadas ({createdAccount.assignedSubjectsDetails.length}):
              </strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0, color: 'var(--text-primary)' }}>
                {createdAccount.assignedSubjectsDetails.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleCopyCredentials}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: copied ? 'var(--color-success-bg, #10b981)' : 'var(--primary-color)',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? '✅ ¡Credenciales Copiadas!' : '📋 Copiar Credenciales'}
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ➕ Crear Otra Cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--card-shadow)',
        maxWidth: '850px',
        margin: '0 auto',
      }}
      className="animate-fade-in"
    >
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '18px' }}>
          👔 Provisión de Cuentas de Personal (Docentes y Moderadores)
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
          Crea credenciales oficiales para docentes y moderadores. Asigna con precisión las materias que cada docente tendrá autorizadas para ver y verificar.
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '20px',
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

      <form onSubmit={handleSubmit}>
        {/* Sección 1: Datos Básicos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Nombre */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Prof. Roberto Morales"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background-secondary, transparent)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              Correo Institucional *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@uniputumayo.edu.co"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background-secondary, transparent)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Contraseña */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                Contraseña Inicial *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-color)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ⚡ Generar segura
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--background-secondary, transparent)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Rol */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              Rol de Personal *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background-secondary, transparent)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option value="teacher">👨‍🏫 Docente (Requiere materias)</option>
              <option value="moderator">🛡️ Moderador de Contenido</option>
            </select>
          </div>
        </div>

        {/* Sección 2: Selección en Cascada para Docente */}
        {role === 'teacher' && (
          <div
            style={{
              background: 'var(--background-secondary, rgba(0,0,0,0.02))',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '15px' }}>
                📚 Asignación de Materias en Cascada
              </h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                Filtra por carrera y semestre para marcar las materias exactas asignadas al docente.
              </p>
            </div>

            {loadingCatalog ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                ⏳ Cargando catálogo de materias...
              </div>
            ) : (
              <>
                {/* Selectores de Nivel 1 y 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  {/* Nivel 1: Carrera */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      1. Carrera Académica
                    </label>
                    <select
                      value={selectedCareerId}
                      onChange={(e) => setSelectedCareerId(e.target.value)}
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

                  {/* Nivel 2: Semestre */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      2. Semestre
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      disabled={availableSemesters.length === 0}
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
                      {availableSemesters.length === 0 ? (
                        <option value="">Sin semestres registrados</option>
                      ) : (
                        availableSemesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semestre {sem}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Nivel 3: Materias del semestre */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      3. Materias Disponibles en Semestre {selectedSemester || '-'}
                    </label>
                    {currentSemesterSubjects.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllInSemester}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary-color)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          padding: 0,
                        }}
                      >
                        {currentSemesterSubjects.every((s) => selectedSubjectIds.includes(s.id))
                          ? 'Desmarcar todas de este semestre'
                          : 'Seleccionar todas de este semestre'}
                      </button>
                    )}
                  </div>

                  {currentSemesterSubjects.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      No hay materias registradas en esta carrera y semestre.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '8px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        padding: '4px',
                      }}
                    >
                      {currentSemesterSubjects.map((s) => {
                        const isChecked = selectedSubjectIds.includes(s.id);
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
                              background: isChecked ? 'rgba(79, 70, 229, 0.08)' : 'var(--card-bg)',
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
                            <span style={{ color: 'var(--text-primary)', fontWeight: isChecked ? '600' : 'normal' }}>
                              {s.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resumen Global de Materias Seleccionadas */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      Total Asignadas al Docente: {selectedSubjectIds.length} materia(s)
                    </span>
                    {selectedSubjectIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectIds([])}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-danger-text, #ef4444)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          padding: 0,
                        }}
                      >
                        Limpiar todas
                      </button>
                    )}
                  </div>

                  {selectedSubjectIds.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      (Aún no has seleccionado materias para este docente)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedSubjectIds.map((sid) => {
                        const s = allSubjects.find((sub) => sub.id === sid);
                        return (
                          <span
                            key={sid}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(79, 70, 229, 0.15)',
                              color: 'var(--primary-color)',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            {s ? s.name : `Materia #${sid}`}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(sid)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '14px',
                                lineHeight: 1,
                              }}
                              title="Remover"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón de Envío */}
        <div style={{ textAlign: 'right' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary-color)',
              color: 'var(--primary-contrast, #ffffff)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '⏳ Creando Cuenta...' : `✨ Crear Cuenta de ${role === 'teacher' ? 'Docente' : 'Moderador'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
