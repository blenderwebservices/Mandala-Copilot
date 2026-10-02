import React from 'react';
import { SaasTier } from '../types/mandala';
import { X, Check, Crown, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface SaaSTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SaasTier;
  onSwitchTier: (newTier: SaasTier) => void;
}

export const SaaSTierModal: React.FC<SaaSTierModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSwitchTier,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Planes y Modelo SaaS
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Arquitectura de monetización comercial del Mandala Chart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Freemium Tier */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                currentTier === 'free'
                  ? 'border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md shadow-indigo-500/10 dark:shadow-indigo-950'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tier Freemium
                  </span>
                  {currentTier === 'free' && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                      Activo
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">$0</span>
                  <span className="text-xs text-slate-500"> / siempre</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Para quienes desean probar el método de cuadrícula con asistencia básica de pilares.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>1 sola cuadrícula 9x9 activa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>IA sugiere los 8 pilares iniciales</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400 dark:text-slate-500">
                    <span className="text-slate-400 dark:text-slate-600">✕</span>
                    <span>Acciones 8x8 ingresadas de forma manual</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400 dark:text-slate-500">
                    <span className="text-slate-400 dark:text-slate-600">✕</span>
                    <span>Sin recalibración adaptativa con IA</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onSwitchTier('free')}
                  disabled={currentTier === 'free'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    currentTier === 'free'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  {currentTier === 'free' ? 'Plan Actual' : 'Cambiar a Freemium'}
                </button>
              </div>
            </div>

            {/* Pro Copilot Tier */}
            <div
              className={`p-5 rounded-xl border relative transition-all flex flex-col justify-between ${
                currentTier === 'pro'
                  ? 'border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg shadow-amber-500/10 dark:shadow-amber-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/80'
              }`}
            >
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  RECOMENDADO
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Tier Pro Copilot
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">$12</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400"> / mes</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Desbloquea el motor completo de 64 acciones, check-ins semanales y recalibración viva.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>Múltiples cuadrículas 9x9 activas (Profesional, Personal, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>Generación completa y regeneración parcial 8x8 con IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>Recalibración adaptativa de tareas con fricción</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>Check-ins ejecutivos semanales automatizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>Exportación en alta resolución y formatos de impresión</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onSwitchTier('pro')}
                  disabled={currentTier === 'pro'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    currentTier === 'pro'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                  }`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span>{currentTier === 'pro' ? 'Plan Pro Activo' : 'Activar Modo Pro Copilot'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Cambia entre tiers libremente para probar las capacidades de la plataforma.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
