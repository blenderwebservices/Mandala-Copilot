import React, { useState, useEffect } from "react";
import { GeminiStatusResult, fetchGeminiStatus, testGeminiPrompt } from "../services/api";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Key, 
  Cpu, 
  Zap, 
  X, 
  Eye, 
  EyeOff, 
  Save, 
  Play, 
  ShieldCheck,
  Check,
  FileText
} from "lucide-react";

interface AiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: GeminiStatusResult | null;
  onStatusUpdated: (newStatus: GeminiStatusResult) => void;
}

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Recomendado", desc: "Velocidad óptima y razonamiento avanzado" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "Estable", desc: "Alta disponibilidad y baja latencia" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "Ligero", desc: "Modelo flash clásico" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Alta Precisión", desc: "Pensamiento complejo y máxima calidad" },
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", tag: "AI Studio", desc: "Plantilla experimental de AI Studio" },
];

export const AiStatusModal: React.FC<AiStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onStatusUpdated,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Live prompt testing
  const [testPrompt, setTestPrompt] = useState("En 10 palabras o menos, dime una frase inspiradora sobre enfoque y productividad.");
  const [isPromptTesting, setIsPromptTesting] = useState(false);
  const [promptResult, setPromptResult] = useState<{ text: string; latencyMs: number; ok: boolean } | null>(null);

  useEffect(() => {
    if (currentStatus?.model) {
      setSelectedModel(currentStatus.model);
    }
  }, [currentStatus]);

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

  const isConnected = currentStatus?.ok === true;
  const isPlaceholder = currentStatus?.status === "placeholder_key";
  const isMissing = currentStatus?.status === "missing_key";
  const isInvalid = currentStatus?.status === "invalid_key";

  const handleTestOrSave = async (saveToEnv: boolean) => {
    setIsTesting(true);
    setSaveSuccessNotice(false);
    setPromptResult(null);
    try {
      const keyToSend = apiKeyInput.trim() ? apiKeyInput.trim() : undefined;
      const modelToSend = selectedModel;
      const result = await fetchGeminiStatus(keyToSend, modelToSend, saveToEnv);
      onStatusUpdated(result);
      if (saveToEnv) {
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 4000);
      }
    } catch (err: any) {
      console.error("Error verificando Gemini:", err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunPromptTest = async () => {
    if (!testPrompt.trim()) return;
    setIsPromptTesting(true);
    setPromptResult(null);
    try {
      const keyToUse = apiKeyInput.trim() ? apiKeyInput.trim() : undefined;
      const res = await testGeminiPrompt(testPrompt, selectedModel, keyToUse);
      setPromptResult({
        text: res.response,
        latencyMs: res.latencyMs,
        ok: res.ok,
      });
    } catch (err: any) {
      setPromptResult({
        text: err.message || "Error al comunicarse con Gemini",
        latencyMs: 0,
        ok: false,
      });
    } finally {
      setIsPromptTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 shadow-2xl shadow-slate-900/10 dark:shadow-indigo-950/40 max-h-[90vh] overflow-y-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isConnected 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400"
            }`}>
              {isConnected ? <Sparkles className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Estado de Google Gemini AI
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  isConnected 
                    ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                }`}>
                  {isConnected ? "En línea / Activo" : "Requiere Atención"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoreo en tiempo real de API Key, modelo activo y latencia de respuesta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Diagnostic Status Banner */}
        <div className="mt-5 space-y-4">
          <div className={`rounded-xl border p-4 ${
            isConnected
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
              : isPlaceholder
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200"
              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200"
          }`}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {isConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                ) : isPlaceholder ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-sm">
                  {isConnected
                    ? "¡Google Gemini está conectado y respondiendo correctamente!"
                    : isPlaceholder
                    ? "Clave de plantilla detectada: GEMINI_API_KEY=\"MY_GEMINI_API_KEY\""
                    : isMissing
                    ? "Variable GEMINI_API_KEY no encontrada en .env"
                    : isInvalid
                    ? "Clave API inválida (Rechazada por Google)"
                    : currentStatus?.status === "model_not_found"
                    ? `Modelo \"${currentStatus?.model}\" no encontrado o sin acceso`
                    : "Error al comunicarse con Gemini"}
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {currentStatus?.message || "Sin datos de estado"}
                </p>

                {currentStatus?.details && !isConnected && (
                  <div className="mt-2 text-[11px] font-mono p-2 rounded bg-slate-900/10 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 break-all">
                    Detalle técnico: {currentStatus.details}
                  </div>
                )}

                {/* Metrics Pill Row */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200/60 dark:bg-black/30 border border-slate-300/80 dark:border-white/5 font-mono">
                    <Key className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Clave:</span>
                    <span className="text-slate-700 dark:text-slate-200">{currentStatus?.keyMasked || "(no definida)"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200/60 dark:bg-black/30 border border-slate-300/80 dark:border-white/5 font-mono">
                    <Cpu className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                    <span className="text-slate-500 dark:text-slate-400">Modelo:</span>
                    <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{currentStatus?.model || selectedModel}</span>
                  </div>

                  {currentStatus?.latencyMs ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200/60 dark:bg-black/30 border border-slate-300/80 dark:border-white/5 font-mono">
                      <Zap className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                      <span className="text-slate-500 dark:text-slate-400">Latencia:</span>
                      <span className="text-amber-600 dark:text-amber-300">{currentStatus.latencyMs} ms</span>
                    </div>
                  ) : null}

                  {currentStatus?.envPath && (
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200/60 dark:bg-black/30 border border-slate-300/80 dark:border-white/5 font-mono text-[11px]"
                      title={currentStatus.envFound ? `Archivo .env cargado desde: ${currentStatus.envPath}` : `No se encontró .env (buscado en: ${currentStatus.envPath})`}
                    >
                      <FileText className={`h-3 w-3 ${currentStatus.envFound ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`} />
                      <span className="text-slate-500 dark:text-slate-400">Origen:</span>
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        {currentStatus.source === "system_env" 
                          ? "Panel / Servidor (Env)" 
                          : currentStatus.envFound 
                          ? ".env detectado" 
                          : ".env ausente"}
                      </span>
                    </div>
                  )}

                  {currentStatus?.checkedAt && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200/60 dark:bg-black/30 border border-slate-300/80 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Verificado: {new Date(currentStatus.checkedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Studio Callout helper if not connected */}
          {!isConnected && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/20 p-3.5 flex items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Obtén tu API Key gratuita en 30 segundos sin necesidad de tarjeta de crédito en <strong>Google AI Studio</strong>.
                </span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                <span>Obtener Clave</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Configuration Form Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              Configurar o Actualizar Clave & Modelo
            </h3>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nueva GEMINI_API_KEY
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Pega aquí tu clave (ej. AIzaSy...)"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title={showKey ? "Ocultar clave" : "Mostrar clave"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Puedes guardarla directamente en el archivo <code>.env</code> o probarla en memoria.
              </p>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Modelo de Gemini
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedModel === m.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        selectedModel === m.id
                          ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {m.tag}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isTesting}
                onClick={() => handleTestOrSave(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Guardar en .env y Probar</span>
              </button>

              <button
                type="button"
                disabled={isTesting}
                onClick={() => handleTestOrSave(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                <span>Solo Probar Clave</span>
              </button>

              <button
                type="button"
                disabled={isTesting}
                onClick={() => {
                  setApiKeyInput("");
                  handleTestOrSave(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition-colors ml-auto cursor-pointer"
                title="Vuelve a leer el archivo .env desde el disco"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>Reverificar .env</span>
              </button>
            </div>

            {saveSuccessNotice && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 p-2 rounded-lg">
                <Check className="h-4 w-4" />
                <span>Archivo .env actualizado y recargado exitosamente en el servidor.</span>
              </div>
            )}
          </div>

          {/* Live Prompt Playground / Verification */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                Prueba de Generación en Vivo (Playground)
              </h3>
              <span className="text-[11px] text-slate-500">
                Verifica que el modelo genere texto real
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Escribe un prompt de prueba..."
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={isPromptTesting || !testPrompt.trim()}
                onClick={handleRunPromptTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
              >
                {isPromptTesting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                <span>Enviar Prueba</span>
              </button>
            </div>

            {promptResult && (
              <div className={`rounded-lg p-3 text-xs border ${
                promptResult.ok
                  ? "bg-white dark:bg-slate-950 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                  : "bg-white dark:bg-slate-950 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-200"
              }`}>
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200 dark:border-white/5 text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {promptResult.ok ? "Respuesta de Gemini:" : "Error de respuesta:"}
                  </span>
                  {promptResult.latencyMs > 0 && (
                    <span className="font-mono text-slate-500 dark:text-slate-400">⏱️ {promptResult.latencyMs} ms</span>
                  )}
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{promptResult.text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
