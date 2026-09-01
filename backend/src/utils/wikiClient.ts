// src/utils/wikiClient.ts
// Cliente para búsqueda de artículos relacionados en la wiki/base de conocimiento

import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

/**
 * Busca artículos relacionados (notas y/o hilos del foro) basados en un término de búsqueda.
 * Esto ayuda a los admins a verificar referencias de contenido reportado.
 * @param searchQuery - Término de búsqueda (palabra clave)
 * @param limit - Número máximo de resultados (default: 10)
 */
export async function getRelatedArticle(searchQuery: string, limit: number = 10) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return { success: false, data: [], message: 'El término de búsqueda no puede estar vacío' };
  }

  const query = searchQuery.trim().toLowerCase();
  const searchTerm = `%${query}%`;

  try {
    // Búsqueda en notas
    const [notesRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id, 
        title, 
        subject, 
        'note' AS type, 
        created_at, 
        user_id,
        is_active
      FROM notes 
      WHERE (title LIKE ? OR subject LIKE ?) AND is_active = TRUE
      LIMIT ?`,
      [searchTerm, searchTerm, limit]
    );

    // Búsqueda en hilos del foro
    const [threadsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id, 
        title AS title, 
        content AS subject, 
        'forum_thread' AS type, 
        created_at, 
        user_id,
        is_active
      FROM forum_threads 
      WHERE (title LIKE ? OR content LIKE ?) AND is_active = TRUE
      LIMIT ?`,
      [searchTerm, searchTerm, limit]
    );

    // Búsqueda en respuestas del foro
    const [repliesRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        r.id, 
        t.title AS title, 
        r.content AS subject, 
        'forum_reply' AS type, 
        r.created_at, 
        r.user_id,
        r.is_active
      FROM forum_replies r
      JOIN forum_threads t ON r.thread_id = t.id
      WHERE (t.title LIKE ? OR r.content LIKE ?) AND r.is_active = TRUE
      LIMIT ?`,
      [searchTerm, searchTerm, limit]
    );

    const allResults = [...notesRows, ...threadsRows, ...repliesRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      success: true,
      data: allResults,
      count: allResults.length,
      message: `Se encontraron ${allResults.length} artículos relacionados con: "${query}"`,
    };
  } catch (error) {
    console.error('[Wiki Search Error]', error);
    return {
      success: false,
      data: [],
      message: 'Error al buscar artículos relacionados',
    };
  }
}
