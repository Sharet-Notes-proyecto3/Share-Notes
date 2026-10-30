// =============================================================================
// IT-FE-02 — PRUEBA DE INTEGRACIÓN: SUBIDA DE APUNTE CON ARCHIVO ADJUNTO (FRONTEND)
// Responsable: Integrante 2 (Jhonatan Muchavisoy — Apuntes, Archivos & Subidas)
//
// ¿Para qué sirve?
//   Verificar que las capas del frontend colaboran coordinadamente de punta a punta:
//   UploadModal (formulario y validaciones de interfaz)
//   -> useFilteredSubjects (restricción académica por semestre)
//   -> AuthContext (sesión activa, rol de estudiante y token JWT)
//   -> notes.service (ensamblado del payload multipart / FormData con archivo binario)
//   -> api.js (cliente HTTP centralizado con cabeceras Bearer)
//
// ¿Qué se simula?
//   SOLO el servidor backend (fetch global).
//   Todo lo demás es código real de producción, sin mocks en componentes ni servicios.
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '../context/AuthContext';
import UploadModal from '../components/notes/UploadModal';

// Helper para simular respuestas HTTP estandarizadas del servidor
const respuestaJson = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null),
  },
  json: async () => body,
});

// Datos de prueba: estudiante de 3er semestre de Ingeniería
const estudiantePrueba = {
  id: 2,
  name: 'Jhonatan Muchavisoy',
  email: 'jhonatan@uni.edu.co',
  role: 'student',
  program_type: 'ingenieria',
  semester: 3,
};

// Catálogo de materias universitarias para el modal
const materiasCatalogo = [
  { id: 10, name: 'Cálculo Multivariado', semester: 3, career_name: 'Ingeniería' },
  { id: 20, name: 'Estructuras de Datos', semester: 3, career_name: 'Ingeniería' },
  { id: 30, name: 'Física Mecánica', semester: 2, career_name: 'Ingeniería' }, // Semestre diferente
];

