import { Mic } from "lucide-react";
import { useAacDisplay } from "../hooks/useAacDisplay";
import { SpeakerZoneView } from "./SpeakerZoneView";
import { UserControlZone } from "./UserControlZone";

export function AacDisplay() {
  const {
    state,
    selectedTile,
    feedbackStatus,
    connectionStatus,
    selectScenario,
    handleSelectTile,
    handleConfirm,
    handleReject,
    handleDismissTileSilent,
    handleConfirmTileSilent,
    toggleListening,
  } = useAacDisplay();

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
      className="min-h-screen w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 sm:p-6 select-none"
    >
      {/* Samtalszoner till vänster för identifierade eller virtuella talare */}
      <div
        data-testid="speaker-zones-container"
        className={`flex-1 ${
          zoneCount === 0
            ? "flex items-center justify-center rounded-3xl border border-dashed border-stone-200/80 bg-stone-50/40 p-8 min-h-[320px]"
            : `grid ${gridLayoutClass} gap-5`
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

      {/* Afasideltagarens dedikerade kontrollzon med scen-brickor och feedback */}
      <UserControlZone
        activeScenarioId={state.activeScenarioId}
        hasSelectedTile={Boolean(selectedTile)}
        isListening={state.isListening}
        connectionStatus={connectionStatus}
        feedbackStatus={feedbackStatus}
        onSelectScenario={selectScenario}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onToggleListening={toggleListening}
      />
    </main>
  );
}
