// src/components/home/LandingPage.jsx
// Página de bienvenida que se muestra ANTES del login.
// Usa las variables de color de index.css, así que funciona en modo día y noche.

import PaletteSwitcher from '../common/PaletteSwitcher';
import './LandingPage.css';

// Patrón decorativo (no es un QR real): 13 x 13, "1" = celda oscura
const QR_ROWS = [
  '1111100011111',
  '1000101010001',
  '1010100110101',
  '1000111010001',
  '1111101011111',
  '0100110100110',
  '1011001011001',
  '0110101100101',
  '1111101101011',
  '1000110010100',
  '1010101101101',
  '1000111010010',
  '1111100101101',
];
const QR_CELLS = QR_ROWS.join('').split('');

const FEATURES = [
  {
    title: 'Apuntes con código QR',
    text: 'Sube PDF o imágenes por materia. Cada apunte genera un QR para abrirlo desde el celular.',
  },
  {
    title: 'Búsqueda por materia y semestre',
    text: 'Encuentra material por título, autor, materia o semestre, y ve los resultados mientras escribes.',
  },
  {
    title: 'Foro por materia',
    text: 'Pregunta, responde y vota las respuestas que te sirvieron para que las mejores queden arriba.',
  },
  {
    title: 'Verificación docente',
    text: 'Tus docentes marcan los apuntes y las respuestas que son material oficial del curso.',
  },
  {
    title: 'Reportes en PDF',
    text: 'Descarga un resumen de los apuntes y la actividad de la materia.',
  },
];

const ROLES = [
  {
    title: 'Estudiante',
    color: 'var(--primary-color)',
    text: 'Sube y consulta apuntes de tu semestre, participa en el foro y vota las respuestas útiles.',
  },
  {
    title: 'Docente',
    color: 'var(--secondary-color)',
    text: 'Verifica apuntes, marca respuestas como solución, cierra hilos y descarga el reporte de tus materias.',
  },
  {
    title: 'Moderación y administración',
    color: 'var(--color-warning)',
    text: 'Atiende las denuncias de contenido, gestiona usuarios y roles, y revisa el estado de la plataforma.',
  },
];

const TEAM = [
  'Ana Milena Zuñiga',
  'Aura Camila Arteaga Castillo',
  'Jhonatan Mauricio Muchavisoy Jajoy',
  'Andres Botina',
];

export default function LandingPage({ onEnter }) {
  const enter = (mode) => {
    if (typeof onEnter === 'function') onEnter(mode);
  };

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-header-inner">
          <a className="lp-brand" href="#inicio" aria-label="ShareNotes, ir al inicio">
            <span className="lp-logo" aria-hidden="true">📚</span>
            <span>ShareNotes</span>
          </a>

          <nav className="lp-nav" aria-label="Secciones de la página">
            <a href="#funciones">Qué puedes hacer</a>
            <a href="#roles">Cada rol</a>
          </nav>

          <div className="lp-header-actions">
            <PaletteSwitcher />
            <button type="button" className="lp-btn lp-btn-primary" onClick={() => enter('login')}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </header>

      <main id="inicio">
        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <h1 className="lp-h1">Los apuntes de tu carrera, ordenados por materia.</h1>
            <p className="lp-lead">
              Sube, busca y comparte material de estudio con tus compañeros. Tus docentes
              verifican lo que vale la pena estudiar.
            </p>
            <div className="lp-hero-actions">
              <button type="button" className="lp-btn lp-btn-primary" onClick={() => enter('register')}>
                Crear cuenta
              </button>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={() => enter('login')}>
                Ya tengo cuenta
              </button>
            </div>
          </div>

          <div
            className="lp-sheet"
            role="img"
            aria-label="Ejemplo de un apunte de Cálculo II verificado por el docente, con su código QR"
          >
            <div className="lp-sheet-top">
              <span className="lp-chip">Cálculo II</span>
              <span className="lp-stamp">Verificado por docente</span>
            </div>
            <div className="lp-sheet-title">Integrales por partes: ejercicios resueltos</div>
            <div className="lp-sheet-meta">Subido por un compañero de tu semestre</div>
            <div className="lp-sheet-lines" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="lp-sheet-foot">
              <div className="lp-qr" aria-hidden="true">
                {QR_CELLS.map((c, i) => (
                  <i key={i} className={c === '1' ? 'on' : ''} />
                ))}
              </div>
              <span className="lp-sheet-hint">Escanea para abrirlo en el celular</span>
            </div>
          </div>
        </section>

        {/* ── Funciones ── */}
        <section className="lp-section" id="funciones" aria-labelledby="funciones-titulo">
          <h2 className="lp-h2" id="funciones-titulo">Qué puedes hacer en ShareNotes</h2>
          <ul className="lp-features">
            {FEATURES.map((f) => (
              <li key={f.title} className="lp-feature">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Roles ── */}
        <div className="lp-band">
          <section className="lp-section" id="roles" aria-labelledby="roles-titulo">
            <h2 className="lp-h2" id="roles-titulo">Cada rol tiene su espacio</h2>
            <div className="lp-roles">
              {ROLES.map((r) => (
                <article key={r.title} className="lp-role" style={{ '--role': r.color }}>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* ── Llamado final ── */}
        <section className="lp-section">
          <div className="lp-cta">
            <div>
              <h2 className="lp-h2 lp-h2-tight">Entra y empieza a compartir</h2>
              <p className="lp-cta-text">Regístrate como estudiante o docente en menos de un minuto.</p>
            </div>
            <div className="lp-hero-actions">
              <button type="button" className="lp-btn lp-btn-primary" onClick={() => enter('register')}>
                Crear cuenta
              </button>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={() => enter('login')}>
                Iniciar sesión
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <strong>ShareNotes</strong>
            <div>Proyecto de Software 3</div>
          </div>
          <ul className="lp-team" aria-label="Integrantes del equipo">
            {TEAM.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}