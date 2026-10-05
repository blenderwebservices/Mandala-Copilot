import React, { useState, useRef, useEffect } from "react";
import { Goal, SaasTier } from "../types/mandala";
import { GeminiStatusResult } from "../services/api";
import { AiStatusBadge } from "./AiStatusBadge";
import { ThemeToggle } from "./ThemeToggle";
import { useSaaS } from "../context/SaaSContext";
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Printer, 
  FolderKanban, 
  Crown,
  Grid3X3,
  ListTree,
  ChevronDown,
  FolderOpen,
  Save,
  Copy,
  Building,
  Users,
  ShieldCheck,
  Check,
  CalendarRange
} from "lucide-react";
import { DocumentModalTab } from "./DocumentManagerModal";

export type ActiveViewType = "grid" | "hierarchy" | "gantt" | "goals";

interface NavbarProps {
  currentGoal: Goal;
  allGoals: Goal[];
  onSelectGoal: (id: string) => void;
  onNewGoal: () => void;
  onOpenCheckin: () => void;
  onOpenExport: () => void;
  onOpenTierModal: () => void;
  tier: SaasTier;
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  aiStatus: GeminiStatusResult | null;
  isLoadingAiStatus: boolean;
  onOpenAiStatus: () => void;
  onOpenDocumentModal: (tab?: DocumentModalTab) => void;
  onOpenTeamModal: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  hasUnsavedChanges?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentGoal,
  allGoals,
  onSelectGoal,
  onNewGoal,
  onOpenCheckin,
  onOpenExport,
  onOpenTierModal,
  tier,
  activeView,
  setActiveView,
  aiStatus,
  isLoadingAiStatus,
  onOpenAiStatus,
  onOpenDocumentModal,
  onOpenTeamModal,
  onOpenAdminModal,
  onOpenAuthModal,
  hasUnsavedChanges = false,
}) => {
  const {
    currentUser,
    currentTeam,
    userTeams,
    isAdmin,
    switchTeam,
  } = useSaaS();

  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Close team dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0b0f17]/90 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Zone 1: Brand Title & Team Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-sm shadow-indigo-500/10 dark:shadow-indigo-950/30 shrink-0">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Mandala
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-500/30">SaaS</span>
            </span>
          </div>

          {/* Team Workspace Switcher */}
          <div className="relative" ref={teamDropdownRef}>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
            <button
              type="button"
              onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-850 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer"
              title="Cambiar de Equipo / Workspace"
            >
              <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="max-w-[90px] sm:max-w-[130px] truncate text-[11px] sm:text-xs">
                {currentTeam.name}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            </button>

            {/* Team Dropdown Menu */}
            {isTeamDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tus Espacios de Trabajo
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {userTeams.map((team) => {
                    const isSelected = team.id === currentTeam.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => {
                          switchTeam(team.id);
                          setIsTeamDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <div className="truncate">
                            <p className="truncate font-medium">{team.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-mono">
                              {team.plan} · {team.members.length} miembros
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 px-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamDropdownOpen(false);
                      onOpenTeamModal();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Administrar integrantes...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => setActiveView("grid")}
            className={`transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg ${
              activeView === "grid" ? "text-indigo-600 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800" : "hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Vista tradicional de Matriz espacial 9x9"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            Matriz 9x9
          </button>

          <button
            onClick={() => setActiveView("hierarchy")}
            className={`transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg ${
              activeView === "hierarchy" ? "text-indigo-600 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800" : "hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Vista jerárquica vertical optimizada para móvil y listas de ejecución"
          >
            <ListTree className="h-3.5 w-3.5" />
            Jerárquica
          </button>

          <button
            onClick={() => setActiveView("gantt")}
            className={`transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg ${
              activeView === "gantt" ? "text-indigo-600 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800" : "hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Diagrama de Gantt y cronograma en modo proyecto (fechas y dependencias)"
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Gantt
          </button>

          <button
            onClick={() => setActiveView("goals")}
            className={`transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg ${
              activeView === "goals" ? "text-indigo-600 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800" : "hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            Documentos ({allGoals.length})
          </button>

          <button
            onClick={onOpenCheckin}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer py-1.5 px-2 rounded-lg"
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Check-in
          </button>

          {/* Document: Open / Save */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
            <button
              onClick={() => onOpenDocumentModal("open")}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Abrir documento [Cmd+O]"
            >
              <FolderOpen className="h-3.5 w-3.5 text-sky-500" />
            </button>
            <button
              onClick={() => onOpenDocumentModal("save")}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer relative"
              title="Guardar [Cmd+S]"
            >
              <Save className="h-3.5 w-3.5 text-indigo-600" />
              {hasUnsavedChanges && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0 absolute top-1 right-1" />
              )}
            </button>
            <button
              onClick={onOpenExport}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Imprimir o exportar matriz"
            >
              <Printer className="h-3.5 w-3.5 text-amber-500" />
            </button>
          </div>
        </nav>

        {/* Zone 3: SaaS Admin, Team, AI Status, Theme & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SaaS Admin Panel CTA */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminModal}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
              title="Panel de Administración Global SaaS"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}

          {/* Team Management CTA */}
          <button
            type="button"
            onClick={onOpenTeamModal}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Integrantes y configuración de equipo"
          >
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden md:inline">Equipo</span>
          </button>

          {/* AI Status Badge */}
          <AiStatusBadge
            status={aiStatus}
            isLoading={isLoadingAiStatus}
            onClick={onOpenAiStatus}
          />

          {/* Theme Selector (Claro / Oscuro / Sistema) */}
          <ThemeToggle />

          {/* User Session Profile Button */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-2xs"
            title="Perfil de Usuario y Selector de Roles Demo"
          >
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-indigo-400/50"
            />
            <span className="hidden xl:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[80px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>

          {/* New Goal CTA */}
          <button
            onClick={onNewGoal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors shadow-sm shadow-indigo-600/20 dark:shadow-indigo-900/40 cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nueva Meta</span>
          </button>
        </div>
      </div>

      {/* Mobile Responsive Sub-Navbar Switcher */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/95 dark:bg-slate-900/90 py-1.5 px-3 text-xs font-medium backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setActiveView("hierarchy")}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeView === "hierarchy"
              ? "bg-indigo-600 text-white shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <ListTree className="h-3.5 w-3.5" />
          <span>Jerárquica</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("grid")}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeView === "grid"
              ? "bg-indigo-600 text-white shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          <span>Matriz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("gantt")}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeView === "gantt"
              ? "bg-indigo-600 text-white shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <CalendarRange className="h-3.5 w-3.5" />
          <span>Gantt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("goals")}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeView === "goals"
              ? "bg-indigo-600 text-white shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FolderKanban className="h-3.5 w-3.5" />
          <span>Metas</span>
        </button>

        <button
          type="button"
          onClick={onOpenTeamModal}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <Users className="h-3.5 w-3.5" />
          <span>Equipo</span>
        </button>
      </div>
    </header>
  );
};
