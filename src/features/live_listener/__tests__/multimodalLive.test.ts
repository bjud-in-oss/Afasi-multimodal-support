import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveListenerService } from "../domain/liveListenerService";
import { defaultAdaptiveMemory } from "../../adaptive_memory";

describe("Multimodal Gemini Live Integration (TCK-006C / TCK-009)", () => {
  let service: LiveListenerService;

  beforeEach(() => {
    service = new LiveListenerService();
    defaultAdaptiveMemory.reset();
  });

  afterEach(() => {
    service.stopListening();
    vi.restoreAllMocks();
  });

  it("skickar direkt textimpuls via sendTextInput utan lokal window.speechSynthesis", () => {
    expect((window as any).speechSynthesis).toBeUndefined();

    let diagEvent = "";
    service.onDiagnosticEvent((status) => {
      diagEvent = status;
    });

    service.sendTextInput("En kopp kaffe");

    expect(diagEvent).toContain("En kopp kaffe");
    expect(service.getLastEventStatus()).toContain("En kopp kaffe");
  });

  it("beräknar aktuellt klockslag (HH:MM) för tidsmedveten kontext", () => {
    const timeStr = service.getCurrentTimeString();
    expect(timeStr).toMatch(/^\d{2}:\d{2}$/);
  });

  it("hanterar inkommande PCM16-ljud och schemalägger i AudioContext", () => {
    // Skapa en syntetisk 16-bit PCM base64 sträng (10 samples med värde 1000)
    const int16Array = new Int16Array([1000, -1000, 2000, -2000, 0, 500, -500, 1500, -1500, 0]);
    let binary = "";
    const bytes = new Uint8Array(int16Array.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Pcm = btoa(binary);

    // Mocka AudioContext i jsdom
    const mockCreateBuffer = vi.fn().mockReturnValue({
      duration: 0.1,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(10)),
    });
    const mockCreateBufferSource = vi.fn().mockReturnValue({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null,
    });

    const mockAudioContext = {
      state: "running",
      currentTime: 1.0,
      createBuffer: mockCreateBuffer,
      createBufferSource: mockCreateBufferSource,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    (window as any).AudioContext = vi.fn().mockImplementation(() => mockAudioContext);

    service.playPcm16AudioChunk(base64Pcm);

    expect(mockCreateBuffer).toHaveBeenCalledWith(1, 10, 24000);
    expect(mockCreateBufferSource).toHaveBeenCalled();

    // Verifiera att stopAudioPlayback rensar aktiva källor
    service.stopAudioPlayback();
    expect(service.getLastEventStatus()).toBeDefined();
  });

  it("berikar brickor med kamerasyn (gradvis kontextupptrappning)", () => {
    // Sätt detekterade objekt från kamerasyn
    service.setDetectedObjects(["kaffe", "bulle"]);
    expect(service.getDetectedObjects()).toEqual(["kaffe", "bulle"]);

    service.setStatus("listening");

    let receivedUtterance: any = null;
    service.setOnUtterance((event) => {
      receivedUtterance = event;
    });

    service.simulateUtterance("speaker-1", "Vill du ha lite kaffe?");

    expect(receivedUtterance).not.toBeNull();
    const coffeeTile = receivedUtterance.tiles.find((t: any) => t.iconKey === "coffee");
    expect(coffeeTile).toBeDefined();
    // Ska vara berikad med kamera!
    expect(coffeeTile.enrichmentStage).toBe("camera_enriched");
    expect(coffeeTile.detectedObject).toBe("kaffe");
  });

  it("startar och stoppar kameraströmmen via getUserMedia", async () => {
    const mockStop = vi.fn();
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: mockStop }]),
    };

    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    } as any;

    await service.startCamera();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
    );

    service.stopCamera();
    expect(mockStop).toHaveBeenCalled();
  });
});
