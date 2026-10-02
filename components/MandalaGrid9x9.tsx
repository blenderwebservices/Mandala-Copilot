import React, { useState } from 'react';
import { Goal, Pillar, MandalaAction, PILLAR_COLORS } from '../types/mandala';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Maximize2, 
  RotateCw, 
  Flame,
  Zap,
  Info,
  Layers
} from 'lucide-react';

interface MandalaGridProps {
  goal: Goal;
  onSelectPillar: (pillarIndex: number) => void;
  onToggleAction: (pillarIndex: number, actionIndex: number) => void;
  onGeneratePillarActions: (pillarIndex: number) => void;
  isGeneratingPillar: number | null;
  onOpenCheckin: () => void;
}

export const MandalaGrid9x9: React.FC<MandalaGridProps> = ({
  goal,
  onSelectPillar,
  onToggleAction,
  onGeneratePillarActions,
  isGeneratingPillar,
  onOpenCheckin,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'recurring' | 'one_time'>('all');
  const [hoveredAction, setHoveredAction] = useState<{ pillarTitle: string; action: MandalaAction } | null>(null);

  // Calculate overall stats
  let totalActions = 0;
  let completedActions = 0;
  let totalRecurring = 0;
  let activeStreaks = 0;

  goal.pillars.forEach((p) => {
    p.actions.forEach((a) => {
      totalActions++;
      if (a.isCompleted) completedActions++;
      if (a.type === 'recurring') {
        totalRecurring++;
        if (a.streakCount > 0) activeStreaks++;
      }
    });
  });

  const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Macro block coordinates mapping (row, col) -> pillar index or 'center'
  // Row 0: P0 (TL), P1 (TC), P2 (TR)
  // Row 1: P3 (ML), Center Goal, P4 (MR)
  // Row 2: P5 (BL), P6 (BC), P7 (BR)
  const macroLayout: ({ type: 'pillar'; index: number } | { type: 'center' })[][] = [
    [{ type: 'pillar', index: 0 }, { type: 'pillar', index: 1 }, { type: 'pillar', index: 2 }],
    [{ type: 'pillar', index: 3 }, { type: 'center' }, { type: 'pillar', index: 4 }],
    [{ type: 'pillar', index: 5 }, { type: 'pillar', index: 6 }, { type: 'pillar', index: 7 }],
  ];

  // Helper for cell positions 0..7 mapped to 3x3 (row, col)
  // 0:(0,0), 1:(0,1), 2:(0,2), 3:(1,0), (center 1,1), 4:(1,2), 5:(2,0), 6:(2,1), 7:(2,2)
  const perimeterCoords = [
    [0, 0], [0, 1], [0, 2],
    [1, 0],         [1, 2],
    [2, 0], [2, 1], [2, 2],
  ];

  // Get pillar progress
  const getPillarProgress = (pillar: Pillar) => {
    if (!pillar.actions || pillar.actions.length === 0) return 0;
    const completed = pillar.actions.filter((a) => a.isCompleted).length;
    return Math.round((completed / pillar.actions.length) * 100);
  };

  // Color code depending on completion %
  const getProgressBorderColor = (progress: number) => {
    if (progress === 0) return 'border-slate-200 hover:border-slate-300 bg-white/70 dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900/40';
    if (progress < 50) return 'border-amber-300 hover:border-amber-400 bg-amber-50/70 dark:border-amber-500/30 dark:hover:border-amber-500/50 dark:bg-amber-950/15';
    if (progress < 100) return 'border-teal-300 hover:border-teal-400 bg-teal-50/70 dark:border-teal-500/40 dark:hover:border-teal-500/60 dark:bg-teal-950/20';
    return 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/70 dark:border-emerald-500/60 dark:hover:border-emerald-500/80 dark:bg-emerald-950/30 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]';
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Goal Overview & KPI Metrics */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-5 backdrop-blur-sm shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                Meta Central Activa
              </span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {completedActions} de {totalActions} acciones ({overallProgress}%)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {goal.title}
            </h1>
            {goal.context && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{goal.context}</p>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 pt-3 lg:pt-0 w-full lg:w-auto">
            {/* Overall Progress Gauge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                <svg className="w-12 h-12 -rotate-90 absolute">
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    className={`${
                      overallProgress === 100
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : overallProgress >= 50
                        ? 'text-teal-500 dark:text-teal-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    } transition-all duration-700 ease-out`}
                    strokeWidth="4"
                    strokeDasharray={119.38}
                    strokeDashoffset={119.38 - (119.38 * overallProgress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{overallProgress}%</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Progreso Global</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {completedActions === 64 ? 'Completado' : 'En Ejecución'}
                </p>
              </div>
            </div>

            {/* Recurring Habits Streak */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <Flame className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Hábitos Activos</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {activeStreaks} / {totalRecurring}
                </p>
              </div>
            </div>

            {/* Check-in Semanal shortcut */}
            <button
              onClick={onOpenCheckin}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Evaluar Check-in</span>
            </button>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todas (64)
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pendientes ({totalActions - completedActions})
            </button>
            <button
              onClick={() => setFilterType('recurring')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'recurring'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hábitos ({totalRecurring})
            </button>
            <button
              onClick={() => setFilterType('one_time')}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'one_time'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tareas Únicas ({totalActions - totalRecurring})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-700 inline-block"></span> 0%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 1-49%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span> 50-99%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 100%
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">💡 Haz clic en cualquier pilar para hacer zoom</span>
          </div>
        </div>
      </div>

      {/* Main 9x9 Grid (3x3 Macro Blocks) */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[860px] max-w-6xl mx-auto p-4 rounded-2xl bg-white/70 dark:bg-[#090d14] border border-slate-200 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
          <div className="grid grid-cols-3 gap-3">
            {macroLayout.map((row, rIdx) =>
              row.map((macro, cIdx) => {
                // If this is the CENTER MACRO BLOCK (Main Goal + 8 Pillars surrounding it)
                if (macro.type === 'center') {
                  return (
                    <div
                      key={`center-macro-${rIdx}-${cIdx}`}
                      className="p-2 rounded-xl border-2 border-indigo-400/60 dark:border-indigo-500/40 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-950 relative shadow-md dark:shadow-lg dark:shadow-indigo-950/30 flex flex-col justify-between transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-mono flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Núcleo Central
                        </span>
                        <span className="text-[10px] font-mono text-indigo-600/80 dark:text-indigo-300/80">8 Pilares</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 aspect-square">
                        {perimeterCoords.map(([subR, subC], pIdx) => {
                          return null;
                        })}

                        {/* We render 9 cells for the center 3x3 */}
                        {[
                          { r: 0, c: 0, pIdx: 0 },
                          { r: 0, c: 1, pIdx: 1 },
                          { r: 0, c: 2, pIdx: 2 },
                          { r: 1, c: 0, pIdx: 3 },
                          { r: 1, c: 1, isCenterGoal: true },
                          { r: 1, c: 2, pIdx: 4 },
                          { r: 2, c: 0, pIdx: 5 },
                          { r: 2, c: 1, pIdx: 6 },
                          { r: 2, c: 2, pIdx: 7 },
                        ].map((cell, idx) => {
                          if (cell.isCenterGoal) {
                            return (
                              <div
                                key={`core-goal-cell`}
                                className="col-span-1 row-span-1 rounded-lg bg-indigo-600 dark:bg-indigo-600/30 border-2 border-indigo-600 dark:border-indigo-400 p-2 flex flex-col items-center justify-center text-center shadow-inner group"
                              >
                                <span className="text-[9px] font-extrabold text-indigo-100 dark:text-indigo-200 uppercase tracking-widest mb-0.5">
                                  META
                                </span>
                                <span className="text-xs font-bold text-white line-clamp-3 leading-tight">
                                  {goal.title}
                                </span>
                              </div>
                            );
                          }

                          const pillar = goal.pillars[cell.pIdx!];
                          if (!pillar) return <div key={`empty-p-${idx}`} />;
                          const progress = getPillarProgress(pillar);

                          return (
                            <button
                              key={`core-pillar-${cell.pIdx}`}
                              onClick={() => onSelectPillar(cell.pIdx!)}
                              className={`p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all hover:scale-[1.03] group cursor-pointer ${
                                progress === 100
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/60'
                                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-400 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                                  P{cell.pIdx! + 1}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {progress}%
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-white">
                                {pillar.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // If this is an OUTER MACRO BLOCK (Pillar k in the center, surrounded by its 8 actions)
                const pIdx = macro.index;
                const pillar = goal.pillars[pIdx];
                if (!pillar) return null;

                const progress = getPillarProgress(pillar);
                const hasActions = pillar.actions && pillar.actions.length === 8;
                const isGenerating = isGeneratingPillar === pIdx;

                return (
                  <div
                    key={`pillar-macro-${pIdx}`}
                    className={`p-2 rounded-xl border transition-all duration-300 flex flex-col justify-between ${getProgressBorderColor(
                      progress
                    )}`}
                  >
                    {/* Macro Block Header */}
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          0{pIdx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {pillar.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                          {progress}%
                        </span>
                        <button
                          onClick={() => onSelectPillar(pIdx)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hacer zoom en este cuadrante"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* 3x3 Mini Grid for this quadrant */}
                    {hasActions ? (
                      <div className="grid grid-cols-3 gap-1 aspect-square">
                        {[
                          { r: 0, c: 0, aIdx: 0 },
                          { r: 0, c: 1, aIdx: 1 },
                          { r: 0, c: 2, aIdx: 2 },
                          { r: 1, c: 0, aIdx: 3 },
                          { r: 1, c: 1, isPillarCenter: true },
                          { r: 1, c: 2, aIdx: 4 },
                          { r: 2, c: 0, aIdx: 5 },
                          { r: 2, c: 1, aIdx: 6 },
                          { r: 2, c: 2, aIdx: 7 },
                        ].map((subCell, sIdx) => {
                          // Center of outer block is the Pillar title mirror
                          if (subCell.isPillarCenter) {
                            return (
                              <button
                                key={`quad-center-${pIdx}`}
                                onClick={() => onSelectPillar(pIdx)}
                                className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
                              >
                                <span className="text-[8px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                                  Pilar 0{pIdx + 1}
                                </span>
                                <span className="text-[10px] font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">
                                  {pillar.title}
                                </span>
                              </button>
                            );
                          }

                          const action = pillar.actions[subCell.aIdx!];
                          if (!action) return <div key={`empty-a-${sIdx}`} />;

                          // Apply filter highlights
                          const matchesFilter =
                            filterType === 'all' ||
                            (filterType === 'pending' && !action.isCompleted) ||
                            (filterType === 'recurring' && action.type === 'recurring') ||
                            (filterType === 'one_time' && action.type === 'one_time');

                          return (
                            <div
                              key={`action-cell-${pIdx}-${subCell.aIdx}`}
                              onMouseEnter={() => setHoveredAction({ pillarTitle: pillar.title, action })}
                              onMouseLeave={() => setHoveredAction(null)}
                              onClick={() => onToggleAction(pIdx, subCell.aIdx!)}
                              className={`p-1.5 rounded-md border text-left cursor-pointer transition-all flex flex-col justify-between group ${
                                !matchesFilter
                                  ? 'opacity-25 grayscale border-slate-200/40 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/20'
                                  : action.isCompleted
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100 hover:border-emerald-400'
                                  : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500">
                                  A{subCell.aIdx! + 1}
                                </span>
                                {action.isCompleted ? (
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                ) : action.type === 'recurring' ? (
                                  <RotateCw className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400/80 shrink-0" />
                                ) : (
                                  <Zap className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400/80 shrink-0" />
                                )}
                              </div>
                              <p
                                className={`text-[9.5px] line-clamp-2 leading-tight ${
                                  action.isCompleted
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white font-medium'
                                }`}
                              >
                                {action.title}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Empty / Pending Generation State for this pillar
                      <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-3 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-slate-50/80 dark:bg-slate-950/50">
                        {isGenerating ? (
                          <div className="space-y-2">
                            <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Generando 8 acciones con IA...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sin acciones asignadas aún</p>
                            <button
                              onClick={() => onGeneratePillarActions(pIdx)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/30 rounded-md transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Generar 8x8 con IA</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Details / Hover Inspector */}
      {hoveredAction && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`p-1.5 rounded-lg shrink-0 ${
                hoveredAction.action.type === 'recurring'
                  ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-transparent'
                  : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-transparent'
              }`}
            >
              {hoveredAction.action.type === 'recurring' ? (
                <RotateCw className="h-4 w-4" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{hoveredAction.pillarTitle}</span>
                <span>·</span>
                <span>{hoveredAction.action.type === 'recurring' ? 'Hábito Recurrente' : 'Tarea Única'}</span>
                {hoveredAction.action.streakCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-0.5">
                      <Flame className="h-3 w-3" /> {hoveredAction.action.streakCount} días de racha
                    </span>
                  </>
                )}
              </div>
              <p className="font-semibold text-slate-900 dark:text-white truncate">{hoveredAction.action.title}</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
            {hoveredAction.action.isCompleted ? '✓ Completada' : 'Haz clic para alternar'}
          </span>
        </div>
      )}
    </div>
  );
};
