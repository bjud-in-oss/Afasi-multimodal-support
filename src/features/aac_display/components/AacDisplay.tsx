import { Mic } from "lucide-react";
import { useAacDisplay } from "../hooks/useAacDisplay";
import { useStickyFloor } from "../hooks/useStickyFloor";
import { SpeakerZoneView } from "./SpeakerZoneView";
import { UserControlZone } from "./UserControlZone";
import { AacTile } from "../domain/types";

export function AacDisplay() {
  const {
    state,
    selectedTile,
    feedbackStatus,
    connectionStatus,
    lastEventStatus,
    selectScenario,
    handleSelectTile: baseHandleSelectTile,
    handleConfirm,
    handleReject,
    handleClear: baseHandleClear,
    handleDismissTileSilent,
    handleConfirmTileSilent,
    toggleListening,
  } = useAacDisplay();

  const stickyFloor = useStickyFloor();

  const handleSelectTile = (tile: AacTile) => {
    stickyFloor.startInteraction();
    baseHandleSelectTile(tile);
  };

  const handleClear = () => {
    baseHandleClear();
    stickyFloor.releaseGracePeriod();
  };

  const zoneCount = state.speakerZones.length;
  const gridLayoutClass = (() => {
    if (zoneCount <= 1) return "grid-cols-1";
    if (zoneCount === 2) return "grid-cols-1 md:grid-cols-2";
    if (zoneCount === 3) return "grid-cols-1 md:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2";
  })();

  return (
    <main
      data-testid="aac-display-root"
      onTouchStart={stickyFloor.startInteraction}
      onTouchEnd={stickyFloor.endInteraction}
      onPointerDown={stickyFloor.startInteraction}
      onPointerUp={stickyFloor.endInteraction}
      className={`h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none relative ${
        stickyFloor.isUserInteracting ? "ring-4 ring-amber-400/60" : ""
      }`}
    >
      {/* Laptop pulserande statusram under Sticky Floor Grace Period */}
      {stickyFloor.thinkingPrompt && (
        <div
          data-testid="laptop-thinking-indicator"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-2.5 rounded-full bg-stone-900/90 text-amber-300 border-2 border-amber-400/80 shadow-2xl animate-pulse font-medium text-sm flex items-center gap-2.5 backdrop-blur-sm pointer-events-none"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>{stickyFloor.thinkingPrompt}</span>
        </div>
      )}

      {/* Samtalszoner till vänster för identifierade talare */}
      <div
        data-testid="speaker-zones-container"
        className={`flex-1 h-full min-h-0 ${
          zoneCount === 0
            ? "flex items-center justify-center rounded-3xl border border-dashed border-stone-200/80 bg-stone-50/40 p-8"
            : `grid ${gridLayoutClass} gap-5 overflow-hidden`
        } transition-all duration-300`}
      >
        {zoneCount === 0 ? (
          <div
            data-testid="empty-speaker-zones-placeholder"
            className="flex flex-col items-center justify-center text-stone-400/70"
            aria-label="Väntar på samtalsdeltagare"
          >
            <div className="w-16 h-16 rounded-full bg-stone-200/40 flex items-center justify-center text-stone-400/80">
              <Mic className="w-8 h-8 stroke-[1.5]" />
            </div>
          </div>
        ) : (
          state.speakerZones.map((zone) => (
            <SpeakerZoneView
              key={zone.id}
              zone={zone}
              selectedTileId={selectedTile?.id}
              onSelectTile={handleSelectTile}
              onDismissTileSilent={handleDismissTileSilent}
              onConfirmTileSilent={handleConfirmTileSilent}
            />
          ))
        )}
      </div>

      {/* Afasideltagarens dedikerade kontrollzon med feedback, rensa och mikrofon */}
      <UserControlZone
        activeScenarioId={state.activeScenarioId}
        hasSelectedTile={Boolean(selectedTile)}
        isListening={state.isListening}
        connectionStatus={connectionStatus}
        lastEventStatus={lastEventStatus}
        feedbackStatus={feedbackStatus}
        onSelectScenario={selectScenario}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onClear={handleClear}
        onToggleListening={toggleListening}
      />
    </main>
  );
}
