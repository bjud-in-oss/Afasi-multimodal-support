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

  return (
    <main
      data-testid="aac-display-root"
      className="min-h-screen w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 sm:p-6 select-none"
    >
      {/* Samtalszoner för identifierade eller virtuella talare */}
      <div className="flex-1 flex flex-col md:flex-row gap-5">
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
