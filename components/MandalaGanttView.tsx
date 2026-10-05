import React, { useState, useMemo, useRef } from 'react';
import {
  Goal,
  Pillar,
  MandalaAction,
  TaskPriority,
  TaskStatus,
  PILLAR_COLORS
} from '../types/mandala';
import { GlobalFilterStatus } from './GlobalFilterBar';
import { matchAnyTextAccentInsensitive } from '../services/searchUtils';
import {
  CalendarRange,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Wand2,
  User,
  Flag,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Info,
  Maximize2,
  SlidersHorizontal,
  ChevronLeft,
  Eye,
  Check
} from 'lucide-react';

interface MandalaGanttViewProps {
  goal: Goal;
  onUpdateAction: (pillarIndex: number, actionIndex: number, updates: Partial<MandalaAction>) => void;
  onBatchUpdateActions?: (updates: { pillarIndex: number; actionIndex: number; updates: Partial<MandalaAction> }[]) => void;
  onToggleAction: (pillarIndex: number, actionIndex: number) => void;
  onRequestRecalibrate?: (action: MandalaAction, actionIndex: number, pillarIndex: number) => void;
  onOpenMainGoalModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: GlobalFilterStatus;
  onStatusFilterChange?: (status: GlobalFilterStatus) => void;
}

type TimelineScale = 'day' | 'week' | 'month';

interface FlattenedTask {
  pillarIndex: number;
  actionIndex: number;
  pillar: Pillar;
  action: MandalaAction;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  isVirtualDate: boolean;
}