describe('IT-FE-02 | Flujo de subida de apunte con archivo adjunto', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Precargamos la sesión del estudiante en almacenamiento persistente
    localStorage.setItem('jhi-authenticationToken', 'token-jwt-jhonatan-123');
    localStorage.setItem('jhi-userAccount', JSON.stringify(estudiantePrueba));

    // Espiamos y mockeamos la API de red global (fetch)
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.includes('/auth/profile')) {
        return respuestaJson(estudiantePrueba);
      }
      return respuestaJson({}, 200);
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  // Helper de renderizado seguro para estabilizar contexto y ciclo de vida de React
  const renderizarModal = async (propsCustom = {}) => {
    const handleClose = vi.fn();
    const handleNoteUploaded = vi.fn();

    const resultado = render(
      <AuthProvider>
        <UploadModal
          subjects={materiasCatalogo}
          onClose={handleClose}
          onNoteUploaded={handleNoteUploaded}
          {...propsCustom}
        />
      </AuthProvider>
    );

    // Esperar a que el modal esté listo en pantalla y la sesión sincronizada
    await waitFor(() => {
      expect(screen.getByText('📤 Subir Nuevo Apunte')).toBeInTheDocument();
    });

    return { ...resultado, handleClose, handleNoteUploaded };
  };

  // ---------------------------------------------------------------------------
  // ESCENARIO 1: CAMINO FELIZ (SUBIDA EXITOSA MULTIPART / FORMDATA CON PDF)
  // ---------------------------------------------------------------------------
  it('sube un apunte exitosamente: valida campos, construye FormData y notifica al componente padre', async () => {
    const handleClose = vi.fn();
    const handleNoteUploaded = vi.fn();

    // Mockeamos la ruta específica de subida de notas
    fetch.mockImplementation(async (url, options) => {
      if (url.includes('/auth/profile')) {
        return respuestaJson(estudiantePrueba);
      }
      if (url.includes('/notes') && options?.method === 'POST') {
        return respuestaJson({
          id: 101,
          title: 'Resumen Derivadas Parciales',
          message: 'Apunte subido exitosamente',
        }, 201);
      }
      return respuestaJson({ message: 'No encontrado' }, 404);
    });

    await renderizarModal({ onClose: handleClose, onNoteUploaded: handleNoteUploaded });

    // 1. Diligenciar título y descripción mediante interacción de usuario
    const inputTitulo = screen.getByPlaceholderText(/Resumen Primer Parcial/i);
    await userEvent.type(inputTitulo, 'Resumen Derivadas Parciales');

    const inputDescripcion = screen.getByPlaceholderText(/Añade detalles sobre el contenido/i);
    await userEvent.type(inputDescripcion, 'Notas completas de la semana 5 preparatorias para el parcial');

    // 2. Seleccionar materia correspondiente a su semestre (semestre 3)
    const selectMateria = screen.getByRole('combobox');
    await userEvent.selectOptions(selectMateria, '10');

    // 3. Crear y adjuntar archivo PDF simulado (representación binaria)
    const archivoPdf = new File(
      ['%PDF-1.4 ...contenido binario de prueba...'],
      'derivadas-parciales.pdf',
      { type: 'application/pdf' }
    );
    const inputFile = document.querySelector('input[type="file"]');
    expect(inputFile).toBeInTheDocument();
    await userEvent.upload(inputFile, archivoPdf);

    // 4. Enviar el formulario
    const formElement = document.querySelector('form');
    fireEvent.submit(formElement);

    // 5. Validar que se hayan ejecutado los callbacks de finalización
    await waitFor(() => {
      expect(handleNoteUploaded).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    // 6. Inspeccionar la llamada HTTP real realizada por api.js
    const llamadasNotes = fetch.mock.calls.filter(([url]) => url.includes('/notes'));
    expect(llamadasNotes.length).toBe(1);

    const [url, config] = llamadasNotes[0];
    expect(url).toContain('/api/notes');
    expect(config.method).toBe('POST');
    expect(config.headers['Authorization']).toBe('Bearer token-jwt-jhonatan-123');

    // Al ser una subida multipart, api.js NO debe forzar 'Content-Type: application/json'
    expect(config.headers['Content-Type']).toBeUndefined();

    // Verificar que el cuerpo es una instancia de FormData con los datos correctos
    expect(config.body).toBeInstanceOf(FormData);
    expect(config.body.get('title')).toBe('Resumen Derivadas Parciales');
    expect(config.body.get('description')).toBe('Notas completas de la semana 5 preparatorias para el parcial');
    expect(config.body.get('subjectId')).toBe('10');

    const archivoEnviado = config.body.get('file');
    expect(archivoEnviado).toBeTruthy();
    expect(archivoEnviado.name).toBe('derivadas-parciales.pdf');
  });

  // ---------------------------------------------------------------------------
  // ESCENARIO 2: VALIDACIÓN CLIENTE — TIPO DE ARCHIVO NO PERMITIDO
  // ---------------------------------------------------------------------------
  it('rechaza archivos con extensión no permitida y bloquea la petición al backend', async () => {
    await renderizarModal();

    // Adjuntar archivo con formato no permitido (.zip o ejecutable)
    const archivoInvalido = new File(['contenido no permitido'], 'archivo.zip', {
      type: 'application/zip',
    });
    const inputFile = document.querySelector('input[type="file"]');
    
    // Disparamos el evento de cambio de archivo directamente para emular selección no válida
    fireEvent.change(inputFile, { target: { files: [archivoInvalido] } });

    // Verificar mensaje de validación visible en pantalla
    expect(
      screen.getByText(/Formato no válido\. Solo se permiten archivos PDF, JPG o PNG\./i)
    ).toBeInTheDocument();

    // Intentar enviar el formulario
    const formElement = document.querySelector('form');
    fireEvent.submit(formElement);

    // Verificar que NO se realizó ninguna llamada a /api/notes
    const llamadasNotes = fetch.mock.calls.filter(([url]) => url.includes('/notes'));
    expect(llamadasNotes.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // ESCENARIO 3: VALIDACIÓN CLIENTE — ARCHIVO QUE EXCEDE EL TAMAÑO MÁXIMO (25MB)
  // ---------------------------------------------------------------------------
  it('rechaza archivos que superan los 25 MB y previene el consumo innecesario de red', async () => {
    await renderizarModal();

    // Crear un archivo simulado con tamaño mayor a 25MB (ej. 26 MB)
    const TAMANO_26_MB = 26 * 1024 * 1024;
    const archivoGrande = new File(['a'], 'apunte-muy-pesado.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(archivoGrande, 'size', {
      value: TAMANO_26_MB,
      configurable: true,
    });

    const inputFile = document.querySelector('input[type="file"]');
    await userEvent.upload(inputFile, archivoGrande);

    // Verificar mensaje de error en la interfaz
    expect(
      screen.getByText(/El archivo excede el tamaño máximo permitido de 25 MB\./i)
    ).toBeInTheDocument();

    // Validar que fetch no fue invocado hacia la API de notas
    const llamadasNotes = fetch.mock.calls.filter(([url]) => url.includes('/notes'));
    expect(llamadasNotes.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // ESCENARIO 4: CAMINO ALTERNATIVO — MANEJO DE ERROR DEL SERVIDOR (HTTP 500)
  // ---------------------------------------------------------------------------
  it('muestra mensaje de error del servidor si la subida falla, sin cerrar el modal', async () => {
    const handleClose = vi.fn();
    const handleNoteUploaded = vi.fn();

    // Simulamos fallo del servidor backend al procesar el archivo
    fetch.mockImplementation(async (url, options) => {
      if (url.includes('/auth/profile')) {
        return respuestaJson(estudiantePrueba);
      }
      if (url.includes('/notes') && options?.method === 'POST') {
        return respuestaJson({ message: 'Error interno al almacenar el archivo en disco' }, 500);
      }
      return respuestaJson({}, 404);
    });

    await renderizarModal({ onClose: handleClose, onNoteUploaded: handleNoteUploaded });

    // Llenar campos requeridos
    const inputTitulo = screen.getByPlaceholderText(/Resumen Primer Parcial/i);
    await userEvent.type(inputTitulo, 'Fórmulas de Transformadas de Laplace');

    const archivoPdf = new File(['%PDF-1.4 prueba'], 'laplace.pdf', { type: 'application/pdf' });
    const inputFile = document.querySelector('input[type="file"]');
    await userEvent.upload(inputFile, archivoPdf);

    // Enviar formulario
    const formElement = document.querySelector('form');
    fireEvent.submit(formElement);

    // Verificar que el componente captura el error y lo muestra en el DOM
    await waitFor(() => {
      expect(
        screen.getByText(/Error interno al almacenar el archivo en disco/i)
      ).toBeInTheDocument();
    });

    // El modal no debe cerrarse para permitir corregir o reintentar
    expect(handleClose).not.toHaveBeenCalled();
    expect(handleNoteUploaded).not.toHaveBeenCalled();
  });
});
