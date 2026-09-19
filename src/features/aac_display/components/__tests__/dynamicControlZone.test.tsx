import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AacDisplay } from "../AacDisplay";
import { defaultLiveListener } from "../../../live_listener";
import { defaultAdaptiveMemory } from "../../../adaptive_memory";

describe("Dynamiska kontrollbrickor i UserControlZone (TCK-006C / TCK-009)", () => {
  beforeEach(() => {
    defaultAdaptiveMemory.reset();
    defaultLiveListener.stopListening();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderar 4 dynamiska kontrollbrickor i användarens kontrollzon", () => {
    render(<AacDisplay />);

    const container = screen.getByTestId("dynamic-control-tiles");
    expect(container).toBeDefined();

    // Kontrollera att det finns exakt 4 knappar i gridden
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(4);
  });

  it("skickar direkt textimpuls över Gemini Live när användaren klickar på en dynamisk kontrollbricka", () => {
    const sendSpy = vi.spyOn(defaultLiveListener, "sendTextInput");

    render(<AacDisplay />);

    const container = screen.getByTestId("dynamic-control-tiles");
    const firstButton = container.querySelectorAll("button")[0];
    expect(firstButton).toBeDefined();

    fireEvent.click(firstButton);

    expect(sendSpy).toHaveBeenCalled();
  });

  it("visar kameraindikator (pulserande blå prick) när en kontrollbricka är berikad via kamerasyn", () => {
    // Simulera att kamerasyn har upptäckt "kaffe"
    defaultLiveListener.setDetectedObjects(["kaffe"]);

    render(<AacDisplay />);

    // Leta efter kameramarkören i kontrollzonen
    const cameraBadge = screen.queryByTestId(/control-camera-badge-/);
    expect(cameraBadge).not.toBeNull();
  });
});
