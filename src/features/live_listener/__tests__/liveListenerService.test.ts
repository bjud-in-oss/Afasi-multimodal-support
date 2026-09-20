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

  it("manuellt klick på mikrofon utgör aktivt samtycke direkt utan verbal hälsning [SYSTEM-001]", async () => {
    const speakSpy = vi.fn();
    service.setSpeechSynthesizer(speakSpy);

    await service.startListening();

    expect(service.isConsentGranted()).toBe(true);
    expect(service.getStatus()).toBe("listening");
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it("confirmConsent aktiverar också samtycke och session direkt", async () => {
    await service.confirmConsent();

    expect(service.isConsentGranted()).toBe(true);
    expect(service.getStatus()).toBe("listening");
  });

  it("rapporterar SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY) omedelbart i diagnostikstatus om nyckel saknas [ADR-018]", async () => {
    let diagnosticStatus = "";
    const testService = new LiveListenerService({
      onUtterance: () => {},
      onDiagnosticStatusChange: (status) => {
        diagnosticStatus = status;
      },
    });
    testService.setApiKey("");

    await testService.startListening();
    expect(diagnosticStatus).toBe("SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
  });

  it("genererar talarhändelser med korrekt talar-ID och tolkade bildbrickor", () => {
    service.startListening();

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

  it("hanterar icke-blockerande funktionsanrop för update_topic_zones [RULE-002, SYSTEM-009]", () => {
    service.startListening();

    service.handleIncomingFunctionCall({
      name: "update_topic_zones",
      args: {
        participantId: "Kalle",
        colorZone: "green",
        behavior: "NON_BLOCKING",
        tiles: [
          { iconKey: "coffee", label: "Kaffe", confidence: 0.95 },
          { iconKey: "water", label: "Vatten", confidence: 0.9 },
        ],
      },
    });

    expect(emittedUtterances.length).toBe(1);
    const event = emittedUtterances[0];
    expect(event.speakerId).toBe("Kalle");
    expect(event.tiles.length).toBe(2);
    expect(event.tiles[0].iconKey).toBe("coffee");
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

  it("loggar realtidshändelser och exponerar lastEventStatus för diagnostik (TCK-006B)", () => {
    const diagnosticLogs: string[] = [];
    const unsub = service.onDiagnosticEvent((status) => {
      diagnosticLogs.push(status);
    });

    service.logPcmPacket(1);
    expect(service.getLastEventStatus()).toBe("PCM Packets Out: 1");

    service.logPcmPacket();
    expect(service.getLastEventStatus()).toBe("PCM Packets Out: 2");

    service.logGeminiEvent("session.ready");
    expect(service.getLastEventStatus()).toBe("Gemini Event: session.ready");

    service.logFunctionCall("update_topic_zones");
    expect(service.getLastEventStatus()).toBe("FunctionCall: update_topic_zones");

    expect(diagnosticLogs).toContain("PCM Packets Out: 1");
    expect(diagnosticLogs).toContain("PCM Packets Out: 2");
    expect(diagnosticLogs).toContain("Gemini Event: session.ready");
    expect(diagnosticLogs).toContain("FunctionCall: update_topic_zones");

    unsub();
  });

  it("använder 'models/gemini-3.8-live' som standardmodell och tillåter modelländring (TCK-006C)", () => {
    expect(service.getModel()).toBe("models/gemini-3.8-live");
    service.setModel("models/gemini-3.8-flash");
    expect(service.getModel()).toBe("models/gemini-3.8-flash");
  });

  it("stänger av kameran fullständigt vid stopListening och pauseListening (TCK-006C)", () => {
    const cameraManager = service.getCameraManager();
    const stopSpy = vi.spyOn(cameraManager, "stop");

    service.stopListening();
    expect(stopSpy).toHaveBeenCalled();

    service.pauseListening();
    expect(stopSpy).toHaveBeenCalledTimes(2);
  });

  it("vidarebefordrar inkommande modell-audio till pcmPlayer utan lokal talsyntes (TCK-006C)", () => {
    const pcmPlayer = service.getPcmPlayer();
    const enqueueSpy = vi.spyOn(pcmPlayer, "enqueuePcmChunk");

    service.handleIncomingModelAudio("dGVzdA==");
    expect(enqueueSpy).toHaveBeenCalledWith("dGVzdA==");
  });

  it("avbryter pcmPlayer omedelbart vid handleIncomingInterruption (TCK-006C)", () => {
    const pcmPlayer = service.getPcmPlayer();
    const interruptSpy = vi.spyOn(pcmPlayer, "interrupt");

    service.handleIncomingInterruption();
    expect(interruptSpy).toHaveBeenCalled();
  });

  it("genererar tidsmedvetet systeminstruktionsfragment med aktuell tid (TCK-006C)", () => {
    const fragment = service.getTemporalInstructionFragment();
    expect(fragment).toContain("AKTUELL LOKAL TID");
    expect(fragment).toContain("Dygnsfas");
  });

  describe("Diagnos & Hard Fail för Gemini Live WebSocket (TCK-006D)", () => {
    it("visar WebSocket-felkoder i lastEventStatus vid fel", () => {
      service.handleWebSocketError("400", "Invalid API Key or Model");
      expect(service.getLastEventStatus()).toBe("WS ERROR: 400 - Invalid API Key or Model");

      service.handleWebSocketError(403, "Permission Denied");
      expect(service.getLastEventStatus()).toBe("WS ERROR: 403 - Permission Denied");
    });

    it("visar WebSocket-stängningskod i lastEventStatus vid onclose", () => {
      service.handleWebSocketClose(1006, "Abnormal Closure / Connection Terminated");
      expect(service.getLastEventStatus()).toBe("WS CLOSED: 1006 - Abnormal Closure / Connection Terminated");
    });

    it("stänger av simulateUtterance helt (Hard Fail) när användaren aktiverat mikrofonen", () => {
      service.startListening(true);
      service.confirmConsent(true);

      // Mikrofonen är nu aktiverad av klick/användaren (micActivatedByClick = true)
      expect(service.getStatus()).toBe("listening");
      expect(service.isMicActivatedByClick()).toBe(true);

      // simulateUtterance ska returnera null och inte producera några brickor
      const result = service.simulateUtterance("speaker-1", "Kaffe och kaka");
      expect(result).toBeNull();
      expect(emittedUtterances.length).toBe(0);

      // När användaren stänger av mikrofonen återställs flaggan
      service.stopListening();
      expect(service.isMicActivatedByClick()).toBe(false);

      // Om status sätts direkt (t.ex. i isolerat test utan mic-klick) fungerar ordboken igen
      service.setStatus("listening");
      const testMockResult = service.simulateUtterance("speaker-1", "Kaffe");
      expect(testMockResult).not.toBeNull();
      expect(emittedUtterances.length).toBe(1);
    });

    it("har en no-op speechSynthesizer som standard utan att anropa webbläsarens speechSynthesis", () => {
      const defaultService = new LiveListenerService();
      // Anrop till confirmConsent och startListening i standardläge skall inte kasta eller anropa window.speechSynthesis
      defaultService.startListening();
      defaultService.confirmConsent();
      expect(defaultService.getStatus()).toBe("listening");
    });

    it("hanterar inkommande update_topic_zones functionCall från Gemini Live och avfyrar onUtterance", () => {
      const mockCall = {
        name: "update_topic_zones",
        args: {
          speakerId: "speaker-maggan",
          topic: "kaffe och fika",
          tiles: [
            { iconKey: "coffee", speechText: "Kaffe", confidence: 0.95 },
            { iconKey: "cake", speechText: "Kanelbulle", confidence: 0.9 },
          ],
        },
      };

      service.handleIncomingFunctionCall(mockCall);

      expect(emittedUtterances.length).toBe(1);
      const emitted = emittedUtterances[0];
      expect(emitted.speakerId).toBe("speaker-maggan");
      expect(emitted.text).toBe("kaffe och fika");
      expect(emitted.tiles.length).toBe(2);
      expect(emitted.tiles[0].iconKey).toBe("coffee");
      expect(service.getLastEventStatus()).toBe("FunctionCall: update_topic_zones");
    });

    it("rapporterar fel i klartext om mikrofonavläsning misslyckas", async () => {
      service.handleMicrophoneError(new Error("Permission denied by user"));
      expect(service.getLastEventStatus()).toBe("MIKROFON-FEL: Permission denied by user");
    });

    it("startar och stoppar mikrofonströmmen via stopListening", async () => {
      const stopTrackSpy = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: stopTrackSpy }],
      };
      (service as any).audioStream = mockStream;

      service.stopListening();

      expect(stopTrackSpy).toHaveBeenCalled();
      expect((service as any).audioStream).toBeNull();
    });
  });
});

