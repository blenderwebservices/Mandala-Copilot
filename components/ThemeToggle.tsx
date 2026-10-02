import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      mode: 'light',
      label: 'Claro',
      desc: 'Aspecto limpio y diurno',
      icon: <Sun className="h-4 w-4 text-amber-500" />,
    },
    {
      mode: 'dark',
      label: 'Oscuro',
      desc: 'Alto contraste y descanso visual',
      icon: <Moon className="h-4 w-4 text-indigo-400" />,
    },
    {
      mode: 'system',
      label: 'Sistema',
      desc: `Automático (${resolvedTheme === 'dark' ? 'Oscuro activo' : 'Claro activo'})`,
      icon: <Monitor className="h-4 w-4 text-sky-400" />,
    },
  ];

  const currentIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-4 w-4 text-amber-500" />;
    }
    if (theme === 'dark') {
      return <Moon className="h-4 w-4 text-indigo-400" />;
    }
    return <Monitor className="h-4 w-4 text-sky-400" />;
  };

  const getThemeTitle = () => {
    if (theme === 'light') return 'Tema: Claro';
    if (theme === 'dark') return 'Tema: Oscuro';
    return `Tema: Sistema (${resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'})`;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm"
        title={getThemeTitle()}
        aria-label={getThemeTitle()}
        aria-expanded={isOpen}
      >
        {currentIcon()}
        <span className="text-xs font-medium hidden lg:inline capitalize">
          {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl shadow-slate-950/10 dark:shadow-slate-950/50 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tema de Interfaz
            </span>
          </div>

          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = theme === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    setTheme(opt.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                      {opt.icon}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {opt.desc}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
