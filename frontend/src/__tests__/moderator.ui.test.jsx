// src/__tests__/moderator.ui.test.jsx
// Pruebas unitarias UI - Módulo Moderador (ShareNotes)
// Enfocadas 100% en componentes visuales/behavior del frontend

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsQueueTable from '../components/moderator/ReportsQueueTable';
import ReportActionButtons from '../components/moderator/ReportActionButtons';

const mockReports = [
  {
    id: 101,
    target_type: 'note',
    target_id: 55,
    reason: 'Contenido inapropiado',
    reported_by_name: 'Juan Pérez',
    created_at: '2026-10-30T10:15:00.000Z',
    content_preview: 'Apunte con información engañosa...',
  },
  {
    id: 102,
    target_type: 'post',
    target_id: 77,
    reason: 'Spam',
    reported_by_name: 'María López',
    created_at: '2026-10-30T11:20:00.000Z',
  },
];

describe('Módulo Moderador - Pruebas Unitarias UI', () => {
  // 1. RENDERIZADO DE LA VISTA DE MODERACIÓN
  it('MOD-UI-01 | Debe renderizar la cola de denuncias con sus elementos clave', () => {
    const onResolve = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ReportsQueueTable
        reports={mockReports}
        onResolve={onResolve}
        onDismiss={onDismiss}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Motivo / Detalles')).toBeInTheDocument();
    expect(screen.getByText('Denunciante')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Acciones de Moderación')).toBeInTheDocument();

    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.getByText('Contenido inapropiado')).toBeInTheDocument();
    expect(screen.getByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();

    expect(screen.getByText(/Apunte/i)).toBeInTheDocument();
    expect(screen.getByText(/Publicación/i)).toBeInTheDocument();
  });

  // 2. INTERACCIÓN DE APROBACIÓN (RESOLVER)
  it('MOD-UI-02 | Debe permitir aprobar/resolver una denuncia al confirmar la acción', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ReportsQueueTable
        reports={[mockReports[0]]}
        onResolve={onResolve}
        onDismiss={onDismiss}
        loading={false}
        error={null}
      />
    );

    const btnResolver = screen.getByRole('button', { name: /resolver/i });
    expect(btnResolver).toBeEnabled();
    await user.click(btnResolver);

    expect(screen.getByText(/confirmar resolver/i)).toBeInTheDocument();

    const btnSi = screen.getByRole('button', { name: /^sí$/i });
    await user.click(btnSi);

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith(101);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  // 3. INTERACCIÓN DE RECHAZO/DESCARTAR CON CONFIRMACIÓN
  it('MOD-UI-03 | Debe mostrar confirmación al descartar y llamar a onDismiss al confirmar', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ReportsQueueTable
        reports={[mockReports[0]]}
        onResolve={onResolve}
        onDismiss={onDismiss}
        loading={false}
        error={null}
      />
    );

    const btnDescartar = screen.getByRole('button', { name: /descartar/i });
    expect(btnDescartar).toBeEnabled();
    await user.click(btnDescartar);

    expect(screen.getByText(/confirmar descartar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sí$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /no/i }));
    expect(onDismiss).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /descartar/i }));
    await user.click(screen.getByRole('button', { name: /^sí$/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(101);
    expect(onResolve).not.toHaveBeenCalled();
  });

  // 4. MANEJO DE ESTADO VACÍO (EMPTY STATE)
  it('MOD-UI-04 | Debe mostrar mensaje de "Sin reportes" cuando no hay denuncias pendientes', () => {
    const onResolve = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ReportsQueueTable
        reports={[]}
        onResolve={onResolve}
        onDismiss={onDismiss}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText(/No hay denuncias pendientes/i)).toBeInTheDocument();
    expect(screen.getByText(/Todos los contenidos reportados han sido revisados/i)).toBeInTheDocument();

    expect(screen.queryByText('Acciones de Moderación')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resolver/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /descartar/i })).not.toBeInTheDocument();
  });

  // 5. GESTIÓN DE PERMISOS O ESTADOS - BOTONES DESHABILITADOS
  it('MOD-UI-05 | Debe deshabilitar los botones de acción cuando disabled=true', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ReportActionButtons report={{ id: 201 }} onResolve={onResolve} onDismiss={onDismiss} disabled={true} />
    );

    const btnResolver = screen.getByRole('button', { name: /resolver/i });
    const btnDescartar = screen.getByRole('button', { name: /descartar/i });

    expect(btnResolver).toBeDisabled();
    expect(btnDescartar).toBeDisabled();

    await user.click(btnResolver);
    await user.click(btnDescartar);

    expect(onResolve).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
