import React from "react";
import { Goal, SaasTier } from "../types/mandala";
import { GeminiStatusResult } from "../services/api";
import { AiStatusBadge } from "./AiStatusBadge";
import { ThemeToggle } from "./ThemeToggle";
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Printer, 
  FolderKanban, 
  Crown,
  Grid3X3,
  ChevronDown,
  FolderOpen,
  Save
} from "lucide-react";

interface NavbarProps {
  currentGoal: Goal;
  allGoals: Goal[];
  onSelectGoal: (id: string) => void;
  onNewGoal: () => void;
  onOpenCheckin: () => void;
  onOpenExport: () => void;
  onOpenTierModal: () => void;
  tier: SaasTier;
  activeView: "grid" | "goals";
  setActiveView: (view: "grid" | "goals") => void;
  aiStatus: GeminiStatusResult | null;
  isLoadingAiStatus: boolean;
  onOpenAiStatus: () => void;
  onOpenDocumentModal: (tab?: "open" | "save") => void;
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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0b0f17]/90 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-sm shadow-indigo-500/10 dark:shadow-indigo-950/30">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Mandala Copilot
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-medium border border-indigo-200 dark:border-indigo-500/30">9×9</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => setActiveView("grid")}
            className={`transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === "grid" ? "text-indigo-600 dark:text-white font-semibold" : "hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Matriz 9x9
          </button>

          {/* Document: Open */}
          <button
            onClick={() => onOpenDocumentModal("open")}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Abrir documento existente o desde archivo [Cmd+O]"
          >
            <FolderOpen className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            Abrir
          </button>

          {/* Document: Save */}
          <button
            onClick={() => onOpenDocumentModal("save")}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Guardar documento actual o descargar archivo [Cmd+S]"
          >
            <Save className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Guardar
          </button>

          <button
            onClick={onOpenCheckin}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Check-in Semanal
          </button>

          <button
            onClick={() => setActiveView("goals")}
            className={`transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === "goals" ? "text-indigo-600 dark:text-white font-semibold" : "hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            Documentos ({allGoals.length})
          </button>

          <button
            onClick={onOpenExport}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Imprimir
          </button>
        </nav>

        {/* Zone 3: Actions, AI Status, Theme & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Document Icons */}
          <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-800 pr-1.5 sm:pr-2">
            <button
              onClick={() => onOpenDocumentModal("open")}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Abrir documento (Cmd+O)"
            >
              <FolderOpen className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            </button>
            <button
              onClick={() => onOpenDocumentModal("save")}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Guardar documento (Cmd+S)"
            >
              <Save className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>

          {/* AI Status Badge */}
          <AiStatusBadge
            status={aiStatus}
            isLoading={isLoadingAiStatus}
            onClick={onOpenAiStatus}
          />

          {/* Theme Selector (Claro / Oscuro / Sistema) */}
          <ThemeToggle />

          {/* Goal Selector Dropdown */}
          <div className="relative hidden xl:block">
            <select
              value={currentGoal.id}
              onChange={(e) => onSelectGoal(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 py-2 pl-3 pr-8 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[170px] truncate transition-colors cursor-pointer"
            >
              {allGoals.map((g) => (
                <option key={g.id} value={g.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {g.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-slate-500 dark:text-slate-400" />
          </div>

          {/* SaaS Tier Button */}
          <button
            onClick={onOpenTierModal}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              tier === "pro"
                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Gestionar suscripción y modo Copilot"
          >
            <Crown className={`h-3.5 w-3.5 ${tier === "pro" ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`} />
            <span className="hidden sm:inline">{tier === "pro" ? "Plan Pro" : "Freemium"}</span>
          </button>

          {/* New Goal CTA */}
          <button
            onClick={onNewGoal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-600/20 dark:shadow-indigo-900/40 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nueva Meta</span>
          </button>
        </div>
      </div>
    </header>
  );
};
