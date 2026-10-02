import React, { useState } from 'react';
import { Goal } from '../types/mandala';
import { X, Printer, Download, Copy, Check, FileText } from 'lucide-react';

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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Exportar e Imprimir Mandala
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lleva tu matriz 9x9 al mundo físico o expórtala a tu gestor de notas
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-indigo-500/50 flex flex-col items-center justify-center text-center gap-2 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Printer className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                Imprimir / PDF
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Formato A4 optimizado
              </span>
            </button>

            {/* Markdown Copy */}
            <button
              onClick={handleCopyMarkdown}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-teal-500/50 flex flex-col items-center justify-center text-center gap-2 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                {copied ? <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-5 w-5" />}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                {copied ? '¡Copiado!' : 'Copiar Markdown'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Para Notion, Obsidian, etc.
              </span>
            </button>

            {/* JSON Download */}
            <button
              onClick={handleDownloadJson}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-amber-500/50 flex flex-col items-center justify-center text-center gap-2 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                Descargar JSON
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Respaldo completo 9x9
              </span>
            </button>
          </div>

          {/* Preview of Markdown */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              Vista previa del desglose estructurado:
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-all">
              {generateMarkdown()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
