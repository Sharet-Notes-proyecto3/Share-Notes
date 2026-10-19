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
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        padding: '0',
        borderRadius: '50%',
        background: 'var(--theme-btn-bg)',
        border: '1px solid var(--theme-btn-border)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        boxShadow: 'var(--theme-btn-shadow)',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      title={isDark ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
      aria-label={isDark ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
    >
      <span className="theme-toggle-icon">{isDark ? '🌙' : '☀️'}</span>
    </button>
  );
}

export { ThemeToggle as PaletteSwitcher };
