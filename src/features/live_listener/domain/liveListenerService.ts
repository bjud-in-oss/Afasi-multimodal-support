import { GoogleGenAI } from "@google/genai";
import {
  ListenerStatus,
  ListenerOptions,
  SpeakerId,
  LiveUtteranceEvent,
  ConsentState,
  CameraStatus,
} from "./types";
import { AacTile } from "../../aac_display/domain/types";
import { defaultAdaptiveMemory } from "../../adaptive_memory";
import { CameraManager } from "./cameraManager";
import { PcmPlayer } from "./pcmPlayer";
import { formatTemporalInstruction } from "./temporalContext";

const resolveGeminiApiKey = (): string | undefined => {
  if (typeof process !== "undefined" && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_GEMINI_API_KEY
  ) {
    return import.meta.env.VITE_GEMINI_API_KEY as string;
  }
  return undefined;
};

const DEFAULT_CONSENT_MSG =
  "Hej! För att stödja Kalle i samtalet lyssnar jag och skapar bilder av vad vi pratar om. Är det okej för alla i rummet?";

const VOCABULARY_MAP: Record<
  string,
  { iconKey: AacTile["iconKey"]; speechText: string; baseConfidence: number }
> = {
  kaffe: { iconKey: "coffee", speechText: "Kaffe", baseConfidence: 0.95 },
  kopp: { iconKey: "coffee", speechText: "En kopp kaffe", baseConfidence: 0.85 },
  kaka: { iconKey: "cake", speechText: "Kaka", baseConfidence: 0.65 },
  bulle: { iconKey: "cake", speechText: "Kanelbulle", baseConfidence: 0.7 },
  kanelbulle: { iconKey: "cake", speechText: "Kanelbulle", baseConfidence: 0.9 },
  vatten: { iconKey: "water", speechText: "Vatten", baseConfidence: 0.95 },
  dricka: { iconKey: "water", speechText: "Dricka vatten", baseConfidence: 0.8 },
  äpple: { iconKey: "apple", speechText: "Äpple", baseConfidence: 0.95 },
  frukt: { iconKey: "apple", speechText: "Frukt", baseConfidence: 0.75 },
  handla: { iconKey: "cart", speechText: "Handla mat", baseConfidence: 0.85 },
  köpa: { iconKey: "cart", speechText: "Köpa mat", baseConfidence: 0.8 },
  mat: { iconKey: "cart", speechText: "Matvaror", baseConfidence: 0.75 },
  medicin: { iconKey: "pill", speechText: "Medicin", baseConfidence: 0.95 },
  tablett: { iconKey: "pill", speechText: "Tablett", baseConfidence: 0.9 },
  glad: { iconKey: "smile", speechText: "Glad och nöjd", baseConfidence: 0.9 },
  mår: { iconKey: "smile", speechText: "Mår bra", baseConfidence: 0.65 },
  bra: { iconKey: "smile", speechText: "Allt är bra", baseConfidence: 0.8 },
  trött: { iconKey: "heart", speechText: "Trött eller behöver vila", baseConfidence: 0.85 },
  vila: { iconKey: "heart", speechText: "Vila en stund", baseConfidence: 0.9 },
  promenad: { iconKey: "sun", speechText: "Gå ut på en promenad", baseConfidence: 0.9 },
  sol: { iconKey: "sun", speechText: "Soligt och fint ute", baseConfidence: 0.9 },
  hem: { iconKey: "home", speechText: "Gå hem", baseConfidence: 0.9 },
  hjälp: { iconKey: "help", speechText: "Behöver hjälp", baseConfidence: 0.95 },
};

export class LiveListenerService {
  private status: ListenerStatus = "idle";
  private consent: ConsentState = { requested: false, granted: false };
  private options: ListenerOptions;
  private speechSynthesizer: (text: string) => void;
  private apiKey: string | undefined = resolveGeminiApiKey();
  private lastEventStatus: string = "Frånkopplad (Väntar på aktivering)";
  private pcmPacketsOut: number = 0;
  private diagnosticSubscribers: Set<(status: string) => void> = new Set();

  private cameraManager: CameraManager;
  private pcmPlayer: PcmPlayer;
  private cameraFrameTimer: any = null;
  private isProcessingFrame: boolean = false;
  private liveSession: any = null;
  private micActivatedByClick: boolean = false;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;

  constructor(options: ListenerOptions = {}) {
    this.options = {
      model: "models/gemini-3.8-live",
      enableCamera: true,
      enableTimeAwareness: true,
      ...options,
    };
    this.cameraManager = CameraManager.getInstance();
    this.pcmPlayer = new PcmPlayer(24000);

    // Enligt ADR-018: Inga tysta fallbacks till webbläsarens speechSynthesis i produktion.
    // Ljudet kommer uteslutande via Gemini Live PCM-strömmen.
    this.speechSynthesizer = (_text: string) => {};
  }

