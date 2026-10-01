import React from 'react';
import { Goal, SaasTier } from '../types/mandala';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Printer, 
  FolderKanban, 
  Crown,
  Grid3X3,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentGoal: Goal;
  allGoals: Goal[];
  onSelectGoal: (id: string) => void;
  onNewGoal: () => void;
  onOpenCheckin: () => void;
  onOpenExport: () => void;
  onOpenTierModal: () => void;
  tier: SaasTier;
  activeView: 'grid' | 'goals';
  setActiveView: (view: 'grid' | 'goals') => void;
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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f17]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Title (Single text element wordmark in display style) */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Mandala Copilot
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-medium">9×9</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean text links with hover transitions) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveView('grid')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeView === 'grid' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Matriz 9x9
          </button>

          <button
            onClick={onOpenCheckin}
            className="hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-400"
          >
            <Calendar className="h-4 w-4 text-emerald-400" />
            Check-in Semanal
          </button>

          <button
            onClick={() => setActiveView('goals')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeView === 'goals' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            Biblioteca ({allGoals.length})
          </button>

          <button
            onClick={onOpenExport}
            className="hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-400"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            Exportar / Imprimir
          </button>
        </nav>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Goal Selector Dropdown */}
          <div className="relative hidden sm:block">
            <select
              value={currentGoal.id}
              onChange={(e) => onSelectGoal(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 py-2 pl-3 pr-8 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] truncate"
            >
              {allGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-slate-400" />
          </div>

          {/* SaaS Tier Button */}
          <button
            onClick={onOpenTierModal}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              tier === 'pro'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Gestionar suscripción y modo Copilot"
          >
            <Crown className={`h-3.5 w-3.5 ${tier === 'pro' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{tier === 'pro' ? 'Plan Pro' : 'Freemium'}</span>
          </button>

          {/* New Goal CTA */}
          <button
            onClick={onNewGoal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-900/40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nueva Meta</span>
          </button>
        </div>
      </div>
    </header>
  );
};
