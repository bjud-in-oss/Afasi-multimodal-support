import { useState, useRef } from "react";
import {
  Check,
  X,
  Mic,
  MicOff,
  RotateCcw,
  Download,
} from "lucide-react";
import { defaultDiagnosticRecorder } from "../../live_listener/domain/diagnosticRecorder";

interface UserControlZoneProps {
  activeScenarioId?: string | null;
  hasSelectedTile: boolean;
  isListening: boolean;
  connectionStatus?: "disconnected" | "connecting" | "active";
  lastEventStatus?: string;
  feedbackStatus: "confirmed" | "rejected" | null;
  onSelectScenario?: (key: "coffee" | "cart" | "heart" | "home") => void;
  onConfirm: () => void;
  onReject: () => void;
  onClear?: () => void;
  onToggleListening: () => void;
}

export function UserControlZone({
  hasSelectedTile,
  isListening,
  connectionStatus = "disconnected",
  lastEventStatus = "Frånkopplad (Väntar på aktivering)",
  feedbackStatus,
  onConfirm,
  onReject,
  onClear,
  onToggleListening,
}: UserControlZoneProps) {
  // Dold diagnostikpanel för felsökning av Gemini Live utan att störa det kognitiva AAC-gränssnittet
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Dubbelklick eller snabbt dubbeltryck på statuspricken växlar diagnostikpanelen
  const handleDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setShowDiagnostics((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  const handleDotDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDiagnostics((prev) => !prev);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await defaultDiagnosticRecorder.triggerDownload();
    } catch (err) {
      console.error("Fel vid nedladdning av diagnostik-ZIP:", err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <aside
      data-testid="aac-user-control-zone"
      className="w-full max-h-24 sm:max-h-28 lg:max-h-none lg:w-80 lg:h-full flex flex-row lg:flex-col items-center lg:items-stretch justify-between p-3 lg:p-5 rounded-2xl lg:rounded-3xl border border-stone-300/80 bg-stone-100/90 shadow-sm select-none gap-2 sm:gap-3 lg:gap-5 shrink-0"
    >
      {/* 1. Snabb-release och rensning av markering */}
      {onClear && (
        <div className="shrink-0 lg:w-full">
          <button
            type="button"
            data-testid="btn-clear-selection"
            onClick={onClear}
            disabled={!hasSelectedTile}
            aria-label="Rensa markering"
            className={`h-12 w-12 sm:h-14 sm:w-14 lg:w-full lg:h-auto lg:py-4 rounded-2xl border flex items-center justify-center transition-all ${
              hasSelectedTile
                ? "bg-white text-stone-700 border-stone-300 hover:bg-stone-50 shadow-sm cursor-pointer active:scale-95"
                : "bg-stone-200/50 text-stone-300 border-stone-200/60 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </button>
        </div>
      )}

      {/* 2. Feedbackreglage: Grön bock och Rött kryss för successiv inlärning */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center max-w-sm lg:max-w-none lg:w-full lg:pt-2 lg:border-t lg:border-stone-200/80">
        <button
          type="button"
          data-testid="feedback-confirm"
          onClick={onConfirm}
          disabled={!hasSelectedTile}
          aria-label="Bekräfta"
          className={`flex-1 h-12 sm:h-14 lg:h-auto lg:py-4 rounded-2xl border flex items-center justify-center transition-all ${
            hasSelectedTile
              ? "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800 shadow-sm cursor-pointer active:scale-95"
              : "bg-stone-200/60 text-stone-400 border-stone-200 cursor-not-allowed"
          }`}
        >
          <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
        </button>

        <button
          type="button"
          data-testid="feedback-reject"
          onClick={onReject}
          disabled={!hasSelectedTile}
          aria-label="Avfärda"
          className={`flex-1 h-12 sm:h-14 lg:h-auto lg:py-4 rounded-2xl border flex items-center justify-center transition-all ${
            hasSelectedTile
              ? "bg-rose-700 text-white border-rose-800 hover:bg-rose-800 shadow-sm cursor-pointer active:scale-95"
              : "bg-stone-200/60 text-stone-400 border-stone-200 cursor-not-allowed"
          }`}
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
        </button>

        {/* 3. Visuell statusindikator vid feedback */}
        {feedbackStatus && (
          <div
            data-testid="feedback-status-indicator"
            className={`h-12 w-12 sm:h-14 sm:w-14 lg:w-full lg:h-auto lg:py-2 px-3 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              feedbackStatus === "confirmed"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {feedbackStatus === "confirmed" ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <X className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
        )}
      </div>

      {/* 4. Mikrofon och samtyckesknapp för live-läge */}
      <div className="shrink-0 lg:w-full lg:mt-auto lg:pt-2">
        <button
          type="button"
          data-testid="btn-toggle-mic"
          onClick={onToggleListening}
          aria-label="Mikrofon"
          className={`h-12 w-12 sm:h-14 sm:w-14 lg:w-full lg:h-auto lg:py-4 rounded-2xl border flex items-center justify-center transition-all cursor-pointer relative ${
            isListening
              ? "bg-stone-900 text-emerald-400 border-stone-900 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
          }`}
        >
          {isListening ? (
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          ) : (
            <MicOff className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          )}

          <span
            data-testid="live-status-dot"
            role="button"
            tabIndex={0}
            onClick={handleDotClick}
            onDoubleClick={handleDotDoubleClick}
            aria-label={
              connectionStatus === "active"
                ? "Live-anslutning aktiv och lyssnar (Dubbelklicka för diagnostik)"
                : connectionStatus === "connecting"
                ? "Ansluter till Gemini Live (Dubbelklicka för diagnostik)"
                : "Frånkopplad (Dubbelklicka för diagnostik)"
            }
            className={`absolute top-2 right-2 lg:top-3.5 lg:right-3.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 cursor-pointer ${
              connectionStatus === "active"
                ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-400/50"
                : connectionStatus === "connecting"
                ? "bg-amber-400 animate-ping ring-2 ring-amber-300/50"
                : "bg-stone-400"
            }`}
          />
        </button>
      </div>

      {/* Diskret felsökningsrad i gränssnittet längst ner på skärmen */}
      {showDiagnostics && (
        <div
          data-testid="diagnostics-panel"
          className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 text-emerald-400 border-t border-stone-800 px-4 py-2.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md select-text"
        >
          <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connectionStatus === "active"
                  ? "bg-emerald-400 animate-pulse"
                  : connectionStatus === "connecting"
                  ? "bg-amber-400 animate-ping"
                  : "bg-stone-500"
              }`}
            />
            <span className="text-stone-400">STATUS:</span>
            <span className="font-semibold text-emerald-300 uppercase">
              {connectionStatus}
            </span>
            <span className="text-stone-600">|</span>
            <span
              data-testid="diagnostics-event-status"
              className="text-stone-300 truncate max-w-xs md:max-w-md"
            >
              {lastEventStatus}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="download-diagnostics-zip"
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="px-3 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingZip ? "Genererar ZIP..." : "Ladda ned Felsöknings-ZIP (60s)"}</span>
            </button>

            <button
              type="button"
              data-testid="btn-close-diagnostics"
              onClick={() => setShowDiagnostics(false)}
              className="px-2 py-0.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 text-xs transition-colors cursor-pointer"
              aria-label="Stäng diagnostik"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
