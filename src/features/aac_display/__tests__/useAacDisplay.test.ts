import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAacDisplay } from "../hooks/useAacDisplay";
import { AacTile } from "../domain/types";
import { defaultLiveListener } from "../../live_listener/domain/liveListenerService";

describe("useAacDisplay - Dubblettspärr och Meningshantering [TCK-015, RULE-006, ADR-019]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("spärrar intilliggande dubbletter i messageQueue vid upprepat klick på samma symbol", () => {
    const { result } = renderHook(() => useAacDisplay());

    const tileCoffee: AacTile = {
      id: "tile-coffee-1",
      iconKey: "coffee",
      confidence: 0.9,
      isGroundTruth: true,
      speechText: "Kaffe",
    };

    // Första klicket ska lägga till i messageQueue
    act(() => {
      result.current.handleSelectTile(tileCoffee);
    });

    expect(result.current.messageQueue.length).toBe(1);
    expect(result.current.messageQueue[0].speechText).toBe("Kaffe");

    // Andra klicket på samma bricka direkt efter ska INTE öka kön (dubblettspärr)
    act(() => {
      result.current.handleSelectTile(tileCoffee);
    });

    expect(result.current.messageQueue.length).toBe(1);
    expect(result.current.messageQueue[0].speechText).toBe("Kaffe");
  });

  it("tillåter alternerande upprepning av symboler men aldrig direkt efter varandra", () => {
    const { result } = renderHook(() => useAacDisplay());

    const tile1: AacTile = {
      id: "t1",
      iconKey: "coffee",
      confidence: 0.95,
      isGroundTruth: true,
      speechText: "Kaffe",
    };

    const tile2: AacTile = {
      id: "t2",
      iconKey: "cake",
      confidence: 0.9,
      isGroundTruth: true,
      speechText: "Bulle",
    };

    act(() => {
      result.current.handleSelectTile(tile1);
    });
    expect(result.current.messageQueue.length).toBe(1);

    // Klicka tile1 igen -> spärras
    act(() => {
      result.current.handleSelectTile(tile1);
    });
    expect(result.current.messageQueue.length).toBe(1);

    // Klicka tile2 -> accepteras
    act(() => {
      result.current.handleSelectTile(tile2);
    });
    expect(result.current.messageQueue.length).toBe(2);

    // Klicka tile2 igen -> spärras
    act(() => {
      result.current.handleSelectTile(tile2);
    });
    expect(result.current.messageQueue.length).toBe(2);

    // Klicka tile1 igen (alternerande) -> accepteras
    act(() => {
      result.current.handleSelectTile(tile1);
    });
    expect(result.current.messageQueue.length).toBe(3);
    expect(result.current.messageQueue.map((t) => t.speechText)).toEqual(["Kaffe", "Bulle", "Kaffe"]);
  });

  it("respekterar strikt max 5 symboler i messageQueue [RULE-006]", () => {
    const { result } = renderHook(() => useAacDisplay());

    const tiles: AacTile[] = [
      { id: "1", iconKey: "coffee", confidence: 0.9, isGroundTruth: true, speechText: "Ett" },
      { id: "2", iconKey: "cake", confidence: 0.9, isGroundTruth: true, speechText: "Två" },
      { id: "3", iconKey: "water", confidence: 0.9, isGroundTruth: true, speechText: "Tre" },
      { id: "4", iconKey: "yes", confidence: 0.9, isGroundTruth: true, speechText: "Fyra" },
      { id: "5", iconKey: "no", confidence: 0.9, isGroundTruth: true, speechText: "Fem" },
      { id: "6", iconKey: "help", confidence: 0.9, isGroundTruth: true, speechText: "Sex" },
    ];

    tiles.forEach((t) => {
      act(() => {
        result.current.handleSelectTile(t);
      });
    });

    expect(result.current.messageQueue.length).toBe(5);
    expect(result.current.messageQueue[4].speechText).toBe("Fem");
  });
});
