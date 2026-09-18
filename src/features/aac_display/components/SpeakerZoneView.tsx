import { SpeakerZone, AacTile } from "../domain/types";
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

  return (
    <section
      data-testid={`speaker-zone-${zone.id}`}
      className={`flex-1 p-5 rounded-3xl border flex flex-col transition-all duration-500 ${themeStyles} ${activePulse}`}
    >
      {/* Rutnät för samtalsbrickor - helt utan rubriktext */}
      <div className="flex-1 grid grid-cols-2 gap-4 place-content-start">
        {zone.tiles.map((tile) => (
          <AacTileItem
            key={tile.id}
            tile={tile}
            isSelected={tile.id === selectedTileId}
            onSelect={onSelectTile}
            onDismissSilent={
              onDismissTileSilent ? (t) => onDismissTileSilent(zone.id, t) : undefined
            }
            onConfirmSilent={
              onConfirmTileSilent ? (t) => onConfirmTileSilent(zone.id, t) : undefined
            }
          />
        ))}

        {/* Vilsam tom yta vid noll samtalsämnen */}
        {zone.tiles.length === 0 && (
          <div className="col-span-2 h-48 flex items-center justify-center rounded-2xl border border-dashed border-stone-200/70" />
        )}
      </div>
    </section>
  );
}
