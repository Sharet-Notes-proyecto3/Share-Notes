// =============================================================================
// DIRECTIVA GLOBAL V-CAN (OCULTAMIENTO CONDICIONAL EN EL DOM)
// Referencia del Patrón: Recibe binding.value = [action, subject]
// Si !can(action, subject), elimina el nodo del DOM (el.parentNode.removeChild(el))
// =============================================================================

import { usePermissions } from '../composables/usePermissions';

/**
 * Lógica de la directiva v-can para Vue / Manipulador de Nodos DOM
 * Ejemplo de uso en template: v-can="['create', 'pqrs']" o v-can="['view', 'admin']"
 */
export const canDirective = {
  mounted(el, binding) {
    checkPermission(el, binding);
  },
  updated(el, binding) {
    checkPermission(el, binding);
  },
};

function checkPermission(el, binding) {
  const value = binding.value;

  if (!Array.isArray(value) || value.length < 2) {
    console.warn('v-can requiere un arreglo con formato [action, subject]');
    return;
  }

  const [action, subject] = value;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { can } = usePermissions();

  const hasPermission = can(action, subject);

  if (!hasPermission) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    } else {
      el.style.display = 'none';
    }
  } else {
    el.style.display = '';
  }
}

export default canDirective;
