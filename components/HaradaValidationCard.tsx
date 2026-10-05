import React from 'react';
import { HaradaValidationResult, HaradaSuggestion } from '../services/api';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  Calendar, 
  Flame, 
  ArrowRight,
  Check,
  Info
} from 'lucide-react';

interface HaradaValidationCardProps {
  validation: HaradaValidationResult;
  onSelectSuggestion: (newTitle: string) => void;
  onProceedAnyway: () => void;
  isLoadingPillars?: boolean;
}

export const HaradaValidationCard: React.FC<HaradaValidationCardProps> = ({
  validation,
  onSelectSuggestion,
  onProceedAnyway,
  isLoadingPillars = false,
}) => {
  const { isCongruent, score, criteria, diagnosis, recommendation, suggestions, isAiGenerated } = validation;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/40 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50/50 dark:from-indigo-950/30 dark:via-slate-900/80 dark:to-slate-950 p-4 sm:p-5 shadow-lg shadow-indigo-500/5 space-y-4 animate-in fade-in transition-all">
      {/* Harada Principle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
            isCongruent
              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
              : 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
          }`}>
            {isCongruent ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Auditoría Método Harada 9×9
              </span>
              {isAiGenerated && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-semibold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> IA
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isCongruent 
                ? '¡Objetivo Central alineado con el Método Harada!' 
                : 'Objetivo con oportunidad de refinamiento Harada'}
            </h4>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-mono text-slate-400">Alineación:</span>
          <span className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg border ${
            score >= 80
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
              : score >= 50
              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
              : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
          }`}>
            {score}/100
          </span>
        </div>
      </div>

      {/* Criteria Breakdown: Claro, Medible, Desafiante */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-colors ${
          criteria.isClear
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}>
          <Target className="h-4 w-4 shrink-0 text-indigo-500" />
          <div className="min-w-0">
            <p className="font-bold text-[11px]">1. Clara y Concreta</p>
            <p className="text-[10px] opacity-80 truncate">{criteria.isClear ? 'Específica y nítida' : 'Requiere mayor precisión'}</p>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-colors ${
          criteria.isMeasurable
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}>
          <Calendar className="h-4 w-4 shrink-0 text-teal-500" />
          <div className="min-w-0">
            <p className="font-bold text-[11px]">2. Medible & Plazo</p>
            <p className="text-[10px] opacity-80 truncate">{criteria.isMeasurable ? 'Incluye métrica o hito' : 'Falta cifra o plazo'}</p>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-colors ${
          criteria.isChallenging
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}>
          <Flame className="h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="font-bold text-[11px]">3. Desafiante</p>
            <p className="text-[10px] opacity-80 truncate">{criteria.isChallenging ? 'Exige 8 pilares' : 'Puede ser más ambiciosa'}</p>
          </div>
        </div>
      </div>

      {/* Diagnosis & Harada Quote */}
      <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          💡 <strong className="text-slate-900 dark:text-white">Diagnóstico:</strong> {diagnosis}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5">
          "El Objetivo Central: En la casilla central de toda la cuadrícula se escribe el objetivo principal, el cual debe ser claro, medible y desafiante." — Método Harada
        </p>
      </div>

      {/* 3 Formulated Harada Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> 3 Metas Alineadas al Método Harada:
            </span>
            <span className="text-[10px] text-slate-400">Haz clic para adoptar una</span>
          </div>

          <div className="space-y-2">
            {suggestions.map((sug, idx) => (
              <div
                key={`sug-${idx}`}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                      Opción 0{idx + 1}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {sug.title}
                    </h5>
                  </div>
                  {sug.rationale && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7">
                      {sug.rationale}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectSuggestion(sug.title)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs self-end sm:self-center"
                  title="Adoptar esta meta formulada con el método Harada"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Usar esta meta</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Option: Keep original if user prefers */}
      <div className="flex items-center justify-between pt-2 border-t border-indigo-100 dark:border-indigo-500/20 text-xs">
        <span className="text-[11px] text-slate-400">
          ¿Prefieres mantener tu redacción tal como está?
        </span>
        <button
          type="button"
          onClick={onProceedAnyway}
          disabled={isLoadingPillars}
          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline font-medium cursor-pointer"
        >
          Continuar con mi enunciado original →
        </button>
      </div>
    </div>
  );
};
