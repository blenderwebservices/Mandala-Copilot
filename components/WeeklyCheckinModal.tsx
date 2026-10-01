import React, { useState } from 'react';
import { Goal } from '../types/mandala';
import { 
  X, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  ArrowRight,
  Flame,
  CheckCircle2,
  RotateCw
} from 'lucide-react';
import { fetchWeeklyCheckin, WeeklyCheckinResult } from '../services/api';

interface WeeklyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  onJumpToPillar: (pillarIndex: number) => void;
}

export const WeeklyCheckinModal: React.FC<WeeklyCheckinModalProps> = ({
  isOpen,
  onClose,
  goal,
  onJumpToPillar,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<WeeklyCheckinResult | null>(null);

  if (!isOpen) return null;

  // Compute stats
  let totalActions = 0;
  let completedActions = 0;
  let totalOneTime = 0;
  let completedOneTime = 0;
  let totalRecurring = 0;
  let activeRecurring = 0;

  const pillarBreakdown = goal.pillars.map((p, idx) => {
    let pTotal = p.actions?.length || 0;
    let pComp = 0;
    p.actions?.forEach((a) => {
      totalActions++;
      if (a.isCompleted) {
        completedActions++;
        pComp++;
      }
      if (a.type === 'one_time') {
        totalOneTime++;
        if (a.isCompleted) completedOneTime++;
      } else {
        totalRecurring++;
        if (a.streakCount > 0) activeRecurring++;
      }
    });

    const progress = pTotal > 0 ? Math.round((pComp / pTotal) * 100) : 0;
    return {
      index: idx,
      title: p.title,
      total: pTotal,
      completed: pComp,
      progress,
    };
  });

  const overallPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const handleRunAiEvaluation = async () => {
    setIsLoading(true);
    try {
      const stats = {
        total: totalActions,
        completed: completedActions,
        percentage: overallPercent,
        totalOneTime,
        completedOneTime,
        totalRecurring,
        activeRecurring,
        pillarBreakdown,
      };
      const res = await fetchWeeklyCheckin(goal.title, stats);
      setCheckinResult(res);
    } catch (err) {
      console.error(err);
      setCheckinResult({
        overallAssessment: 'Tu ritmo de avance demuestra tracción en los pilares iniciales.',
        bottleneck: 'Mantener la regularidad en los hábitos diarios de mayor complejidad.',
        keyWins: [
          'Cuadrantes de arquitectura bien definidos',
          'Primeras tareas críticas completadas',
        ],
        nextActions: [
          'Agendar bloques de Deep Work específicos',
          'Recalibrar aquellas acciones que lleven más de 5 días sin tocar',
          'Celebrar los micro-avances en el check-in del viernes',
        ],
        motivationalNote: 'El poder del Mandala Chart 9x9 radica en que la visión global nunca se pierde mientras ejecutas la micro-acción.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Check-in Semanal Adaptativo
              </h2>
              <p className="text-[11px] text-slate-400">
                Auditoría de consistencia y balance del Mandala 9x9
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block mb-1">Avance Global</span>
              <p className="text-xl font-bold font-mono text-white">{overallPercent}%</p>
              <span className="text-[10px] text-slate-500 font-mono">
                {completedActions}/{totalActions} tareas
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block mb-1">Tareas Únicas</span>
              <p className="text-xl font-bold font-mono text-indigo-400">
                {completedOneTime}/{totalOneTime}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Hitos completados</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block mb-1">Hábitos Activos</span>
              <p className="text-xl font-bold font-mono text-teal-400">
                {activeRecurring}/{totalRecurring}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Con racha positiva</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-400 block mb-1">Cuadrantes 100%</span>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {pillarBreakdown.filter((p) => p.progress === 100).length}/8
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Pilares concluidos</span>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Diagnóstico del Copiloto IA
              </span>
              {!checkinResult && (
                <button
                  onClick={handleRunAiEvaluation}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-900 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizando cuadrantes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generar Evaluación IA</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {checkinResult ? (
              <div className="space-y-3 animate-in fade-in">
                {/* Overall Assessment */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                    Evaluación de Tracción
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {checkinResult.overallAssessment}
                  </p>
                </div>

                {/* Bottleneck Warning */}
                {checkinResult.bottleneck && (
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Cuello de Botella Detectado</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      {checkinResult.bottleneck}
                    </p>
                  </div>
                )}

                {/* Key Wins & Adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Victorias Clave
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {checkinResult.keyWins?.map((win, wIdx) => (
                        <li key={wIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/15 space-y-2">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" /> Ajustes Sugeridos
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {checkinResult.nextActions?.map((act, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">→</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Motivational Quote */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 text-center text-xs text-slate-400 italic">
                  "{checkinResult.motivationalNote}"
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleRunAiEvaluation}
                    disabled={isLoading}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>Volver a evaluar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Haz clic en "Generar Evaluación IA" para que el Copiloto examine el balance entre tus 8 pilares, detecte inconsistencias de hábitos y sugiera el plan de acción para los próximos 7 días.
                </p>
              </div>
            )}
          </div>

          {/* Quadrant Progress Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Desglose por Cuadrante (8 Pilares)
            </span>
            <div className="space-y-2">
              {pillarBreakdown.map((p) => (
                <div
                  key={p.index}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-slate-500">0{p.index + 1}</span>
                    <span className="text-xs font-medium text-slate-200 truncate">{p.title}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full ${
                          p.progress === 100
                            ? 'bg-emerald-500'
                            : p.progress >= 50
                            ? 'bg-teal-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-300 w-10 text-right">
                      {p.progress}%
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onJumpToPillar(p.index);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 ml-1"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
