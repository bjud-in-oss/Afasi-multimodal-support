import React from "react";
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
  ThumbsUp,
  ThumbsDown,
  HeartCrack,
  Toilet,
  X,
  Wind,
} from "lucide-react";
import { AacTile } from "../domain/types";

interface MessageBarProps {
  messageQueue: AacTile[];
  selectedQueueIndex: number | null;
  isBreathingPause: boolean;
  onSelectQueueTile: (index: number) => void;
  onRemoveQueueTile: (index: number, e: React.MouseEvent) => void;
}

export function MessageBar({
  messageQueue,
  selectedQueueIndex,
  isBreathingPause,
  onSelectQueueTile,
  onRemoveQueueTile,
}: MessageBarProps) {
  const renderIcon = (iconKey: string, queueLen: number) => {
    const iconSize =
      queueLen <= 2
        ? "w-8 h-8 sm:w-10 sm:h-10 stroke-[2]"
        : queueLen <= 4
        ? "w-6 h-6 sm:w-8 sm:h-8 stroke-[2]"
        : "w-5 h-5 sm:w-6 sm:h-6 stroke-[2]";

    switch (iconKey) {
      case "coffee":
        return <Coffee className={iconSize} />;
      case "cake":
        return <Cake className={iconSize} />;
      case "water":
        return <GlassWater className={iconSize} />;
      case "cart":
        return <ShoppingCart className={iconSize} />;
      case "apple":
        return <Apple className={iconSize} />;
      case "pill":
        return <Pill className={iconSize} />;
      case "heart":
        return <Heart className={iconSize} />;
      case "sun":
        return <Sun className={iconSize} />;
      case "home":
        return <Home className={iconSize} />;
      case "smile":
        return <Smile className={iconSize} />;
      case "thumbs-up":
      case "yes":
        return <ThumbsUp className={iconSize} />;
      case "thumbs-down":
      case "no":
        return <ThumbsDown className={iconSize} />;
      case "pain":
        return <HeartCrack className={iconSize} />;
      case "toilet":
        return <Toilet className={iconSize} />;
      default:
        return <HelpCircle className={iconSize} />;
    }
  };

  if (isBreathingPause) {
    return (
      <div
        data-testid="breathing-pause-indicator"
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-300 text-emerald-800 animate-pulse select-none transition-all duration-700 shadow-sm"
      >
        <Wind className="w-5 h-5 animate-bounce stroke-[2]" />
        <span className="text-xs sm:text-sm font-medium tracking-wide">Andningspaus...</span>
      </div>
    );
  }

  if (messageQueue.length === 0) {
    return null;
  }

  const sizeClass =
    messageQueue.length <= 2
      ? "w-14 h-14 sm:w-16 sm:h-16"
      : messageQueue.length <= 4
      ? "w-12 h-12 sm:w-14 sm:h-14"
      : "w-10 h-10 sm:w-12 sm:h-12";

  return (
    <div
      data-testid="message-bar-container"
      className="flex items-center justify-center gap-1.5 sm:gap-2 px-1 max-w-full overflow-hidden select-none"
    >
      {messageQueue.map((tile, index) => {
        const isSelected = selectedQueueIndex === index;
        return (
          <div
            key={`${tile.id}-${index}`}
            data-testid={`message-bar-tile-${index}`}
            onClick={() => onSelectQueueTile(index)}
            className={`relative shrink-0 ${sizeClass} rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${
              isSelected
                ? "bg-rose-50 border-rose-400 ring-2 ring-rose-500/80 shadow-md scale-105"
                : "bg-white border-stone-300 hover:border-stone-400 text-stone-800 shadow-sm"
            }`}
          >
            {renderIcon(tile.iconKey, messageQueue.length)}

            {/* Typ A Kryss för punktkorrigering [RULE-015] */}
            {isSelected && (
              <button
                type="button"
                data-testid={`message-bar-remove-${index}`}
                onClick={(e) => onRemoveQueueTile(index, e)}
                aria-label="Radera denna symbol"
                className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-rose-700 active:scale-90 z-20 border-2 border-white"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
