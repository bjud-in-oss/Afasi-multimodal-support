import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStickyFloor } from "../hooks/useStickyFloor";

describe("useStickyFloor (Kognitiv interaktionsspärr [RULE-001])", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initieras med passivt tillstånd och inget tänker-meddelande", () => {
    const { result } = renderHook(() => useStickyFloor());
    expect(result.current.isUserInteracting).toBe(false);
    expect(result.current.isGracePeriodActive).toBe(false);
    expect(result.current.thinkingPrompt).toBeNull();
  });

  it("aktiverar Sticky Floor vid startInteraction och pausar inkommande UI-uppdateringar", () => {
    const { result } = renderHook(() => useStickyFloor());

    act(() => {
      result.current.startInteraction();
    });

    expect(result.current.isUserInteracting).toBe(true);
    expect(result.current.thinkingPrompt).toBe("Kalle tänker... vänta.");
  });

  it("startar 5000 ms Grace Period vid endInteraction och nollställer vid ny beröring", () => {
    const { result } = renderHook(() => useStickyFloor());

    act(() => {
      result.current.startInteraction();
    });

    act(() => {
      result.current.endInteraction();
    });

    expect(result.current.isGracePeriodActive).toBe(true);
    expect(result.current.isUserInteracting).toBe(true);
    expect(result.current.thinkingPrompt).toBe("Kalle tänker... vänta.");

    // Hoppa 4000ms framåt - fortfarande aktiv
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.isGracePeriodActive).toBe(true);

    // Ny beröring nollställer grace period timern
    act(() => {
      result.current.startInteraction();
    });
    expect(result.current.isGracePeriodActive).toBe(false);
    expect(result.current.isUserInteracting).toBe(true);

    // Släpp igen och låt 5000ms passera fullt ut
    act(() => {
      result.current.endInteraction();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.isGracePeriodActive).toBe(false);
    expect(result.current.isUserInteracting).toBe(false);
    expect(result.current.thinkingPrompt).toBeNull();
  });

  it("tidig release: cancelInteraction() bryter Grace Period omedelbart vid klick på Rensa", () => {
    const { result } = renderHook(() => useStickyFloor());

    act(() => {
      result.current.startInteraction();
      result.current.endInteraction();
    });
    expect(result.current.isGracePeriodActive).toBe(true);

    act(() => {
      result.current.cancelInteraction();
    });

    expect(result.current.isGracePeriodActive).toBe(false);
    expect(result.current.isUserInteracting).toBe(false);
    expect(result.current.thinkingPrompt).toBeNull();
  });

  it("hård timeout: oavbruten beröring i > 30s återställer automatiskt för att förhindra frysning", () => {
    const { result } = renderHook(() => useStickyFloor());

    act(() => {
      result.current.startInteraction();
    });
    expect(result.current.isUserInteracting).toBe(true);

    // 30 sekunder passerar
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isUserInteracting).toBe(false);
    expect(result.current.thinkingPrompt).toBeNull();
  });
});
