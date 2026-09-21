export type Role = 'student' | 'admin';

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
  | 'notes:edit_own'

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

  // Reportes
  | 'reports:create'
  | 'reports:view_all'
  | 'reports:resolve'

  // Usuarios
  | 'users:view_list'
  | 'users:toggle_status'
  | 'users:assign_roles'

  // Sanciones
  | 'sanctions:apply_warning'
  | 'sanctions:apply_temp_ban'
  | 'sanctions:apply_perm_ban'
  | 'sanctions:view_history'

  // QR
  | 'qr:generate';

// ── Permisos por rol ──────────────────────────────────────────

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

const ADMIN_PERMISSIONS: Permission[] = [
  ...STUDENT_PERMISSIONS,
  'notes:upload_unrestricted',
  'notes:edit_own',
  'notes:delete_any',
  'subjects:create',
  'forum:pin_thread',
  'forum:delete_any',
  'reports:view_all',
  'reports:resolve',
  'users:view_list',
  'users:toggle_status',
  'users:assign_roles',
  'sanctions:apply_warning',
  'sanctions:apply_temp_ban',
  'sanctions:apply_perm_ban',
  'sanctions:view_history',
  'careers:create',
  'qr:generate',
];

// Mapa de roles → permisos 

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: STUDENT_PERMISSIONS,
  admin:   ADMIN_PERMISSIONS,
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  student: 1,
  admin:   2,
};

