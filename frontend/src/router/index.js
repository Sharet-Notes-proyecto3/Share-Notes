// =============================================================================
// ENRUTADOR Y GUARD DE RUTAS DE NAVEGACIÓN (ROUTE GUARD)
// Intercepción beforeEach basada en autenticación pura y roles
// =============================================================================

import { getStoredToken, getStoredUser } from '../services/api';

/**
 * Definición de rutas con metadatos de autoridades requeridas
 */
export const routes = [
  {
    path: '/',
    name: 'Home',
    component: 'NotesGrid',
    meta: { public: true },
  },
  {
    path: '/notes',
    name: 'Notes',
    component: 'NotesGrid',
    meta: { authorities: ['student', 'teacher', 'moderator', 'admin'] },
  },
  {
    path: '/forum',
    name: 'Forum',
    component: 'ForumView',
    meta: { authorities: ['student', 'teacher', 'moderator', 'admin'] },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: 'AdminView',
    meta: { authorities: ['admin'] },
  },
  {
    path: '/teacher/courses/:courseId/dashboard',
    name: 'TeacherDashboard',
    component: 'TeacherDashboard',
    meta: { authorities: ['teacher', 'admin'] },
  },
  {
    path: '/moderator/dashboard',
    name: 'ModeratorDashboard',
    component: 'ModeratorDashboard',
    meta: { authorities: ['moderator', 'admin'] },
  },
  {
    path: '/moderator/reports',
    name: 'ModeratorReports',
    component: 'ModeratorDashboard',
    meta: { authorities: ['moderator', 'admin'] },
  },
  {
    path: '/moderator/logs',
    name: 'ModeratorLogs',
    component: 'ModeratorDashboard',
    meta: { authorities: ['moderator', 'admin'] },
  },
];

/**
 * Función de Guard de Navegación de Rutas
 */
export async function beforeEachRouteGuard(to, from, next) {
  // Si la ruta es pública, permitir navegación libre
  if (to?.meta?.public) {
    if (typeof next === 'function') next();
    return true;
  }

  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    const redirectTarget = { name: 'Home', query: { redirect: to?.fullPath || '/' } };
    if (typeof next === 'function') next(redirectTarget);
    return false;
  }

  const requiredAuthorities = to?.meta?.authorities || [];
  if (requiredAuthorities.length === 0) {
    if (typeof next === 'function') next();
    return true;
  }

  const userRole = (user?.role || '').toString().toLowerCase();
  const hasPermission =
    userRole === 'admin' ||
    requiredAuthorities.map((a) => a.toString().toLowerCase()).includes(userRole);

  if (hasPermission) {
    if (typeof next === 'function') next();
    return true;
  } else {
    // Si no posee los permisos requeridos, redirigir
    const redirectTarget = { name: 'Home', query: { redirect: to?.fullPath || '/' } };
    if (typeof next === 'function') next(redirectTarget);
    return false;
  }
}

export const router = {
  routes,
  beforeEach: beforeEachRouteGuard,
};

export default router;
