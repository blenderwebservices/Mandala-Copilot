import React, { useState, useRef, useEffect } from "react";
import { Goal } from "../types/mandala";
import { 
  readDocumentFile, 
  downloadDocumentFile, 
  duplicateGoal, 
  createDocument 
} from "../services/documentService";
import { 
  FolderOpen, 
  Save, 
  FileUp, 
  Download, 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Trash2, 
  ArrowRight, 
  Search, 
  FileText, 
  Clock, 
  HardDrive, 
  Layers, 
  Check, 
  Code
} from "lucide-react";

export type DocumentModalTab = "open" | "save";

interface DocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: DocumentModalTab;
  currentGoal: Goal;
  allGoals: Goal[];
  onSelectGoal: (id: string) => void;
  onSaveGoal: (updatedGoal: Goal) => void;
  onImportGoal: (newGoal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onDuplicateGoal: (goal: Goal) => void;
  onShowToast: (message: string) => void;
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = "open",
  currentGoal,
  allGoals,
  onSelectGoal,
  onSaveGoal,
  onImportGoal,
  onDeleteGoal,
  onDuplicateGoal,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentModalTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importedPreview, setImportedPreview] = useState<Goal | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Edit fields for save tab
  const [documentTitle, setDocumentTitle] = useState(currentGoal.title);
  const [documentContext, setDocumentContext] = useState(currentGoal.context || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setDocumentTitle(currentGoal.title);
    setDocumentContext(currentGoal.context || "");
    setImportedPreview(null);
    setFileError(null);
  }, [currentGoal, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // File handling
  const handleFileProcess = async (file: File) => {
    setFileError(null);
    setImportedPreview(null);
    const result = await readDocumentFile(file);
    if (result.success && result.goal) {
      setImportedPreview(result.goal);
    } else {
      setFileError(result.error || "No se pudo interpretar el archivo.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleConfirmImport = () => {
    if (!importedPreview) return;
    onImportGoal(importedPreview);
    onShowToast(`Documento "${importedPreview.title}" abierto correctamente.`);
    onClose();
  };

  const handleQuickSaveCurrent = () => {
    const updated: Goal = {
      ...currentGoal,
      title: documentTitle.trim() || currentGoal.title,
      context: documentContext.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSaveGoal(updated);
    downloadDocumentFile(updated);
    onShowToast(`Documento "${updated.title}" descargado y guardado.`);
    onClose();
  };

  const handleSaveAsCopy = () => {
    const cloned = duplicateGoal(currentGoal, "(Nueva Versión)");
    cloned.title = documentTitle.trim() ? `${documentTitle.trim()} (Copia)` : cloned.title;
    cloned.context = documentContext.trim() || undefined;
    onDuplicateGoal(cloned);
    onShowToast(`Copia creada y abierta en la matriz.`);
    onClose();
  };

  const filteredGoals = allGoals.filter((g) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(query) || (g.context && g.context.toLowerCase().includes(query));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0f172a] shadow-2xl shadow-indigo-950/40 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Gestión de Documentos de Metas 9×9
              </h2>
              <p className="text-xs text-slate-400">
                Guarda, exporta y abre metas completas con sus 8 pilares y 64 acciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6">
          <button
            onClick={() => setActiveTab("open")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "open"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Abrir Documento Existente</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {allGoals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("save")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "save"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Save className="h-4 w-4" />
            <span>Guardar / Exportar Documento</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "open" ? (
            /* TAB: ABRIR DOCUMENTO */
            <div className="space-y-6">
              {/* Option A: Open from Computer File */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileUp className="h-3.5 w-3.5 text-indigo-400" />
                    Abrir archivo desde tu computadora (.mandala / .json)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Formatos: .mandala, .mandala.json, .json
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.mandala"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-950/30"
                      : "border-slate-700/80 bg-slate-950/40 hover:border-indigo-500/60 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Haz clic para examinar archivos o arrastra tu documento aquí
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Restaura de inmediato toda la matriz 9×9 con sus 8 pilares, tareas y hábitos
                    </span>
                  </div>
                </div>

                {/* File Error */}
                {fileError && (
                  <div className="flex items-start gap-2.5 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-rose-200">Error al abrir el documento:</span>
                      <span>{fileError}</span>
                    </div>
                  </div>
                )}

                {/* Import Preview Card */}
                {importedPreview && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3 animate-fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold block">
                            Documento válido detectado
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">
                            {importedPreview.title}
                          </h4>
                          {importedPreview.context && (
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                              {importedPreview.context}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmImport}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Abrir en Matriz 9×9</span>
                      </button>
                    </div>

                    {/* Preview Stats */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-emerald-200">
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
                        {importedPreview.pillars.length} Pilares
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
                        {importedPreview.pillars.reduce((acc, p) => acc + p.actions.length, 0)} Acciones Totales
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5">
                        {importedPreview.pillars.reduce((acc, p) => acc + p.actions.filter((a) => a.isCompleted).length, 0)} Completadas
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option B: Open Existing Saved Documents */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-teal-400" />
                    Documentos guardados en esta aplicación ({allGoals.length})
                  </h3>

                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por título..."
                      className="rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-full sm:w-56"
                    />
                  </div>
                </div>

                {filteredGoals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-950/40">
                    No se encontraron documentos que coincidan con "{searchQuery}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {filteredGoals.map((goal) => {
                      const totalActions = goal.pillars.reduce((acc, p) => acc + p.actions.length, 0);
                      const completedActions = goal.pillars.reduce(
                        (acc, p) => acc + p.actions.filter((a) => a.isCompleted).length,
                        0
                      );
                      const pct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
                      const isCurrent = goal.id === currentGoal.id;

                      return (
                        <div
                          key={goal.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCurrent
                              ? "border-indigo-500/50 bg-indigo-950/20"
                              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white truncate">
                                {goal.title}
                              </h4>
                              {isCurrent && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                  Activo
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                              <span>Progreso: {completedActions}/{totalActions} ({pct}%)</span>
                              <span>·</span>
                              <span>{goal.pillars.length} pilares</span>
                              {goal.updatedAt && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(goal.updatedAt).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            {/* Download local backup file */}
                            <button
                              type="button"
                              onClick={() => {
                                downloadDocumentFile(goal);
                                onShowToast(`Documento "${goal.title}" descargado.`);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Descargar copia en archivo .mandala"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => {
                                const dup = duplicateGoal(goal);
                                onDuplicateGoal(dup);
                                onShowToast(`Copia de "${goal.title}" creada.`);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Duplicar documento"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete (if more than 1) */}
                            {allGoals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteGoal(goal.id);
                                  onShowToast(`Documento eliminado.`);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                                title="Eliminar documento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Select / Open */}
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => {
                                onSelectGoal(goal.id);
                                onShowToast(`Documento "${goal.title}" cargado.`);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                isCurrent
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                  : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                              }`}
                            >
                              <span>{isCurrent ? "En pantalla" : "Abrir"}</span>
                              {!isCurrent && <ArrowRight className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB: GUARDAR DOCUMENTO */
            <div className="space-y-5">
              {/* Document Overview Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Save className="h-3.5 w-3.5 text-indigo-400" />
                    Guardar Documento Actual
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {currentGoal.id}
                  </span>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Título de la Meta (Nombre del Documento)
                  </label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Ej. Lanzar mi SaaS B2B en 6 meses"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Context Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contexto o Descripción Estratégica (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={documentContext}
                    onChange={(e) => setDocumentContext(e.target.value)}
                    placeholder="Detalles, hipótesis o limitaciones del proyecto..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Document Content Metrics */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-wrap gap-4 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span>8 Pilares Estratégicos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>64 Acciones (8×8)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Último guardado: {new Date(currentGoal.updatedAt || currentGoal.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Save Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Save & Download as File */}
                <button
                  type="button"
                  onClick={handleQuickSaveCurrent}
                  className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-900/30 hover:border-indigo-500 flex flex-col text-left gap-2 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Download className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                      Recomendado
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-indigo-200 block">
                      Guardar y Descargar Archivo (.mandala)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                      Genera un archivo portátil que puedes guardar en tu disco o abrir en cualquier equipo.
                    </span>
                  </div>
                </button>

                {/* Save as New Copy */}
                <button
                  type="button"
                  onClick={handleSaveAsCopy}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 flex flex-col text-left gap-2 transition-all cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 self-start">
                    <Copy className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-teal-200 block">
                      Guardar como Copia / Nueva Versión
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                      Crea un duplicado independiente en tu biblioteca para conservar versiones históricas.
                    </span>
                  </div>
                </button>
              </div>

              {/* JSON preview toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>{showJsonPreview ? "Ocultar" : "Ver"} estructura JSON del documento</span>
                </button>

                {showJsonPreview && (
                  <pre className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                    {JSON.stringify(createDocument(currentGoal), null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Mandala Copilot · Documentos 9×9 con 64 acciones
          </span>
          <button
            type="button"
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
