// =============================================================================
// IT-FE-01 — PRUEBA DE INTEGRACIÓN: FLUJO DE LOGIN Y AUTENTICACIÓN (FRONTEND)
//
// ¿Para qué sirve?
//   Verificar que las capas del frontend trabajan juntas de punta a punta:
//   AuthModal (formulario) -> AuthContext (estado de sesión)
//   -> auth.service (validación/normalización) -> api.js (fetch + almacenamiento)
//
// ¿Qué se simula?
//   SOLO el servidor (fetch). Todo lo demás es código real, sin mocks.
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';


function EstadoSesion() {
  const { isAuthenticated, user } = useAuth();
  return (
    <p data-testid="estado-sesion">
      {isAuthenticated ? `Sesión activa: ${user.name}` : 'Sin sesión'}
    </p>
  );
}


const respuestaJson = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'application/json' },
  json: async () => body,
});

const usuarioBackend = {
  id: 1,
  name: 'Ana Pérez',
  email: 'ana@uni.edu.co',
  role: 'student',
  program_type: 'tecnologo', 
  semester: 3,
};

describe('IT-FE-01 | Flujo de login y autenticación', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('inicia sesión: el formulario llama al backend, guarda el token y actualiza el contexto', async () => {
    fetch.mockResolvedValueOnce(
      respuestaJson({ token: 'token-jwt-falso', user: usuarioBackend })
    );

    render(
      <AuthProvider>
        <AuthModal />
        <EstadoSesion />
      </AuthProvider>
    );

    
    expect(screen.getByTestId('estado-sesion')).toHaveTextContent('Sin sesión');

    
    await userEvent.type(screen.getByLabelText(/Correo electrónico/), '  Ana@Uni.edu.co ');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/), 'Clave1234');

    
    await userEvent.click(screen.getByRole('button', { name: /Ingresar a ShareNotes/ }));

    await waitFor(() =>
      expect(screen.getByTestId('estado-sesion')).toHaveTextContent('Sesión activa: Ana Pérez')
    );

    
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({
      email: 'ana@uni.edu.co',
      password: 'Clave1234',
    });

    expect(localStorage.getItem('jhi-authenticationToken')).toBe('token-jwt-falso');
    expect(JSON.parse(localStorage.getItem('jhi-userAccount')).email).toBe('ana@uni.edu.co');
  });

  it('muestra error con credenciales incorrectas y no crea sesión', async () => {
    fetch.mockResolvedValueOnce(
      respuestaJson({ message: 'Credenciales incorrectas' }, 401)
    );

    render(
      <AuthProvider>
        <AuthModal />
        <EstadoSesion />
      </AuthProvider>
    );

    await userEvent.type(screen.getByLabelText(/Correo electrónico/), 'ana@uni.edu.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña$/), 'incorrecta');
    await userEvent.click(screen.getByRole('button', { name: /Ingresar a ShareNotes/ }));

    
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();

   
    expect(screen.getByTestId('estado-sesion')).toHaveTextContent('Sin sesión');
    expect(localStorage.getItem('jhi-authenticationToken')).toBeNull();
  });
});
