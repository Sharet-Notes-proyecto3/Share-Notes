import { useEffect, useState } from 'react';

export default function ThemeToggle({ style = {} }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('sharenotes-theme') !== 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light-mode');
      localStorage.setItem('sharenotes-theme', 'dark');
    } else {
      root.classList.add('light-mode');
      localStorage.setItem('sharenotes-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 14px',
        borderRadius: '999px',
        background: isDark ? '#18181b' : '#ffffff',
        border: isDark ? '1px solid #3f3f46' : '1px solid #7dd3fc',
        color: isDark ? '#f4f4f5' : '#0284c7',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        boxShadow: isDark
          ? '0 4px 14px rgba(0, 0, 0, 0.5)'
          : '0 4px 14px rgba(56, 189, 248, 0.25)',
        transition: 'all 0.25s ease',
        userSelect: 'none',
        ...style,
      }}
      title={isDark ? 'Cambiar a Modo Día (Blanco + Azul Claro)' : 'Cambiar a Modo Noche (Negro + Gris)'}
    >
      <span style={{ fontSize: '15px' }}>{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Modo Noche' : 'Modo Día'}</span>
    </button>
  );
}

export { ThemeToggle as PaletteSwitcher };
