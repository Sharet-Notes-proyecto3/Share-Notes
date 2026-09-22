// src/composables/useTeacherPermissions.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacher.service';

export function useTeacherPermissions() {
  const { user, token, isAdmin, isTeacher } = useAuth();
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    let isActive = true;
    if (token && (isTeacher || isAdmin)) {
      setLoadingCourses(true);
      teacherService
        .getTeacherCourses(token)
        .then((res) => {
          if (!isActive) return;
          const coursesList = Array.isArray(res) ? res : res?.data || [];
          setTeacherCourses(coursesList.map((c) => c.id || c.subject_id));
        })
        .catch((err) => {
          console.warn('Error al cargar materias asignadas al docente:', err.message);
        })
        .finally(() => {
          if (isActive) setLoadingCourses(false);
        });
    }
    return () => {
      isActive = false;
    };
  }, [token, isTeacher, isAdmin]);

  /**
   * Determina si el usuario actual puede verificar un apunte
   */
  const canVerify = (note) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!isTeacher) return false;
    if (note?.verified) return false; // Ya está verificado
    if (teacherCourses.length === 0) return true; // Si no hay restricción local, permitir y validar en backend (ABAC)
    return teacherCourses.includes(Number(note?.subject_id));
  };

  /**
   * Determina si el usuario actual puede cerrar un hilo de discusión
   */
  const canModerateThread = (thread) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!isTeacher) return false;
    if (thread?.is_closed) return false; // Ya está cerrado
    if (teacherCourses.length === 0) return true;
    return teacherCourses.includes(Number(thread?.subject_id));
  };

  /**
   * Determina si el usuario actual puede marcar una respuesta como solución oficial
   */
  const canMarkSolution = (thread, reply) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!isTeacher) return false;
    if (reply?.is_solution) return false; // Ya es solución
    if (teacherCourses.length === 0) return true;
    return teacherCourses.includes(Number(thread?.subject_id));
  };

  return {
    teacherCourses,
    loadingCourses,
    canVerify,
    canModerateThread,
    canMarkSolution,
    isTeacherOrAdmin: isTeacher || isAdmin,
  };
}

export default useTeacherPermissions;
