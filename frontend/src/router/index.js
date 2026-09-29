// =============================================================================
// ENRUTADOR Y GUARD DE RUTAS DE NAVEGACIÓN (VUE ROUTER GUARD / ROUTE GUARD)
// Referencia del Patrón: Intercepción beforeEach con hasAnyAuthorityAndCheckAuth()
// =============================================================================

import { accountService } from '../services/account.service';

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
 * Función de Guard de Navegación de Rutas (equivalente a router.beforeResolve)
 * Bloquea rutas no encontradas y deniega acceso si el usuario no tiene permisos.
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

  const requiredAuthorities = target?.meta?.authorities || [];
  const hasPermission = await accountService.hasAnyAuthorityAndCheckAuth(requiredAuthorities);

  if (hasPermission) {
    if (typeof next === 'function') next();
    return true;
  }

  if (typeof next === 'function') {
    next({ path: '/forbidden', query: { redirect: targetPath } });
  }

  return false;
}

export const router = {
  routes,
  beforeEach: beforeEachRouteGuard,
};

export default router;
