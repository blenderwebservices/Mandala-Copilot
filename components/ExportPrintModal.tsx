import React, { useState } from 'react';
import { Goal } from '../types/mandala';
import { X, Printer, Download, Copy, Check, FileText, Code, CheckCircle2, Layers } from 'lucide-react';
import { printMandalaDocument } from '../services/printService';

interface ExportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
}

export const ExportPrintModal: React.FC<ExportPrintModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'rendered' | 'markdown'>('rendered');

  if (!isOpen) return null;

  const handlePrint = () => {
    printMandalaDocument(goal);
  };

  const generateMarkdown = () => {
    let md = `# Mandala Chart 9x9: ${goal.title}\n\n`;
    if (goal.context) md += `> **Contexto**: ${goal.context}\n\n`;

    let total = 0;
    let completed = 0;
    goal.pillars.forEach((p) => {
      p.actions.forEach((a) => {
        total++;
        if (a.isCompleted) completed++;
      });
    });
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    md += `**Progreso Global**: ${completed}/${total} (${pct}%)\n\n---\n\n`;

    goal.pillars.forEach((p, idx) => {
      const pCompleted = p.actions.filter((a) => a.isCompleted).length;
      md += `### Pilar 0${idx + 1}: ${p.title} (${pCompleted}/8)\n`;
      p.actions.forEach((a) => {
        const check = a.isCompleted ? '[x]' : '[ ]';
        const typeBadge = a.type === 'recurring' ? '(Hábito)' : '(Tarea)';
        md += `- ${check} ${a.title} ${typeBadge}\n`;
      });
      md += `\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(goal, null, 2));
    const safeTitle = (goal.title || "meta")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ_\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/\.{2,}/g, "")
      .substring(0, 50) || "meta";
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mandala-${safeTitle}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  let totalActions = 0;
  let completedActions = 0;
  let habitCount = 0;
  let taskCount = 0;
  goal.pillars.forEach((p) => {
    p.actions.forEach((a) => {
      totalActions++;
      if (a.isCompleted) completedActions++;
      if (a.type === 'recurring') habitCount++;
      else taskCount++;
    });
  });
  const globalPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto no-print">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in transition-colors flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Imprimir y Exportar Documento Mandala</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-500/30">
                  Formato A4
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Imprime directamente el documento interpretado con su estructura completa o expórtalo a Markdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="p-4 sm:p-6 pb-3 space-y-4 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Print Button (Calls printMandalaDocument) */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-3.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-white/20 text-white group-hover:scale-105 transition-transform">
                <Printer className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold leading-tight">
                Imprimir Documento / PDF
              </span>
              <span className="text-[10px] text-indigo-100/90 leading-tight">
                Documento .md interpretado (Sin modal)
              </span>
            </button>

            {/* Markdown Copy */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-teal-500/50 flex flex-col items-center justify-center text-center gap-1.5 transition-all group shadow-xs cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                {copied ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                {copied ? '¡Copiado al Portapapeles!' : 'Copiar Texto Markdown'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Para Obsidian, Notion o Docs
              </span>
            </button>

            {/* JSON Download */}
            <button
              type="button"
              onClick={handleDownloadJson}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-amber-500/50 flex flex-col items-center justify-center text-center gap-1.5 transition-all group shadow-xs cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Download className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                Descargar JSON
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Estructura íntegra 9×9
              </span>
            </button>
          </div>

          {/* Preview Tab Selector */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab('rendered')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  previewTab === 'rendered'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Vista Previa del Documento Interpretado</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  previewTab === 'markdown'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Markdown Crudo (.md)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline-block font-mono">
              {completedActions}/64 acciones ({globalPct}%)
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-4 sm:px-6 pb-6 overflow-y-auto flex-1">
          {previewTab === 'rendered' ? (
            /* Rendered Document View */
            <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-950/50 space-y-5 text-slate-900 dark:text-slate-100 font-sans shadow-inner">
              {/* Document Header */}
              <div className="border-b-2 border-indigo-500 pb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold block mb-1">
                  Mandala Copilot AI · Metodología Harada 9×9
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {goal.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Documento Estratégico Oficial</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Context Block */}
              {goal.context && (
                <div className="p-3.5 rounded-lg border-l-4 border-indigo-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                    Contexto Estratégico
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    {goal.context}
                  </p>
                </div>
              )}

              {/* Summary Metrics */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Progreso Global:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {completedActions}/{totalActions} ({globalPct}%)
                  </span>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ml-1">
                    <div 
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                      style={{ width: `${globalPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span>8 Pilares</span>
                  <span>•</span>
                  <span>{habitCount} Hábitos</span>
                  <span>•</span>
                  <span>{taskCount} Tareas</span>
                </div>
              </div>

              {/* 8 Pillars Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {goal.pillars.map((pillar, pIdx) => {
                  const pDone = pillar.actions.filter((a) => a.isCompleted).length;
                  return (
                    <div 
                      key={pillar.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            0{pIdx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {pillar.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          pDone === 8 
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {pDone}/8
                        </span>
                      </div>

                      <ul className="space-y-1.5 text-[11px]">
                        {pillar.actions.map((act) => (
                          <li key={act.id} className="flex items-start gap-2">
                            <span className={`mt-0.5 text-xs ${act.isCompleted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                              {act.isCompleted ? '☑' : '☐'}
                            </span>
                            <div className="flex-1 min-w-0 flex items-baseline justify-between gap-1.5">
                              <span className={`truncate ${act.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                {act.title}
                              </span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono shrink-0 ${
                                act.type === 'recurring' 
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {act.type === 'recurring' ? 'Hábito' : 'Tarea'}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Raw Markdown View */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Contenido en formato estándar CommonMark:</span>
                <span className="font-mono text-[11px]">.md</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-[380px] overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all leading-relaxed">
                {generateMarkdown()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Al imprimir, se envía únicamente el documento interpretado, sin la interfaz modal.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
