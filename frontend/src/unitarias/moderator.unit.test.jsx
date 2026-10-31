// =============================================================================
// PRUEBAS UNITARIAS — MÓDULO DE MODERADOR (FRONTEND)
// Responsable: Jairo Andres Botina Valencia
// Archivo: frontend/src/unitarias/moderator.unit.test.jsx
//
// Runner del proyecto: Vitest (API compatible con Jest) + React Testing Library.
// Aislamiento: se mockean AuthContext y moderationService. No hay fetch real.
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModeratorDashboard from '../components/moderator/ModeratorDashboard';
import { useAuth } from '../context/AuthContext';
import { moderationService } from '../services/moderationService';

// --- Aislamiento de dependencias externas -----------------------------------

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/moderationService', () => ({
  moderationService: {
    getReportsQueue: vi.fn(),
    resolveReport: vi.fn(),
    dismissReport: vi.fn(),
    moderateNote: vi.fn(),
    moderatePost: vi.fn(),
    restrictUser: vi.fn(),
    getModerationLogs: vi.fn(),
  },
}));

// --- Datos de prueba ---------------------------------------------------------

const TOKEN_MODERADOR = 'token-moderador';

const USUARIO_MODERADOR = {
  id: 20,
  name: 'Jairo Andres Botina Valencia',
  role: 'moderator',
};

const REPORTE_BASE = {
  id: 101,
  target_type: 'note',
  target_id: 10,
  reason: 'Contenido inapropiado',
  reported_by_name: 'Ana Pérez',
  created_at: '2026-10-30T10:00:00.000Z',
};

const crearReporte = (overrides = {}) => ({ ...REPORTE_BASE, ...overrides });

function promesaDiferida() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderizarPanel() {
  return render(<ModeratorDashboard />);
}

// --- Suite -------------------------------------------------------------------

describe('Módulo de Moderador — pruebas unitarias', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      token: TOKEN_MODERADOR,
      user: USUARIO_MODERADOR,
      userRole: 'moderator',
      isModerator: true,
      isAdmin: false,
    });

    moderationService.getReportsQueue.mockResolvedValue([]);
    moderationService.resolveReport.mockResolvedValue({});
    moderationService.dismissReport.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. RENDERIZADO DEL PANEL
  // ---------------------------------------------------------------------------
  it('1. renderiza la estructura principal del panel de moderación', async () => {
    // Arrange
    moderationService.getReportsQueue.mockResolvedValue([crearReporte()]);

    // Act
    renderizarPanel();

    // Assert
    expect(
      await screen.findByRole('heading', {
        name: /Panel de Moderación de Contenidos/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Cola de Denuncias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Historial de Moderación/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restricción de Usuarios/i })).toBeInTheDocument();
    expect(screen.getByText('Denuncias Pendientes')).toBeInTheDocument();
    expect(await screen.findByText('#101')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 2. ESTADOS DE CARGA
  // ---------------------------------------------------------------------------
  it('2. muestra el indicador de carga mientras el mock asíncrono está pendiente', async () => {
    // Arrange
    const respuestaPendiente = promesaDiferida();
    moderationService.getReportsQueue.mockReturnValue(respuestaPendiente.promise);

    // Act
    renderizarPanel();

    // Assert
    expect(
      await screen.findByText(/Cargando cola de denuncias pendientes/i),
    ).toBeVisible();

    // Se resuelve la promesa para cerrar el estado de carga y evitar fugas de act.
    await act(async () => {
      respuestaPendiente.resolve([crearReporte()]);
    });

    expect(await screen.findByText('#101')).toBeInTheDocument();
    expect(
      screen.queryByText(/Cargando cola de denuncias pendientes/i),
    ).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 3. ACTUALIZACIÓN DE ESTADO (FILTROS)
  // ---------------------------------------------------------------------------
  it('3. actualiza el estado local del filtro por ID al escribir en el campo', async () => {
    // Arrange
    const user = userEvent.setup();
    renderizarPanel();
    await screen.findByText(/No hay denuncias pendientes/i);

    // Act
    await user.click(screen.getByRole('button', { name: /Restricción de Usuarios/i }));
    const campoFiltro = screen.getByPlaceholderText(/ID del usuario/i);
    await user.type(campoFiltro, '42');

    // Assert
    expect(campoFiltro).toHaveValue(42);
    expect(screen.getByRole('button', { name: /Restringir/i })).toBeEnabled();
  });

  // ---------------------------------------------------------------------------
  // 4. ACCIONES DE MODERACIÓN (EVENTOS)
  // ---------------------------------------------------------------------------
  it('4. ejecuta las acciones de moderación con el ID correcto al confirmar', async () => {
    // Arrange
    const user = userEvent.setup();
    const reporteAResolver = crearReporte({ id: 101, reason: 'Spam' });
    const reporteADescartar = crearReporte({ id: 202, reason: 'Duplicado' });

    moderationService.getReportsQueue.mockResolvedValue([
      reporteAResolver,
      reporteADescartar,
    ]);

    renderizarPanel();

    const filaResolver = (await screen.findByText('#101')).closest('tr');

    // Act — resolver la denuncia 101
    await user.click(within(filaResolver).getByRole('button', { name: /Resolver/i }));
    await user.click(within(filaResolver).getByRole('button', { name: 'Sí' }));

    // Assert — el controlador recibe el ID correcto y la fila desaparece
    await waitFor(() => {
      expect(moderationService.resolveReport).toHaveBeenCalledWith(TOKEN_MODERADOR, 101);
    });
    await waitFor(() => {
      expect(screen.queryByText('#101')).not.toBeInTheDocument();
    });

    // Act — descartar la denuncia 202
    const filaDescartar = screen.getByText('#202').closest('tr');
    await user.click(within(filaDescartar).getByRole('button', { name: /Descartar/i }));
    await user.click(within(filaDescartar).getByRole('button', { name: 'Sí' }));

    // Assert — el controlador recibe el ID correcto
    await waitFor(() => {
      expect(moderationService.dismissReport).toHaveBeenCalledWith(TOKEN_MODERADOR, 202);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. MANEJO DE ERRORES
  // ---------------------------------------------------------------------------
  it('5. muestra una alerta visible cuando la petición de moderación es rechazada', async () => {
    // Arrange
    moderationService.getReportsQueue.mockRejectedValue(
      new Error('Servicio de moderación no disponible (500)'),
    );

    // Act
    renderizarPanel();

    // Assert
    const alerta = await screen.findByText(
      /Servicio de moderación no disponible \(500\)/i,
    );

    expect(alerta).toBeVisible();
    expect(alerta).toHaveTextContent(/⚠️/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
