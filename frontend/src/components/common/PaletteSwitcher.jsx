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
        background: 'var(--theme-btn-bg)',
        border: '1px solid var(--theme-btn-border)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: 'var(--theme-btn-shadow)',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        ...style,
      }}
      title={isDark ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
    >
      <span className="theme-toggle-icon">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Modo Noche' : 'Modo Día'}</span>
    </button>
  );
}

export { ThemeToggle as PaletteSwitcher };
