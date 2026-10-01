import React from "react";
import { GeminiStatusResult } from "../services/api";
import { Sparkles, AlertCircle, RefreshCw, Zap } from "lucide-react";

interface AiStatusBadgeProps {
  status: GeminiStatusResult | null;
  isLoading: boolean;
  onClick: () => void;
}

export const AiStatusBadge: React.FC<AiStatusBadgeProps> = ({
  status,
  isLoading,
  onClick,
}) => {
  if (isLoading && !status) {
    return (
      <button
        onClick={onClick}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-slate-300 text-xs font-medium hover:border-slate-600 transition-all cursor-pointer"
        title="Comprobando estado de conexión con Gemini..."
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
        <span className="hidden sm:inline text-slate-400">Verificando IA...</span>
      </button>
    );
  }

  const isConnected = status?.ok === true;
  const isPlaceholder = status?.status === "placeholder_key";
  const isMissing = status?.status === "missing_key";
  const isInvalid = status?.status === "invalid_key";

  if (isConnected) {
    const cleanModel = (status?.model || "Gemini").replace("gemini-", "");
    return (
      <button
        onClick={onClick}
        type="button"
        className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 text-xs font-medium transition-all shadow-sm shadow-emerald-950/20 cursor-pointer"
        title={`Gemini conectado (${status?.model || "modelo activo"}). Latencia: ${status?.latencyMs || 0}ms. Clic para detalles o pruebas.`}
      >
        {/* Pulsing Green Indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        <Sparkles className="h-3.5 w-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
        
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-emerald-200 hidden sm:inline">Gemini</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
            {cleanModel}
          </span>
          {status?.latencyMs ? (
            <span className="text-[10px] text-emerald-400/80 font-mono hidden md:inline flex items-center gap-0.5">
              <Zap className="h-2.5 w-2.5" />
              {status.latencyMs}ms
            </span>
          ) : null}
        </div>
      </button>
    );
  }

  // Not connected / Needs attention
  const badgeLabel = isPlaceholder
    ? "API Key por defecto"
    : isMissing
    ? "Sin API Key"
    : isInvalid
    ? "API Key inválida"
    : "Gemini Offline";

  return (
    <button
      onClick={onClick}
      type="button"
      className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-all shadow-sm shadow-amber-950/20 cursor-pointer"
      title="Haz clic para verificar tu API Key y modelo de Gemini"
    >
      {/* Amber Alert Dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>

      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />

      <div className="flex items-center gap-1.5">
        <span className="font-medium text-amber-200">{badgeLabel}</span>
        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30 hidden sm:inline">
          Configurar
        </span>
      </div>
    </button>
  );
};
