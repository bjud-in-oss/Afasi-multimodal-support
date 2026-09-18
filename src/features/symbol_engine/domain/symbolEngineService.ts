import { AacTile } from "../../aac_display/domain/types";
import { defaultAdaptiveMemory } from "../../adaptive_memory";
import { ReplacementRequest, SymbolCandidate } from "./types";

// Kontextuella symbolkandidater för dynamisk återgenerering
const CONTEXT_CANDIDATES: Record<string, SymbolCandidate[]> = {
  coffee: [
    { iconKey: "coffee", speechText: "Kaffe", category: "food", baseConfidence: 0.95 },
    { iconKey: "cake", speechText: "Kaka eller bulle", category: "food", baseConfidence: 0.85 },
    { iconKey: "water", speechText: "Ett glas vatten", category: "food", baseConfidence: 0.8 },
    { iconKey: "apple", speechText: "Äpple eller frukt", category: "food", baseConfidence: 0.75 },
    { iconKey: "smile", speechText: "Trevligt fika", category: "social", baseConfidence: 0.7 },
  ],
  cart: [
    { iconKey: "cart", speechText: "Handla mat", category: "need", baseConfidence: 0.95 },
    { iconKey: "apple", speechText: "Frukt och grönt", category: "food", baseConfidence: 0.85 },
    { iconKey: "water", speechText: "Vatten och dryck", category: "food", baseConfidence: 0.8 },
    { iconKey: "coffee", speechText: "Kaffe till hemmet", category: "food", baseConfidence: 0.75 },
  ],
  heart: [
    { iconKey: "heart", speechText: "Vila och hjärta", category: "health", baseConfidence: 0.9 },
    { iconKey: "pill", speechText: "Medicin eller tablett", category: "health", baseConfidence: 0.85 },
    { iconKey: "water", speechText: "Dricka vatten", category: "health", baseConfidence: 0.8 },
    { iconKey: "smile", speechText: "Må bättre", category: "social", baseConfidence: 0.75 },
  ],
  home: [
    { iconKey: "home", speechText: "Vara hemma", category: "need", baseConfidence: 0.9 },
    { iconKey: "sun", speechText: "Soligt och lugnt", category: "social", baseConfidence: 0.8 },
    { iconKey: "heart", speechText: "Vila ut", category: "health", baseConfidence: 0.75 },
  ],
  general: [
    { iconKey: "coffee", speechText: "Kaffe", category: "food", baseConfidence: 0.85 },
    { iconKey: "water", speechText: "Vatten", category: "food", baseConfidence: 0.85 },
    { iconKey: "smile", speechText: "Glad", category: "social", baseConfidence: 0.8 },
    { iconKey: "sun", speechText: "Promenad", category: "social", baseConfidence: 0.8 },
    { iconKey: "home", speechText: "Hemma", category: "need", baseConfidence: 0.8 },
    { iconKey: "heart", speechText: "Vila", category: "health", baseConfidence: 0.8 },
  ],
};

export class SymbolEngineService {
  /**
   * Hanterar avfärdande av en ruta, sparar dämpad vikt i minnet
   * och genererar/hämtar en ny relevant ersättare.
   */
  public async requestReplacementTile(request: ReplacementRequest): Promise<AacTile | null> {
    const { zoneId, rejectedTile, contextKey } = request;

    // 1. Spara omedelbart avfärdandet i adaptiva minnet (< 0.50 konfidens)
    defaultAdaptiveMemory.recordFeedback({
      contextKey: contextKey || "general",
      tileId: rejectedTile.id,
      iconKey: rejectedTile.iconKey,
      action: "reject",
      initialConfidence: rejectedTile.confidence,
    });

    // 2. Välj kandidatpool utifrån sammanhanget
    const candidates = CONTEXT_CANDIDATES[contextKey] || CONTEXT_CANDIDATES.general;

    // 3. Filtrera bort den dissade symbolen och konvertera till AacTile
    const rawTiles: AacTile[] = candidates
      .filter((c) => c.iconKey !== rejectedTile.iconKey)
      .map((c) => ({
        id: `replacement-${zoneId}-${c.iconKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        iconKey: c.iconKey,
        confidence: c.baseConfidence,
        isGroundTruth: c.baseConfidence >= 0.8,
        speechText: c.speechText,
        category: c.category,
      }));

    // 4. Kör kandidaterna genom adaptiva minnesmotorn
    const weightedTiles = defaultAdaptiveMemory.applyLearnedWeights(
      contextKey || "general",
      rawTiles
    );

    // 5. Anti-hallucination: Tillåt endast brickor med konfidens >= 0.50
    const validCandidates = weightedTiles.filter((t) => t.confidence >= 0.5);

    if (validCandidates.length === 0) {
      return null;
    }

    // Välj kandidaten med högst konfidens
    validCandidates.sort((a, b) => b.confidence - a.confidence);
    return validCandidates[0];
  }

  /**
   * Tyst godkännande av en bricka (ökar vikten i minnet utan tal).
   */
  public recordSilentConfirmation(contextKey: string, tile: AacTile): void {
    defaultAdaptiveMemory.recordFeedback({
      contextKey: contextKey || "general",
      tileId: tile.id,
      iconKey: tile.iconKey,
      action: "confirm",
      initialConfidence: tile.confidence,
    });
  }
}

export const defaultSymbolEngine = new SymbolEngineService();
