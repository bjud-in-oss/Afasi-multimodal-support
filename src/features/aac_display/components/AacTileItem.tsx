import {
  Coffee,
  Cake,
  GlassWater,
  ShoppingCart,
  Apple,
  Pill,
  Heart,
  Sun,
  Home,
  Smile,
  HelpCircle,
  HelpCircle as QuestionIcon,
  X,
  Check,
  ThumbsUp,
  ThumbsDown,
  HeartCrack,
  Toilet,
} from "lucide-react";
import { AacTile } from "../domain/types";

interface AacTileItemProps {
  tile: AacTile;
  isSelected?: boolean;
  onSelect: (tile: AacTile) => void;
  onDismissSilent?: (tile: AacTile, e: React.MouseEvent) => void;
  onConfirmSilent?: (tile: AacTile, e: React.MouseEvent) => void;
}

export function AacTileItem({
  tile,
  isSelected,
  onSelect,
  onDismissSilent,
  onConfirmSilent,
}: AacTileItemProps) {
  // Strikt anti-hallucination: filtrera bort osäkra gissningar under 0.50
  if (tile.confidence < 0.5) {
    return null;
  }

  const needsClarification = tile.confidence >= 0.5 && tile.confidence < 0.8;

  const renderIcon = () => {
    const props = { className: "w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 stroke-[1.75]" };
    switch (tile.iconKey) {
      case "coffee":
        return <Coffee {...props} />;
      case "cake":
        return <Cake {...props} />;
      case "water":
        return <GlassWater {...props} />;
      case "cart":
        return <ShoppingCart {...props} />;
      case "apple":
        return <Apple {...props} />;
      case "pill":
        return <Pill {...props} />;
      case "heart":
        return <Heart {...props} />;
      case "sun":
        return <Sun {...props} />;
      case "home":
        return <Home {...props} />;
      case "smile":
        return <Smile {...props} />;
      case "thumbs-up":
      case "yes":
        return <ThumbsUp {...props} />;
      case "thumbs-down":
      case "no":
        return <ThumbsDown {...props} />;
      case "pain":
        return <HeartCrack {...props} />;
      case "toilet":
        return <Toilet {...props} />;
      default:
        return <HelpCircle {...props} />;
    }
  };

  return (
    <div
      data-testid={`tile-container-${tile.id}`}
      className={`relative flex items-center justify-center p-3 sm:p-5 w-full h-full min-h-[110px] sm:min-h-[130px] rounded-2xl sm:rounded-3xl border transition-all duration-200 group ${
        isSelected
          ? "bg-white border-stone-800 shadow-md ring-4 ring-stone-800/10 scale-[1.02]"
          : "bg-white/90 hover:bg-white border-stone-200/90 shadow-sm hover:shadow"
      }`}
    >
      {/* Huvudknapp för att välja brickan */}
      <button
        type="button"
        data-testid={`aac-tile-${tile.id}`}
        onClick={() => onSelect(tile)}
        aria-label={tile.speechText}
        className="w-full h-full flex items-center justify-center cursor-pointer focus:outline-none"
      >
        <div className="text-stone-800 flex items-center justify-center w-full h-full">
          {renderIcon()}
        </div>
      </button>

      {/* Mikro-kryss för tyst avfärdande ("dissa" utan tal) */}
      {onDismissSilent && (
        <button
          type="button"
          data-testid={`micro-dismiss-${tile.id}`}
          aria-label="Avfärda förslag tyst"
          onClick={(e) => {
            e.stopPropagation();
            onDismissSilent(tile, e);
          }}
          className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-stone-100/90 hover:bg-rose-100 text-stone-400 hover:text-rose-700 transition-colors cursor-pointer border border-stone-200/70 shadow-xs"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}

      {/* Mikro-bock för tyst bekräftelse utan tal */}
      {onConfirmSilent && (
        <button
          type="button"
          data-testid={`micro-confirm-${tile.id}`}
          aria-label="Bekräfta förslag tyst"
          onClick={(e) => {
            e.stopPropagation();
            onConfirmSilent(tile, e);
          }}
          className="absolute bottom-2 right-2 z-10 p-1 rounded-lg bg-stone-100/90 hover:bg-emerald-100 text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer border border-stone-200/70 shadow-xs"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}

      {/* Frågetecken-överlägg vid medelhög konfidens (0.50 - 0.79) */}
      {needsClarification && (
        <div
          data-testid="question-mark-overlay"
          className="pointer-events-none absolute top-2 right-2 z-10 p-1 rounded-full bg-amber-100/95 border border-amber-300 text-amber-900 shadow-xs"
        >
          <QuestionIcon className="w-4 h-4 stroke-[2.5]" />
        </div>
      )}
    </div>
  );
}
