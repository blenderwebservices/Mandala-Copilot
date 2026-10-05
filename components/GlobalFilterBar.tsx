import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Filter,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RotateCw,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';

export type GlobalFilterStatus =
  | 'all'
  | 'pending'
  | 'completed'
  | 'in_progress'
  | 'blocked'
  | 'recurring'
  | 'one_time';

export interface GlobalFilterStats {
  total: number;
  matches: number;
  completed: number;
  pending: number;
  inProgress: number;
  blocked: number;
  recurring: number;
  oneTime: number;
}

interface GlobalFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: GlobalFilterStatus;
  onStatusFilterChange: (status: GlobalFilterStatus) => void;
  onClearFilters: () => void;
  stats: GlobalFilterStats;
  currentGoalTitle?: string;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  stats,
  currentGoalTitle,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isFiltered = searchQuery.trim().length > 0 || statusFilter !== 'all';

  // Keyboard shortcut: Cmd+K / Ctrl+K or '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          onSearchChange('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, onSearchChange]);

  const filterOptions: {
    id: GlobalFilterStatus;
    label: string;
    icon: React.ReactNode;
    count: number;
    colorClass: string;
    activeClass: string;
  }[] = [
    {
      id: 'all',
      label: 'Todas',
      icon: <Filter className="h-3 w-3" />,
      count: stats.total,
      colorClass: 'text-slate-600 dark:text-slate-400',
      activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-2xs',
    },
    {
      id: 'pending',
      label: 'Pendientes',
      icon: <Circle className="h-3 w-3 text-amber-500" />,
      count: stats.pending,
      colorClass: 'text-amber-700 dark:text-amber-400',
      activeClass: 'bg-amber-600 text-white shadow-2xs font-semibold',
    },
    {
      id: 'completed',
      label: 'Completadas',
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
      count: stats.completed,
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      activeClass: 'bg-emerald-600 text-white shadow-2xs font-semibold',
    },
    {
      id: 'in_progress',
      label: 'En Progreso',
      icon: <Clock className="h-3 w-3 text-indigo-500" />,
      count: stats.inProgress,
      colorClass: 'text-indigo-700 dark:text-indigo-400',
      activeClass: 'bg-indigo-600 text-white shadow-2xs font-semibold',
    },
    {
      id: 'blocked',
      label: 'Bloqueadas',
      icon: <AlertTriangle className="h-3 w-3 text-rose-500" />,
      count: stats.blocked,
      colorClass: 'text-rose-700 dark:text-rose-400',
      activeClass: 'bg-rose-600 text-white shadow-2xs font-semibold',
    },
    {
      id: 'recurring',
      label: 'Hábitos (Racha)',
      icon: <RotateCw className="h-3 w-3 text-sky-500" />,
      count: stats.recurring,
      colorClass: 'text-sky-700 dark:text-sky-400',
      activeClass: 'bg-sky-600 text-white shadow-2xs font-semibold',
    },
    {
      id: 'one_time',
      label: 'Tareas Únicas',
      icon: <Zap className="h-3 w-3 text-purple-500" />,
      count: stats.oneTime,
      colorClass: 'text-purple-700 dark:text-purple-400',
      activeClass: 'bg-purple-600 text-white shadow-2xs font-semibold',
    },
  ];

  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Search Input Box */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar actividad por palabras clave (ej: 'Postgres', 'Landing', 'Diario')... ⌘K"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Borrar texto de búsqueda (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Clear Filters Button if any filter or query is active */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
              title="Restablecer búsqueda y filtros"
            >
              <X className="h-3 w-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Status Filter Buttons / Pills with Counter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {filterOptions.map((opt) => {
            const isSelected = statusFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStatusFilterChange(opt.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? `${opt.activeClass} border-transparent`
                    : `bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 ${opt.colorClass}`
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-black/20 dark:bg-white/20 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Results Status Notice (when filter or search is active) */}
      {isFiltered && (
        <div className="max-w-7xl mx-auto mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>
              Filtro activo en todas las vistas:
              {searchQuery && (
                <>
                  {' '}palabras <strong className="text-slate-900 dark:text-slate-100">"{searchQuery}"</strong>
                </>
              )}
              {statusFilter !== 'all' && (
                <>
                  {' '}[estado: <strong className="text-indigo-600 dark:text-indigo-400">{statusFilter}</strong>]
                </>
              )}
              {' '}— <strong className="text-emerald-600 dark:text-emerald-400">{stats.matches}</strong> de {stats.total} actividades coinciden.
            </span>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            El filtro prevalece al cambiar entre Matriz 9x9, Jerárquica y Gantt
          </span>
        </div>
      )}
    </div>
  );
};
