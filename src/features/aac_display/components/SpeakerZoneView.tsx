import { SpeakerZone, AacTile, PERMANENT_SAFETY_TILES } from "../domain/types";
import { AacTileItem } from "./AacTileItem";

interface SpeakerZoneViewProps {
  zone: SpeakerZone;
  selectedTileId?: string;
  onSelectTile: (tile: AacTile) => void;
  onDismissTileSilent?: (zoneId: string, tile: AacTile) => void;
  onConfirmTileSilent?: (zoneId: string, tile: AacTile) => void;
}

export function SpeakerZoneView({
  zone,
  selectedTileId,
  onSelectTile,
  onDismissTileSilent,
  onConfirmTileSilent,
}: SpeakerZoneViewProps) {
  const themeStyles = {
    emerald: "bg-emerald-50/30 border-emerald-200/60",
    amber: "bg-amber-50/30 border-amber-200/60",
    sky: "bg-sky-50/30 border-sky-200/60",
    stone: "bg-stone-50/40 border-stone-200/60",
    violet: "bg-violet-50/30 border-violet-200/60",
    rose: "bg-rose-50/30 border-rose-200/60",
  }[zone.colorTheme];

  const activePulse = zone.isActive ? "ring-2 ring-emerald-500/40 shadow-sm" : "";
  const isDynamicEmpty = !zone.tiles || zone.tiles.length === 0;
  const displayTiles = isDynamicEmpty ? PERMANENT_SAFETY_TILES : zone.tiles;

  return (
    <section
      data-testid={`speaker-zone-${zone.id}`}
      className={`flex-1 h-full min-h-0 p-3 sm:p-5 rounded-3xl border flex flex-col transition-all duration-500 select-none overflow-hidden ${themeStyles} ${activePulse}`}
    >
      {/* Rutnät för samtalsbrickor - helt utan rubriktext */}
      <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 overflow-hidden">
        {displayTiles.map((tile) => (
          <AacTileItem
            key={tile.id}
            tile={tile}
            isSelected={tile.id === selectedTileId}
            onSelect={onSelectTile}
            onDismissSilent={
              !isDynamicEmpty && onDismissTileSilent
                ? (t) => onDismissTileSilent(zone.id, t)
                : undefined
            }
            onConfirmSilent={
              !isDynamicEmpty && onConfirmTileSilent
                ? (t) => onConfirmTileSilent(zone.id, t)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
