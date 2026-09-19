import { useState, useRef } from "react";
import {
  Coffee,
  ShoppingCart,
  Heart,
  Home,
  Cake,
  GlassWater,
  Apple,
  Pill,
  Smile,
  Sun,
  HelpCircle,
  Check,
  X,
  Mic,
  MicOff,
} from "lucide-react";
import { AacTile } from "../domain/types";

interface UserControlZoneProps {
  controlTiles?: AacTile[];
  activeScenarioId: string | null;
  hasSelectedTile: boolean;
  isListening: boolean;
  connectionStatus?: "disconnected" | "connecting" | "active";
  lastEventStatus?: string;
  feedbackStatus: "confirmed" | "rejected" | null;
  onSelectControlTile?: (tile: AacTile) => void;
  onSelectScenario: (key: "coffee" | "cart" | "heart" | "home") => void;
  onConfirm: () => void;
  onReject: () => void;
  onToggleListening: () => void;
}

export function UserControlZone({
  controlTiles = [],
  activeScenarioId,
  hasSelectedTile,
  isListening,
  connectionStatus = "disconnected",
  lastEventStatus = "Frånkopplad (Väntar på aktivering)",
  feedbackStatus,
  onSelectControlTile,
  onSelectScenario,
  onConfirm,
  onReject,
  onToggleListening,
}: UserControlZoneProps) {
  // Dold diagnostikpanel för felsökning av Gemini Live utan att störa det kognitiva AAC-gränssnittet
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
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

  const renderControlIcon = (tile: AacTile) => {
    if (tile.customSvg) {
      return (
        <div
          data-testid={`custom-svg-${tile.id}`}
          className="w-8 h-8 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: tile.customSvg }}
        />
      );
    }
    const props = { className: "w-8 h-8 stroke-[1.75]" };
    switch (tile.iconKey) {
      case "coffee":
        return <Coffee {...props} />;
      case "cart":
        return <ShoppingCart {...props} />;
      case "heart":
        return <Heart {...props} />;
      case "home":
        return <Home {...props} />;
      case "cake":
        return <Cake {...props} />;
      case "water":
        return <GlassWater {...props} />;
      case "apple":
        return <Apple {...props} />;
      case "pill":
        return <Pill {...props} />;
      case "smile":
        return <Smile {...props} />;
      case "sun":
        return <Sun {...props} />;
      default:
        return <HelpCircle {...props} />;
    }
  };

  return (
    <aside
      data-testid="aac-user-control-zone"
      className="w-full lg:w-80 p-5 rounded-3xl border border-stone-300/80 bg-stone-100/90 flex flex-col gap-5 shadow-sm"
    >
      {/* 1. Dynamiskt uppdaterade kontrollbrickor (4 mest relevanta baserat på samtal, kamera, klockslag och AdaptiveMemory) */}
      <div data-testid="dynamic-control-tiles" className="grid grid-cols-2 gap-3">
        {controlTiles.map((tile) => {
          const isScenario = ["coffee", "cart", "heart", "home"].includes(tile.iconKey);
          const isSelected = activeScenarioId === tile.iconKey;

          return (
            <button
              key={tile.id}
              type="button"
              data-testid={`scene-${tile.iconKey}`}
              data-control-tile={tile.iconKey}
              onClick={() => {
                if (onSelectControlTile) {
                  onSelectControlTile(tile);
                }
                if (isScenario) {
                  onSelectScenario(tile.iconKey as any);
                }
              }}
              aria-label={tile.speechText}
              className={`p-4 aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-stone-900 text-white border-stone-900 shadow-md scale-[1.02]"
                  : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50 shadow-xs"
              }`}
            >
              {renderControlIcon(tile)}
              {tile.enrichmentStage === "camera_enriched" && (
                <span
                  data-testid={`control-camera-badge-${tile.id}`}
                  title={`Identifierat via kamera: ${tile.detectedObject || "objekt"}`}
                  className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white animate-pulse"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Feedbackreglage: Grön bock och Rött kryss för successiv inlärning */}
      <div className="flex gap-3 pt-2 border-t border-stone-200/80">
        <button
          type="button"
          data-testid="feedback-confirm"
          onClick={onConfirm}
          disabled={!hasSelectedTile}
          aria-label="Bekräfta"
          className={`flex-1 py-4 rounded-2xl border flex items-center justify-center transition-all ${
            hasSelectedTile
              ? "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800 shadow-sm cursor-pointer active:scale-95"
              : "bg-stone-200/60 text-stone-400 border-stone-200 cursor-not-allowed"
          }`}
        >
          <Check className="w-8 h-8 stroke-[3]" />
        </button>

        <button
          type="button"
          data-testid="feedback-reject"
          onClick={onReject}
          disabled={!hasSelectedTile}
          aria-label="Avfärda"
          className={`flex-1 py-4 rounded-2xl border flex items-center justify-center transition-all ${
            hasSelectedTile
              ? "bg-rose-700 text-white border-rose-800 hover:bg-rose-800 shadow-sm cursor-pointer active:scale-95"
              : "bg-stone-200/60 text-stone-400 border-stone-200 cursor-not-allowed"
          }`}
        >
          <X className="w-8 h-8 stroke-[3]" />
        </button>
      </div>

      {/* 3. Visuell statusindikator vid feedback */}
      {feedbackStatus && (
        <div
          data-testid="feedback-status-indicator"
          className={`py-2 px-3 rounded-xl flex items-center justify-center transition-all ${
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

      {/* 4. Mikrofon och samtyckesknapp för live-läge */}
      <div className="mt-auto pt-2">
        <button
          type="button"
          data-testid="btn-toggle-mic"
          onClick={onToggleListening}
          aria-label="Mikrofon"
          className={`w-full py-4 rounded-2xl border flex items-center justify-center transition-all cursor-pointer relative ${
            isListening
              ? "bg-stone-900 text-emerald-400 border-stone-900 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
          }`}
        >
          {isListening ? (
            <Mic className="w-7 h-7 stroke-[2]" />
          ) : (
            <MicOff className="w-7 h-7 stroke-[2]" />
          )}

          {/* Visuell statussymbol för Gemini Live-anslutning:
              - Röd/Grå punkt: Frånkopplad / Inget API-svar
              - Gul punkt: Ansluter till Gemini Live...
              - Grön pulserande punkt: Live-anslutning aktiv och lyssnar efter samtal/väckningsord ("Maggan")
              - Dubbelklick/tryck: Växlar dold diagnostikpanel */}
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
            className={`absolute top-3.5 right-3.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 cursor-pointer ${
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
          className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 text-emerald-400 border-t border-stone-800 px-4 py-2 font-mono text-xs flex items-center justify-between shadow-2xl backdrop-blur-md select-text"
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
              className="text-stone-300 truncate"
            >
              {lastEventStatus}
            </span>
          </div>
          <button
            type="button"
            data-testid="btn-close-diagnostics"
            onClick={() => setShowDiagnostics(false)}
            className="ml-4 px-2 py-0.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 text-xs transition-colors cursor-pointer"
            aria-label="Stäng diagnostik"
          >
            ✕
          </button>
        </div>
      )}
    </aside>
  );
}
