import { AacTile } from "../../aac_display/domain/types";

export interface SymbolCandidate {
  iconKey: AacTile["iconKey"];
  speechText: string;
  category?: AacTile["category"];
  baseConfidence: number;
}

export interface ReplacementRequest {
  zoneId: string;
  rejectedTile: AacTile;
  contextKey: string;
}

export interface SymbolEngineOptions {
  onReplacementReady?: (zoneId: string, oldTileId: string, newTile: AacTile) => void;
}
