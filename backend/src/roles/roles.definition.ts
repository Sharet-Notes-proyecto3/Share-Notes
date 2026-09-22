export type Role = 'student' | 'teacher' | 'moderator' | 'admin';

export type Permission =
  // Auth
  | 'auth:register'
  | 'auth:login'
  | 'auth:view_own_profile'
  | 'auth:edit_own_profile'

  // Apuntes
  | 'notes:upload'
  | 'notes:upload_unrestricted'
  | 'notes:download'
  | 'notes:search'
  | 'notes:delete_own'
  | 'notes:delete_any'
  | 'notes:verify'
  | 'notes:moderate_status'

  // Materias / carreras
  | 'subjects:view'
  | 'subjects:create'
  | 'careers:create'

  // Foro
  | 'forum:create_thread'
  | 'forum:reply'
  | 'forum:pin_thread'
  | 'forum:delete_own'
  | 'forum:delete_any'
  | 'forum:mark_solution'
  | 'forum:close_thread'
  | 'forum:moderate_delete'

  // Reportes
  | 'reports:create'
  | 'reports:view_all'
  | 'reports:resolve'
  | 'reports:dismiss'
  | 'reports:course_pdf'

  // Usuarios
  | 'users:view_list'
  | 'users:toggle_status'
  | 'users:assign_roles'
  | 'users:restrict'

  // Sanciones / Moderación
  | 'sanctions:apply_warning'
  | 'sanctions:apply_temp_ban'
  | 'sanctions:apply_perm_ban'
  | 'sanctions:view_history'
  | 'moderation:view_logs'

  // QR
  | 'qr:generate';

// ── Permisos por rol (Deduplicados y Optimizados) ──────────────────────────

const STUDENT_PERMISSIONS: Permission[] = [
  'auth:register',
  'auth:login',
  'auth:view_own_profile',
  'auth:edit_own_profile',
  'notes:upload',
  'notes:download',
  'notes:search',
  'notes:delete_own',
  'subjects:view',
  'forum:create_thread',
  'forum:reply',
  'forum:delete_own',
  'reports:create',
];

const TEACHER_PERMISSIONS: Permission[] = Array.from(
  new Set<Permission>([
    ...STUDENT_PERMISSIONS,
    'notes:verify',
    'forum:mark_solution',
    'forum:close_thread',
    'reports:course_pdf',
  ])
);

const MODERATOR_PERMISSIONS: Permission[] = Array.from(
  new Set<Permission>([
    ...STUDENT_PERMISSIONS,
    'reports:view_all',
    'reports:resolve',
    'reports:dismiss',
    'notes:moderate_status',
    'forum:moderate_delete',
    'users:restrict',
    'moderation:view_logs',
  ])
);

const ADMIN_PERMISSIONS: Permission[] = Array.from(
  new Set<Permission>([
    ...TEACHER_PERMISSIONS,
    ...MODERATOR_PERMISSIONS,
    'notes:upload_unrestricted',
    'notes:delete_any',
    'subjects:create',
    'forum:pin_thread',
    'forum:delete_any',
    'users:view_list',
    'users:toggle_status',
    'users:assign_roles',
    'sanctions:apply_warning',
    'sanctions:apply_temp_ban',
    'sanctions:apply_perm_ban',
    'sanctions:view_history',
    'careers:create',
    'qr:generate',
  ])
);

// Mapa de roles → lista deduplicada de permisos
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: STUDENT_PERMISSIONS,
  teacher: TEACHER_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

// Mapa O(1) precargado de Sets para búsqueda instantánea
export const ROLE_PERMISSION_SETS: Record<Role, Set<Permission>> = {
  student: new Set(STUDENT_PERMISSIONS),
  teacher: new Set(TEACHER_PERMISSIONS),
  moderator: new Set(MODERATOR_PERMISSIONS),
  admin: new Set(ADMIN_PERMISSIONS),
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  student: 1,
  teacher: 2,
  moderator: 2,
  admin: 3,
};
