// src/middlewares/teacher.middleware.ts
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

/**
 * ABAC Middleware: isTeacherOfCourse
 * Valida que el usuario autenticado (docente) esté asignado a la asignatura
 * del recurso antes de permitir la verificación de apuntes, cierre de hilos o marcado de soluciones.
 * El rol 'admin' pasa siempre la verificación.
 */
export async function isTeacherOfCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // El rol Admin tiene bypass total
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'teacher') {
      res.status(403).json({ message: 'Acceso denegado: se requiere rol de docente' });
      return;
    }

    const teacherId = req.user.userId;
    let subjectId: number | undefined;

    // 1. Determinar el subjectId buscando primero la asignatura real del recurso en la DB (Previene ABAC Bypass / IDOR)
    const path = req.baseUrl + req.path;
    const resourceId = parseInt(req.params.id);

    if (!isNaN(resourceId)) {
      if (path.includes('/notes/')) {
        // Consultar apunte
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT subject_id FROM notes WHERE id = ? AND is_active = TRUE',
          [resourceId]
        );
        if (!rows[0]) {
          res.status(404).json({ message: 'Apunte no encontrado' });
          return;
        }
        subjectId = rows[0].subject_id;
      } else if (path.includes('/forum/posts/')) {
        // Consultar hilo del foro
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT subject_id FROM forum_threads WHERE id = ? AND is_active = TRUE',
          [resourceId]
        );
        if (!rows[0]) {
          res.status(404).json({ message: 'Hilo del foro no encontrado' });
          return;
        }
        subjectId = rows[0].subject_id;
      } else if (path.includes('/forum/answers/')) {
        // Consultar respuesta del foro y su hilo correspondiente
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT t.subject_id 
           FROM forum_replies r 
           JOIN forum_threads t ON r.thread_id = t.id 
           WHERE r.id = ? AND r.is_active = TRUE`,
          [resourceId]
        );
        if (!rows[0]) {
          res.status(404).json({ message: 'Respuesta del foro no encontrada' });
          return;
        }
        subjectId = rows[0].subject_id;
      }
    } else if (req.body && req.body.subjectId) {
      subjectId = parseInt(req.body.subjectId);
    } else if (req.query && req.query.subjectId) {
      subjectId = parseInt(req.query.subjectId as string);
    }

    if (!subjectId || isNaN(subjectId)) {
      res.status(400).json({ message: 'No se pudo determinar la asignatura del recurso' });
      return;
    }

    // 2. Verificar en la tabla teacher_courses la asignación docente-materia
    const [assignments] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM teacher_courses WHERE teacher_id = ? AND subject_id = ?',
      [teacherId, subjectId]
    );

    if (assignments.length === 0) {
      res.status(403).json({
        message: 'Acceso denegado: no estás asignado a la asignatura de este recurso',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
