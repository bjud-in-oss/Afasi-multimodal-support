import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdaptiveMemoryService } from "../domain/adaptiveMemoryService";
import { AacTile } from "../../aac_display/domain/types";

describe("AdaptiveMemoryService (Successiv Inlärningsmotor)", () => {
  let memoryService: AdaptiveMemoryService;

  beforeEach(() => {
    // Rensa testminne
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
    vi.restoreAllMocks();
    memoryService = new AdaptiveMemoryService("test_aac_memory");
  });

  it("initialiserar med tomt minne utan fel", () => {
    const associations = memoryService.getAllAssociations();
    expect(Object.keys(associations).length).toBe(0);
  });

  it("ökar konfidensen och bekräftelseräknaren vid grön bock", () => {
    const updated = memoryService.recordFeedback({
      contextKey: "coffee",
      tileId: "tile-cake-2",
      iconKey: "cake",
      action: "confirm",
      initialConfidence: 0.65,
    });

    expect(updated.confirmCount).toBe(1);
    expect(updated.rejectCount).toBe(0);
    // Skall ha lyfts från 0.65 över 0.80 tröskeln
    expect(updated.calculatedConfidence).toBeGreaterThanOrEqual(0.8);
  });

  it("sänker konfidensen och dämpar brickan under 0.50 vid rött kryss", () => {
    const updated = memoryService.recordFeedback({
      contextKey: "coffee",
      tileId: "tile-cake-2",
      iconKey: "cake",
      action: "reject",
      initialConfidence: 0.65,
    });

    expect(updated.confirmCount).toBe(0);
    expect(updated.rejectCount).toBe(1);
    // Skall ha sänkts under 0.50 så att den inte visas
    expect(updated.calculatedConfidence).toBeLessThan(0.5);
  });

  it("applicerar sparade vikter på inkommande samtalsbrickor", () => {
    // Först: Bekräfta kakan så att den blir stark
    memoryService.recordFeedback({
      contextKey: "coffee",
      tileId: "tile-cake-2",
      iconKey: "cake",
      action: "confirm",
      initialConfidence: 0.65,
    });

    const rawTiles: AacTile[] = [
      {
        id: "tile-coffee-1",
        iconKey: "coffee",
        confidence: 0.95,
        isGroundTruth: true,
        speechText: "Kaffe",
      },
      {
        id: "tile-cake-2",
        iconKey: "cake",
        confidence: 0.65, // Ursprungligen osäker med frågetecken
        isGroundTruth: false,
        speechText: "Kaka",
      },
    ];

    const adjustedTiles = memoryService.applyLearnedWeights("coffee", rawTiles);

    // Kakan ska nu ha en effektiv konfidens >= 0.80
    const cakeTile = adjustedTiles.find((t) => t.iconKey === "cake");
    expect(cakeTile).toBeDefined();
    expect(cakeTile?.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("filtrerar bort avvisade brickor ur framtida samtal", () => {
    // Avfärda kakan
    memoryService.recordFeedback({
      contextKey: "coffee",
      tileId: "tile-cake-2",
      iconKey: "cake",
      action: "reject",
      initialConfidence: 0.65,
    });

    const rawTiles: AacTile[] = [
      {
        id: "tile-coffee-1",
        iconKey: "coffee",
        confidence: 0.95,
        isGroundTruth: true,
        speechText: "Kaffe",
      },
      {
        id: "tile-cake-2",
        iconKey: "cake",
        confidence: 0.65,
        isGroundTruth: false,
        speechText: "Kaka",
      },
    ];

    const adjustedTiles = memoryService.applyLearnedWeights("coffee", rawTiles);

    // Kakan ska vara helt bortfiltrerad (< 0.50) så att den inte dyker upp
    const cakeTile = adjustedTiles.find((t) => t.iconKey === "cake");
    expect(cakeTile).toBeUndefined();
    expect(adjustedTiles.length).toBe(1);
  });

  it("persisterar och återställer associationer från lagring", () => {
    memoryService.recordFeedback({
      contextKey: "cart",
      tileId: "tile-apple-1",
      iconKey: "apple",
      action: "confirm",
      initialConfidence: 0.8,
    });

    // Skapa ny instans med samma lagringsnyckel
    const secondInstance = new AdaptiveMemoryService("test_aac_memory");
    const association = secondInstance.getAssociation("cart", "apple");

    expect(association).toBeDefined();
    expect(association?.confirmCount).toBe(1);
  });
});
