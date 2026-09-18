import { describe, it, expect, beforeEach } from "vitest";
import { SymbolEngineService } from "../domain/symbolEngineService";
import { AacTile } from "../../aac_display/domain/types";
import { defaultAdaptiveMemory } from "../../adaptive_memory";

describe("SymbolEngineService (Mikro-feedback & Återgenerering)", () => {
  let service: SymbolEngineService;

  beforeEach(() => {
    service = new SymbolEngineService();
  });

  it("avfärdar dissad bricka och registrerar sänkt konfidens i adaptive_memory", async () => {
    const rejectedTile: AacTile = {
      id: "tile-coffee-1",
      iconKey: "coffee",
      confidence: 0.9,
      isGroundTruth: true,
      speechText: "Kaffe",
    };

    const replacement = await service.requestReplacementTile({
      zoneId: "speaker-1",
      rejectedTile,
      contextKey: "coffee",
    });

    // Kontrollera att minnet har sänkt vikten för coffee
    const assoc = defaultAdaptiveMemory.getAssociation("coffee", "coffee");
    expect(assoc?.calculatedConfidence).toBeLessThan(0.5);

    // Ersättningsbrickan ska inte vara kaffe
    if (replacement) {
      expect(replacement.iconKey).not.toBe("coffee");
      expect(replacement.confidence).toBeGreaterThanOrEqual(0.5);
    }
  });

  it("föreslår en kontextuell ersättare vid avfärdande", async () => {
    const rejectedTile: AacTile = {
      id: "tile-cake-1",
      iconKey: "cake",
      confidence: 0.8,
      isGroundTruth: true,
      speechText: "Kaka",
    };

    const replacement = await service.requestReplacementTile({
      zoneId: "speaker-1",
      rejectedTile,
      contextKey: "coffee",
    });

    expect(replacement).not.toBeNull();
    expect(replacement?.iconKey).toBeDefined();
    expect(replacement?.iconKey).not.toBe("cake");
  });

  it("bekräftar bricka tyst och stärker dess vikt i minnet", () => {
    const confirmedTile: AacTile = {
      id: "tile-water-1",
      iconKey: "water",
      confidence: 0.7,
      isGroundTruth: false,
      speechText: "Vatten",
    };

    service.recordSilentConfirmation("general", confirmedTile);

    const assoc = defaultAdaptiveMemory.getAssociation("general", "water");
    expect(assoc?.calculatedConfidence).toBeGreaterThan(0.7);
  });
});
