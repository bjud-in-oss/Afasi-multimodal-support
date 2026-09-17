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
} from "lucide-react";
import { AacTile } from "../domain/types";

interface AacTileItemProps {
  tile: AacTile;
  isSelected?: boolean;
  onSelect: (tile: AacTile) => void;
}

export function AacTileItem({ tile, isSelected, onSelect }: AacTileItemProps) {
  // Strikt anti-hallucination: filtrera bort osäkra gissningar under 0.50
  if (tile.confidence < 0.5) {
    return null;
  }

  const needsClarification = tile.confidence >= 0.5 && tile.confidence < 0.8;

  const renderIcon = () => {
    const props = { className: "w-12 h-12 stroke-[1.75]" };
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
      default:
        return <HelpCircle {...props} />;
    }
  };

  return (
    <button
      type="button"
      data-testid={`aac-tile-${tile.id}`}
      onClick={() => onSelect(tile)}
      aria-label={tile.speechText}
      className={`relative flex items-center justify-center p-6 aspect-square rounded-2xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "bg-white border-stone-800 shadow-md ring-3 ring-stone-800/10 scale-[1.02]"
          : "bg-white/90 hover:bg-white border-stone-200/90 shadow-sm hover:shadow active:scale-[0.98]"
      }`}
    >
      <div className="text-stone-800">{renderIcon()}</div>

      {/* Frågetecken-överlägg vid medelhög konfidens (0.50 - 0.79) */}
      {needsClarification && (
        <div
          data-testid="question-mark-overlay"
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-amber-100/95 border border-amber-300 text-amber-900 shadow-xs"
        >
          <QuestionIcon className="w-4 h-4 stroke-[2.5]" />
        </div>
      )}
    </button>
  );
}
