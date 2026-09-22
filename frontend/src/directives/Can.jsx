// =============================================================================
// COMPONENTE WRAPPER CAN (EQUIVALENTE DE DIRECTIVA V-CAN PARA JSX)
// Referencia del Patrón: Ocultamiento de UI mediante [action, subject]
// =============================================================================

import { usePermissions } from '../composables/usePermissions';

/**
 * Componente Wrapper para ocultamiento condicional en UI
 * Uso: <Can do="view" on="admin">{children}</Can>
 */
export function Can({ do: action, on: subject, children }) {
  const { can } = usePermissions();

  if (!can(action, subject)) {
    return null; // Remueve el elemento del renderizado en el DOM
  }

  return children;
}

export default Can;
