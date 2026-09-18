import {
  Coffee,
  ShoppingCart,
  Heart,
  Home,
  Check,
  X,
  Mic,
  MicOff,
} from "lucide-react";

interface UserControlZoneProps {
  activeScenarioId: string | null;
  hasSelectedTile: boolean;
  isListening: boolean;
  connectionStatus?: "disconnected" | "connecting" | "active";
  feedbackStatus: "confirmed" | "rejected" | null;
  onSelectScenario: (key: "coffee" | "cart" | "heart" | "home") => void;
  onConfirm: () => void;
  onReject: () => void;
  onToggleListening: () => void;
}

export function UserControlZone({
  activeScenarioId,
  hasSelectedTile,
  isListening,
  connectionStatus = "disconnected",
  feedbackStatus,
  onSelectScenario,
  onConfirm,
  onReject,
  onToggleListening,
}: UserControlZoneProps) {
  return (
    <aside
      data-testid="aac-user-control-zone"
      className="w-full lg:w-80 p-5 rounded-3xl border border-stone-300/80 bg-stone-100/90 flex flex-col gap-5 shadow-sm"
    >
      {/* 1. Scen-brickor för att initiera låtsassamtal utan menyer eller text */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          data-testid="scene-coffee"
          onClick={() => onSelectScenario("coffee")}
          aria-label="Fika"
          className={`p-4 aspect-square rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
            activeScenarioId === "coffee"
              ? "bg-stone-900 text-white border-stone-900 shadow-md scale-[1.02]"
              : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <Coffee className="w-8 h-8 stroke-[1.75]" />
        </button>

        <button
          type="button"
          data-testid="scene-cart"
          onClick={() => onSelectScenario("cart")}
          aria-label="Handla"
          className={`p-4 aspect-square rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
            activeScenarioId === "cart"
              ? "bg-stone-900 text-white border-stone-900 shadow-md scale-[1.02]"
              : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <ShoppingCart className="w-8 h-8 stroke-[1.75]" />
        </button>

        <button
          type="button"
          data-testid="scene-heart"
          onClick={() => onSelectScenario("heart")}
          aria-label="Hälsa"
          className={`p-4 aspect-square rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
            activeScenarioId === "heart"
              ? "bg-stone-900 text-white border-stone-900 shadow-md scale-[1.02]"
              : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <Heart className="w-8 h-8 stroke-[1.75]" />
        </button>

        <button
          type="button"
          data-testid="scene-home"
          onClick={() => onSelectScenario("home")}
          aria-label="Vila och återställ"
          className="p-4 aspect-square rounded-2xl border bg-white text-stone-700 border-stone-200 hover:bg-stone-50 flex items-center justify-center transition-all cursor-pointer"
        >
          <Home className="w-8 h-8 stroke-[1.75]" />
        </button>
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
              - Grön pulserande punkt: Live-anslutning aktiv och lyssnar efter samtal/väckningsord ("Maggan") */}
          <span
            data-testid="live-status-dot"
            aria-label={
              connectionStatus === "active"
                ? "Live-anslutning aktiv och lyssnar"
                : connectionStatus === "connecting"
                ? "Ansluter till Gemini Live"
                : "Frånkopplad"
            }
            className={`absolute top-3.5 right-3.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
              connectionStatus === "active"
                ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-400/50"
                : connectionStatus === "connecting"
                ? "bg-amber-400 animate-ping ring-2 ring-amber-300/50"
                : "bg-stone-400"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
