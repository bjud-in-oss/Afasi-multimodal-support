import { describe, it, expect, beforeEach, vi } from "vitest";
import { LiveListenerService } from "../domain/liveListenerService";
import { LiveUtteranceEvent, ListenerStatus } from "../domain/types";

describe("LiveListenerService (Realtidslyssnare & Samtycke)", () => {
  let service: LiveListenerService;
  let emittedUtterances: LiveUtteranceEvent[];
  let statuses: ListenerStatus[];

  beforeEach(() => {
    emittedUtterances = [];
    statuses = [];
    service = new LiveListenerService({
      onUtterance: (evt) => emittedUtterances.push(evt),
      onStatusChange: (status) => statuses.push(status),
      consentMessage: "Test consent message",
    });
  });

  it("startar i idle-läge utan aktiv mikrofon", () => {
    expect(service.getStatus()).toBe("idle");
    expect(service.isConsentGranted()).toBe(false);
  });

  it("begär muntligt samtycke vid start och övergår till awaiting_consent", () => {
    const speakSpy = vi.fn();
    service.setSpeechSynthesizer(speakSpy);

    service.startListening();

    expect(service.getStatus()).toBe("awaiting_consent");
    expect(speakSpy).toHaveBeenCalledWith("Test consent message");
  });

  it("övergår till listening när samtycke bekräftas", () => {
    service.startListening();
    service.confirmConsent();

    expect(service.isConsentGranted()).toBe(true);
    expect(service.getStatus()).toBe("listening");
  });

  it("genererar talarhändelser med korrekt talar-ID och tolkade bildbrickor", () => {
    service.startListening();
    service.confirmConsent();

    // Simulera talat uttalande från Talare 1
    service.simulateUtterance("speaker-1", "Vill du ha kaffe och kaka?");

    expect(emittedUtterances.length).toBe(1);
    const event = emittedUtterances[0];
    expect(event.speakerId).toBe("speaker-1");
    expect(event.tiles.length).toBeGreaterThan(0);
    // Skall innehålla kaffe och/eller kaka
    const iconKeys = event.tiles.map((t) => t.iconKey);
    expect(iconKeys).toContain("coffee");
  });

  it("respekterar paus och stopp så att inga händelser släpps igenom när mikrofonen är av", () => {
    service.startListening();
    service.confirmConsent();
    service.pauseListening();

    expect(service.getStatus()).toBe("paused");

    service.simulateUtterance("speaker-2", "Hej på dig");
    expect(emittedUtterances.length).toBe(0);

    service.stopListening();
    expect(service.getStatus()).toBe("idle");
  });

  it("återställer tillstånd och samtycke vid reset", () => {
    service.startListening();
    service.confirmConsent();
    service.resetConsent();

    expect(service.isConsentGranted()).toBe(false);
    expect(service.getStatus()).toBe("idle");
  });

  it("stöder klientbaserad API-nyckel (VITE_GEMINI_API_KEY) och get/setApiKey", () => {
    service.setApiKey("test-vite-api-key");
    expect(service.getApiKey()).toBe("test-vite-api-key");
  });

  it("tillåter dynamisk registrering av lyssnar-callbacks och statusändring", () => {
    const statusLogs: ListenerStatus[] = [];
    service.setOnStatusChange((st) => statusLogs.push(st));

    service.setStatus("connecting");
    expect(service.getStatus()).toBe("connecting");
    expect(statusLogs).toContain("connecting");
  });
});
