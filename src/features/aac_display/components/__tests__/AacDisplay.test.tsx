import { describe, it, expect, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { AacDisplay } from "../AacDisplay";
import { SpeakerZoneView } from "../SpeakerZoneView";
import { defaultLiveListener } from "../../../live_listener";
import { defaultAdaptiveMemory } from "../../../adaptive_memory";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  defaultAdaptiveMemory.clearMemory();
  defaultLiveListener.resetConsent();
});

const simulateUtterance = (
  speakerId = "speaker-1",
  tiles = [
    { id: "tile-coffee-1", iconKey: "coffee", confidence: 0.95, isGroundTruth: true, speechText: "Kaffe" },
    { id: "tile-cake-2", iconKey: "cake", confidence: 0.65, isGroundTruth: false, speechText: "Bulle" },
  ]
) => {
  defaultLiveListener.simulateUtterance({
    speakerId,
    text: "Vill du ha fika?",
    tiles: tiles as any,
  });
};

describe("AacDisplay (Textlöst AAC-gränssnitt för Afasideltagare)", () => {
  it("renderar utan text eller rubriker i viloläge och utan statiska knappar", () => {
    const { container } = render(<AacDisplay />);
    
    // Verifiera att ingen rubrik eller menynamn visas
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    expect(headings.length).toBe(0);

    // Verifiera att kontrollzonen finns och att statiska scen-brickor raderats
    expect(screen.getByTestId("aac-user-control-zone")).toBeInTheDocument();
    expect(screen.queryByTestId("scene-coffee")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scene-cart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scene-heart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scene-home")).not.toBeInTheDocument();
  });

  it("visar inga hallucinerade bilder i tomma samtalszoner vid start", () => {
    render(<AacDisplay />);
    const tiles = screen.queryAllByTestId(/^aac-tile-/);
    expect(tiles.length).toBe(0);
  });

  it("aktiverar deltagarzoner dynamiskt när ett yttrande tas emot", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const activeTiles = screen.getAllByTestId(/^aac-tile-/);
    expect(activeTiles.length).toBeGreaterThan(0);
  });

  it("visar frågetecken-överlägg på brickor med medelhög konfidens (0.50 - 0.79)", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const questionMarks = screen.getAllByTestId("question-mark-overlay");
    expect(questionMarks.length).toBeGreaterThan(0);
  });

  it("lämnar brickor med konfidens under 0.50 helt tomma", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance("speaker-1", [
        { id: "tile-low-conf", iconKey: "apple", confidence: 0.35, isGroundTruth: false, speechText: "Låg" },
      ]);
    });

    const hiddenLowConf = screen.queryByTestId("aac-tile-tile-low-conf");
    expect(hiddenLowConf).not.toBeInTheDocument();
  });

  it("avfärdar tolkning vid klick på rött kryss (feedbackreglage)", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    const rejectButton = screen.getByTestId("feedback-reject");
    fireEvent.click(rejectButton);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("bekräftar tolkning vid klick på grön bock (feedbackreglage)", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    const confirmButton = screen.getByTestId("feedback-confirm");
    fireEvent.click(confirmButton);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("avfärdar bricka tyst vid klick på mikro-kryss och ersätter den i realtid", async () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const microDismissButtons = screen.getAllByTestId(/^micro-dismiss-/);
    expect(microDismissButtons.length).toBeGreaterThan(0);

    const firstDismissBtn = microDismissButtons[0];
    fireEvent.click(firstDismissBtn);

    await waitFor(() => {
      const currentTiles = screen.getAllByTestId(/^aac-tile-/);
      expect(currentTiles.length).toBeGreaterThan(0);
    });
  });

  it("bekräftar bricka tyst vid klick på mikro-bock", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const microConfirmButtons = screen.getAllByTestId(/^micro-confirm-/);
    expect(microConfirmButtons.length).toBeGreaterThan(0);

    fireEvent.click(microConfirmButtons[0]);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("kan rensa markering och frigöra sticky floor via rensa-knappen", () => {
    render(<AacDisplay />);
    act(() => {
      simulateUtterance();
    });

    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    const clearButton = screen.getByTestId("btn-clear-selection");
    fireEvent.click(clearButton);

    expect(screen.queryByTestId("laptop-thinking-indicator")).not.toBeInTheDocument();
  });

  describe("Sticky Floor & Laptop Grace Period", () => {
    it("visar pulserande prompt på laptopen under användarinteraktion", () => {
      render(<AacDisplay />);
      act(() => {
        simulateUtterance();
      });

      const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
      fireEvent.pointerDown(firstTile);

      expect(screen.getByTestId("laptop-thinking-indicator")).toBeInTheDocument();
      expect(screen.getByText("Kalle tänker... vänta.")).toBeInTheDocument();
    });
  });

  describe("Flertalar-rum (TCK-006: Adaptiv layout-skalning och färgkodning)", () => {
    it("anpassar grid-layouten adaptivt för 1 och 2 talarzoner", () => {
      render(<AacDisplay />);
      const zonesContainer = screen.getByTestId("speaker-zones-container");

      act(() => {
        simulateUtterance("speaker-1");
      });
      expect(zonesContainer).toHaveClass("grid-cols-1");

      act(() => {
        simulateUtterance("speaker-2");
      });
      expect(zonesContainer).toHaveClass("md:grid-cols-2");
    });

    it("renderar nya färgteman (violet och rose) med WCAG AA-vänlig dämpning i SpeakerZoneView", () => {
      const testZoneViolet = {
        id: "speaker-violet",
        colorTheme: "violet" as const,
        tiles: [],
        isActive: true,
      };

      const { rerender } = render(
        <SpeakerZoneView
          zone={testZoneViolet}
          onSelectTile={vi.fn()}
        />
      );

      const violetSection = screen.getByTestId("speaker-zone-speaker-violet");
      expect(violetSection.className).toContain("bg-violet-50/30");
      expect(violetSection.className).toContain("border-violet-200/60");
      expect(violetSection.className).toContain("duration-500");

      const testZoneRose = {
        id: "speaker-rose",
        colorTheme: "rose" as const,
        tiles: [],
        isActive: false,
      };

      rerender(
        <SpeakerZoneView
          zone={testZoneRose}
          onSelectTile={vi.fn()}
        />
      );

      const roseSection = screen.getByTestId("speaker-zone-speaker-rose");
      expect(roseSection.className).toContain("bg-rose-50/30");
      expect(roseSection.className).toContain("border-rose-200/60");
    });

    it("stödjer flertalar-fika med 3 talare och unika färgprofiler", () => {
      render(<AacDisplay />);
      
      act(() => {
        simulateUtterance("speaker-1");
        simulateUtterance("speaker-2");
        simulateUtterance("speaker-3");
      });

      const zonesContainer = screen.getByTestId("speaker-zones-container");
      expect(zonesContainer).toBeInTheDocument();

      const speaker1 = screen.getByTestId("speaker-zone-speaker-1");
      const speaker2 = screen.getByTestId("speaker-zone-speaker-2");
      const speaker3 = screen.getByTestId("speaker-zone-speaker-3");

      expect(speaker1).toBeInTheDocument();
      expect(speaker2).toBeInTheDocument();
      expect(speaker3).toBeInTheDocument();
    });
  });

  describe("Dynamisk live-koppling och zoninitialisering (TCK-007 / Bugfix)", () => {
    it("börjar vid 0 talare och visar tom samtalsyta till vänster och kontrollzon till höger", () => {
      render(<AacDisplay />);

      // Kontrollera att samtalszon-containern har 0 talarzoner och visar placeholder
      expect(screen.getByTestId("empty-speaker-zones-placeholder")).toBeInTheDocument();
      expect(screen.queryByTestId("speaker-zone-speaker-1")).not.toBeInTheDocument();

      // Kontrollera att afasideltagarens kontrollzon finns till höger
      expect(screen.getByTestId("aac-user-control-zone")).toBeInTheDocument();
    });

    it("visar visuell statusindikator (punkt) på mikrofonknappen för Gemini Live-anslutning", () => {
      render(<AacDisplay />);

      const statusDot = screen.getByTestId("live-status-dot");
      expect(statusDot).toBeInTheDocument();
      // Frånkopplad punkt initialt (grå / stone)
      expect(statusDot.className).toContain("bg-stone-400");

      // Klicka på mikrofonen för att aktivera anslutning
      const micButton = screen.getByTestId("btn-toggle-mic");
      fireEvent.click(micButton);

      // När mikrofonen startas övergår den till connecting / active
      expect(statusDot.className).toMatch(/bg-amber-400|bg-emerald-500/);
    });
  });

  describe("Dold diagnostikpanel och realtidslogg (TCK-006B)", () => {
    it("håller diagnostikpanelen dold som standard för en textlös upplevelse", () => {
      render(<AacDisplay />);
      expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();
    });

    it("öppnar diagnostikpanelen vid dubbelklick på statuspricken och stänger den via stängknapp", () => {
      render(<AacDisplay />);

      const statusDot = screen.getByTestId("live-status-dot");
      expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();

      // Dubbelklicka på statuspricken
      fireEvent.doubleClick(statusDot);

      // Panelen ska nu visas
      const diagPanel = screen.getByTestId("diagnostics-panel");
      expect(diagPanel).toBeInTheDocument();
      expect(screen.getByTestId("diagnostics-event-status")).toBeInTheDocument();
      expect(screen.getByTestId("download-diagnostics-zip")).toBeInTheDocument();

      // Stäng via stängknappen
      const closeBtn = screen.getByTestId("btn-close-diagnostics");
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();
    });

    it("växlar diagnostikpanelen vid snabbt dubbeltryck (klick)", () => {
      render(<AacDisplay />);

      const statusDot = screen.getByTestId("live-status-dot");

      // Första klicket
      fireEvent.click(statusDot);
      expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();

      // Andra klicket inom kort tid (<400ms)
      fireEvent.click(statusDot);
      expect(screen.getByTestId("diagnostics-panel")).toBeInTheDocument();

      // Ytterligare snabbt klick stänger igen
      fireEvent.click(statusDot);
      expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();
    });
  });

  describe("Layout och Skärmutrymme (TCK-012 / UI-FIX)", () => {
    it("renderar UserControlZone som en kompakt botten-docka med max-h-24 sm:max-h-28 och flex-row", () => {
      render(<AacDisplay />);
      const controlZone = screen.getByTestId("aac-user-control-zone");
      expect(controlZone.className).toContain("max-h-24");
      expect(controlZone.className).toContain("sm:max-h-28");
      expect(controlZone.className).toContain("flex-row");
      expect(controlZone.className).toContain("justify-between");

      // Verifiera att kontrollknapparna finns
      expect(screen.getByTestId("btn-clear-selection")).toBeInTheDocument();
      expect(screen.getByTestId("feedback-confirm")).toBeInTheDocument();
      expect(screen.getByTestId("feedback-reject")).toBeInTheDocument();
      expect(screen.getByTestId("btn-toggle-mic")).toBeInTheDocument();
    });

    it("ger SpeakerZoneView flex-1 h-full min-h-0 för att äga huvudytan", () => {
      render(<AacDisplay />);
      act(() => {
        simulateUtterance("speaker-1");
      });

      const zoneSection = screen.getByTestId("speaker-zone-speaker-1");
      expect(zoneSection.className).toContain("flex-1");
      expect(zoneSection.className).toContain("h-full");
      expect(zoneSection.className).toContain("min-h-0");
    });

    it("visar permanenta trygghetsbrickor ([Ja], [Nej], [Ont/Smärta], [Toalett], [Vatten]) vid tystnad eller tomma ämnen [RULE-007]", () => {
      const emptyZone = {
        id: "speaker-silent",
        colorTheme: "emerald" as const,
        tiles: [],
        isActive: true,
      };

      const handleSelect = vi.fn();
      render(
        <SpeakerZoneView
          zone={emptyZone}
          onSelectTile={handleSelect}
        />
      );

      // Verifiera att alla 5 trygghetsbrickor renderas
      const yesTile = screen.getByTestId("aac-tile-safety-yes");
      const noTile = screen.getByTestId("aac-tile-safety-no");
      const painTile = screen.getByTestId("aac-tile-safety-pain");
      const toiletTile = screen.getByTestId("aac-tile-safety-toilet");
      const waterTile = screen.getByTestId("aac-tile-safety-water");

      expect(yesTile).toBeInTheDocument();
      expect(noTile).toBeInTheDocument();
      expect(painTile).toBeInTheDocument();
      expect(toiletTile).toBeInTheDocument();
      expect(waterTile).toBeInTheDocument();

      // Verifiera att ingen streckad tom box renderas
      const zone = screen.getByTestId("speaker-zone-speaker-silent");
      expect(zone.querySelector(".border-dashed")).not.toBeInTheDocument();

      // Verifiera att klick på en trygghetsbricka anropar callback
      fireEvent.click(painTile);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "safety-pain",
          speechText: "Ont / Smärta",
        })
      );
    });
  });
});
