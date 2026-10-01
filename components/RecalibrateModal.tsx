import React, { useState } from 'react';
import { MandalaAction, ActionType } from '../types/mandala';
import { Sparkles, ArrowRight, Check, X, AlertTriangle, Lightbulb, SplitSquareVertical } from 'lucide-react';
import { fetchRecalibration, RecalibrationResult, GeneratedAction } from '../services/api';

interface RecalibrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalTitle: string;
  pillarTitle: string;
  action: MandalaAction | null;
  actionIndex: number;
  onApplyReplacement: (actionIndex: number, newActions: GeneratedAction[]) => void;
}

export const RecalibrateModal: React.FC<RecalibrateModalProps> = ({
  isOpen,
  onClose,
  goalTitle,
  pillarTitle,
  action,
  actionIndex,
  onApplyReplacement,
}) => {
  const [selectedReason, setSelectedReason] = useState('Demasiado grande o difusa; no sé por dónde empezar');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecalibrationResult | null>(null);

  if (!isOpen || !action) return null;

  const presetReasons = [
    'Demasiado grande o difusa; no sé por dónde empezar',
    'Falta de tiempo diario; el umbral de entrada es muy alto',
    'Bloqueo técnico o dependencia de un tercero',
    'He perdido el interés o ya no parece relevante',
  ];

  const handleRunRecalibration = async () => {
    setIsLoading(true);
    const feedback = customReason.trim() ? customReason : selectedReason;

    try {
      const res = await fetchRecalibration(
        goalTitle,
        pillarTitle,
        action.title,
        action.type,
        feedback
      );
      setResult(res);
    } catch (err) {
      console.error(err);
      // Fallback
      setResult({
        diagnosis: 'La acción actual requiere un compromiso de energía demasiado alto al inicio.',
        recommendation: 'Aplica el principio de los dos minutos de Hábitos Atómicos: reduce la escala hasta que sea ridículamente fácil de empezar.',
        replacementActions: [
          { title: `Definir el esquema inicial de ${action.title} en 10 min`, type: 'one_time' },
          { title: `Micro-hábito diario: 15 minutos sin distracciones`, type: 'recurring' },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result && result.replacementActions.length > 0) {
      onApplyReplacement(actionIndex, result.replacementActions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Recalibración Adaptativa con IA
              </h2>
              <p className="text-[11px] text-slate-400">
                Pilar: <span className="text-slate-300 font-semibold">{pillarTitle}</span>
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Action in Question Card */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase text-amber-300">
              Acción con Fricción o Estancamiento
            </span>
            <p className="text-sm font-bold text-white">{action.title}</p>
            <div className="flex items-center gap-2 text-[11px] text-amber-200/80">
              <span>Tipo: {action.type === 'recurring' ? 'Hábito Recurrente' : 'Tarea Única'}</span>
              <span>·</span>
              <span>Posición A{actionIndex + 1}</span>
            </div>
          </div>

          {!result ? (
            // Form to diagnose
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  ¿Cuál es la causa del bloqueo o retraso?
                </label>
                <div className="space-y-2">
                  {presetReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setSelectedReason(reason);
                        setCustomReason('');
                      }}
                      className={`w-full p-2.5 rounded-lg text-left text-xs transition-colors border ${
                        selectedReason === reason && !customReason
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  O describe tu situación con tus palabras (opcional):
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ej. 'Me cuesta mucho ponerme 2 horas seguidas, prefiero pasos de 20 minutos'..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRunRecalibration}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-950 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Recalibrar Acción</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Results & Replacement Proposal
            <div className="space-y-4 animate-in fade-in">
              {/* Diagnosis */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Diagnóstico del Cuello de Botella</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.diagnosis}</p>
              </div>

              {/* Recommendation */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Lightbulb className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Recomendación Táctica</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Proposed Replacement Actions */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                  Sustitución Sugerida (Micro-acciones de baja fricción):
                </span>
                <div className="space-y-2">
                  {result.replacementActions.map((rep, rIdx) => (
                    <div
                      key={`rep-act-${rIdx}`}
                      className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-white">{rep.title}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                        {rep.type === 'recurring' ? 'Hábito' : 'Una vez'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Modificar motivo
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Aplicar Sustitución al Mandala</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