  public getModel(): string {
    return this.options.model || "models/gemini-3.8-live";
  }

  public setModel(model: string): void {
    this.options.model = model;
  }

  public getCameraManager(): CameraManager {
    return this.cameraManager;
  }

  public getPcmPlayer(): PcmPlayer {
    return this.pcmPlayer;
  }

  public isMicActivatedByClick(): boolean {
    return this.micActivatedByClick;
  }

  public setMicActivatedByClick(active: boolean): void {
    this.micActivatedByClick = active;
  }

  public async resumeAudio(): Promise<void> {
    await this.pcmPlayer.resume();
  }

  public triggerCameraBurst(reason?: string): void {
    this.cameraManager.triggerBurst(reason);
  }

  public setSpeechSynthesizer(fn: (text: string) => void): void {
    this.speechSynthesizer = fn;
  }

  public setOnUtterance(cb: ((event: LiveUtteranceEvent) => void) | undefined): void {
    this.options.onUtterance = cb;
  }

  public setOnActiveSpeakerChange(
    cb: ((speakerId: SpeakerId | null) => void) | undefined
  ): void {
    this.options.onActiveSpeakerChange = cb;
  }

  public setOnStatusChange(cb: ((status: ListenerStatus) => void) | undefined): void {
    this.options.onStatusChange = cb;
  }

  public setOnCameraStatusChange(cb: ((status: CameraStatus) => void) | undefined): void {
    this.options.onCameraStatusChange = cb;
  }

  public setOnDiagnosticEvent(cb: ((status: string) => void) | undefined): void {
    this.options.onDiagnosticEvent = cb;
  }

  public onDiagnosticEvent(cb: (status: string) => void): () => void {
    this.diagnosticSubscribers.add(cb);
    cb(this.lastEventStatus);
    return () => {
      this.diagnosticSubscribers.delete(cb);
    };
  }

  public getLastEventStatus(): string {
    return this.lastEventStatus;
  }

  public logPcmPacket(count?: number): void {
    if (typeof count === "number") {
      this.pcmPacketsOut = count;
    } else {
      this.pcmPacketsOut += 1;
    }
    this.updateDiagnosticStatus(`PCM Packets Out: ${this.pcmPacketsOut}`);
  }

  public logGeminiEvent(eventType: string): void {
    this.updateDiagnosticStatus(`Gemini Event: ${eventType}`);
  }

  public logFunctionCall(functionName: string = "update_topic_zones"): void {
    this.updateDiagnosticStatus(`FunctionCall: ${functionName}`);
  }

  public logDiagnostic(status: string): void {
    this.updateDiagnosticStatus(status);
  }

  private updateDiagnosticStatus(newStatus: string): void {
    this.lastEventStatus = newStatus;
    if (this.options.onDiagnosticEvent) {
      this.options.onDiagnosticEvent(newStatus);
    }
    for (const sub of this.diagnosticSubscribers) {
      try {
        sub(newStatus);
      } catch (err) {
        console.error("Error in diagnostic subscriber:", err);
      }
    }
  }

