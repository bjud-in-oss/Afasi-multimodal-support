import { describe, it, expect, beforeEach, vi } from "vitest";
import { LiveListenerService, COGNITIVE_OBSERVER_INSTRUCTION } from "../domain/liveListenerService";
import { LiveUtteranceEvent, ListenerStatus } from "../domain/types";
import { defaultDiagnosticRecorder } from "../domain/diagnosticRecorder";

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

    it("vidarebefordrar svgContent och dynamisk topic från update_topic_zones [TCK-014, ADR-023]", () => {
      const mockCall = {
        name: "update_topic_zones",
        args: {
          participantId: "speaker-anna",
          topic: "Diskuterar bilreparation",
          tiles: [
            {
              iconKey: "repair",
              speechText: "Reparera",
              confidence: 0.92,
              svgContent: "<svg><circle cx='12' cy='12' r='10'/></svg>",
            },
          ],
        },
      };

      service.handleIncomingFunctionCall(mockCall);

      expect(emittedUtterances.length).toBe(1);
      const emitted = emittedUtterances[0];
      expect(emitted.speakerId).toBe("speaker-anna");
      expect(emitted.text).toBe("Diskuterar bilreparation");
      expect(emitted.tiles[0].iconKey).toBe("repair");
      expect(emitted.tiles[0].svgContent).toBe("<svg><circle cx='12' cy='12' r='10'/></svg>");
    });

    it("sparar utgående mikrofonaudio (PCM) i defaultDiagnosticRecorder under strömning [SYSTEM-004]", async () => {
      const recordPcmSpy = vi.spyOn(defaultDiagnosticRecorder, "recordPcmChunk");

      // Skapa en simulerad AudioContext med ScriptProcessor
      let capturedProcessCallback: ((e: any) => void) | null = null;
      const mockProcessor = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        set onaudioprocess(cb: (e: any) => void) {
          capturedProcessCallback = cb;
        },
      };

      const mockSource = {
        connect: vi.fn(),
        disconnect: vi.fn(),
      };

      const mockAudioCtx = {
        createMediaStreamSource: vi.fn().mockReturnValue(mockSource),
        createScriptProcessor: vi.fn().mockReturnValue(mockProcessor),
        close: vi.fn(),
      };

      (service as any).audioContext = mockAudioCtx;
      (service as any).processor = mockProcessor;

      // Starta mikrofonströmning med fejkad getUserMedia
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };

      if (!navigator.mediaDevices) {
        (navigator as any).mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
      (window as any).AudioContext = vi.fn().mockImplementation(() => mockAudioCtx);

      await service.startMicrophoneStream();

      expect(capturedProcessCallback).not.toBeNull();

      service.setStatus("listening");

      // Simulera ett audio-processing event med Float32Array PCM-data
      const mockFloatData = new Float32Array(512);
      mockFloatData[0] = 0.5;
      mockFloatData[1] = -0.5;

      const mockAudioEvent = {
        inputBuffer: {
          getChannelData: () => mockFloatData,
        },
      };

      // Kör audiocallbacken
      capturedProcessCallback!(mockAudioEvent);

      // Verifiera att recordPcmChunk anropats med isModel = false
      expect(recordPcmSpy).toHaveBeenCalledWith(expect.any(Uint8Array), false);

      recordPcmSpy.mockRestore();
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

    it("dämpar mikrofonen vid lokal talsyntes eller aktiv PCM-uppspelning [TCK-015, RULE-002]", async () => {
      // 1. Initialt är playback inte aktivt
      expect(service.isPlaybackActive()).toBe(false);

      // 2. Sätt lokal uppläsning aktiv
      service.setLocalSpeaking(true);
      expect(service.isPlaybackActive()).toBe(true);

      // 3. Stäng av lokal uppläsning
      service.setLocalSpeaking(false);
      expect(service.isPlaybackActive()).toBe(false);

      // 4. När pcmPlayer spelar upp ska isPlaybackActive också vara sant
      vi.spyOn((service as any).pcmPlayer, "isPlaying").mockReturnValue(true);
      expect(service.isPlaybackActive()).toBe(true);
    });

    it("skickar inte PCM-data till nätverket under mikrofondämpning [TCK-015, RULE-002]", async () => {
      const recordPcmSpy = vi.spyOn(defaultDiagnosticRecorder, "recordPcmChunk");
      const sendRealtimeInputSpy = vi.fn();
      (service as any).liveSession = {
        sendRealtimeInput: sendRealtimeInputSpy,
      };

      let capturedCallback: ((e: any) => void) | null = null;
      const mockProcessor = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        set onaudioprocess(cb: (e: any) => void) {
          capturedCallback = cb;
        },
      };
      const mockAudioCtx = {
        createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
        createScriptProcessor: vi.fn().mockReturnValue(mockProcessor),
        close: vi.fn(),
      };
      (service as any).audioContext = mockAudioCtx;
      (service as any).processor = mockProcessor;

      if (!navigator.mediaDevices) {
        (navigator as any).mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });
      (window as any).AudioContext = vi.fn().mockImplementation(() => mockAudioCtx);

      await service.startMicrophoneStream();
      service.setStatus("listening");

      // Aktivera dämpning (t.ex. talsyntes talar)
      service.setLocalSpeaking(true);

      const mockFloatData = new Float32Array(512);
      mockFloatData[0] = 0.8;
      const mockAudioEvent = {
        inputBuffer: {
          getChannelData: () => mockFloatData,
        },
      };

      // Kör audiocallbacken under aktiv dämpning
      capturedCallback!(mockAudioEvent);

      // Verifiera att ingen sändning eller PCM-buffring skett under dämpningen
      expect(sendRealtimeInputSpy).not.toHaveBeenCalled();
      expect(recordPcmSpy).not.toHaveBeenCalled();

      // Slå av dämpning och kör igen
      service.setLocalSpeaking(false);
      capturedCallback!(mockAudioEvent);
      expect(recordPcmSpy).toHaveBeenCalled();
      expect(sendRealtimeInputSpy).toHaveBeenCalled();

      recordPcmSpy.mockRestore();
    });
  });

  describe("LiveListenerService - Strikt Tystnad och Knapp-Undantag [TCK-016, RULE-002, RULE-005, SYSTEM-001]", () => {
    it("verifierar att systeminstruktionen föreskriver absolut talförbud vid inkommande mikrofonljud", () => {
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toBeDefined();
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toContain("ABSOLUTE SPOKEN SILENCE DURING AUDIO INPUT");
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toMatch(/never generate spoken audio/i);
    });

    it("verifierar att systeminstruktionen föreskriver att modellen enbart får använda verktygsanrop (update_topic_zones) vid omgivningsljud", () => {
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toContain("ONLY TOOL CALLS DURING PASSIVE LISTENING");
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toContain("EXCLUSIVELY via non-blocking tool calls (`update_topic_zones`)");
    });

    it("verifierar att systeminstruktionen har ett strikt knapp-undantag för text_impulse", () => {
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toContain("STRICT EXCEPTION FOR DIRECT USER TEXT IMPULSE");
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toContain("text_impulse");
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toContain("maximum 1 sentence");
      expect(COGNITIVE_OBSERVER_INSTRUCTION).toMatch(/return to 100% silent observer mode/i);
    });
  });
});

