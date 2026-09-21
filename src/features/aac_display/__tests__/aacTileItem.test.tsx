import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AacTileItem } from "../components/AacTileItem";
import { AacTile } from "../domain/types";

describe("AacTileItem - Ikonmappning och Tier 3 SVG [TCK-014, ADR-023]", () => {
  it("renderar bildikon för iconKey='images' och inte HelpCircle", () => {
    const tile: AacTile = {
      id: "t-images",
      iconKey: "images",
      confidence: 0.9,
      isGroundTruth: false,
      speechText: "Visa bilder",
    };

    render(<AacTileItem tile={tile} onSelect={vi.fn()} />);

    const item = screen.getByTestId("aac-tile-t-images");
    expect(item).toBeDefined();
    // Ska inte innehålla lucide-help-circle
    const svg = item.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains("lucide-image")).toBe(true);
  });

  it("renderar skiftnyckel för iconKey='repair'", () => {
    const tile: AacTile = {
      id: "t-repair",
      iconKey: "repair",
      confidence: 0.85,
      isGroundTruth: false,
      speechText: "Reparera",
    };

    render(<AacTileItem tile={tile} onSelect={vi.fn()} />);

    const item = screen.getByTestId("aac-tile-t-repair");
    const svg = item.querySelector("svg");
    expect(svg?.classList.contains("lucide-wrench")).toBe(true);
  });

  it("renderar gnistor/sparkles för iconKey='generate'", () => {
    const tile: AacTile = {
      id: "t-generate",
      iconKey: "generate",
      confidence: 0.88,
      isGroundTruth: false,
      speechText: "Skapa",
    };

    render(<AacTileItem tile={tile} onSelect={vi.fn()} />);

    const item = screen.getByTestId("aac-tile-t-generate");
    const svg = item.querySelector("svg");
    expect(svg?.classList.contains("lucide-sparkles")).toBe(true);
  });

  it("renderar förstoringsglas för iconKey='search'", () => {
    const tile: AacTile = {
      id: "t-search",
      iconKey: "search",
      confidence: 0.92,
      isGroundTruth: false,
      speechText: "Söka",
    };

    render(<AacTileItem tile={tile} onSelect={vi.fn()} />);

    const item = screen.getByTestId("aac-tile-t-search");
    const svg = item.querySelector("svg");
    expect(svg?.classList.contains("lucide-search")).toBe(true);
  });

  it("renderar direktkodad svgContent om definierad [ADR-023 Tier 3]", () => {
    const rawSvg = `<svg data-testid="custom-tier3-svg" viewBox="0 0 24 24"><path d="M10 10" /></svg>`;
    const tile: AacTile = {
      id: "t-svg",
      iconKey: "custom_unknown_symbol",
      confidence: 0.95,
      isGroundTruth: false,
      speechText: "Specialikon",
      svgContent: rawSvg,
    };

    render(<AacTileItem tile={tile} onSelect={vi.fn()} />);

    const item = screen.getByTestId("aac-tile-t-svg");
    const customSvg = item.querySelector("[data-testid='custom-tier3-svg']");
    expect(customSvg).not.toBeNull();
  });
});
