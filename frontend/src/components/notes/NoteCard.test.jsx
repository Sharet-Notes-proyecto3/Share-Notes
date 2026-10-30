import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteCard from './NoteCard';
import { useAuth } from '../../context/AuthContext';

// --- Simulacros (mocks) de las dependencias de NoteCard ---
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../services/notes.service', () => ({
  notesService: { getNoteBlob: vi.fn() },
}));
vi.mock('../teacher/VerifiedBadge', () => ({
  default: () => <span>Verificado</span>,
}));
vi.mock('../teacher/NoteVerifyButton', () => ({ default: () => null }));
vi.mock('../moderator/ContentModerateButton', () => ({ default: () => null }));

const notaEjemplo = {
  id: 1,
  title: 'Apuntes de Cálculo',
  description: 'Resumen de límites y derivadas',
  subject_name: 'Cálculo II',
  uploader_name: 'Ana Pérez',
  original_name: 'calculo.pdf',
};

describe('NoteCard', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: null, token: 'token-falso', isModerator: false });
  });

  it('muestra la información principal del apunte', () => {
    render(<NoteCard note={notaEjemplo} onOpenPreview={vi.fn()} onDeleteNote={vi.fn()} />);

    expect(screen.getByText('Apuntes de Cálculo')).toBeInTheDocument();
    expect(screen.getByText('Cálculo II')).toBeInTheDocument();
    expect(screen.getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByText(/PDF/)).toBeInTheDocument();
    expect(screen.getByText('Fecha no disponible', { exact: false })).toBeInTheDocument();
  });

  it('llama a onOpenPreview con el apunte al hacer clic en Vista Previa', async () => {
    const onOpenPreview = vi.fn();
    render(<NoteCard note={notaEjemplo} onOpenPreview={onOpenPreview} onDeleteNote={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Vista Previa/ }));

    expect(onOpenPreview).toHaveBeenCalledTimes(1);
    expect(onOpenPreview).toHaveBeenCalledWith(notaEjemplo);
  });

    it('muestra el botón eliminar al dueño del apunte y llama a onDeleteNote', async () => {
    useAuth.mockReturnValue({ user: { id: 7 }, token: 'token-falso', isModerator: false });
    const onDeleteNote = vi.fn();
    const nota = { ...notaEjemplo, uploader_id: 7 };

    render(<NoteCard note={nota} onOpenPreview={vi.fn()} onDeleteNote={onDeleteNote} />);

    await userEvent.click(screen.getByTitle('Eliminar apunte'));

    expect(onDeleteNote).toHaveBeenCalledWith(nota);
  });

  it('no muestra el botón eliminar a un usuario que no es el dueño', () => {
    useAuth.mockReturnValue({ user: { id: 99 }, token: 'token-falso', isModerator: false });

    render(<NoteCard note={{ ...notaEjemplo, uploader_id: 7 }} onOpenPreview={vi.fn()} onDeleteNote={vi.fn()} />);

    expect(screen.queryByTitle('Eliminar apunte')).not.toBeInTheDocument();
  });
});