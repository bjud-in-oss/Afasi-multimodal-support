import { describe, it, expect, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AacDisplay } from "../AacDisplay";

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
    // Välj scen som innehåller både säkra och osäkra gissningar
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const questionMarks = screen.getAllByTestId("question-mark-overlay");
    expect(questionMarks.length).toBeGreaterThan(0);
  });

  it("lämnar brickor med konfidens under 0.50 helt tomma", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    // Verifiera att inga brickor med <0.50 renderas
    const hiddenLowConf = screen.queryByTestId("aac-tile-low-conf");
    expect(hiddenLowConf).not.toBeInTheDocument();
  });

  it("avfärdar tolkning vid klick på rött kryss (feedbackreglage)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    // Klicka på en osäker bricka
    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    // Tryck på rött kryss
    const rejectButton = screen.getByTestId("feedback-reject");
    fireEvent.click(rejectButton);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("bekräftar tolkning vid klick på grön bock (feedbackreglage)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));

    const firstTile = screen.getAllByTestId(/^aac-tile-/)[0];
    fireEvent.click(firstTile);

    // Tryck på grön bock
    const confirmButton = screen.getByTestId("feedback-confirm");
    fireEvent.click(confirmButton);

    expect(screen.getByTestId("feedback-status-indicator")).toBeInTheDocument();
  });

  it("kan återgå till viloläge genom återställningsknappen (hem)", () => {
    render(<AacDisplay />);
    fireEvent.click(screen.getByTestId("scene-coffee"));
    expect(screen.getAllByTestId(/^aac-tile-/).length).toBeGreaterThan(0);

    // Tryck på hem-ikonen för att vila
    const homeSceneButton = screen.getByTestId("scene-home");
    fireEvent.click(homeSceneButton);

    // Samtalszonerna är nu återställda
    const tilesAfterReset = screen.queryAllByTestId(/^aac-tile-/);
    expect(tilesAfterReset.length).toBe(0);
  });
});