// Helpers for Date calculations
const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseISODate = (isoStr?: string): Date | null => {
  if (!isoStr) return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const diffDays = (d1: Date, d2: Date): number => {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

export const MandalaGanttView: React.FC<MandalaGanttViewProps> = ({
  goal,
  onUpdateAction,
  onBatchUpdateActions,
  onToggleAction,
  onRequestRecalibrate,
  onOpenMainGoalModal,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  statusFilter: externalStatusFilter,
  onStatusFilterChange: externalOnStatusFilterChange,
}) => {
  // View states
  const [scale, setScale] = useState<TimelineScale>('week');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<number | 'all'>('all');
  const [internalStatusFilter, setInternalStatusFilter] = useState<GlobalFilterStatus>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const onSearchChange = externalOnSearchChange || setInternalSearchQuery;
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const onStatusFilterChange = externalOnStatusFilterChange || setInternalStatusFilter;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTabMobile, setActiveTabMobile] = useState<'wbs' | 'gantt'>('gantt');
  const [showAutoScheduleBanner, setShowAutoScheduleBanner] = useState(true);
  const [expandedPillars, setExpandedPillars] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    goal.pillars.forEach((_, idx) => {
      initial[idx] = true;
    });
    return initial;
  });

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Today reference
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Base reference date for goals without custom start dates
  const projectBaseDate = useMemo(() => {
    const created = parseISODate(goal.createdAt?.split('T')[0]);
    return created || today;
  }, [goal.createdAt, today]);

  // Flatten and normalize all 64 actions with concrete or calculated dates
  const { flattenedTasks, hasAnyCustomDates, projectStartDate, projectEndDate, totalDurationDays } = useMemo(() => {
    let hasCustom = false;
    const tasks: FlattenedTask[] = [];

    goal.pillars.forEach((pillar, pIdx) => {
      pillar.actions.forEach((action, aIdx) => {
        let sDate = parseISODate(action.startDate);
        let eDate = parseISODate(action.endDate);

        let isVirtual = false;
        if (sDate && eDate) {
          hasCustom = true;
        } else {
          isVirtual = true;
          // Calculate realistic staggered schedule based on pillar (phase) and action index
          // Each pillar starts staggered by 4 days, each action takes 5-7 days
          const pillarStartOffset = pIdx * 4;
          const actionStartOffset = aIdx * 3;
          sDate = addDays(projectBaseDate, pillarStartOffset + actionStartOffset);
          eDate = addDays(sDate, 6);
        }

        // Ensure eDate >= sDate
        if (eDate < sDate) {
          eDate = addDays(sDate, 1);
        }

        tasks.push({
          pillarIndex: pIdx,
          actionIndex: aIdx,
          pillar,
          action,
          startDate: sDate,
          endDate: eDate,
          durationDays: Math.max(1, diffDays(sDate, eDate) + 1),
          isVirtualDate: isVirtual,
        });
      });
    });

    let minDate = tasks[0]?.startDate || today;
    let maxDate = tasks[0]?.endDate || today;

    tasks.forEach(t => {
      if (t.startDate < minDate) minDate = t.startDate;
      if (t.endDate > maxDate) maxDate = t.endDate;
    });

    // Add padding to timeline (7 days before and after)
    const paddedStart = addDays(minDate, -7);
    const paddedEnd = addDays(maxDate, 14);
    const totalDays = Math.max(30, diffDays(paddedStart, paddedEnd) + 1);

    return {
      flattenedTasks: tasks,
      hasAnyCustomDates: hasCustom,
      projectStartDate: paddedStart,
      projectEndDate: paddedEnd,
      totalDurationDays: totalDays,
    };
  }, [goal.pillars, projectBaseDate, today]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return flattenedTasks.filter(item => {
      if (selectedPillarFilter !== 'all' && item.pillarIndex !== selectedPillarFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        const act = item.action;
        if (statusFilter === 'pending' && (act.isCompleted || act.progress === 100)) return false;
        if (statusFilter === 'completed' && !(act.isCompleted || act.progress === 100)) return false;
        if (statusFilter === 'in_progress' && (act.isCompleted || !((act.progress && act.progress > 0) || act.status === 'in_progress'))) return false;
        if (statusFilter === 'blocked' && !(act.status === 'blocked' || act.isStuck)) return false;
        if (statusFilter === 'recurring' && act.type !== 'recurring') return false;
        if (statusFilter === 'one_time' && act.type !== 'one_time') return false;
      }
      if (searchQuery.trim()) {
        const matches = matchAnyTextAccentInsensitive(
          [item.action.title, item.pillar.title, item.action.notes, item.action.assignee],
          searchQuery
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [flattenedTasks, selectedPillarFilter, statusFilter, searchQuery]);

  // Overall Project Stats
  const stats = useMemo(() => {
    let completedCount = 0;
    let inProgressCount = 0;
    let blockedCount = 0;
    let totalProgressSum = 0;

    flattenedTasks.forEach(t => {
      const act = t.action;
      const progress = act.progress !== undefined ? act.progress : (act.isCompleted ? 100 : 0);
      totalProgressSum += progress;

      if (act.isCompleted || progress === 100) completedCount++;
      else if (act.status === 'blocked' || act.isStuck) blockedCount++;
      else if (act.status === 'in_progress' || progress > 0) inProgressCount++;
    });

    const avgProgress = Math.round(totalProgressSum / (flattenedTasks.length || 1));

    return {
      totalTasks: flattenedTasks.length,
      completedCount,
      inProgressCount,
      blockedCount,
      avgProgress,
    };
  }, [flattenedTasks]);

  // Timeline Column Widths & Units based on Scale
  const { pxPerDay, columnIntervalDays } = useMemo(() => {
    switch (scale) {
      case 'day':
        return { pxPerDay: 42, columnIntervalDays: 1 };
      case 'month':
        return { pxPerDay: 7, columnIntervalDays: 30 };
      case 'week':
      default:
        return { pxPerDay: 18, columnIntervalDays: 7 };
    }
  }, [scale]);

  const timelineWidthPx = useMemo(() => {
    return totalDurationDays * pxPerDay;
  }, [totalDurationDays, pxPerDay]);

  // Generate Timeline Header Columns
  const timelineColumns = useMemo(() => {
    const cols = [];
    let curr = new Date(projectStartDate);

    while (curr <= projectEndDate) {
      const dayOffset = diffDays(projectStartDate, curr);
      const leftPx = dayOffset * pxPerDay;

      cols.push({
        date: new Date(curr),
        leftPx,
        isToday: curr.getTime() === today.getTime(),
        labelMonth: curr.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        labelDay: curr.toLocaleDateString('es-ES', { weekday: 'narrow', day: 'numeric' }),
        labelWeek: `S${Math.ceil((curr.getDate() + 6 - curr.getDay()) / 7)}`,
      });

      curr = addDays(curr, columnIntervalDays);
    }
    return cols;
  }, [projectStartDate, projectEndDate, columnIntervalDays, pxPerDay, today]);

  // Position of "Today" vertical marker
  const todayMarkerLeftPx = useMemo(() => {
    const offset = diffDays(projectStartDate, today);
    if (offset < 0 || offset > totalDurationDays) return null;
    return offset * pxPerDay;
  }, [projectStartDate, today, totalDurationDays, pxPerDay]);

  // Currently selected task for detailed drawer/modal
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return flattenedTasks.find(t => t.action.id === selectedTaskId) || null;
  }, [selectedTaskId, flattenedTasks]);

  // Auto-schedule algorithm: sequences all 64 actions with coherent dates, predecessors, and milestones
  const handleAutoScheduleProject = () => {
    const updates: { pillarIndex: number; actionIndex: number; updates: Partial<MandalaAction> }[] = [];
    const base = new Date(today);

    // Spread the 8 pillars into a phased master project plan
    goal.pillars.forEach((pillar, pIdx) => {
      // Each pillar has a staggered start (e.g. 5 days apart)
      const pillarStartDate = addDays(base, pIdx * 5);
      let currentTaskStart = new Date(pillarStartDate);

      pillar.actions.forEach((action, aIdx) => {
        // Duration: 4 to 8 days per action
        const duration = 5;
        const taskEnd = addDays(currentTaskStart, duration);

        // Predecessor: previous action in the same pillar, or action 7 of previous pillar
        let predId: string | undefined = undefined;
        if (aIdx > 0) {
          predId = pillar.actions[aIdx - 1].id;
        } else if (pIdx > 0) {
          // First action of pillar depends on action 0 or 7 of predecessor pillar
          predId = goal.pillars[pIdx - 1].actions[0].id;
        }

        // Successor: next action in this pillar
        let succId: string | undefined = undefined;
        if (aIdx < pillar.actions.length - 1) {
          succId = pillar.actions[aIdx + 1].id;
        }

        // Last action of each pillar is marked as a project milestone!
        const isMilestone = aIdx === 7;
        const priority: TaskPriority = aIdx === 0 || aIdx === 7 ? 'high' : 'medium';

        updates.push({
          pillarIndex: pIdx,
          actionIndex: aIdx,
          updates: {
            startDate: formatDateToISO(currentTaskStart),
            endDate: formatDateToISO(taskEnd),
            predecessorId: predId,
            successorId: succId,
            priority: action.priority || priority,
            status: action.isCompleted ? 'completed' : (action.status || 'not_started'),
            progress: action.progress !== undefined ? action.progress : (action.isCompleted ? 100 : 0),
            isMilestone: action.isMilestone !== undefined ? action.isMilestone : isMilestone,
          },
        });

        // Next task starts 2 days before the previous finishes (fast-tracking/overlap)
        currentTaskStart = addDays(currentTaskStart, 3);
      });
    });

    if (onBatchUpdateActions) {
      onBatchUpdateActions(updates);
    } else {
      // Fallback sequentially
      updates.forEach(u => {
        onUpdateAction(u.pillarIndex, u.actionIndex, u.updates);
      });
    }

    setShowAutoScheduleBanner(false);
  };

  // Toggle pillar expansion
  const togglePillarCollapse = (pIdx: number) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pIdx]: !prev[pIdx],
    }));
  };

  // Group filtered tasks by pillar for rendering
  const tasksByPillar = useMemo(() => {
    const map = new Map<number, FlattenedTask[]>();
    filteredTasks.forEach(task => {
      const list = map.get(task.pillarIndex) || [];
      list.push(task);
      map.set(task.pillarIndex, list);
    });
    return map;
  }, [filteredTasks]);

  // Export project schedule to CSV
  const handleExportCSV = () => {
    const headers = [
      'Pilar',
      'Posicion',
      'Accion',
      'Tipo',
      'Fecha Inicio',
      'Fecha Fin',
      'Duracion (Dias)',
      'Progreso (%)',
      'Estado',
      'Prioridad',
      'Responsable',
      'Nodo Anterior (Predecesor)',
      'Nodo Siguiente (Sucesor)'
    ];

    const rows = flattenedTasks.map(t => [
      `"${t.pillar.title.replace(/"/g, '""')}"`,
      t.action.position + 1,
      `"${t.action.title.replace(/"/g, '""')}"`,
      t.action.type,
      t.action.startDate || formatDateToISO(t.startDate),
      t.action.endDate || formatDateToISO(t.endDate),
      t.durationDays,
      t.action.progress !== undefined ? t.action.progress : (t.action.isCompleted ? 100 : 0),
      t.action.status || (t.action.isCompleted ? 'completed' : 'not_started'),
      t.action.priority || 'medium',
      `"${(t.action.assignee || '').replace(/"/g, '""')}"`,
      t.action.predecessorId || '',
      t.action.successorId || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cronograma_Gantt_${goal.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick progress update
  const handleQuickProgress = (task: FlattenedTask, progress: number) => {
    const isCompleted = progress === 100;
    const status: TaskStatus = progress === 100 ? 'completed' : (progress > 0 ? 'in_progress' : 'not_started');
    onUpdateAction(task.pillarIndex, task.actionIndex, {
      progress,
      isCompleted,
      status,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[calc(100vh-4rem)] max-w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. TOP HEADER & PROJECT METRICS */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 sm:px-6 py-4 shadow-2xs backdrop-blur-sm z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CalendarRange className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Modo Proyecto: Diagrama de Gantt
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                    64 Tareas (8×8)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenMainGoalModal}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 mt-0.5 cursor-pointer text-left"
                  title="Editar objetivo principal"
                >
                  <span>Meta: <strong className="text-slate-700 dark:text-slate-200">{goal.title}</strong></span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Avance Global</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  {stats.avgProgress}%
                </div>
              </div>
              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${stats.avgProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">{stats.completedCount}</span> / 64 Completadas
            </div>

            {stats.blockedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs shrink-0">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">{stats.blockedCount}</span> Bloqueadas
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer shrink-0"
              title="Descargar cronograma como archivo CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* 2. CONTROLS BAR (Filters, Search, Scale, Auto-Schedule) */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tarea, pilar, responsable..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 w-48 sm:w-56"
              />
            </div>

            {/* Filter by Pillar */}
            <div className="flex items-center gap-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
              <select
                value={selectedPillarFilter}
                onChange={e => setSelectedPillarFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Pilares (8)</option>
                {goal.pillars.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    P{idx + 1}: {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value as GlobalFilterStatus)}
              className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="in_progress">En Progreso</option>
              <option value="blocked">Bloqueada</option>
              <option value="recurring">Hábitos</option>
              <option value="one_time">Únicas</option>
            </select>
          </div>

          {/* Right Controls: Scale Selector & Auto-Schedule */}
          <div className="flex items-center gap-2">
            {/* Timeline Scale Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setScale('day')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  scale === 'day'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Días
              </button>
              <button
                type="button"
                onClick={() => setScale('week')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  scale === 'week'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semanas
              </button>
              <button
                type="button"
                onClick={() => setScale('month')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  scale === 'month'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Meses
              </button>
            </div>

            {/* Smart Auto-Scheduler Button */}
            <button
              type="button"
              onClick={handleAutoScheduleProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Calcula automáticamente fechas secuenciales, predecesores y entregables para las 64 acciones"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Auto-programar Cronograma</span>
              <span className="sm:hidden">Auto-programar</span>
            </button>
          </div>
        </div>

        {/* Mobile View Toggle between WBS Table and Gantt Timeline */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTabMobile('wbs')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center cursor-pointer transition-colors ${
              activeTabMobile === 'wbs'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            📋 Lista WBS
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMobile('gantt')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center cursor-pointer transition-colors ${
              activeTabMobile === 'gantt'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            📊 Cronograma Gantt
          </button>
        </div>
      </header>

      {/* 3. VIRTUAL DATES NOTICE BANNER */}
      {!hasAnyCustomDates && showAutoScheduleBanner && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex items-center justify-between gap-3 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Fechas proyectadas:</strong> Las 64 tareas tienen fechas automáticas estimadas. Presiona <strong>"Auto-programar Cronograma"</strong> para consolidar fechas fijas, predecesores y dependencias, o edita directamente cada tarea.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoScheduleProject}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md transition-colors cursor-pointer text-[11px]"
            >
              Fijar Fechas Ahora
            </button>
            <button
              type="button"
              onClick={() => setShowAutoScheduleBanner(false)}
              className="p-1 hover:bg-amber-500/20 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN SPLIT VIEW: WBS TABLE (LEFT) + GANTT TIMELINE (RIGHT) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT COLUMN: WBS (WORK BREAKDOWN STRUCTURE) LIST */}
        <div
          className={`${
            activeTabMobile === 'wbs' ? 'flex' : 'hidden md:flex'
          } flex-col w-full md:w-[480px] lg:w-[540px] xl:w-[580px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-y-auto shrink-0 select-none z-10`}
        >
          {/* WBS Table Header */}
          <div className="sticky top-0 z-10 grid grid-cols-12 gap-1 items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
            <div className="col-span-6 flex items-center gap-1">Entregable / Acción</div>
            <div className="col-span-2 text-center">Inicio</div>
            <div className="col-span-2 text-center">Fin</div>
            <div className="col-span-2 text-right pr-2">Avance</div>
          </div>

          {/* Pillars & Actions Accordion */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {goal.pillars.map((pillar, pIdx) => {
              if (selectedPillarFilter !== 'all' && pIdx !== selectedPillarFilter) return null;
              const pillarTasks = tasksByPillar.get(pIdx) || [];
              const isFilterActive = searchQuery.trim().length > 0 || statusFilter !== 'all';
              const isExpanded = isFilterActive ? pillarTasks.length > 0 : !!expandedPillars[pIdx];
              const colorConfig = PILLAR_COLORS[pIdx % PILLAR_COLORS.length];

              // Pillar stats
              const completedPillarCount = pillar.actions.filter(a => a.isCompleted).length;
              const pillarProgress = Math.round(
                pillar.actions.reduce((acc, a) => acc + (a.progress !== undefined ? a.progress : (a.isCompleted ? 100 : 0)), 0) / 8
              );

              return (
                <div key={pillar.id} className="flex flex-col">
                  {/* Pillar Phase Header Row */}
                  <div
                    onClick={() => togglePillarCollapse(pIdx)}
                    className={`flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 cursor-pointer transition-colors border-b border-slate-200/60 dark:border-slate-800/60`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button type="button" className="text-slate-400 p-0.5">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorConfig.badge}`}>
                        Pilar {pIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {pillar.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {completedPillarCount}/8 ({pillarProgress}%)
                      </span>
                      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{ width: `${pillarProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions in Pillar */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {pillarTasks.map(taskItem => {
                        const { action, actionIndex } = taskItem;
                        const isSelected = selectedTaskId === action.id;
                        const isDone = action.isCompleted;
                        const taskProgress = action.progress !== undefined ? action.progress : (isDone ? 100 : 0);

                        return (
                          <div
                            key={action.id}
                            className={`grid grid-cols-12 gap-1 items-center px-3 py-2 text-xs transition-colors hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 ${
                              isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-500' : ''
                            }`}
                          >
                            {/* Action Title & Checkbox */}
                            <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                              <button
                                type="button"
                                onClick={() => onToggleAction(pIdx, actionIndex)}
                                className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                                title={isDone ? 'Marcar incompleta' : 'Completar tarea'}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(action.id)}
                                className={`text-left truncate font-medium hover:underline cursor-pointer flex-1 ${
                                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                                }`}
                                title={action.title}
                              >
                                {action.title}
                              </button>

                              {action.isMilestone && (
                                <span title="Hito del proyecto">
                                  <Flag className="h-3 w-3 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>

                            {/* Start Date Input */}
                            <div className="col-span-2 text-center">
                              <input
                                type="date"
                                value={action.startDate || formatDateToISO(taskItem.startDate)}
                                onChange={e => {
                                  onUpdateAction(pIdx, actionIndex, { startDate: e.target.value });
                                }}
                                className="w-full text-[11px] bg-transparent hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded px-1 py-0.5 text-center text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            {/* End Date Input */}
                            <div className="col-span-2 text-center">
                              <input
                                type="date"
                                value={action.endDate || formatDateToISO(taskItem.endDate)}
                                onChange={e => {
                                  onUpdateAction(pIdx, actionIndex, { endDate: e.target.value });
                                }}
                                className="w-full text-[11px] bg-transparent hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded px-1 py-0.5 text-center text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            {/* Progress & Details Drawer Trigger */}
                            <div className="col-span-2 flex items-center justify-end gap-1.5 pr-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextProg = taskProgress === 100 ? 0 : taskProgress === 0 ? 50 : 100;
                                  handleQuickProgress(taskItem, nextProg);
                                }}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                  taskProgress === 100
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : taskProgress > 0
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                                title="Click para alternar avance rápido (0% -> 50% -> 100%)"
                              >
                                {taskProgress}%
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(action.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Abrir panel de detalles, dependencias y notas"
                              >
                                <SlidersHorizontal className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE GANTT TIMELINE */}
        <div
          ref={timelineContainerRef}
          className={`${
            activeTabMobile === 'gantt' ? 'flex' : 'hidden md:flex'
          } flex-col flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 relative`}
        >
          <div
            style={{ width: `${Math.max(timelineWidthPx, 900)}px` }}
            className="min-h-full flex flex-col relative select-none"
          >
            {/* Timeline Header Ruler */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col shadow-2xs">
              {/* Scale Tick Labels */}
              <div className="h-10 relative border-b border-slate-100 dark:border-slate-800/80">
                {timelineColumns.map((col, idx) => (
                  <div
                    key={idx}
                    style={{ left: `${col.leftPx}px` }}
                    className={`absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-800 pl-1 pt-1 text-[10px] leading-tight ${
                      col.isToday ? 'bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    <div>{col.labelMonth}</div>
                    <div className="text-[9px] text-slate-400">
                      {scale === 'day' ? col.labelDay : col.labelWeek}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* "Today" Vertical Marker Line */}
            {todayMarkerLeftPx !== null && (
              <div
                style={{ left: `${todayMarkerLeftPx}px` }}
                className="absolute top-10 bottom-0 w-0.5 bg-amber-500 z-10 pointer-events-none opacity-80"
              >
                <div className="bg-amber-500 text-white text-[9px] font-bold px-1 py-0.5 rounded -translate-x-1/2 shadow-xs whitespace-nowrap">
                  Hoy
                </div>
              </div>
            )}

            {/* Timeline Gantt Rows matching WBS */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 relative">
              {goal.pillars.map((pillar, pIdx) => {
                if (selectedPillarFilter !== 'all' && pIdx !== selectedPillarFilter) return null;
                const pillarTasks = tasksByPillar.get(pIdx) || [];
                const isFilterActive = searchQuery.trim().length > 0 || statusFilter !== 'all';
                const isExpanded = isFilterActive ? pillarTasks.length > 0 : !!expandedPillars[pIdx];
                const colorConfig = PILLAR_COLORS[pIdx % PILLAR_COLORS.length];

                // Compute pillar phase bar bounds (min start date to max end date)
                let pMin = pillarTasks[0]?.startDate || today;
                let pMax = pillarTasks[0]?.endDate || today;
                pillarTasks.forEach(t => {
                  if (t.startDate < pMin) pMin = t.startDate;
                  if (t.endDate > pMax) pMax = t.endDate;
                });

                const pOffsetDays = diffDays(projectStartDate, pMin);
                const pDurationDays = Math.max(1, diffDays(pMin, pMax) + 1);
                const pLeftPx = Math.max(0, pOffsetDays * pxPerDay);
                const pWidthPx = Math.max(20, pDurationDays * pxPerDay);

                return (
                  <div key={pillar.id} className="flex flex-col">
                    {/* Pillar Phase Summary Bar in Timeline */}
                    <div className="h-9 relative bg-slate-100/60 dark:bg-slate-900/30 border-b border-slate-200/40 dark:border-slate-800/40">
                      <div
                        style={{
                          left: `${pLeftPx}px`,
                          width: `${pWidthPx}px`,
                        }}
                        className="absolute top-2 h-5 rounded-md bg-slate-300/80 dark:bg-slate-700/80 border border-slate-400/50 dark:border-slate-600/50 flex items-center px-2 text-[10px] font-bold text-slate-800 dark:text-slate-100 shadow-2xs truncate pointer-events-none"
                      >
                        <span className="truncate">
                          Fase {pIdx + 1}: {pillar.title}
                        </span>
                      </div>
                    </div>

                    {/* Action Task Bars in Timeline */}
                    {isExpanded &&
                      pillarTasks.map(taskItem => {
                        const { action } = taskItem;
                        const isDone = action.isCompleted;
                        const taskProgress = action.progress !== undefined ? action.progress : (isDone ? 100 : 0);

                        const startOffsetDays = diffDays(projectStartDate, taskItem.startDate);
                        const leftPx = Math.max(0, startOffsetDays * pxPerDay);
                        const widthPx = Math.max(24, taskItem.durationDays * pxPerDay);

                        return (
                          <div
                            key={action.id}
                            className="h-[37px] relative hover:bg-indigo-50/20 dark:hover:bg-slate-900/40 transition-colors group"
                          >
                            {/* The Gantt Bar */}
                            <div
                              onClick={() => setSelectedTaskId(action.id)}
                              style={{
                                left: `${leftPx}px`,
                                width: `${widthPx}px`,
                              }}
                              className={`absolute top-1.5 h-6 rounded-md shadow-xs cursor-pointer transition-all hover:scale-y-105 flex items-center overflow-hidden border ${
                                isDone
                                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-950 dark:text-emerald-100'
                                  : action.status === 'blocked'
                                  ? 'bg-rose-500/30 border-rose-500 text-rose-900 dark:text-rose-100'
                                  : 'bg-indigo-500/25 border-indigo-500/60 text-slate-900 dark:text-slate-100'
                              }`}
                              title={`${action.title}\nInicio: ${formatDateToISO(taskItem.startDate)}\nFin: ${formatDateToISO(taskItem.endDate)}\nAvance: ${taskProgress}%`}
                            >
                              {/* Inner Progress Fill Bar */}
                              <div
                                style={{ width: `${taskProgress}%` }}
                                className={`absolute top-0 bottom-0 left-0 transition-all ${
                                  isDone
                                    ? 'bg-emerald-500/80'
                                    : action.status === 'blocked'
                                    ? 'bg-rose-500/80'
                                    : 'bg-indigo-600/80'
                                }`}
                              />

                              {/* Content inside Gantt bar */}
                              <div className="relative z-10 px-2 flex items-center justify-between w-full min-w-0 text-[11px] font-medium">
                                <span className="truncate select-none drop-shadow-xs">
                                  {action.title}
                                </span>

                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  {action.isMilestone && (
                                    <div className="w-2.5 h-2.5 rotate-45 bg-amber-400 border border-amber-600 shrink-0" />
                                  )}
                                  <span className="text-[10px] font-bold opacity-90">
                                    {taskProgress}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Dependencies Indicators on hover */}
                            {(action.predecessorId || action.successorId) && (
                              <div
                                style={{ left: `${leftPx + widthPx + 6}px` }}
                                className="absolute top-2 hidden group-hover:flex items-center gap-1 text-[10px] text-slate-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-800 z-20 whitespace-nowrap"
                              >
                                {action.predecessorId && <span>🔗 Previo</span>}
                                {action.successorId && <span>➡️ Sucesor</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. TASK DETAIL & DEPENDENCY DRAWER / MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full sm:w-[460px] md:w-[500px] h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Pilar {selectedTask.pillarIndex + 1} • Acción {selectedTask.actionIndex + 1}
                </span>
                <span className="text-xs text-slate-500">Configuración de Proyecto</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-5 flex-1">
              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Tarea / Entregable
                </label>
                <textarea
                  rows={2}
                  value={selectedTask.action.title}
                  onChange={e => {
                    onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                      title: e.target.value,
                    });
                  }}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={selectedTask.action.startDate || formatDateToISO(selectedTask.startDate)}
                    onChange={e => {
                      onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                        startDate: e.target.value,
                      });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={selectedTask.action.endDate || formatDateToISO(selectedTask.endDate)}
                    onChange={e => {
                      onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                        endDate: e.target.value,
                      });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Progreso del Entregable
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedTask.action.progress !== undefined ? selectedTask.action.progress : (selectedTask.action.isCompleted ? 100 : 0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedTask.action.progress !== undefined ? selectedTask.action.progress : (selectedTask.action.isCompleted ? 100 : 0)}
                  onChange={e => {
                    const prog = parseInt(e.target.value, 10);
                    handleQuickProgress(selectedTask, prog);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0% (Sin iniciar)</span>
                  <span>50% (En desarrollo)</span>
                  <span>100% (Finalizado)</span>
                </div>
              </div>

              {/* DEPENDENCIES: Nodo Anterior & Nodo Siguiente */}
              <div className="space-y-3 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Layers className="h-4 w-4" />
                  <span>Dependencias del Cronograma</span>
                </div>

                {/* Predecessor (Nodo Anterior) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nodo Anterior (Tarea de la que depende esta acción):
                  </label>
                  <select
                    value={selectedTask.action.predecessorId || ''}
                    onChange={e => {
                      onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                        predecessorId: e.target.value || undefined,
                      });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Sin dependencia previa (Inicio libre) --</option>
                    {flattenedTasks
                      .filter(t => t.action.id !== selectedTask.action.id)
                      .map(t => (
                        <option key={t.action.id} value={t.action.id}>
                          P{t.pillarIndex + 1}.{t.actionIndex + 1} - {t.action.title.substring(0, 45)}...
                        </option>
                      ))}
                  </select>
                </div>

                {/* Successor (Nodo Siguiente) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nodo Siguiente (Tarea que se desbloquea tras finalizar esta):
                  </label>
                  <select
                    value={selectedTask.action.successorId || ''}
                    onChange={e => {
                      onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                        successorId: e.target.value || undefined,
                      });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Sin sucesor directo --</option>
                    {flattenedTasks
                      .filter(t => t.action.id !== selectedTask.action.id)
                      .map(t => (
                        <option key={t.action.id} value={t.action.id}>
                          P{t.pillarIndex + 1}.{t.actionIndex + 1} - {t.action.title.substring(0, 45)}...
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Status, Priority & Milestone Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={selectedTask.action.status || (selectedTask.action.isCompleted ? 'completed' : 'not_started')}
                    onChange={e => {
                      const newStatus = e.target.value as TaskStatus;
                      const isCompleted = newStatus === 'completed';
                      onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                        status: newStatus,
                        isCompleted,
                        progress: isCompleted ? 100 : (selectedTask.action.progress || 0),
                      });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="not_started">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="blocked">Bloqueada</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={selectedTask.action.priority || 'medium'}
                    onChange={e => {
                      onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                        priority: e.target.value as TaskPriority,
                      });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Milestone */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Responsable / Asignado
                  </label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nombre del responsable..."
                      value={selectedTask.action.assignee || ''}
                      onChange={e => {
                        onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                          assignee: e.target.value,
                        });
                      }}
                      className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!selectedTask.action.isMilestone}
                      onChange={e => {
                        onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                          isMilestone: e.target.checked,
                        });
                      }}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    <span>Marcar como Hito Clave (Milestone)</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Notas de Ejecución y Recursos
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles técnicos, enlaces a documentación, criterios de aceptación..."
                  value={selectedTask.action.notes || ''}
                  onChange={e => {
                    onUpdateAction(selectedTask.pillarIndex, selectedTask.actionIndex, {
                      notes: e.target.value,
                    });
                  }}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* AI Recalibrate Trigger */}
              {onRequestRecalibrate && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRequestRecalibrate(selectedTask.action, selectedTask.actionIndex, selectedTask.pillarIndex);
                      setSelectedTaskId(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Recalibrar o Ajustar con IA Copilot</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
