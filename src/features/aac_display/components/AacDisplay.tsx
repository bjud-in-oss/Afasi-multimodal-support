import { useAacDisplay } from "../hooks/useAacDisplay";
import { SpeakerZoneView } from "./SpeakerZoneView";
import { UserControlZone } from "./UserControlZone";

export function AacDisplay() {
  const {
    state,
    selectedTile,
    feedbackStatus,
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
      {/* Samtalszoner för identifierade eller virtuella talare */}
      <div
        data-testid="speaker-zones-container"
        className={`flex-1 grid ${gridLayoutClass} gap-5 transition-all duration-300`}
      >
        {state.speakerZones.map((zone) => (
          <SpeakerZoneView
            key={zone.id}
            zone={zone}
            selectedTileId={selectedTile?.id}
            onSelectTile={handleSelectTile}
            onDismissTileSilent={handleDismissTileSilent}
            onConfirmTileSilent={handleConfirmTileSilent}
          />
        ))}
      </div>

      {/* Afasideltagarens dedikerade kontrollzon med scen-brickor och feedback */}
      <UserControlZone
        activeScenarioId={state.activeScenarioId}
        hasSelectedTile={Boolean(selectedTile)}
        isListening={state.isListening}
        feedbackStatus={feedbackStatus}
        onSelectScenario={selectScenario}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onToggleListening={toggleListening}
      />
    </main>
  );
}
