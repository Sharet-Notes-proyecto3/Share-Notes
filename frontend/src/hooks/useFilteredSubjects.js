// frontend/src/hooks/useFilteredSubjects.js
// Hook compartido para filtrado académico de materias según rol y semestre
// Responsable: Integrante 2 (Apuntes, Materias y Restricciones Académicas)

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function useFilteredSubjects(subjects = []) {
  const { user } = useAuth();

  const isStudent = (user?.role || '').toLowerCase() === 'student';
  const rawSemester = user?.semester;
  const programType = user?.program_type || user?.programType || null;

  const hasAcademicProfile =
    Boolean(programType) &&
    rawSemester !== null &&
    rawSemester !== undefined &&
    rawSemester !== '';

  const isRestrictedStudent = isStudent && hasAcademicProfile;
  const studentSemester = isRestrictedStudent ? Number(rawSemester) : null;
  const programTypeLabel = programType === 'ingenieria' ? 'Ingeniería' : 'Tecnólogo';

  const filteredSubjects = useMemo(() => {
    if (isRestrictedStudent && studentSemester) {
      return (subjects || []).filter((sub) => Number(sub.semester) === studentSemester);
    }
    return subjects || [];
  }, [subjects, isRestrictedStudent, studentSemester]);

  const hasNoSubjectsForSemester = isRestrictedStudent && filteredSubjects.length === 0;

  const isSubjectAllowed = (subjectId) => {
    if (!isRestrictedStudent) return true;
    return filteredSubjects.some((s) => String(s.id) === String(subjectId));
  };

  return {
    filteredSubjects,
    isStudent,
    hasAcademicProfile,
    isRestrictedStudent,
    studentSemester,
    programType,
    programTypeLabel,
    hasNoSubjectsForSemester,
    isSubjectAllowed,
  };
}

export default useFilteredSubjects;
