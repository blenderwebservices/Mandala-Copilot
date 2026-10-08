import React, { useState, useRef, useEffect } from "react";
import { Goal, SaasTier } from "../types/mandala";
import { GeminiStatusResult } from "../services/api";
import { AiStatusBadge } from "./AiStatusBadge";
import { ThemeToggle } from "./ThemeToggle";
import { useSaaS } from "../context/SaaSContext";
import { 
  Plus, 
  Calendar, 
  Printer, 
  FolderKanban, 
  Grid3X3,
  ListTree,
  ChevronDown,
  FolderOpen,
  Save,
  Building,
  Users,
  ShieldCheck,
  Check,
  CalendarRange,
  FileText
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-md shadow-xs transition-colors duration-150">
      {/* ========================================================= */}
      {/* BARRA 1: De Mandala (SaaS) hasta Check-in                */}
      {/* ========================================================= */}
      <div className="w-full border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto flex flex-col md:flex-row md:items-center justify-between px-3 sm:px-6 lg:px-8 py-2 gap-2 max-w-7xl">
          {/* Marca / Identidad & Selector de Workspace */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-xs shadow-indigo-500/10 dark:shadow-indigo-950/30 shrink-0">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Mandala
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-500/30">
                  SaaS
                </span>
              </div>
            </div>

            {/* Separador vertical */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

            {/* Team Workspace Switcher */}
            <div className="relative" ref={teamDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-850 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer shadow-2xs"
                title="Cambiar de Equipo / Workspace"
              >
                <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="max-w-[100px] sm:max-w-[130px] truncate text-[11px] sm:text-xs">
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

          {/* Vistas de navegación y Check-in (Responsivas con scroll suave en pantallas estrechas) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveView("grid")}
              className={`transition-all flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg whitespace-nowrap shrink-0 border ${
                activeView === "grid"
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Vista tradicional de Matriz espacial 9x9"
            >
              <Grid3X3 className="h-3.5 w-3.5 shrink-0" />
              <span>Matriz 9x9</span>
            </button>

            <button
              onClick={() => setActiveView("hierarchy")}
              className={`transition-all flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg whitespace-nowrap shrink-0 border ${
                activeView === "hierarchy"
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Vista jerárquica vertical optimizada para móvil y listas de ejecución"
            >
              <ListTree className="h-3.5 w-3.5 shrink-0" />
              <span>Jerárquica</span>
            </button>

            <button
              onClick={() => setActiveView("gantt")}
              className={`transition-all flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg whitespace-nowrap shrink-0 border ${
                activeView === "gantt"
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Diagrama de Gantt y cronograma en modo proyecto (fechas y dependencias)"
            >
              <CalendarRange className="h-3.5 w-3.5 shrink-0" />
              <span>Gantt</span>
            </button>

            <button
              onClick={() => setActiveView("goals")}
              className={`transition-all flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg whitespace-nowrap shrink-0 border ${
                activeView === "goals"
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Biblioteca de documentos guardados"
            >
              <FolderKanban className="h-3.5 w-3.5 shrink-0" />
              <span>Documentos ({allGoals.length})</span>
            </button>

            {/* Check-in Semanal */}
            <button
              onClick={onOpenCheckin}
              className="transition-all flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 py-1.5 px-2.5 rounded-lg cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              title="Asistente de Check-in Estratégico Semanal"
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">Check-in</span>
            </button>
          </nav>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BARRA 2: De Abrir hasta imprimir, junto con nuevo         */}
      {/* ========================================================= */}
      <div className="w-full border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/90 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 lg:px-8 py-1.5 gap-2 max-w-7xl">
          {/* Grupo de Acciones de Documento: Nuevo, Abrir, Guardar, Imprimir */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            {/* Botón: Nuevo / Nueva Meta */}
            <button
              onClick={onNewGoal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shadow-2xs shadow-indigo-600/30 dark:shadow-indigo-900/40 cursor-pointer shrink-0"
              title="Crear una nueva meta [Asistente IA o en blanco]"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="inline">Nueva Meta</span>
            </button>

            {/* Separador sutil */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

            {/* Botón: Abrir */}
            <button
              onClick={() => onOpenDocumentModal("open")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Abrir documento [Cmd+O]"
            >
              <FolderOpen className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span className="hidden xs:inline">Abrir</span>
              <kbd className="hidden md:inline text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-600">⌘O</kbd>
            </button>

            {/* Botón: Guardar */}
            <button
              onClick={() => onOpenDocumentModal("save")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs shrink-0 relative"
              title="Guardar documento actual [Cmd+S]"
            >
              <Save className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden xs:inline">Guardar</span>
              <kbd className="hidden md:inline text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-600">⌘S</kbd>
              {hasUnsavedChanges && (
                <span 
                  className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0 absolute top-1 right-1" 
                  title="Hay cambios sin guardar"
                />
              )}
            </button>

            {/* Botón: Imprimir / Exportar */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Imprimir o exportar matriz en PDF / PNG"
            >
              <Printer className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="hidden xs:inline">Imprimir</span>
            </button>
          </div>

          {/* Contexto del Documento Activo */}
          <div className="flex items-center gap-2 min-w-0 text-xs text-slate-500 dark:text-slate-400 overflow-hidden ml-auto">
            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <span className="hidden sm:inline text-slate-400 shrink-0">Meta activa:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-[280px] md:max-w-[380px] lg:max-w-[480px]">
              {currentGoal.title}
            </span>
            {hasUnsavedChanges ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium shrink-0 border border-amber-200 dark:border-amber-800/50">
                Sin guardar
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium shrink-0 border border-emerald-200 dark:border-emerald-800/50 hidden xs:inline">
                Sincronizado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BARRA 3: El resto (Admin, Equipo, IA, Tema, Perfil)       */}
      {/* ========================================================= */}
      <div className="w-full bg-slate-100/60 dark:bg-[#070b12]/80 backdrop-blur-sm">
        <div className="mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8 py-1.5 gap-2 max-w-7xl">
          {/* Lado izquierdo: Admin, Equipo y Estado de IA */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* SaaS Admin Panel CTA */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                title="Panel de Administración Global SaaS"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden xs:inline">Admin</span>
              </button>
            )}

            {/* Team Management CTA */}
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              title="Integrantes y configuración de equipo"
            >
              <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="hidden xs:inline">Equipo</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({currentTeam.members.length})
              </span>
            </button>

            {/* AI Status Badge */}
            <AiStatusBadge
              status={aiStatus}
              isLoading={isLoadingAiStatus}
              onClick={onOpenAiStatus}
            />
          </div>

          {/* Lado derecho: Selector de Tema y Perfil de Usuario */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Selector (Claro / Oscuro / Sistema) */}
            <ThemeToggle />

            {/* User Session Profile Button */}
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-white/80 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
              title="Perfil de Usuario y Selector de Roles Demo"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-indigo-400/50"
              />
              <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[80px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="hidden md:inline text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-600">
                {currentUser.role}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
