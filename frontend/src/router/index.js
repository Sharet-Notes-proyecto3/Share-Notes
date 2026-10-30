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
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: 'ForbiddenView',
    meta: { public: true },
  },
  {
    path: '/not-found',
    name: 'NotFound',
    component: 'NotFoundView',
    meta: { public: true },
  },
  {
    path: '*',
    name: 'CatchAll',
    component: 'NotFoundView',
    meta: { public: true },
  },
];

/**
 * Función de Guard de Navegación de Rutas (equivalente a router.beforeEach de Vue Router)
 */
export async function beforeEachRouteGuard(to, from, next) {
  const target = to || {};
  const targetPath = target.path || target.fullPath || '/';

  if (!targetPath || targetPath === 'undefined') {
    if (typeof next === 'function') next({ path: '/not-found' });
    return false;
  }

  const routeExists = routes.some((route) => {
    if (route.path === '*') return true;
    if (route.path === targetPath) return true;
    if (route.path.includes(':') && targetPath.startsWith(route.path.split('/:')[0])) {
      return true;
    }
    return false;
  });

  if (!routeExists && targetPath !== '/forbidden' && targetPath !== '/not-found') {
    if (typeof next === 'function') next({ path: '/not-found' });
    return false;
  }

  if (target?.meta?.public || targetPath === '/forbidden' || targetPath === '/not-found') {
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

  
    // Evalúa el rol del usuario contra las autoridades requeridas (el admin pasa siempre)
  const role = (user.role || '').toString().toLowerCase();
  const hasPermission =
    requiredAuthorities.length === 0 ||
    role === 'admin' ||
    requiredAuthorities.some((a) => a.toString().toLowerCase() === role);

  if (hasPermission) {
    if (typeof next === 'function') next();
    return true;
  } else {
    // Si no está autenticado o no posee los permisos requeridos, redirigir
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

