import { describe, it, expect, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { AacDisplay } from "../AacDisplay";
import { SpeakerZoneView } from "../SpeakerZoneView";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AacDisplay (Textlöst AAC-gränssnitt för Afasideltagare)", () => {
  it("renderar utan text eller rubriker i viloläge", () => {
    const { container } = render(<AacDisplay />);
    
    // Verifiera att ingen rubrik eller menynamn visas
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    expect(headings.length).toBe(0);

    // Verifiera att kontrollzonen och scen-brickor finns
    expect(screen.getByTestId("aac-user-control-zone")).toBeInTheDocument();
    expect(screen.getByTestId("scene-coffee")).toBeInTheDocument();
    expect(screen.getByTestId("scene-cart")).toBeInTheDocument();
    expect(screen.getByTestId("scene-heart")).toBeInTheDocument();
    expect(screen.getByTestId("scene-home")).toBeInTheDocument();
  });

  it("visar inga hallucinerade bilder i tomma samtalszoner vid start", () => {
    render(<AacDisplay />);
    // Initialt ska samtalszonerna vara tomma och vilsamma
    const tiles = screen.queryAllByTestId(/^aac-tile-/);
    expect(tiles.length).toBe(0);
  });

  it("aktiverar låtsasdeltagare när användaren trycker på kaffekoppen (Fika)", () => {
    render(<AacDisplay />);
    const coffeeSceneButton = screen.getByTestId("scene-coffee");
    
    fireEvent.click(coffeeSceneButton);

    // Nu ska samtalszoner befolkas av låtsasdeltagarnas ämnen
    const activeTiles = screen.getAllByTestId(/^aac-tile-/);
    expect(activeTiles.length).toBeGreaterThan(0);
  });

  it("visar frågetecken-överlägg på brickor med medelhög konfidens (0.50 - 0.79)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const questionMarks = screen.getAllByTestId("question-mark-overlay");
    expect(questionMarks.length).toBeGreaterThan(0);
  });

  it("lämnar brickor med konfidens under 0.50 helt tomma", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const hiddenLowConf = screen.queryByTestId("aac-tile-low-conf");
    expect(hiddenLowConf).not.toBeInTheDocument();
  });

  it("avfärdar tolkning vid klick på rött kryss (feedbackreglage)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    const rejectButton = screen.getByTestId("feedback-reject");
    fireEvent.click(rejectButton);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("bekräftar tolkning vid klick på grön bock (feedbackreglage)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    const confirmButton = screen.getByTestId("feedback-confirm");
    fireEvent.click(confirmButton);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("avfärdar bricka tyst vid klick på mikro-kryss och ersätter den i realtid", async () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const microDismissButtons = screen.getAllByTestId(/^micro-dismiss-/);
    expect(microDismissButtons.length).toBeGreaterThan(0);

    const firstDismissBtn = microDismissButtons[0];
    fireEvent.click(firstDismissBtn);

    // Brickan avfärdas omedelbart och systemet fyller på med ersättare
    await waitFor(() => {
      const currentTiles = screen.getAllByTestId(/^aac-tile-/);
      expect(currentTiles.length).toBeGreaterThan(0);
    });
  });

  it("bekräftar bricka tyst vid klick på mikro-bock", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const microConfirmButtons = screen.getAllByTestId(/^micro-confirm-/);
    expect(microConfirmButtons.length).toBeGreaterThan(0);

    fireEvent.click(microConfirmButtons[0]);

    // Visuell bekräftelseindikator ska tändas kortvarigt
    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("kan återgå till viloläge genom återställningsknappen (hem)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));
    expect(screen.getAllByTestId(/^aac-tile-/).length).toBeGreaterThan(0);

    const homeSceneButton = screen.getByTestId("scene-home");
    fireEvent.click(homeSceneButton);

    const tilesAfterReset = screen.queryAllByTestId(/^aac-tile-/);
    expect(tilesAfterReset.length).toBe(0);
  });

  describe("Flertalar-rum (TCK-006: Adaptiv layout-skalning och färgkodning)", () => {
    it("anpassar grid-layouten adaptivt för 1, 2 och 3 talarzoner", () => {
      render(<AacDisplay />);
      
      // I startläget finns 2 talare i default-state
      const zonesContainer = screen.getByTestId("speaker-zones-container");
      expect(zonesContainer).toHaveClass("md:grid-cols-2");

      // Byt till 1 talare via 'cart'
      const cartButton = screen.getByTestId("scene-cart");
      fireEvent.click(cartButton);
      expect(zonesContainer).toHaveClass("grid-cols-1");

      // Byt till 3 talare via 'heart' (Gruppsamtal)
      const heartButton = screen.getByTestId("scene-heart");
      fireEvent.click(heartButton);
      expect(zonesContainer).toHaveClass("md:grid-cols-3");
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

    it("stödjer flertalar-fika med 3+ talare och unika färgprofiler", () => {
      render(<AacDisplay />);
      
      // Klicka på 'heart' (Gruppsamtal & Omtanke)
      const heartButton = screen.getByTestId("scene-heart");
      fireEvent.click(heartButton);

      const zonesContainer = screen.getByTestId("speaker-zones-container");
      expect(zonesContainer).toBeInTheDocument();

      // Kontrollera att alla 3 talarzoner renderas
      const speaker1 = screen.getByTestId("speaker-zone-speaker-1");
      const speaker2 = screen.getByTestId("speaker-zone-speaker-2");
      const speaker3 = screen.getByTestId("speaker-zone-speaker-3");

      expect(speaker1).toBeInTheDocument();
      expect(speaker2).toBeInTheDocument();
      expect(speaker3).toBeInTheDocument();

      // Kontrollera unika färgklasser för talarna
      expect(speaker1.className).toContain("border-emerald-200/60");
      expect(speaker2.className).toContain("border-violet-200/60");
      expect(speaker3.className).toContain("border-rose-200/60");
    });
  });
});
