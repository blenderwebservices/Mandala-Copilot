import React, { useState } from "react";
import { Goal, SaasTier } from "../types/mandala";
import { useSaaS } from "../context/SaaSContext";
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  Crown, 
  Download, 
  FileUp, 
  HardDrive,
  Building,
  User,
  Users
} from "lucide-react";
import { DocumentModalTab } from "./DocumentManagerModal";
import { matchTextAccentInsensitive } from "../services/searchUtils";

interface GoalsLibraryViewProps {
  goals: Goal[];
  currentGoalId: string;
  onSelectGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onNewGoal: () => void;
  tier: SaasTier;
  onOpenTierModal: () => void;
  onOpenDocumentModal: (tab?: DocumentModalTab) => void;
  onDuplicateGoal: (goal: Goal) => void;
  onSaveGoalToFile: (goal: Goal) => void;
  searchQuery?: string;
}

export const GoalsLibraryView: React.FC<GoalsLibraryViewProps> = ({
  goals,
  currentGoalId,
  onSelectGoal,
  onDeleteGoal,
  onNewGoal,
  tier,
  onOpenTierModal,
  onOpenDocumentModal,
  onDuplicateGoal,
  onSaveGoalToFile,
  searchQuery = '',
}) => {
  const { currentTeam } = useSaaS();
  const [filterScope, setFilterScope] = useState<'all' | 'team' | 'personal'>('all');

  const filteredGoals = goals.filter((g) => {
    if (filterScope === 'team') {
      if (!(g.teamId === currentTeam.id || g.visibility === 'team')) return false;
    }
    if (filterScope === 'personal') {
      if (!(!g.teamId || g.visibility === 'private')) return false;
    }
    if (searchQuery && searchQuery.trim()) {
      const matchTitle = matchTextAccentInsensitive(g.title, searchQuery);
      const matchContext = matchTextAccentInsensitive(g.context, searchQuery);
      const matchActions = g.pillars.some((p) =>
        matchTextAccentInsensitive(p.title, searchQuery) ||
        p.actions.some((a) => matchTextAccentInsensitive(a.title, searchQuery) || matchTextAccentInsensitive(a.notes, searchQuery))
      );
      if (!matchTitle && !matchContext && !matchActions) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <HardDrive className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Documentos de Metas (Mandala Charts)</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Cada documento contiene la estructura completa de una meta: 8 pilares estratégicos y 64 acciones concretas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Open / Import document file */}
          <button
            onClick={() => onOpenDocumentModal("open")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title="Abrir un archivo .mandala o .json desde tu computadora"
          >
            <FileUp className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            <span>Abrir Archivo</span>
          </button>

          {tier === "free" && goals.length >= 1 && (
            <button
              onClick={onOpenTierModal}
              className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Múltiples Metas (Pro)</span>
            </button>
          )}

          <button
            onClick={onNewGoal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-600/20 dark:shadow-indigo-950 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Meta 9×9</span>
          </button>
        </div>
      </div>

      {/* Scope Filter Bar (SaaS Workspaces) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Ámbito:</span>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFilterScope('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              filterScope === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Todos ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('team')}
            className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterScope === 'team'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building className="h-3 w-3" />
            <span>Equipo ({currentTeam.name})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('personal')}
            className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterScope === 'personal'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="h-3 w-3" />
            <span>Personales</span>
          </button>
        </div>
      </div>

      {/* Grid of Goals / Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal) => {
          let totalActions = 0;
          let completedActions = 0;
          let habitCount = 0;

          goal.pillars.forEach((p) => {
            p.actions.forEach((a) => {
              totalActions++;
              if (a.isCompleted) completedActions++;
              if (a.type === "recurring") habitCount++;
            });
          });

          const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
          const isCurrent = goal.id === currentGoalId;
          const isTeamGoal = goal.teamId || goal.visibility === 'team';

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                isCurrent
                  ? "border-indigo-500/60 bg-white dark:bg-slate-900/90 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-950/20 ring-1 ring-indigo-500/30"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {goal.pillars.length} Pilares · {totalActions} Acciones
                    </span>
                    {isTeamGoal ? (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/20">
                        <Users className="h-2.5 w-2.5" /> Equipo
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center gap-1 border border-teal-200 dark:border-teal-500/20">
                        <User className="h-2.5 w-2.5" /> Privada
                      </span>
                    )}
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                      Activo
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors line-clamp-2">
                  {goal.title}
                </h3>

                {goal.context && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{goal.context}</p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400">Progreso 8×8</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress === 100
                          ? "bg-emerald-500"
                          : progress >= 50
                          ? "bg-teal-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Quick stats tags */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{completedActions} completadas</span>
                  <span>·</span>
                  <span>{habitCount} hábitos</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Download Document File */}
                  <button
                    onClick={() => onSaveGoalToFile(goal)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Guardar documento en archivo (.mandala)"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  {/* Duplicate Goal */}
                  <button
                    onClick={() => onDuplicateGoal(goal)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Duplicar / Guardar como copia"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* Delete (if more than 1) */}
                  {goals.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la meta "${goal.title}"?`)) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar meta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Select / Open Goal Button */}
                <button
                  onClick={() => onSelectGoal(goal.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-500"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                  }`}
                >
                  <span>{isCurrent ? "Abierto" : "Abrir"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