  public getApiKey(): string | undefined {
    return this.apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public getStatus(): ListenerStatus {
    return this.status;
  }

  public getCameraStatus(): CameraStatus {
    return this.cameraManager.getStatus();
  }

  public isConsentGranted(): boolean {
    return this.consent.granted;
  }

  public setStatus(status: ListenerStatus): void {
    this.status = status;
    this.notifyStatus();
  }

  public async startListening(fromUserMicClick: boolean = false): Promise<void> {
    if (fromUserMicClick) {
      this.micActivatedByClick = true;
    }
    if (!this.consent.granted) {
      this.status = "awaiting_consent";
      this.consent.requested = true;
      this.notifyStatus();
      this.updateDiagnosticStatus("Gemini Event: session.awaiting_consent");

      const message = this.options.consentMessage || DEFAULT_CONSENT_MSG;
      this.speechSynthesizer(message);
      return;
    }

    await this.activateSession();
  }

  public async confirmConsent(fromUserMicClick: boolean = false): Promise<void> {
    if (fromUserMicClick) {
      this.micActivatedByClick = true;
    }
    this.consent.granted = true;
    this.consent.timestamp = Date.now();
    await this.activateSession();
    this.speechSynthesizer("Tack, nu lyssnar jag på samtalet.");
  }

  public activateUserMic(): void {
    this.micActivatedByClick = true;
  }

  private async activateSession(): Promise<void> {
    this.status = "listening";
    this.notifyStatus();
    this.pcmPacketsOut = 0;
    this.logGeminiEvent(`session.ready [Model: ${this.getModel()}]`);
    this.logFunctionCall("update_topic_zones");

    // Initiera och anslut WebSocket till Gemini Live API om API-nyckel finns
    await this.initLiveWebSocket();

    // Starta mikrofoninspelning (16kHz PCM16-mono)
    await this.startMicrophoneStream();

    // Starta kameran vid aktivt lyssnande om tillåtet
    if (this.options.enableCamera !== false) {
      try {
        await this.cameraManager.start();
        this.notifyCameraStatus();
        this.scheduleNextCameraFrame();
      } catch (err: any) {
        this.updateDiagnosticStatus(`KAMERA-FEL: ${err?.message || "Kunde inte starta kamera"}`);
      }
    }
  }

  public async startMicrophoneStream(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      this.stopMicrophoneStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.audioStream = stream;

      const AudioCtxClass =
        (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) ||
        (globalThis as any).AudioContext;

      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass({ sampleRate: 16000 });
      this.audioContext = ctx;

      const source = ctx.createMediaStreamSource(stream);
      // Buffertstorlek 4096 vid 16kHz ger ~256ms chunkar
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      this.audioProcessor = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (this.status !== "listening") return;
        const inputData = e.inputBuffer.getChannelData(0);
        if (!inputData || inputData.length === 0) return;

        // Konvertera Float32 (-1.0 till 1.0) till Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Konvertera Int16Array till Base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Pcm = btoa(binary);

        this.logPcmPacket();

        if (this.liveSession && typeof this.liveSession.sendRealtimeInput === "function") {
          this.liveSession.sendRealtimeInput({
            audio: {
              data: base64Pcm,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (err: any) {
      this.handleMicrophoneError(err);
    }
  }

  public handleMicrophoneError(err: any): void {
    const msg = err?.message || String(err);
    const formatted = `MIKROFON-FEL: ${msg}`;
    console.error(formatted);
    this.updateDiagnosticStatus(formatted);
  }

  public stopMicrophoneStream(): void {
    if (this.audioProcessor) {
      try {
        this.audioProcessor.disconnect();
      } catch {}
      this.audioProcessor = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.audioStream = null;
    }
  }

  private async initLiveWebSocket(): Promise<void> {
    const key = this.apiKey || resolveGeminiApiKey();
    if (!key) {
      this.handleWebSocketError("400", "Saknar API-nyckel (GEMINI_API_KEY saknas i miljö)");
      return;
    }

    try {
      this.closeLiveSession();
      const ai = new GoogleGenAI({ apiKey: key });

      // Anslut till Gemini Live API via WebSockets med function calling för bildbrickor
      const session = await ai.live.connect({
        model: this.getModel(),
        config: {
          responseModalities: ["audio"],
          systemInstruction: {
            parts: [{ text: this.getTemporalInstructionFragment() }],
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "update_topic_zones",
                  description:
                    "Skapar eller uppdaterar AAC-bildbrickor på skärmen baserat på vad samtalspartnern säger.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      speakerId: {
                        type: "STRING",
                        description: "Identifierare för talaren, t.ex. 'speaker-1' eller namnet.",
                      },
                      topic: {
                        type: "STRING",
                        description: "Kort sammanfattning av vad som sades.",
                      },
                      tiles: {
                        type: "ARRAY",
                        description: "Lista över relevanta bildbrickor att visa.",
                        items: {
                          type: "OBJECT",
                          properties: {
                            iconKey: {
                              type: "STRING",
                              enum: [
                                "coffee",
                                "cake",
                                "water",
                                "cart",
                                "apple",
                                "pill",
                                "heart",
                                "sun",
                                "home",
                                "smile",
                                "help",
                                "thumbs-up",
                                "thumbs-down",
                              ],
                            },
                            speechText: { type: "STRING" },
                            confidence: { type: "NUMBER" },
                          },
                          required: ["iconKey", "speechText"],
                        },
                      },
                    },
                    required: ["speakerId", "tiles"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            this.logGeminiEvent("websocket.open [Gemini Live Ansluten]");
          },
          onmessage: (response: any) => {
            if (response?.serverContent?.modelTurn?.parts) {
              for (const part of response.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                  this.handleIncomingModelAudio(part.inlineData.data);
                }
                if (part.functionCall) {
                  this.handleIncomingFunctionCall(part.functionCall);
                }
              }
            }
            // Hantera även functionCalls på rotnivå om Gemini skickar dem där
            if (response?.toolCall?.functionCalls) {
              for (const fc of response.toolCall.functionCalls) {
                this.handleIncomingFunctionCall(fc);
              }
            }
            if (response?.serverContent?.interrupted) {
              this.handleIncomingInterruption();
            }
          },
          onerror: (err: any) => {
            const errCode = err?.code || err?.status || err?.statusCode || "400";
            const errMsg = err?.message || err?.statusText || "Invalid API Key or Model / Connection Failed";
            this.handleWebSocketError(errCode, errMsg);
          },
          onclose: (closeEvt: any) => {
            const code = closeEvt?.code ?? 1006;
            const reason = closeEvt?.reason || "Abnormal Closure / Connection Terminated";
            // Rapportera endast om användaren fortfarande har mikrofonen aktiverad
            if (this.status === "listening" || this.micActivatedByClick) {
              this.handleWebSocketClose(code, reason);
            }
          },
        },
      });

      this.liveSession = session;
    } catch (err: any) {
      const errCode = err?.status || err?.code || "400";
      const errMsg = err?.message || "Invalid API Key or Model / Connect Failed";
      this.handleWebSocketError(errCode, errMsg);
    }
  }

  public handleIncomingFunctionCall(call: any): void {
    if (!call || call.name !== "update_topic_zones") return;

    this.logFunctionCall("update_topic_zones");
    const args = call.args || {};
    const speakerId: string = args.speakerId || "speaker-gemini";
    const topicText: string = args.topic || "Samtalsämne";
    const rawTilesList: any[] = Array.isArray(args.tiles) ? args.tiles : [];

    const parsedTiles: AacTile[] = rawTilesList.map((t, idx) => ({
      id: `live-tile-${speakerId}-${t.iconKey || "help"}-${Date.now()}-${idx}`,
      iconKey: (t.iconKey || "help") as AacTile["iconKey"],
      confidence: typeof t.confidence === "number" ? t.confidence : 0.9,
      isGroundTruth: (t.confidence ?? 0.9) >= 0.8,
      speechText: t.speechText || t.iconKey || "Symbol",
    }));

    const weightedTiles = defaultAdaptiveMemory.applyLearnedWeights("general", parsedTiles);

    const event: LiveUtteranceEvent = {
      id: `utterance-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speakerId,
      text: topicText,
      tiles: weightedTiles,
      timestamp: Date.now(),
    };

    if (this.options.onUtterance) {
      this.options.onUtterance(event);
    }

    // Skicka svar tillbaka till Gemini om sessionen är aktiv
    if (this.liveSession && typeof this.liveSession.sendRealtimeInput === "function") {
      this.liveSession.sendRealtimeInput({
        toolResponse: {
          functionResponses: [
            {
              name: "update_topic_zones",
              response: { output: { success: true, count: weightedTiles.length } },
              id: call.id,
            },
          ],
        },
      });
    }
  }

  public handleWebSocketError(code: string | number, message: string): void {
    const formatted = `WS ERROR: ${code} - ${message}`;
    console.error(formatted);
    this.updateDiagnosticStatus(formatted);
  }

  public handleWebSocketClose(code: string | number, reason: string): void {
    const formatted = `WS CLOSED: ${code} - ${reason}`;
    console.warn(formatted);
    this.updateDiagnosticStatus(formatted);
  }

  public pauseListening(): void {
    this.stopCameraAndTimers();
    this.stopMicrophoneStream();
    if (this.status === "listening") {
      this.status = "paused";
      this.notifyStatus();
      this.updateDiagnosticStatus("Gemini Event: session.paused");
    }
  }

  public async resumeListening(): Promise<void> {
    if (this.status === "paused" && this.consent.granted) {
      await this.activateSession();
      this.updateDiagnosticStatus("Gemini Event: session.resumed");
    }
  }

  public stopListening(): void {
    this.micActivatedByClick = false;
    this.status = "idle";
    this.notifyStatus();
    this.updateDiagnosticStatus("Frånkopplad (Väntar på aktivering)");
    this.stopCameraAndTimers();
    this.stopMicrophoneStream();
    this.closeLiveSession();
    this.pcmPlayer.interrupt();
    if (this.options.onActiveSpeakerChange) {
      this.options.onActiveSpeakerChange(null);
    }
  }

  public resetConsent(): void {
    this.micActivatedByClick = false;
    this.consent = { requested: false, granted: false };
    this.status = "idle";
    this.notifyStatus();
    this.updateDiagnosticStatus("Frånkopplad (Väntar på aktivering)");
    this.stopCameraAndTimers();
    this.stopMicrophoneStream();
    this.closeLiveSession();
    this.pcmPlayer.interrupt();
  }

  private closeLiveSession(): void {
    if (this.liveSession) {
      try {
        if (typeof this.liveSession.close === "function") {
          this.liveSession.close();
        }
      } catch (err) {
        console.error("Error closing live session:", err);
      }
      this.liveSession = null;
    }
  }

  private stopCameraAndTimers(): void {
    if (this.cameraFrameTimer) {
      clearTimeout(this.cameraFrameTimer);
      this.cameraFrameTimer = null;
    }
    this.cameraManager.stop();
    this.notifyCameraStatus();
  }

  private notifyCameraStatus(): void {
    if (this.options.onCameraStatusChange) {
      this.options.onCameraStatusChange(this.cameraManager.getStatus());
    }
  }

  private scheduleNextCameraFrame(): void {
    if (this.status !== "listening" || !this.cameraManager.isActive()) {
      return;
    }

    const interval = this.cameraManager.getNextIntervalMs();
    this.cameraFrameTimer = setTimeout(async () => {
      await this.processCameraFrame();
      this.scheduleNextCameraFrame();
    }, interval);
  }

  private async processCameraFrame(): Promise<void> {
    if (this.status !== "listening" || !this.cameraManager.isActive() || this.isProcessingFrame) {
      return;
    }

    this.isProcessingFrame = true;
    try {
      // Kontrollera Pixel-Delta rörelse
      this.cameraManager.checkMotionPixelDelta();

      // Kontrollera rate limit
      if (this.cameraManager.canSendFrameNow()) {
        const jpegBase64 = this.cameraManager.captureFrameJpeg();
        if (jpegBase64) {
          this.cameraManager.recordFrameSent();
          this.logDiagnostic(
            `Kamera Frame Sänd (${this.cameraManager.isBurstActive() ? "Burst 1.5s" : "Idle 5.0s"})`
          );
          if (this.liveSession && typeof this.liveSession.sendRealtimeInput === "function") {
            this.liveSession.sendRealtimeInput({
              video: { data: jpegBase64, mimeType: "image/jpeg" },
            });
          }
        }
      }
    } finally {
      this.isProcessingFrame = false;
    }
  }

  public handleIncomingModelAudio(base64Pcm: string): void {
    this.pcmPlayer.enqueuePcmChunk(base64Pcm);
  }

  public handleIncomingInterruption(): void {
    this.pcmPlayer.interrupt();
    this.logGeminiEvent("interrupted");
  }

  public getTemporalInstructionFragment(): string {
    return formatTemporalInstruction(new Date());
  }

  public simulateUtterance(speakerId: SpeakerId, text: string): LiveUtteranceEvent | null {
    // Om användaren har tryckt på mikrofonknappen är mock-ordboken helt avstängd (Hard Fail)
    if (this.micActivatedByClick) {
      return null;
    }

    if (this.status !== "listening") {
      return null;
    }

    this.logPcmPacket();
    this.logGeminiEvent("audio.transcription");
    this.logFunctionCall("update_topic_zones");

    // Talarväxling aktiverar automatiskt Burst-läge i kameramotorn
    this.cameraManager.triggerBurst("speaker_turn");

    if (this.options.onActiveSpeakerChange) {
      this.options.onActiveSpeakerChange(speakerId);
      setTimeout(() => {
        if (this.options.onActiveSpeakerChange) {
          this.options.onActiveSpeakerChange(null);
        }
      }, 3000);
    }

    const lower = text.toLowerCase();
    const rawTiles: AacTile[] = [];

    for (const [word, config] of Object.entries(VOCABULARY_MAP)) {
      if (lower.includes(word)) {
        rawTiles.push({
          id: `live-tile-${speakerId}-${config.iconKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          iconKey: config.iconKey,
          confidence: config.baseConfidence,
          isGroundTruth: config.baseConfidence >= 0.8,
          speechText: config.speechText,
        });
      }
    }

    const contextKey = "general";
    const weightedTiles = defaultAdaptiveMemory.applyLearnedWeights(contextKey, rawTiles);

    const event: LiveUtteranceEvent = {
      id: `utterance-${Date.now()}`,
      speakerId,
      text,
      tiles: weightedTiles,
      timestamp: Date.now(),
    };

    if (this.options.onUtterance) {
      this.options.onUtterance(event);
    }

    return event;
  }

  private notifyStatus(): void {
    if (this.options.onStatusChange) {
      this.options.onStatusChange(this.status);
    }
  }
}

export const defaultLiveListener = new LiveListenerService();
